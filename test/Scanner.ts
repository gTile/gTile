import test, { ExecutionContext } from "ava";

import { Literal, Scanner, Token } from "../src/util/scanner.js";

type RawLiteral = [type: Literal.Keyword | Literal.Number, raw: string];

const isLiteral = (token: Literal | RawLiteral): token is Literal =>
  typeof token === "number";

const matchTokenSequenceExhaustive = (
  t: ExecutionContext,
  ...tests: [
    input: string,
    ...tokens: (Literal | RawLiteral)[],
    EOL: Literal.$
  ][]
) => {
  for (const test of tests) {
    const [input, ...tokens] = test;
    const scanner = new Scanner(input);
    let token: Token, tokenIdx = 0;

    do {
      const expectedToken = tokens[tokenIdx];
      token = scanner.scan();

      if (isLiteral(expectedToken)) {
        t.is(token.kind, expectedToken);
      } else {
        t.is(token.kind, expectedToken[0]);
        t.is(token.raw, expectedToken[1]);
      }

      ++tokenIdx;
    } while (token.kind !== Literal.$ && tokenIdx < tokens.length);

    t.assert(token.kind === Literal.$);
    t.assert(tokenIdx === tokens.length);
  }
}

test("scans tokenstream",
  matchTokenSequenceExhaustive,
  ["", Literal.$],
  [
    "(multiply (add 12390 2) (add 3 2))",
    Literal.LParen,
    [Literal.Keyword, "multiply"],
    Literal.LParen,
    [Literal.Keyword, "add"],
    [Literal.Number, "12390"],
    [Literal.Number, "2"],
    Literal.RParen,
    Literal.LParen,
    [Literal.Keyword, "add"],
    [Literal.Number, "3"],
    [Literal.Number, "2"],
    Literal.RParen,
    Literal.RParen,
    Literal.$,
  ],
  [
    "3x3 1:1 1:a",
    [Literal.Number, "3"],
    [Literal.Keyword, "x"],
    [Literal.Number, "3"],
    [Literal.Number, "1"],
    Literal.Colon,
    [Literal.Number, "1"],
    [Literal.Number, "1"],
    Literal.Colon,
    [Literal.Keyword, "a"],
    Literal.$,
  ]
);
