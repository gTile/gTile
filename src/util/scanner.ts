export class LexicalError extends Error {}

export const enum Literal {
  /**
   * A number literal with one or more digits. Never starts with "0".
   */
  Number = 1,

  /**
   * A string consisting of only lower case letters.
   */
  Keyword,

  /**
   * The literal ",".
   */
  Separator,

  /**
   * The literal ":".
   */
  Colon,

  /**
   * The literal "(".
   */
  LParen,

  /**
   * The literal ")".
   */
  RParen,

  /**
   * Represents the end of the input string.
   */
  $,
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
 * Token     := ( Number | Keyword | Separator | Colon | LParen | RParen | $ ) .
 * Number    := 1 … 9 { ( "0" | Number ) } .
 * Keyword   := a … z { Keyword } .
 * Separator := "," .
 * Colon     := ":" .
 * LParen    := "(" .
 * RParen    := ")" .
 * EOS       := $ .
 */
export class Scanner {
  static DigitRegex = /^[0-9]$/;
  static CharRegex = /^[a-z]$/;

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
      case "1": case "2": case "3": case "4": case "5":
      case "6": case "7": case "8": case "9":
        do {
          this.#take();
        } while (Scanner.DigitRegex.test(this.#input[this.#position]));

        return Literal.Number;
      case "a": case "b": case "c": case "d": case "e": case "f": case "g":
      case "h": case "i": case "j": case "k": case "l": case "m": case "n":
      case "o": case "p": case "q": case "r": case "s": case "t": case "u":
      case "v": case "w": case "x": case "y": case "z":
        do {
          this.#take();
        } while (Scanner.CharRegex.test(this.#input[this.#position]));
        return Literal.Keyword;
      case ",":
        this.#take();
        return Literal.Separator;
      case ":":
        this.#take();
        return Literal.Colon;
      case "(":
        this.#take();
        return Literal.LParen;
      case ")":
        this.#take();
        return Literal.RParen;
      case undefined:
        return Literal.$;
    }

    throw new LexicalError(
      `Unexpected character "${char}" at position ${this.#position}.`);
  }
}
