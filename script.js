import { initTheme } from "./scripts/theme.js?v=5";
import { initUi, scrollToContact } from "./scripts/ui.js?v=5";
import { initProjects } from "./scripts/projects.js?v=5";
import { initAwards } from "./scripts/awards.js?v=5";
import { initCaseStudy } from "./scripts/case-study.js?v=5";

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initUi();
    initProjects();
    const awardsReady = initAwards();
    initCaseStudy();
    if (window.location.hash === "#contact") {
        awardsReady.then(() => requestAnimationFrame(() => scrollToContact("auto")));
    }
});
