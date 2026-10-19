import { element, icon, link } from "./dom.js?v=7";
import { projectMedia, loadMedia } from "./project-media.mjs?v=8";

const projectsDataUrl = new URL("../data/projects.json", import.meta.url);

const row = (label, content, className = "") => {
    const section = element("section", `case-row ${className}`.trim());
    section.append(element("h2", "case-label", label), content);
    return section;
};

const unavailable = (root, title, message) => {
    document.title = `${title} - Lekang Ji`;
    const section = element("section", "case-missing");
    section.append(element("h1", "", title), element("p", "", message), link("Back to all projects", "/projects/", false, "case-back", "left"));
    root.replaceChildren(section);
};

export const initCaseStudy = async () => {
    const root = document.querySelector("[data-case-study]");
    if (!root) return;
    try {
        const response = await fetch(projectsDataUrl);
        if (!response.ok) throw new Error(`Projects request failed: ${response.status}`);
        const data = await response.json();
        const id = new URLSearchParams(window.location.search).get("id");
        const category = data.projects.find((category) => category.projects.some((project) => project.id === id));
        const project = category?.projects.find((project) => project.id === id);
        if (!project) {
            unavailable(root, "Case study unavailable", "Choose a project from the archive to read its case study.");
            return;
        }

        const study = project.caseStudy ?? {};
        const title = study.title ?? project.title;
        const summary = study.summary ?? project.description;
        document.title = `${title} - Lekang Ji`;
        const ogUrl = document.querySelector('meta[property="og:url"]');
        const canonical = element("link");
        canonical.rel = "canonical";
        canonical.href = `${ogUrl.getAttribute("content")}?id=${encodeURIComponent(id)}`;
        document.head.append(canonical);
        ogUrl.setAttribute("content", canonical.href);
        document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').forEach((meta) => meta.setAttribute("content", summary));
        document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach((meta) => meta.setAttribute("content", document.title));

        const hero = element("section", "case-hero");
        hero.append(
            link("All projects", "/projects/", false, "case-back", "left"),
            element("h1", "", title),
            element("p", "case-category", category.eyebrow),
            element("p", "case-summary", summary),
        );
        const sections = [];
        const actions = element("div", "case-links");
        const githubUrl = project.githubUrl ?? (project.url?.startsWith("https://github.com/") ? project.url : null);
        const siteUrl = project.siteUrl ?? (!githubUrl ? project.url : null);
        if (siteUrl) actions.append(link("Visit site", siteUrl, true, "button-link case-project-link"));
        if (githubUrl) {
            const github = link("GitHub", githubUrl, true, "button-link button-link-secondary case-project-link");
            github.prepend(icon("github"));
            actions.append(github);
        }
        if (siteUrl || githubUrl) sections.push(row("Links", actions));

        const assets = project.images ?? (projectMedia[id]?.length ? projectMedia[id] : project.image ? [{ src: project.image, alt: project.title }] : []);
        if (assets.length) {
            const gallery = element("div", "case-gallery");
            for (const asset of assets) {
                const figure = element("figure", "case-media");
                const image = element("img");
                const caption = element("figcaption", "", "Loading project image…");
                caption.setAttribute("role", "status");
                figure.append(image, caption);
                gallery.append(figure);
                loadMedia(image, asset, {
                    onLoad: () => {
                        figure.classList.add("is-loaded");
                        caption.textContent = asset.alt;
                    },
                    onError: () => { caption.textContent = "Image unavailable. Project details continue below."; },
                });
            }
            sections.push(row("Screenshots", gallery));
        }

        const body = element("div", "case-body");
        const details = [
            ["Overview", study.statement],
            ["The problem", study.problem],
            ["What I built", study.built],
            ["Engineering focus", study.difficulty],
            ["My role", study.contribution],
            ["Result", study.outcome],
        ];
        for (const [label, content] of details) {
            if (content) body.append(row(label, element("p", "", content), "case-detail"));
        }
        if (body.children.length) sections.push(body);

        if (study.stages?.length) {
            const system = element("div", "case-system");
            const flow = element("div", "system-flow");
            study.stages.forEach((stage, index) => {
                flow.append(element("div", "system-step", stage));
                if (index < study.stages.length - 1) flow.append(icon("right"));
            });
            system.append(flow, element("p", "system-note", "Conceptual system map — not a production schematic."));
            sections.push(row("System", system));
        }
        if (project.stack?.length) {
            const stack = element("ul", "case-stack");
            project.stack.forEach((item) => stack.append(element("li", "", item)));
            sections.push(row("Stack", stack));
        }
        root.replaceChildren(hero, ...sections, link("Back to all projects", "/projects/", false, "case-back case-bottom", "left"));
    } catch (error) {
        console.error(error);
        unavailable(root, "Projects unavailable", "Project details are unavailable right now. Reload this page to try again, or return to the project archive.");
    }
};
