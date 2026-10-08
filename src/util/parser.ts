import { clamp } from "./math.js";
import { GridOffset, GridSelection, GridSize } from "../types/grid.js";
import { LexicalError, Literal, Scanner, Token } from "./scanner.js";

/**
 * Represents a selection bound to a particular grid.
 */
export interface Preset {
  gridSize: GridSize;
  selection: GridSelection;
}

/**
 * Describes a set of adjacent rows or columns of a grid.
 */
export interface GridSpec {
  mode: "cols" | "rows";
  cells: GridCellSpec[];
}

/**
 * Ultimately describes a cell inside a grid.
 *
 * The weight of a cell is used to calculate how much space it claims in
 * relation to its siblings. The sum of weights amongst siblings is used as
 * normalization factor.
 * A cell can be declared as dynamic which means it can be the target for
 * multiple windows that are to be placed in the cell. Each window then claims
 * the same fraction of the available cell space.
 * A cell can alternatively act as a container for a {@link GridSpec|sub-grid}.
 * In that case it cannot be dynamic.
 */
export interface GridCellSpec {
  weight: number;
  dynamic: boolean;
  child?: GridSpec;
}

class ParseError extends Error {}

// Settings are user-controlled and parsed on Shell's main thread. Bound the
// work before scanning or descending recursively so malformed input cannot
// freeze the desktop or overflow the JavaScript stack.
const MAX_INPUT_LENGTH = 8192;
const MAX_GRID_DEPTH = 32;
const MAX_GRID_CELLS = 1024;
const MAX_NUMBER = 1_000_000_000;

abstract class Parser {
  protected scanner: Scanner;
  protected token!: Token;

  constructor(input: string) {
    this.scanner = new Scanner(input);
  }

  protected begin() {
    if (this.scanner.input.length > MAX_INPUT_LENGTH) {
      throw new ParseError("Configuration exceeds 8192 characters");
    }
    this.token = this.scanner.scan();
  }

  protected finish() {
    if (this.token.kind !== Literal.$) {
      throw new ParseError("Unexpected trailing input");
    }
  }

  protected parseNumber(): number {
    const value = Number(this.accept({ kind: Literal.Number }));
    if (!Number.isSafeInteger(value) || value < 1 || value > MAX_NUMBER) {
      throw new ParseError("Number must be an integer between 1 and 1000000000");
    }
    return value;
  }

  /**
   * Scans the next token, thus accepting & discarding the current token.
   *
   * @param which Optional. Conditions that the current token must comply with.
   * @returns The literal representation of the accepted token.
   * @throws {ParseError} If the current token doesn't match the expected shape.
   */
  protected accept(which?: { kind: Literal, raw?: string }) {
    if (which) {
      if (which.kind !== this.token.kind) {
        throw new ParseError(
          `Unexpected token ${this.token.kind}. Want ${which.kind}`);
      } else if (which.raw && which.raw !== this.token.raw) {
        throw new ParseError(
          `Unexpected constant literal ${this.token.raw}. Want ${which.raw}`);
      }
    }

    const raw = this.token.raw;
    this.token = this.scanner.scan();

    return raw;
  }

  /**
   * Conditionally scans the next token.
   *
   * @param kind The scan only proceeds if the current token matches this.
   * @returns Whether the current token was accepted.
   */
  protected acceptIf(kind: Literal): boolean {
    if (this.token.kind === kind) {
      this.token = this.scanner.scan();

      return true;
    }

    return false;
  }
}

/**
 * A simple parser for parsing a list of user-specified grid sizes.
 *
 * Attention: The parsed grid size is clamped to the interval [1, 64].
 * For instance, `600x800` will be parsed as `64x64`.
 *
 * It parses inputs that are coherent with the following grammar. The grammer
 * uses the lexemes defined by {@link Literal}:

 * List     := [ GridSize { "," GridSize } ] .
 * GridSize := Number "x" Number .
 *
 * Examples:
 * - ""
 * - " "
 * - "3x1"
 * - "2x1, 4x12"
 * - " 2 x8  , 3x 4 ,10  x2 "
 */
export class GridSizeListParser extends Parser {
  constructor(input: string) {
    super(input);
  }

  /**
   * Parses the input provided during instance creation.
   *
   * @returns The parsed grid list or `null` when a parser error occured.
   */
  parse(): GridSize[] | null {
    try {
      this.begin();
      const result = this.#parseList();
      this.finish();
      return result;
    } catch (e) {
      if (e instanceof LexicalError || e instanceof ParseError) {
        console.warn(
          `Failed to parse grid-size list.`,
          `Error: ${e.message}`,
        );
        return null;
      }

      throw e;
    }
  }

