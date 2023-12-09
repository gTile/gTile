import Meta from "gi://Meta";

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
}

export interface FocusEvent {
  type: Event.FOCUS;
  target: Meta.Window | null;
}

export interface MonitorEvent {
  type: Event.MONITORS_CHANGED;
}

/**
 * A data structure that comprises of a discriminative {@link Event} and
 * associated meta information.
 */
export type DesktopEvent =
  | FocusEvent
  | MonitorEvent;
