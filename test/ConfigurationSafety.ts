import test from "ava";

import {
  GridSizeListParser,
  GridSpecParser,
  ResizePresetListParser,
} from "../src/util/parser.js";
import { AutoTileLayouts } from "../src/util/grid.js";
import type { ExtensionSettings } from "../src/types/settings.js";
import { supressLogging, unsuppressLogging } from "./helpers/index.js";

test.before(() => supressLogging());
test.after(() => unsuppressLogging());

test("rejects trailing tokens instead of silently applying a partial setting", t => {
  t.is(new GridSizeListParser("3x3 4x4").parse(), null);
  t.is(new ResizePresetListParser("3x3 1:1 2:2 3:3 3:3").parse(), null);
  t.is(new GridSpecParser("cols(1,2) rows(1,2)").parse(), null);
});

test("rejects unsafe numeric values before calculating window geometry", t => {
  for (const number of ["9007199254740993", "9".repeat(400)]) {
    t.is(new GridSizeListParser(`${number}x3`).parse(), null);
    t.is(new ResizePresetListParser(`3x3 1:1 ${number}:2`).parse(), null);
    t.is(new GridSpecParser(`cols(1,${number})`).parse(), null);
  }
});

test("resize presets cannot project coordinates outside their grid", t => {
  t.is(new ResizePresetListParser("2x2 1:1 3:2").parse(), null);
  t.is(new ResizePresetListParser("2x2 1:1 2:3").parse(), null);
  t.is(new ResizePresetListParser("2x2 1:1 2:2, 999999999:1 1:1")
    .parse(), null);
});

test("limits settings length before scanning on Shell's main thread", t => {
  const input = " ".repeat(8193);
  t.is(new GridSizeListParser(input).parse(), null);
  t.is(new ResizePresetListParser(input).parse(), null);
  t.is(new GridSpecParser(input).parse(), null);
});

test("bounds recursion and cell count without rejecting ordinary nested grids", t => {
  t.not(new GridSpecParser("rows(1,2:cols(1,3d))").parse(), null);
  const nested = (depth: number) => "cols(1:".repeat(depth) + "cols(1)" +
    ")".repeat(depth);
  t.not(new GridSpecParser(nested(31)).parse(), null);
  t.is(new GridSpecParser(nested(32)).parse(), null);
  t.not(new GridSpecParser(`cols(${Array(1024).fill("1").join(",")})`)
    .parse(), null);
  t.is(new GridSpecParser(`cols(${Array(1025).fill("1").join(",")})`)
    .parse(), null);
});

test("empty grid specs tile to a single cell", t => {
  t.deepEqual(new GridSpecParser("").parse(), {
    mode: "cols", cells: [{ weight: 1, dynamic: false }],
  });
});

test("grid size clamping remains compatible with existing settings", t => {
  t.deepEqual(new GridSizeListParser("600x800, 4x3").parse(), [
    { cols: 64, rows: 64 }, { cols: 4, rows: 3 },
  ]);
});

test("invalid ratios fall back to usable layouts with positive weights", t => {
  for (const ratios of ["", "0,1", "NaN,Infinity", "0.5oops"]) {
    const settings = {
      get_string: (key: string) => key === "autotile-main-window-ratios"
        ? ratios : "cols(1d)",
    } as ExtensionSettings;
    const layouts = AutoTileLayouts(settings);
    t.is(layouts.main.length, 1);
    t.true(layouts.main[0].cells.every(cell => cell.weight > 0));
    t.true(layouts["main-inverted"][0].cells.every(cell => cell.weight > 0));
  }
});
