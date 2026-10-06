import { initSite, initSectionBackgrounds } from "./scripts/site.js?v=7";
import { initTheme } from "./scripts/theme.js?v=7";
import { initUi, scrollToContact } from "./scripts/ui.js?v=7";
import { initProjects } from "./scripts/projects.js?v=7";
import { initAwards } from "./scripts/awards.js?v=7";
import { initCaseStudy } from "./scripts/case-study.js?v=7";

document.addEventListener("DOMContentLoaded", async () => {
    initSite();
    initTheme();
    initUi();
    const archivesReady = Promise.all([initProjects(), initAwards()]);
    initCaseStudy();
    await archivesReady;
    initSectionBackgrounds();
    if (window.location.hash === "#contact") {
        requestAnimationFrame(() => scrollToContact("auto"));
    }
});
