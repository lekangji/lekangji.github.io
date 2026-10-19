import { element, icon, link } from "./dom.js?v=7";

const pages = [
    ["Home", "/"], ["About", "/about/"], ["Projects", "/projects/"],
    ["Awards", "/achievements/"],
];
const contacts = [
    ["Email", "mailto:contact@lekangji.cc"],
    ["LinkedIn", "https://www.linkedin.com/in/lekangji/"],
    ["GitHub", "https://github.com/lekangji"],
];

export const initSectionBackgrounds = () => {
    // Count content sections, not navigation, wrappers, or individual case-study details.
    document.querySelectorAll("main > section, main > .resume-hero, main > .case-body, .archive-content > section")
        .forEach((section, index) => section.classList.toggle("section-shaded", index % 2 === 1));
};

export const initSite = () => {
    // Directory indexes keep static hosting and refreshes working; show clean URLs.
    const path = location.pathname.replace(/index\.html$/, "").replace(/\/$/, "") || "/";
    if (path !== location.pathname) history.replaceState(null, "", path + location.search + location.hash);
    const header = document.querySelector(".site-header");
    if (header) {
        const nav = element("nav", "site-nav wrap");
        nav.setAttribute("aria-label", "Primary navigation");
        const wordmark = element("a", "wordmark");
        wordmark.append(element("strong", "name-first", "Lekang"), " ", element("span", "name-last", "Ji"));
        wordmark.href = "/";
        const links = element("div", "nav-links");
        links.id = "primaryNav";
        for (const [label, href] of pages) {
            const item = element("a", "", label);
            item.href = href;
            if (label === header.dataset.page) item.setAttribute("aria-current", "page");
            links.append(item);
        }
        const menu = element("button", "nav-toggle");
        menu.type = "button";
        menu.setAttribute("aria-controls", links.id);
        menu.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-label", "Open navigation");
        menu.append(icon("menu"), icon("close"));
        const theme = element("button", "theme-toggle");
        theme.id = "themeToggle";
        theme.type = "button";
        theme.setAttribute("aria-label", "Switch to dark mode");
        theme.append(icon("moon"), icon("sun"));
        const contact = element("div", "nav-contacts");
        contact.id = "contact";
        contact.tabIndex = -1;
        contact.setAttribute("role", "group");
        contact.setAttribute("aria-label", "Contact links");
        for (const [label, href] of contacts) {
            const item = link("", href, !href.startsWith("mailto:"), "nav-contact", label.toLowerCase());
            item.setAttribute("aria-label", label);
            item.title = label;
            contact.append(item);
        }
        nav.append(wordmark, links, contact, theme, menu);
        header.replaceChildren(nav);
    }

    const footer = document.querySelector(".site-footer");
    if (footer) {
        const bottom = element("div", "footer-bottom");
        bottom.append(element("span", "", `© ${new Date().getFullYear()} Lekang Ji`), link("Back to top", "#top", false, "footer-top", "up"));
        footer.replaceChildren(bottom);
    }
};
