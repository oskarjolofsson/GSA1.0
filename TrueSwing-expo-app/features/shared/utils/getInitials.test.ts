import { getInitials } from "features/shared/utils/getInitials";

describe("getInitials", () => {
    it("uses first and last word of a multi-word name", () => {
        expect(getInitials("Oskar Olofsson", null)).toBe("OO");
    });

    it("uses a single initial for a one-word name", () => {
        expect(getInitials("Madonna", null)).toBe("M");
    });

    it("ignores extra whitespace between words", () => {
        expect(getInitials("  Oskar   Johan  Olofsson  ", null)).toBe("OO");
    });

    it("falls back to the email's first alphanumeric character", () => {
        expect(getInitials(null, "oskar@example.com")).toBe("O");
        expect(getInitials("   ", "9live@example.com")).toBe("9");
    });

    it("skips leading non-alphanumeric characters in the email", () => {
        expect(getInitials(null, ".hidden@example.com")).toBe("H");
    });

    it("returns '?' when both name and email are missing", () => {
        expect(getInitials(null, null)).toBe("?");
        expect(getInitials("", "")).toBe("?");
        expect(getInitials(undefined, undefined)).toBe("?");
    });
});
