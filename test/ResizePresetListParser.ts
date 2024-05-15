import test, { ExecutionContext } from "ava";

import { Preset, ResizePresetListParser } from "../src/util/parser.js";
import { supressLogging, unsuppressLogging } from "./helpers/index.js";

// Suppress application-level logging for tests in this file
test.before(() => supressLogging());
test.after(() => unsuppressLogging());

const testSemanticEquivalence = (
  t: ExecutionContext,
  ...presets: [presetA: string, presetB: string][]
) => {
  for (const preset of presets) {
    const parsedA = (new ResizePresetListParser(preset[0])).parse();
    const parsedB = (new ResizePresetListParser(preset[1])).parse();

    t.not(parsedA, null);
    t.not(parsedB, null);
    t.deepEqual(parsedA, parsedB);
  }
}

test("parses short notation",
  testSemanticEquivalence,
  [
    "3x3 1:1 2:2, 2x2 1:1 1:1     2:2 2:2",
    "3x3 1:1 2:2, 2x2 1:1 1:1 2x2 2:2 2:2",
  ],
  [
    "3x3 1:1 2:2,     1:1 1:1, 4x4 1:1 1:1,     1:3 4:4",
    "3x3 1:1 2:2, 3x3 1:1 1:1, 4x4 1:1 1:1, 4x4 1:3 4:4",
  ],
  [
    "3x3 1:1 2:2,     1:1 1:1",
    "3x3 1:1 2:2, 3x3 1:1 1:1",
  ],
);

const testSyntacticError = (
  t: ExecutionContext,
  ...presets: string[]
) => {
  for (const preset of presets) {
    t.is((new ResizePresetListParser(preset)).parse(), null);
  }
};

test("handles invalid specs",
  testSyntacticError,
  "0x0 3:3 3:3",
  "0x1 3:3 3:3",
  "1x0 3:3 3:3",
  "3:3 0:0",
  "3:3 0:1",
  "3:3 1:0",
  "3:b 1:1",
  "3x3 1:b 1:1",
  "3xa 1:1 1:1",
  "3x3 1:a 1:1",
  "3x3 1:1 1:a",
  "xx3 1:1 1:1",
  "3x3 x:1 1:1",
  "3x3 1:1 x:1",
  "bx3 1:1 1:1",
  "3x3 b:1 1:1",
  "3x3 1:1 b:1",
);

const compareParsedRepresentation = (
  t: ExecutionContext,
  ...tests: [
    input: string,
    parsed: Preset[],
  ][]
) => {
  for (const test of tests) {
    const [input, expected] = test;

    t.deepEqual(
      (new ResizePresetListParser(input)).parse(),
      expected);
  }
}

test("parses correctly",
  compareParsedRepresentation,
  [
    "11x17 4:6 8:10",
    [
      {
        gridSize: { cols: 11, rows: 17 },
        selection: {
          anchor: { col: 3, row: 5 },
          target: { col: 7, row: 9 },
        },
      }
    ]
  ],
  [
    "8x8 3:3 6:6, 2:2 7:7,1:1 8:8,16x16 6:6 10:10",
    [
      {
        gridSize: { cols: 8, rows: 8 },
        selection: {
          anchor: { col: 2, row: 2 },
          target: { col: 5, row: 5 },
        },
      },
      {
        gridSize: { cols: 8, rows: 8 },
        selection: {
          anchor: { col: 1, row: 1 },
          target: { col: 6, row: 6 },
        },
      },
      {
        gridSize: { cols: 8, rows: 8 },
        selection: {
          anchor: { col: 0, row: 0 },
          target: { col: 7, row: 7 },
        },
      },
      {
        gridSize: { cols: 16, rows: 16 },
        selection: {
          anchor: { col: 5, row: 5 },
          target: { col: 9, row: 9 },
        },
      },
    ]
  ]
)

const compareSnapshot = (
  t: ExecutionContext,
  ...input: string[]
) => {
  for (const spec of input) {
    t.snapshot((new ResizePresetListParser(spec)).parse());
  }
}

test("regression",
  compareSnapshot,
  // These are the default presets as defined in the gschema.xml file
  // Corresponds to settings resize1 - resize30
  "4x4 1:3 2:4, 1:2 3:4, 1:1 4:4, 1:4 1:4",
  "4x4 1:3 4:4,1:2 4:4,1:1 4:4,1:4 4:4",
  "4x4 3:3 4:4,2:2 4:4,1:1 4:4,4:4 4:4",
  "4x4 1:1 2:4,1:1 3:4,1:1 4:4,1:1 1:4",
  "8x8 3:3 6:6, 2:2 7:7,1:1 8:8,16x16 6:6 10:10",
  "4x4 3:1 4:4,2:1 4:4,1:1 4:4,4:1 4:4",
  "4x4 1:1 2:2,1:1 3:3,1:1 4:4,1:1 1:1",
  "4x4 1:1 4:2,1:1 4:3,1:1 4:4,1:1 4:1",
  "4x4 3:1 4:2,2:1 4:3,1:1 4:4,4:1 4:1",
  "11x17 4:6 8:10",
  "2x3 1:3 1:3",
  "2x3 1:3 2:3",
  "2x3 2:3 2:3",
  "2x3 1:2 1:2",
  "2x3 2:1 2:2",
  "2x3 2:2 2:2",
  "2x3 1:1 1:1",
  "2x3 1:1 1:2",
  "2x3 2:1 2:1",
  "3x3 2:2 3:3",
  "3x3 1:3 1:3",
  "3x3 2:3 2:3",
  "3x3 3:3 3:3",
  "3x3 1:2 1:2",
  "3x3 2:2 2:2",
  "3x3 3:2 3:2",
  "3x3 1:1 1:1",
  "3x3 2:1 2:1",
  "3x3 3:1 3:1",
  "3x3 2:2 3:3",
);
