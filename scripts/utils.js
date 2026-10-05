export const getCssVar = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const hexToRgb = (hex) => {
    if (!hex) return null;

    let sanitized = hex.replace("#", "").trim();
    if (sanitized.length === 3) {
        sanitized = sanitized
            .split("")
            .map((character) => character.repeat(2))
            .join("");
    }
    if (sanitized.length !== 6) return null;

    const value = Number.parseInt(sanitized, 16);
    if (Number.isNaN(value)) return null;

    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
    };
};

export const rgbaFromHex = (hex, alpha) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};
