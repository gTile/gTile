/**
 * Demands explicit deallocation of resources to avoid memory leaks and prevent
 * otherwise irreversible side-effects.
 */
export interface GarbageCollector {
  /**
   * Performs a garbage collection cycle and release allocated resources.
   */
  release(): void;
}

export class GarbageCollection implements GarbageCollector {
  #routines: Function[] = [];

  /**
   * Registers a cleanup routine that runs when {@link release} is called.
   *
   * @param fn The cleanup routine.
   */
  defer(fn: Function) {
    this.#routines.push(fn);
  }

  /**
   * Executes all deferred cleanup routines in reverse order, i.e. LIFO.
   */
  release() {
    while (this.#routines.length > 0) {
      this.#routines.pop()!();
    }
  }
}
