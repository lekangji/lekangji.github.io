import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import vm from "node:vm";
import http from "node:http";
import { projectMedia, loadMedia, mediaUrl } from "./project-media.mjs";

class Element {
    constructor() {
        this.listeners = {};
        this.attributes = {};
        this.children = [];
        const classes = new Set();
        this.classList = {
            add: (...names) => names.forEach((name) => classes.add(name)),
            remove: (...names) => names.forEach((name) => classes.delete(name)),
            contains: (name) => classes.has(name),
            toggle: (name, on) => on ? classes.add(name) : classes.delete(name),
        };
        this.style = { setProperty() {}, removeProperty() {} };
    }
    addEventListener(type, handler) { (this.listeners[type] ??= []).push(handler); }
    emit(type, event = {}) { for (const handler of this.listeners[type] ?? []) handler(event); }
    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name]; }
    append(...nodes) { this.children.push(...nodes); }
    prepend(...nodes) { this.children.unshift(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    focus(options) { this.focusOptions = options; this.focusCount = (this.focusCount ?? 0) + 1; }
    remove() { this.removed = true; }
    cloneNode() { return new Element(); }
    getBoundingClientRect() { return { top: 0, bottom: 500, left: 400, right: 960, height: 500 }; }
}

async function evaluate(file, globals) {
    const source = (await readFile(new URL(file, import.meta.url), "utf8"))
        .replace(/^import .*;\r?\n/gm, "")
        .replace(/import\.meta\.url/g, JSON.stringify(new URL(file, import.meta.url).href))
        .replace(/export /g, "");
    const context = vm.createContext(globals);
    const dom = (await readFile(new URL("dom.js", import.meta.url), "utf8")).replace(/export /g, "");
    vm.runInContext(dom + "\nconst makeElement = element;", context);
    vm.runInContext(source, context);
    return context;
}

async function themeHarness(storage, dark = false) {
    const toggle = new Element();
    const root = new Element();
    const system = new Element();
    system.matches = dark;
    const context = await evaluate("theme.js", {
        localStorage: storage,
        window: { matchMedia: () => system },
        document: { getElementById: () => toggle, documentElement: root, dispatchEvent() {} },
        CustomEvent: class {},
    });
    vm.runInContext("initTheme()", context);
    return { toggle, root, system };
}

test("blocked storage reads and writes leave theme initialization and toggling usable", async () => {
    const { toggle, root, system } = await themeHarness({
        getItem() { throw new Error("SecurityError"); },
        setItem() { throw new Error("QuotaExceededError"); },
    }, true);
    assert.equal(root.getAttribute("data-theme"), "dark");
    toggle.emit("click");
    assert.equal(root.getAttribute("data-theme"), "light");
    assert.equal(toggle.getAttribute("aria-label"), "Switch to dark mode");
    system.emit("change", { matches: true });
    assert.equal(root.getAttribute("data-theme"), "light");
    const unavailable = await themeHarness(undefined);
    unavailable.toggle.emit("click");
    assert.equal(unavailable.root.getAttribute("data-theme"), "dark");
});

test("body text and button labels meet WCAG AA contrast in both palettes", async () => {
    const luminance = (hex) => {
        const channels = hex.match(/[a-f\d]{2}/gi).map((value) => parseInt(value, 16) / 255)
            .map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
        return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const css = await readFile(new URL("../style.css", import.meta.url), "utf8");
    const palettes = [":root", '[data-theme="dark"]'].map((selector) => {
        const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0];
        const palette = Object.fromEntries([...block.matchAll(/--([\w-]+): #([a-f\d]{6});/gi)].map((match) => [match[1], match[2]]));
        return { ...palette, label: palette["accent-ink"] };
    });
    for (const palette of palettes) {
        for (const [foreground, background] of [["ink", "bg"], ["muted", "bg"], ["muted", "paper"], ["accent", "paper"], ["label", "accent"]]) {
            const values = [luminance(palette[foreground]), luminance(palette[background])].sort((a, b) => a - b);
            assert.ok((values[1] + .05) / (values[0] + .05) >= 4.5, `${foreground} on ${background}`);
        }
    }
});

test("saved themes persist; invalid preferences follow the system", async () => {
    let saved = "dark";
    const first = await themeHarness({ getItem: () => saved, setItem: (_, value) => { saved = value; } });
    assert.equal(first.root.getAttribute("data-theme"), "dark");
    first.toggle.emit("click");
    assert.equal(saved, "light");
    const second = await themeHarness({ getItem: () => saved }, true);
    assert.equal(second.root.getAttribute("data-theme"), "light");
    const invalid = await themeHarness({ getItem: () => "unexpected" });
    invalid.system.emit("change", { matches: true });
    assert.equal(invalid.root.getAttribute("data-theme"), "dark");
});

test("Escape restores navigation focus only for an open menu without an open dialog", async () => {
    const toggle = new Element();
    const nav = new Element();
    const document = new Element();
    let dialogOpen = false;
    document.documentElement = new Element();
    document.querySelectorAll = () => [];
    document.getElementById = () => nav;
    document.querySelector = (selector) => selector === ".nav-toggle" ? toggle : selector === "dialog[open]" && dialogOpen ? {} : null;
    const context = await evaluate("ui.js", {
        document, window: { scrollY: 0, addEventListener() {}, matchMedia: () => ({ matches: true, addEventListener() {} }) },
    });
    vm.runInContext("initUi()", context);
    toggle.setAttribute("aria-expanded", "false");
    document.emit("keydown", { key: "Escape" });
    assert.equal(toggle.focusCount, undefined);
    toggle.setAttribute("aria-expanded", "true");
    dialogOpen = true;
    document.emit("keydown", { key: "Escape" });
    assert.equal(toggle.focusCount, undefined);
    assert.equal(toggle.getAttribute("aria-expanded"), "true");
    dialogOpen = false;
    document.emit("keydown", { key: "Escape", defaultPrevented: true });
    assert.equal(toggle.focusCount, undefined);
    document.emit("keydown", { key: "Escape" });
    assert.equal(toggle.focusCount, 1);
    assert.equal(toggle.getAttribute("aria-expanded"), "false");
});

test("dialog close restores opener and scroll; panel whitespace does not dismiss", async () => {
    const trigger = new Element();
    trigger.dataset = { featuredProject: "macro-ups" };
    trigger.querySelector = () => new Element();
    const panel = new Element();
    const close = new Element();
    const parts = new Map();
    panel.querySelector = (selector) => {
        if (selector === ".featured-panel-close") return close;
        if (!parts.has(selector)) parts.set(selector, new Element());
        return parts.get(selector);
    };
    panel.showModal = () => { panel.open = true; };
    panel.close = () => { panel.open = false; panel.emit("close"); };
    const section = { querySelector: () => panel, querySelectorAll: () => [trigger] };
    const body = new Element();
    const scrolls = [];
    await evaluate("featured-projects.mjs", {
        projectMedia, loadMedia,
        document: { readyState: "complete", getElementById: () => section, createElement: () => new Element(), body },
        window: { scrollY: 240, scrollX: 0, innerHeight: 800, addEventListener() {}, scrollTo: (value) => scrolls.push(value), matchMedia: () => ({ matches: true, addEventListener() {} }) },
        requestAnimationFrame: (callback) => callback(),
    });
    for (const dismissal of ["button", "backdrop", "native-close"]) {
        trigger.emit("click");
        assert.equal(panel.open, true);
        assert.equal(body.classList.contains("featured-panel-open"), true);
        assert.equal(panel.scrollTop, 0);
        panel.emit("click", { target: panel, clientX: 450, clientY: 400 });
        assert.equal(panel.open, true);
        if (dismissal === "button") close.emit("click");
        else if (dismissal === "backdrop") panel.emit("click", { target: panel, clientX: 200, clientY: 200 });
        else panel.close();
        assert.equal(body.classList.contains("featured-panel-open"), false);
        assert.equal(trigger.focusOptions.preventScroll, true);
        assert.equal(scrolls.at(-1).top, 240);
        assert.equal(scrolls.at(-1).behavior, "instant");
    }
});

test("explicit media waits for load and reports errors without extension probing", () => {
    assert.equal(mediaUrl("https://example.com/project.png"), "https://example.com/project.png");
    const image = new Element();
    let loaded = false;
    let failed = false;
    loadMedia(image, { src: "images/favicon.svg", alt: "LJ mark" }, { onLoad: () => { loaded = true; }, onError: () => { failed = true; } });
    assert.equal(loaded, false);
    assert.equal(image.loading, "lazy");
    assert.match(image.src, /images\/favicon\.svg$/);
    assert.equal(image.alt, "LJ mark");
    image.emit("load");
    assert.equal(loaded, true);
    image.emit("error");
    assert.equal(image.removed, true);
    assert.equal(failed, true);
});

const projectData = JSON.parse(await readFile(new URL("../data/projects.json", import.meta.url), "utf8"));
const archiveProjects = projectData.projects.flatMap((category) => category.projects);
const descendants = (node) => [node, ...(node.children ?? []).flatMap(descendants)];

test("every JSON project renders its stack, available links and metadata; invalid IDs recover", async () => {
    for (const id of [...archiveProjects.map((project) => project.id), "missing", "__proto__", "constructor", ""]) {
        const root = new Element();
        const metas = [new Element(), new Element()];
        const ogUrl = new Element();
        const head = new Element();
        ogUrl.setAttribute("content", "https://lekang.cc/projects/case-study/");
        const document = { head, querySelector: (selector) => selector === '[data-case-study]' ? root : ogUrl, querySelectorAll: () => metas, createElement: () => new Element() };
        const context = await evaluate("case-study.js", { document, projectMedia, loadMedia, fetch: async () => ({ ok: true, json: async () => projectData }), window: { location: { search: `?id=${id}` } }, URLSearchParams, URL });
        await vm.runInContext("initCaseStudy()", context);
        if (["missing", "__proto__", "constructor", ""].includes(id)) {
            assert.equal(document.title, "Case study unavailable - Lekang Ji");
            assert.equal(root.children[0].children.at(-1).href, "/projects/");
        } else {
            const project = archiveProjects.find((project) => project.id === id);
            const nodes = descendants(root);
            for (const field of ["statement", "problem", "built", "difficulty", "contribution", "outcome"]) {
                if (project.caseStudy?.[field]) assert.ok(nodes.some((node) => node.textContent === project.caseStudy[field]), `${id}: ${field}`);
            }
            const stack = nodes.find((node) => node.className === "case-stack");
            assert.deepEqual(stack.children.map((node) => node.textContent), project.stack);
            const links = nodes.filter((node) => node.className?.includes("case-project-link"));
            const github = project.githubUrl ?? (project.url?.startsWith("https://github.com/") ? project.url : null);
            const site = project.siteUrl ?? (!github ? project.url : null);
            assert.deepEqual(links.map((node) => node.href), [site, github].filter(Boolean));
            for (const link of links) {
                assert.equal(link.target, "_blank");
                assert.equal(link.rel, "noopener noreferrer");
            }
            assert.match(document.title, / - Lekang Ji$/);
            assert.ok(metas[0].getAttribute("content"));
            assert.equal(head.children[0].rel, "canonical");
            assert.equal(head.children[0].href, `https://lekang.cc/projects/case-study/?id=${id}`);
            assert.equal(ogUrl.getAttribute("content"), head.children[0].href);
        }
    }
});

test("project request failure offers recovery and archive cards all open project pages", async () => {
    const root = new Element();
    const document = { head: new Element(), querySelector: () => root, querySelectorAll: () => [], createElement: () => new Element() };
    const failure = await evaluate("case-study.js", { document, URL, URLSearchParams, window: { location: { search: "?id=macro-ups" } }, fetch: async () => ({ ok: false, status: 503 }), console: { error() {} } });
    await vm.runInContext("initCaseStudy()", failure);
    assert.match(root.children[0].children[1].textContent, /unavailable/);
    assert.equal(root.children[0].children.at(-1).href, "/projects/");

    const context = await evaluate("projects.js", { document, URL, projectMedia, fetch: async () => ({ ok: true, json: async () => projectData }) });
    await vm.runInContext("initProjects()", context);
    const titles = descendants(root).filter((node) => node.className === "project-card-title-link");
    assert.deepEqual(titles.map((node) => node.href), archiveProjects.map((project) => `/projects/case-study/?id=${project.id}`));
});

test("failed archive and award requests replace loading text with clear messages", async () => {
    for (const [file, init, selector] of [["projects.js", "initProjects", "[data-projects-root]"], ["awards.js", "initAwards", "[data-awards-root]"]]) {
        const source = (await readFile(new URL(file, import.meta.url), "utf8"))
            .replace(/^import .*;\r?\n/gm, "").replace(/import\.meta\.url/g, JSON.stringify(new URL(file, import.meta.url).href)).replace(/export /g, "");
        const root = new Element();
        const context = vm.createContext({ projectMedia, URL, document: { querySelector: (value) => value === selector ? root : null }, fetch: async () => ({ ok: false, status: 503 }), console: { error() {} } });
        vm.runInContext(source, context);
        await vm.runInContext(`${init}()`, context);
        assert.match(root.textContent, /unavailable right now/);
    }
});

test("six pages and local asset references resolve over local HTTP", async () => {
    const base = new URL("../", import.meta.url);
    const server = http.createServer(async (request, response) => {
        try {
            const pathname = request.url.split("?")[0];
            response.end(await readFile(new URL(`.${pathname.endsWith("/") ? pathname + "index.html" : pathname}`, base)));
        }
        catch { response.writeHead(404).end(); }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
        const address = `http://127.0.0.1:${server.address().port}`;
        for (const page of ["index.html", "about/index.html", "resume/index.html", "projects/index.html", "projects/case-study/index.html", "achievements/index.html"]) {
            const response = await fetch(`${address}/${page}`);
            assert.equal(response.status, 200);
            const text = await response.text();
            assert.match(text, /href="#main-content"/);
            assert.match(text, /id="main-content"/);
            assert.match(text, /og:description/);
            for (const [, path] of text.matchAll(/(?:src|href)="([^"]+)"/g)) {
                if (/^(https?:|mailto:|#)/.test(path)) continue;
                const url = new URL(path, `${address}/${page}`);
                assert.equal((await fetch(url)).status, 200, `${page}: ${path}`);
            }
        }
        for (const module of ["script.js", "scripts/featured-projects.mjs", "scripts/projects.js", "scripts/case-study.js"]) {
            const source = await readFile(new URL(module, base), "utf8");
            for (const [, path] of source.matchAll(/from "([^"]+)"/g)) await access(new URL(path.split("?")[0], new URL(module, base)));
        }
        for (const assets of Object.values(projectMedia)) for (const asset of assets) await access(new URL(asset.src, base));
        const css = await readFile(new URL("style.css", base), "utf8");
        for (const [, path] of css.matchAll(/url\("(\/images\/icons\/[^"\)]+)"\)/g)) {
            const response = await fetch(`${address}${path}`);
            assert.equal(response.status, 200, path);
            assert.match(await response.text(), /<svg[\s>]/);
        }
    } finally {
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
    }
});

test("shared shell keeps three accessible contact icons in the navbar and no contact footer", async () => {
    const header = new Element();
    header.dataset = { page: "About" };
    const footer = new Element();
    const document = { createElement: () => new Element(), querySelector: (selector) => selector === ".site-header" ? header : footer };
    let cleanUrl;
    const context = await evaluate("site.js", { document, location: { pathname: "/about/index.html", search: "?view=all", hash: "#contact" }, history: { replaceState: (_, __, url) => { cleanUrl = url; } } });
    vm.runInContext("initSite()", context);
    assert.equal(cleanUrl, "/about?view=all#contact");
    const nav = header.children[0];
    assert.equal(nav.children[0].children[0].textContent, "Lekang");
    assert.equal(nav.children[0].children[0].className, "name-first");
    assert.equal(nav.children[0].children[2].textContent, "Ji");
    assert.equal(nav.children[0].children[2].className, "name-last");
    assert.equal(nav.children[1].children.find((item) => item.textContent === "About").getAttribute("aria-current"), "page");
    const contact = nav.children.find((item) => item.className === "nav-contacts");
    assert.equal(contact.id, "contact");
    const links = contact.children;
    assert.deepEqual(links.map((item) => item.href), ["mailto:contact@lekangji.cc", "https://www.linkedin.com/in/lekangji/", "https://github.com/lekangji"]);
    for (const [index, name] of ["email", "linkedin", "github"].entries()) {
        assert.equal(links[index].getAttribute("aria-label"), ["Email", "LinkedIn", "GitHub"][index]);
        assert.equal(links[index].children.length, 1);
        const icon = links[index].children[0];
        assert.equal(icon.className, `icon icon-${name}`);
        assert.equal(icon.getAttribute("aria-hidden"), "true");
    }
    assert.equal(links[1].rel, "noopener noreferrer");
    assert.equal(links[2].target, "_blank");
    assert.equal(footer.children.length, 1);
    assert.equal(footer.children[0].className, "footer-bottom");
    assert.ok(nav.children[1].children.every((item) => item.textContent !== "Contact"));
    for (const file of ["../index.html", "../about/index.html", "../projects/index.html", "../achievements/index.html", "../resume/index.html", "../projects/case-study/index.html"]) {
        const html = await readFile(new URL(file, import.meta.url), "utf8");
        assert.doesNotMatch(html, /contact-section|href="#contact"/);
        assert.match(html, /class="nav-contacts"/);
        assert.doesNotMatch(html, /wordmark-dot|hero-period/);
        for (const name of ["Email", "LinkedIn", "GitHub"]) assert.ok(html.includes(`aria-label="${name}"`));
        if (file === "../index.html") {
            assert.match(html, /<section class="work-section wrap" id="work" aria-labelledby="work-title">/);
            assert.match(html, /<h2 id="work-title">Featured projects/);
        }
    }
});

test("activity widgets recover from image errors and coding stats follow the selected theme", async () => {
    const document = new Element();
    document.documentElement = new Element();
    document.documentElement.setAttribute("data-theme", "light");
    const github = new Element();
    github.dataset = { activityStatus: "github-status" };
    github.complete = true;
    github.naturalWidth = 0;
    const coding = new Element();
    coding.dataset = { activityStatus: "coding-status" };
    coding.src = "https://github-readme-stats.hackclub.dev/api/wakatime?username=797&theme=dark";
    const githubStatus = new Element();
    const codingStatus = new Element();
    document.querySelectorAll = () => [github, coding];
    document.getElementById = (id) => ({ wakatimeStats: coding, "github-status": githubStatus, "coding-status": codingStatus })[id];
    const context = await evaluate("activity.js", { document, URL });
    vm.runInContext("initActivity()", context);
    assert.equal(github.hidden, true);
    assert.match(githubStatus.textContent, /unavailable/);
    assert.equal(new URL(coding.src).searchParams.get("theme"), "default");
    assert.equal(new URL(coding.src).searchParams.get("username"), "797");
    github.emit("load");
    assert.equal(github.hidden, false);
    assert.equal(githubStatus.hidden, true);
    coding.emit("error");
    assert.equal(coding.hidden, true);
    document.documentElement.setAttribute("data-theme", "dark");
    document.emit("theme-change");
    assert.equal(coding.hidden, false);
    assert.equal(new URL(coding.src).searchParams.get("theme"), "dark");
    coding.emit("load");
    assert.equal(codingStatus.hidden, true);
    const about = await readFile(new URL("../about/index.html", import.meta.url), "utf8");
    assert.ok(about.indexOf('class="about-activity"') > about.indexOf('class="about-timeline"'));
    assert.match(about, /https:\/\/ghchart\.rshah\.org\/2967a0\/lekangji/);
});

test("legacy route aliases preserve query strings and anchors", async () => {
    for (const [file, route] of [["../about.html", "/about/"], ["../resume.html", "/resume/"], ["../projects/case-study.html", "/projects/case-study/"], ["../index/index.html", "/"]]) {
        const html = await readFile(new URL(file, import.meta.url), "utf8");
        assert.ok(html.includes(`rel="canonical" href="${route}"`));
        let redirected;
        await evaluate("redirect.js", {
            location: { search: "?id=macro-ups", hash: "#contact", replace: (url) => { redirected = url; } },
            document: { querySelector: () => ({ getAttribute: () => route }) },
        });
        assert.equal(redirected, route + "?id=macro-ups#contact");
    }
});

test("section tones follow content order and Contact waits for both archives", async () => {
    const sections = Array.from({ length: 6 }, () => new Element());
    const site = await evaluate("site.js", { document: { querySelectorAll: () => sections } });
    vm.runInContext("initSectionBackgrounds()", site);
    assert.deepEqual(sections.map((section) => section.classList.contains("section-shaded")), [false, true, false, true, false, true]);

    let ready;
    let finishProjects;
    const projects = new Promise((resolve) => { finishProjects = resolve; });
    const calls = [];
    const source = (await readFile(new URL("../script.js", import.meta.url), "utf8")).replace(/^import .*;\r?\n/gm, "");
    vm.runInNewContext(source, {
        document: { addEventListener: (_, handler) => { ready = handler; } },
        initSite() {}, initTheme() {}, initUi() {}, initCaseStudy() {}, initActivity() {},
        initProjects: () => projects, initAwards: async () => {},
        initSectionBackgrounds: () => calls.push("backgrounds"),
        window: { location: { hash: "#contact" } },
        requestAnimationFrame: (handler) => handler(),
        scrollToContact: () => calls.push("contact"),
    });
    const completion = ready();
    assert.deepEqual(calls, []);
    finishProjects();
    await completion;
    assert.deepEqual(calls, ["backgrounds", "contact"]);

    const ui = await readFile(new URL("ui.js", import.meta.url), "utf8");
    assert.doesNotMatch(ui, /event\.preventDefault\(\)/, "Contact and Back to top retain native anchor behavior");
});
