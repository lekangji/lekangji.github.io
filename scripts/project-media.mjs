// Add supplied images here as { src: "images/exact-filename.jpg", alt: "…" }.
// Paths are relative to the site root. The first image is the cover.
// Empty lists retain the existing illustrations without speculative requests.
export const projectMedia = {
    "macro-ups": [],
    "print-failure-detection": [],
    "browser-gaming-platform": [],
};

export const mediaUrl = (src) => new URL(`../${src}`, import.meta.url).href;

export function loadMedia(image, asset, { onLoad = () => {}, onError = () => {} } = {}) {
    image.alt = asset.alt;
    image.decoding = "async";
    image.loading = "lazy";
    image.addEventListener("load", onLoad, { once: true });
    image.addEventListener("error", () => {
        image.remove();
        onError();
    }, { once: true });
    image.src = mediaUrl(asset.src);
}
