const tilespec = imports.tilespec;

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
