import { GridSelection, GridSize } from "./grid.js";

/**
 * Represents an event related to the gTile user interface.
 */
export const enum Event {
  /**
   * User selected a set of tiles in the grid overlay.
   */
  Selection = 1,

  /**
   * Visibility state of the gTile user interface has changed.
   */
  Visibility,
}

export interface UserSelectionEvent {
  type: Event.Selection;
  monitorIdx: number;
  gridSize: GridSize;
  selection: GridSelection;
}

export interface VisibilityEvent {
  type: Event.Visibility;
  visible: boolean;
}

/**
 * A data structure that comprises of a discriminative {@link Event} and
 * associated meta information.
 */
export type OverlayEvent =
  | UserSelectionEvent
  | VisibilityEvent;
