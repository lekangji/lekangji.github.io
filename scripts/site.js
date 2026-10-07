import { element, icon, link } from "./dom.js?v=7";

const pages = [
    ["Home", "/"], ["About", "/about/"], ["Projects", "/projects/"],
    ["Awards", "/achievements/"], ["Contact", "#contact"],
];
const contacts = [
    ["Email", "mailto:contact@lekangji.cc", "contact@lekangji.cc"],
    ["LinkedIn", "https://www.linkedin.com/in/lekangji/", "linkedin.com/in/lekangji"],
    ["GitHub", "https://github.com/lekangji", "github.com/lekangji"],
];

export const initSectionBackgrounds = () => {
    // Count content sections, not navigation, wrappers, or individual case-study details.
    document.querySelectorAll("main > section, main > .resume-hero, main > .case-body, .archive-content > section, .contact-section")
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
        const wordmark = element("a", "wordmark", "Lekang Ji");
        wordmark.append(element("span", "wordmark-dot", "."));
        wordmark.children[0].setAttribute("aria-hidden", "true");
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
        menu.append(element("span"));
        const theme = element("button", "theme-toggle");
        theme.id = "themeToggle";
        theme.type = "button";
        theme.setAttribute("aria-label", "Switch to dark mode");
        nav.append(wordmark, links, menu, theme);
        header.replaceChildren(nav);
    }

    const footer = document.querySelector(".site-footer");
    if (footer) {
        const contact = element("section", "contact-section");
        contact.id = "contact";
        contact.tabIndex = -1;
        contact.setAttribute("aria-labelledby", "contact-title");
        const title = element("h2", "", "Contact");
        title.id = "contact-title";
        const list = element("div", "contact-links");
        for (const [label, href, address] of contacts) {
            const item = link("", href, !href.startsWith("mailto:"), "contact-item");
            const text = element("span", "contact-label");
            const heading = element("strong", "", label);
            heading.prepend(icon(label.toLowerCase()));
            text.append(heading, element("span", "contact-address", address));
            item.prepend(text);
            list.append(item);
        }
        contact.append(title, list);
        const bottom = element("div", "footer-bottom");
        bottom.append(element("span", "", `© ${new Date().getFullYear()} Lekang Ji`), link("Back to top", "#top", false, "footer-top", "up"));
        footer.replaceChildren(contact, bottom);
    }
};
