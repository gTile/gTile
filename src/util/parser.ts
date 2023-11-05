import { GridOffset, GridSelection, GridSize } from "../types/grid.js";
import { LexicalError, Literal, Scanner, Token } from "./scanner.js";

/**
 * Represents a selection bound to a particular grid.
 */
export interface Preset {
  gridSize: GridSize;
  selection: GridSelection;
}

class ParseError extends Error {}

abstract class Parser {
  protected scanner: Scanner;
  protected token!: Token;

  constructor(input: string) {
    this.scanner = new Scanner(input);
  }

  protected accept(kind?: Literal) {
    if (kind !== undefined && this.token.kind !== kind) {
      throw new ParseError(`Unexpected token ${this.token.kind}. Want ${kind}`);
    }

    this.token = this.scanner.scan();
  }

  protected acceptIf(kind: Literal): boolean {
    if (this.token.kind === kind) {
      this.token = this.scanner.scan();

      return true;
    }

    return false;
  }
}

/**
 * A simple parser for parsing a list of user-specified grid sizes. It parses
 * inputs that are coherent with the following grammar. The grammer uses the
 * lexemes defined by {@link Literal}:
 *
 * List     := [ GridSize { Separator GridSize } ] .
 * GridSize := Number X Number .
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
      this.token = this.scanner.scan();

      return this.#parseList();
    } catch (e) {
      if (e instanceof LexicalError || e instanceof ParseError) {
        console.warn(
          `Failed to parse preset list. Input: "${this.scanner.input}".`,
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
      case Literal.EOS:
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
    const cols = this.#parseNumber();
    this.accept(Literal.X);
    const rows = this.#parseNumber();

    return { cols, rows };
  }

  #parseNumber(): number {
    const n = Number(this.token.raw);
    this.accept(Literal.Number);

    return n;
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
 * S         := [ Preset { Separator ( Preset | Selection ) } ] .
 * Preset    := GridSize Selection .
 * Selection := Offset Offset .
 * GridSize  := Number X Number .
 * Offset    := Number Colon Number .
 *
 * Implementation detail:
 * The grammar above is not parsable by the LL(1) parser used in this
 * implementation. Thus, the grammer found in the implementation below differs
 * slightly from the (more intuitive) one above which requires an LL(2) parser.
 * For reference, this is the syntactically equivalent grammar used in the
 * implementation below:
 *
 * S                 := [ GridSize Selection { Separator PresetOrSelection } ] .
 * PresetOrSelection := Number ( X Number Selection | Colon Number Offset ) .
 * Selection         := Offset Offset .
 * GridSize          := Number X Number .
 * Offset            := Number Colon Number .
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
      this.token = this.scanner.scan();

      return this.#parseList();
    } catch (e) {
      if (e instanceof LexicalError || e instanceof ParseError) {
        console.warn(
          `Failed to parse preset list. Input: "${this.scanner.input}".`,
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
      case Literal.EOS:
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
    const num = this.#parseNumber();

    switch (this.token.kind) {
      case Literal.X:
        this.accept();
        const rows = this.#parseNumber();
        const selection = this.#parseSelection();

        return {
          gridSize: { cols: num, rows },
          selection
        } satisfies Preset;
      case Literal.Colon:
        this.accept();
        const row = this.#parseNumber();
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
    const cols = this.#parseNumber();
    this.accept(Literal.X);
    const rows = this.#parseNumber();

    return { cols, rows };
  }

  #parseOffset(): GridOffset {
    // Revise by -1 due to 0-based index that is used throughout the code.
    // Note that a number is defined as being >=1 in the lexer grammar.
    const col = this.#parseNumber() - 1;
    this.accept(Literal.Colon);
    const row = this.#parseNumber() - 1;

    return { col, row };
  }

  #parseNumber(): number {
    const n = Number(this.token.raw);
    this.accept(Literal.Number);

    return n;
  }

  #isPreset(o: Preset | GridSelection): o is Preset {
    return 'gridSize' satisfies keyof Preset in o;
  }
}

