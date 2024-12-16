import { KeyBindingSettingKey } from "./settings.js";

type StripPrefix<S extends string, P extends string> =
  S extends `${P}${infer U}` ? U : never;

type AsNumber<T extends string> =
  T extends `${infer U extends number}` ? U : never;

/**
 * Represents a user intent.
 */
export const enum Action {
  /**
   * Toggle gTile overlay.
   */
  TOGGLE = 1,

  /**
   * Close the gTile overlay and abort the current operation, if any.
   */
  CANCEL,

  /**
   * Apply the previewed window placement.
   */
  CONFIRM,

  /**
   * Changes the current grid size by cycling through the available presets.
   */
  LOOP_GRID_SIZE,

  /**
   * Move currently previewed grid selection in the desired direction by a
   * single tile.
   */
  PAN,

  /**
   * Extend or shrink the current grid selection preview by one tile in the
   * desired direction such that it aligns with the grid.
   */
  ADJUST,

  /**
   * Moves a window by at most one tile in the desired direction such that the
   * edge of the window aligns with the grid.
   */
  MOVE,

  /**
   * Expand or contract the specified edge of a window by at most one tile such
   * that it aligns with the grid.
   */
  RESIZE,

  /**
   * Move and resize a window such that it fills the the remaining space in all
   * four cardinal directions until it either snaps to the screen edge or a
   * neighbouring window.
   */
  GROW,

  /**
   * Move and resize a window by looping through a list of user-defined
   * specifications, i.e. grid size + selection, in the selected preset.
   */
  LOOP_PRESET,

  /**
   * Move the window to the neighbouring screen.
   */
  RELOCATE,

  /**
   * Autotile all windows on a screen according to the desired layout.
   */
  AUTOTILE,
}

export type CardinalDirection = "north" | "east" | "south" | "west";

export interface ToggleAction {
  type: Action.TOGGLE;
}

export interface CancelAction {
  type: Action.CANCEL;
}

export interface ConfirmAction {
  type: Action.CONFIRM;
}

export interface LoopGridSizeAction {
  type: Action.LOOP_GRID_SIZE;
}

export interface PanAction {
  type: Action.PAN;
  dir: CardinalDirection;
}

export interface AdjustAction {
  type: Action.ADJUST;
  mode: "extend" | "shrink";
  dir: CardinalDirection;
}

export interface MoveAction {
  type: Action.MOVE;
  dir: CardinalDirection;
}

export interface ResizeAction {
  type: Action.RESIZE;
  mode: "extend" | "shrink";
  dir: CardinalDirection;
}

export interface GrowAction {
  type: Action.GROW;
}

export interface LoopPresetAction {
  type: Action.LOOP_PRESET;
  preset: AsNumber<StripPrefix<KeyBindingSettingKey, "preset-resize-">>;
}

export interface RelocateAction {
  type: Action.RELOCATE;
}

export type AutoTileAction = {
  type: Action.AUTOTILE;
  layout: "main" | "main-inverted";
} | {
  type: Action.AUTOTILE;
  layout: "cols";
  cols: AsNumber<StripPrefix<KeyBindingSettingKey, "autotile-">>;
}

/**
 * A data structure that comprises of a discriminative {@link Action} and
 * associated meta information.
 */
export type HotkeyAction =
  | ToggleAction
  | CancelAction
  | ConfirmAction
  | LoopGridSizeAction
  | PanAction
  | AdjustAction
  | MoveAction
  | ResizeAction
  | GrowAction
  | LoopPresetAction
  | RelocateAction
  | AutoTileAction;
