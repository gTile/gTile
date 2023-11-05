export class LexicalError extends Error {}

export const enum Literal {
  /**
   * The literal "0".
   */
  Zero = 1,

  /**
   * A number literal with one or more digits. Never starts with "0".
   */
  Number,

  /**
   * The literal "x" or "X".
   */
  X,

  /**
   * The literal ",".
   */
  Separator,

  /**
   * The literal ":".
   */
  Colon,

  /**
   * Represents the end of the input string.
   */
  EOS,
};

/**
 * Datastructure that describes a scanned lexeme.
 */
export interface Token {
  kind: Literal;
  position: number;
  raw: string;
}

/**
 * A simple scanner able to tokenize the lexemes of this lexical grammar:
 *
 * Token     := { Zero | Number | X | Separator | Colon | EOS } .
 * Zero      := 0 .
 * Number    := 1 … 9 [ Number ] .
 * X         := "x" | "X" .
 * Separator := "," .
 * Colon     := ":" .
 * EOS       := $ .
 */
export class Scanner {
  static DigitRegex = /[0-9]/;

  #input: string;
  #position: number;
  #buffer: string;

  constructor(input: string) {
    this.#input = input;
    this.#position = 0;
    this.#buffer = "";
  }

  /**
   * Scans the next token from the input.
   *
   * @returns The scanned token.
   * @throws {LexicalError} When a non-supported character was encountered.
   */
  scan(): Token {
    while (this.#input[this.#position] === " ") ++this.#position;

    const position = this.#position;
    const kind = this.#scanToken();
    const token: Token = { kind, position, raw: this.#buffer };
    this.#buffer = "";

    return token;
  }

  /**
   * The input string that the scanner operates on.
   */
  get input(): string {
    return this.#input;
  }

  #take(): void {
    this.#buffer += this.#input[this.#position++];
  }

  #scanToken(): Literal {
    const char = this.#input[this.#position];

    switch (char) {
      case "0":
        this.#take();
        return Literal.Zero;
      case "1": case "2": case "3": case "4": case "5":
      case "6": case "7": case "8": case "9":
        do {
          this.#take();
        } while (Scanner.DigitRegex.test(this.#input[this.#position]));

        return Literal.Number;
      case "x": case "X":
        this.#take();
        return Literal.X;
      case ",":
        this.#take();
        return Literal.Separator;
      case ":":
        this.#take();
        return Literal.Colon;
      case undefined:
        return Literal.EOS;
    }

    throw new LexicalError(
      `Unexpected character "${char}" at position ${this.#position}.`);
  }
}
