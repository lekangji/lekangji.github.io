export const initActivity = () => {
    const images = document.querySelectorAll("[data-activity-image]");
    if (!images.length) return;

    for (const image of images) {
        const status = document.getElementById(image.dataset.activityStatus);
        const loaded = () => {
            image.hidden = false;
            status.hidden = true;
        };
        const failed = () => {
            image.hidden = true;
            status.hidden = false;
            status.textContent = "Activity stats are unavailable right now.";
        };
        image.addEventListener("load", loaded);
        image.addEventListener("error", failed);
        if (image.complete) image.naturalWidth ? loaded() : failed();
    }

    const coding = document.getElementById("wakatimeStats");
    const syncTheme = () => {
        const url = new URL(coding.src);
        const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "default";
        if (url.searchParams.get("theme") === theme) return;
        const status = document.getElementById(coding.dataset.activityStatus);
        status.textContent = "Loading coding time…";
        status.hidden = false;
        coding.hidden = false;
        url.searchParams.set("theme", theme);
        coding.src = url.href;
    };
    syncTheme();
    document.addEventListener("theme-change", syncTheme);
};