  #parseList(): GridSize[] {
    const gridSizes: GridSize[] = [];

    switch (this.token.kind) {
      case Literal.$:
        return gridSizes;
      case Literal.Number:
        do {
          gridSizes.push(this.#parseGridSize());
        } while (this.acceptIf(Literal.Separator));

        return gridSizes;
    }

    throw new ParseError(`Unexpected token "${this.token.raw}" ` +
      `(type: ${this.token.kind}) at pos ${this.token.position}.`);
  }

  #parseGridSize(): GridSize {
    const cols = clamp(this.parseNumber(), 1, 64);
    this.accept({ kind: Literal.Keyword, raw: "x" });
    const rows = clamp(this.parseNumber(), 1, 64);

    return { cols, rows };
  }

  #parseNumber(): number {
    return Number(this.accept({ kind: Literal.Number }));
  }
}

/**
 * A simple parser for parsing a list of user-specified resize presets.
 *
 * ATTENTION: !!! The parsed offset is revised by -1 !!!
 * Currently, the user specifies the tile offset as 1-based index while this
 * codebase uses 0-based indexes for all calculations. The parser does revise
 * the offset for convenience.
 *
 * It parses inputs that are coherent with the following grammar. The grammer
 * uses the lexemes defined by {@link Literal}:
 *
 * S         := [ Preset { "," ( Preset | Selection ) } ] .
 * Preset    := GridSize Selection .
 * Selection := Offset Offset .
 * GridSize  := Number "x" Number .
 * Offset    := Number ":" Number .
 *
 * Implementation detail:
 * The grammar above is not parsable by the LL(1) parser used in this
 * implementation. Thus, the grammer found in the implementation below differs
 * slightly from the (more intuitive) one above which requires an LL(2) parser.
 * For reference, this is the grammar used in the implementation below. It
 * produces the same expressions as the one above.
 *
 * S                 := [ GridSize Selection { "," PresetOrSelection } ] .
 * PresetOrSelection := Number ( "x" Number Selection | ":" Number Offset ) .
 * Selection         := Offset Offset .
 * GridSize          := Number "x" Number .
 * Offset            := Number ":" Number .
 *
 * Examples
 * - ""
 * - " "
 * - "2x3 1:3 1:3"
 * - "4x4 1:3 2:4, 1:2 3:4, 1:1 4:4, 1:4 1:4"
 * - "8x8 3:3 6:6, 2:2 7:7,1:1 8:8,16x16 6:6 10:10"
 */
export class ResizePresetListParser extends Parser {
  constructor(input: string) {
    super(input);
  }

  /**
   * Parses the input provided during instance creation.
   *
   * Attention: Automatically revises the parsed 1-based offsets to 0-based
   * offsets!
   *
   * @returns The parsed presets or `null` when a parser error occured.
   */
  parse(): Preset[] | null {
    try {
      this.begin();
      const result = this.#parseList();
      this.finish();
      for (const { gridSize, selection } of result) {
        for (const { col, row } of [selection.anchor, selection.target]) {
          if (col >= gridSize.cols || row >= gridSize.rows) {
            throw new ParseError("Resize preset coordinates exceed its grid");
          }
        }
      }
      return result;
    } catch (e) {
      if (e instanceof LexicalError || e instanceof ParseError) {
        console.warn(
          `Failed to parse preset list.`,
          `Error: ${e.message}`,
        );
        return null;
      }

      throw e;
    }
  }

  #parseList(): Preset[] {
    const presets: Preset[] = [];

    switch (this.token.kind) {
      case Literal.$:
        return presets;
      case Literal.Number:
        const gridSize = this.#parseGridSize();
        const selection = this.#parseSelection();
        presets.push({ gridSize, selection });

        while (this.acceptIf(Literal.Separator)) {
          const presetOrSelection = this.#parsePresetOrSelection();
          if (this.#isPreset(presetOrSelection)) {
            presets.push(presetOrSelection);
          } else {
            const { gridSize: { cols, rows } } = presets[presets.length - 1];
            presets.push({
              gridSize: { cols, rows },
              selection: presetOrSelection,
            });
          }
        }

        return presets;
    }

