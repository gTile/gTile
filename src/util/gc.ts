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
  #routines: (() => void)[] = [];

  /**
   * Registers a cleanup routine that runs when {@link release} is called.
   *
   * @param fn The cleanup routine.
   */
  defer(fn: () => void) {
    this.#routines.push(fn);
  }

  /**
   * Executes all deferred cleanup routines in reverse order, i.e., LIFO.
   */
  release() {
    const errors: unknown[] = [];
    while (this.#routines.length > 0) {
      try {
        this.#routines.pop()!();
      } catch (error) {
        // One broken teardown must not leave shortcuts, signals, or actors
        // attached to Shell. Report failures after all resources are released.
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, "Failed to release gTile resources");
    }
  }
}
