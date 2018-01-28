const System = imports.compiled_typescript.System;

describe('Prep', function() {
  it("System should not be null", function() {
    expect(System).not.toBe(null);
  });
});

describe('Loader', function() {
  it("tilespec should get imported", function(done) {
    System.import('tilespec')
      .then(x => done(), e => done.fail(e));
  });
});

System.import('tilespec').then((tilespec) => {
describe("TileSpec", function() {
  it("tilespec.parsePreset should work", function () {
    const roundtrip = function(s) {
      return tilespec.parsePreset(s)
        .map(x => x.toString())
        .join(', ');
            };
    expect(roundtrip('3x3 0:0 1:1, 2x2 0:0 0:0'))
      .toBe('3x3 0:0 1:1, 2x2 0:0 0:0');
        });
});
})