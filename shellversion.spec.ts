import { ShellVersion } from "./shellversion";

describe("shellversion", () => {
    it("parsing of major and minor version to work for valid versions", () => {
        expect(ShellVersion.parse('3.34').major).toEqual(3);
        expect(ShellVersion.parse('3.34').minor).toEqual(34)
        expect(ShellVersion.parse('3.3').minor).toEqual(3);
    });
    it("parsing of major and minor version to fail for invalid versions", () => {
        expect(() => ShellVersion.parse('3.3x')).toThrow();
    });
    it("version_at_least_34 to behave properly", () => {
        expect(ShellVersion.parse('3.34').version_at_least_34()).toBeTrue();
        expect(ShellVersion.parse('3.35').version_at_least_34()).toBeTrue();
        expect(ShellVersion.parse('4.35').version_at_least_34()).toBeTrue();
        expect(ShellVersion.parse('2.35').version_at_least_34()).toBeFalse();
        expect(ShellVersion.parse('3.33').version_at_least_34()).toBeFalse();
    });
    it("version_at_least_36 to behave properly", () => {
        expect(ShellVersion.parse('3.34').version_at_least_36()).toBeFalse();
        expect(ShellVersion.parse('3.35').version_at_least_36()).toBeFalse();
        expect(ShellVersion.parse('3.36').version_at_least_36()).toBeTrue();
        expect(ShellVersion.parse('3.37').version_at_least_36()).toBeTrue();
        expect(ShellVersion.parse('4.35').version_at_least_36()).toBeTrue();
        expect(ShellVersion.parse('2.35').version_at_least_36()).toBeFalse();
        expect(ShellVersion.parse('3.33').version_at_least_36()).toBeFalse();
    });
})