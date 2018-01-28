const tilespec = imports.tilespec;

describe("Screen", function() {

    it("tilespec.parseTuple should be a thing", function () {
        expect(parseTuple("3x3 0:0 1:1")).isNotNull();
    });
});