    throw new ParseError(`Unexpected token "${this.token.raw}" ` +
      `(type: ${this.token.kind}) at pos ${this.token.position}.`);
  }

  #parsePresetOrSelection(): Preset | GridSelection {
    const num = this.parseNumber();

    switch (this.token.kind) {
      case Literal.Keyword:
        this.accept({ kind: Literal.Keyword, raw: "x" });
        const rows = this.parseNumber();
        const selection = this.#parseSelection();

        return {
          gridSize: { cols: num, rows },
          selection
        } satisfies Preset;
      case Literal.Colon:
        this.accept();
        const row = this.parseNumber();
        const target = this.#parseOffset();

        return {
          // Revise by -1 due to 0-based index that is used throughout the code.
          anchor: { col: num - 1, row: row - 1 },
          target,
        } satisfies GridSelection;
    }

    throw new ParseError(`Unexpected token "${this.token.raw}" ` +
      `(type: ${this.token.kind}) at pos ${this.token.position}.`);
  }

  #parseSelection(): GridSelection {
    const anchor = this.#parseOffset();
    const target = this.#parseOffset();

    return { anchor, target };
  }

  #parseGridSize(): GridSize {
    const cols = this.parseNumber();
    this.accept({ kind: Literal.Keyword, raw: "x" });
    const rows = this.parseNumber();

    return { cols, rows };
  }

  #parseOffset(): GridOffset {
    // Revise by -1 due to 0-based index that is used throughout the code.
    // Note that a number is defined as being >=1 in the lexer grammar.
    const col = this.parseNumber() - 1;
    this.accept({ kind: Literal.Colon });
    const row = this.parseNumber() - 1;

    return { col, row };
  }

  #isPreset(o: Preset | GridSelection): o is Preset {
    return "gridSize" satisfies keyof Preset in o;
  }
}

/**
 * A parser for {@link GridSpec}s. A grid spec is a very simple DSL that allows
 * defining a grid in terms of a hierarchy of child rows and columns.
 *
 * The following grammar can be used to generate valid grid spec expressions:
 *
 * gridspec := [ ( colspec | rowspec ) ] .
 * colspec  := "cols" "(" cellspec { "," cellspec } ")" .
 * rowspec  := "rows" "(" cellspec { "," cellspec } ")" .
 * cellspec := <number> [ ( "d" | ":" ( colspec | rowspec ) ) ] .
 *
 * Examples:
 * - ""            - describes a single-cell grid with 100% width and height
 * - "rows(3, 1)"  - describes a grid with 2 rows that take 75% and 25% height.
 * - "cols(2, 2d)" - describes a grid with 2 cells (one dynamic) each 50% width.
 * - "cols(2:rows(1,2d,1), 2:rows(1,2:rows(1,1),1))"
 */
export class GridSpecParser extends Parser {
  #depth = 0;
  #cells = 0;

  /**
   * Parses the input provided during instance creation.
   *
   * @returns The parsed {@link GridSpec} or `null` when a parser error occured.
   */
  parse(): GridSpec | null {
    try {
      this.#depth = 0;
      this.#cells = 0;
      this.begin();
      const result = this.#parseGridSpec();
      this.finish();
      return result;
    } catch (e) {
      if (e instanceof LexicalError || e instanceof ParseError) {
        console.warn(
          `Failed to parse GridSpec.`,
          `Error: ${e.message}`,
        );
        return null;
      }

      throw e;
    }
  }

  #parseGridSpec(): GridSpec {
    switch (this.token.kind) {
      case Literal.$:
        return { mode: "cols", cells: [{ weight: 1, dynamic: false }] };
      case Literal.Keyword:
        return this.#parseColRowSpec();
    }

    throw new ParseError(`Unexpected token "${this.token.raw}" ` +
      `(type: ${this.token.kind}) at pos ${this.token.position}.`);
  }

  #parseColRowSpec(): GridSpec {
    if (++this.#depth > MAX_GRID_DEPTH) {
      throw new ParseError("Grid nesting exceeds 32 levels");
    }
    try {
      switch (this.token.kind) {
        case Literal.Keyword:
          const mode = this.token.raw;
          if (mode !== "cols" && mode !== "rows") {
            break;
          }

          this.accept();
          this.accept({ kind: Literal.LParen });

          const cells: GridCellSpec[] = [];
          do {
            cells.push(this.#parseCellSpec());
          } while (this.acceptIf(Literal.Separator));

          this.accept({ kind: Literal.RParen });

          return { mode, cells };
      }

      throw new ParseError(`Unexpected token "${this.token.raw}" ` +
        `(type: ${this.token.kind}) at pos ${this.token.position}.`);
    } finally {
      --this.#depth;
    }
  }

  #parseCellSpec(): GridCellSpec {
    if (++this.#cells > MAX_GRID_CELLS) {
      throw new ParseError("Grid exceeds 1024 cells");
    }
    const weight = this.parseNumber();
    let dynamic = false;
    let child: GridSpec | undefined;

    if (this.token.kind === Literal.Keyword && this.token.raw === "d") {
      this.accept();
      dynamic = true;
    } else if (this.acceptIf(Literal.Colon)) {
      child = this.#parseColRowSpec();
    }

    return { weight, dynamic, child };
  }

}
