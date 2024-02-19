import Meta from "gi://Meta";

import { Rectangle } from "./grid.js";

/**
 * Abstraction that represents monitor settings.
 */
export interface Screen {
  index: number;
  scale: number;
  resolution: Rectangle;
  workArea: Rectangle;
}

/**
 * Represents an event that is related to the desktop environment of the user.
 */
export const enum Event {
  /**
   * Focused window has changed.
   */
  FOCUS = 1,

  /**
   * Monitor configuration has changed.
   */
  MONITORS_CHANGED,

  /**
   * The workspace overview was (de)activated.
   */
  OVERVIEW,
}

export interface FocusEvent {
  type: Event.FOCUS;
  target: Meta.Window | null;
}

export interface MonitorEvent {
  type: Event.MONITORS_CHANGED;
}

export interface OverviewEvent {
  type: Event.OVERVIEW;
  visible: boolean;
}

/**
 * A data structure that comprises of a discriminative {@link Event} and
 * associated meta information.
 */
export type DesktopEvent =
  | FocusEvent
  | MonitorEvent
  | OverviewEvent;
