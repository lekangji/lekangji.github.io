const dispatchThemeChange = (theme) => {
    document.dispatchEvent(new CustomEvent("theme-change", { detail: { theme } }));
};

export const initTheme = () => {
    const toggle = document.getElementById("themeToggle");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    let preference = null;
    try {
        const saved = localStorage.getItem("theme-preference");
        if (saved === "light" || saved === "dark") preference = saved;
    } catch {
        // Storage can be blocked; keep the preference in memory for this visit.
    }

    const applyTheme = (theme, remember = false) => {
        document.documentElement.setAttribute("data-theme", theme);
        if (remember) {
            preference = theme;
            try { localStorage.setItem("theme-preference", theme); } catch { /* Use the in-memory preference. */ }
        }
        toggle?.setAttribute(
            "aria-label",
            theme === "light" ? "Switch to dark mode" : "Switch to light mode",
        );
        dispatchThemeChange(theme);
    };

    applyTheme(preference || (systemTheme.matches ? "dark" : "light"));
    document.documentElement.classList.add("theme-ready");
    systemTheme.addEventListener("change", (event) => {
        if (!preference) applyTheme(event.matches ? "dark" : "light");
    });
    toggle?.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        applyTheme(current === "light" ? "dark" : "light", true);
    });
};
