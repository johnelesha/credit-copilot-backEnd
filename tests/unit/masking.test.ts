import { describe, it, expect } from "vitest";
import { maskSensitiveText } from "../../src/domain/masking.js";

describe("maskSensitiveText", () => {
    it("masks a 14-digit national ID", () => {
        const text = "National ID 29001011234567";
        expect(maskSensitiveText(text)).toContain("2900**********");
        expect(maskSensitiveText(text)).not.toContain("29001011234567");
    });

    it("masks a mobile number", () => {
        const text = "Mobile 01012345678";
        const masked = maskSensitiveText(text);
        expect(masked).not.toContain("01012345678");
    });
});
