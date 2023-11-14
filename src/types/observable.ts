/**
 * A callback that consumes an event of type {@link T}.
 */
export type DispatchFn<T> = (event: T) => void;

/**
 * Provides notifcations about events of type {@link T} to all subscribers.
 */
export interface Publisher<T> {
  /**
   * Registers a callback that is called whenever a new event is published.
   *
   * @param fn The callback that is invoked whenever the publisher dispatches a
   *   new event of type {@link T}.
   */
  subscribe(fn: DispatchFn<T>): void;
}
