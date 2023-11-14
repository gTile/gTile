import { GarbageCollection } from "./gc.js";

/**
 * Provides a volatile storage for values of type {@link T}. The store
 * automatically clears the value after a specified duration.
 */
export interface VolatileStore<T> {
  store: T | null;
}

export class VolatileStorage<T> implements VolatileStore<T> {
  #gc: GarbageCollection
  #timeout: number;
  #stored: T | null;

  /**
   * Creates a timeout-based volatile store.
   *
   * @param lifetime The duration (in ms) that the store will hold its value.
   */
  constructor(lifetime: number) {
    this.#gc = new GarbageCollection();
    this.#timeout = lifetime;
    this.#stored = null;
  }

  /**
   * A volatile value that is automatically reset to null after the lifetime.
   */
  set store(t: T | null) {
    this.#gc.release();
    this.#stored = t;
    const id = setTimeout(() => this.#stored = null, this.#timeout);
    this.#gc.defer(() => clearTimeout(id));
  }

  get store(): T | null {
    return this.#stored;
  }
}
