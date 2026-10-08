import test from "ava";

import { GarbageCollection } from "../src/util/gc.js";
import { VolatileStorage } from "../src/util/volatile.js";

test("cleanup runs in reverse order and is safe to repeat", t => {
  const gc = new GarbageCollection();
  const calls: number[] = [];
  gc.defer(() => { calls.push(1); });
  gc.defer(() => { calls.push(2); });
  gc.release();
  gc.release();
  t.deepEqual(calls, [2, 1]);
});

test("cleanup releases every resource even when one callback fails", t => {
  const gc = new GarbageCollection();
  const calls: string[] = [];
  const cause = new Error("disconnect failed");
  gc.defer(() => { calls.push("shortcuts"); });
  gc.defer(() => { throw cause; });
  gc.defer(() => { calls.push("actors"); });
  const error = t.throws(() => gc.release(), { instanceOf: AggregateError });
  t.deepEqual(error.errors, [cause]);
  t.deepEqual(calls, ["actors", "shortcuts"]);
  t.notThrows(() => gc.release());
});

test("volatile storage clears retained state when disabled", t => {
  const store = new VolatileStorage<number>(1000);
  store.store = 42;
  t.is(store.store, 42);
  store.release();
  t.is<number | null, null>(store.store, null);
  t.notThrows(() => store.release());
});

test("volatile storage expires presets automatically", async t => {
  const store = new VolatileStorage<number>(10);
  store.store = 42;
  await new Promise(resolve => setTimeout(resolve, 30));
  t.is<number | null, null>(store.store, null);
  store.release();
});
