import { element as makeElement } from "./dom.js?v=7";
import { projectMedia, mediaUrl } from "./project-media.mjs?v=7";

const projectsDataUrl = new URL("../data/projects.json", import.meta.url);


const buildProjectCard = (project, index, selectedIds, categoryName) => {
    const card = makeElement("article", "project-card");
    const inner = makeElement("div", "project-card-inner");
    const caseStudyUrl = selectedIds.has(project.id) ? `/projects/case-study/?id=${encodeURIComponent(project.id)}` : null;

    const visual = makeElement("div", "project-card-visual");
    visual.append(makeElement("span", "mono", String(index + 1).padStart(2, "0")));
    const cover = projectMedia[project.id]?.[0];
    if (cover || project.image) {
        const image = makeElement("img", "project-card-image");
        image.alt = cover?.alt ?? "";
        image.loading = "lazy";
        image.decoding = "async";
        image.addEventListener("load", () => card.classList.add("has-image"), { once: true });
        image.addEventListener("error", () => {
            visual.remove();
            card.classList.remove("has-image");
        }, { once: true });
        image.src = cover ? mediaUrl(cover.src) : project.image;
        visual.append(image);
    }
    const body = makeElement("div", "project-card-body");
    const title = makeElement("h3");
    const titleLink = makeElement(caseStudyUrl || project.url ? "a" : "span", "project-card-title-link", project.title);
    if (caseStudyUrl || project.url) titleLink.href = caseStudyUrl || project.url;
    if (!caseStudyUrl && project.url) {
        titleLink.target = "_blank";
        titleLink.rel = "noreferrer";
    }
    title.append(titleLink);
    body.append(
        makeElement("p", "project-card-meta mono", categoryName),
        title,
        makeElement("p", "project-card-description", project.description),
    );
    const footer = makeElement("div", "project-card-footer mono");
    footer.append(makeElement("span", "", (project.stack ?? [])[0] ?? "PROJECT"));
    const actions = makeElement("span", "project-card-actions");
    if (caseStudyUrl) {
        const caseStudy = makeElement("a", "project-card-action", "CASE STUDY ↗");
        caseStudy.href = caseStudyUrl;
        actions.append(caseStudy);
    }
    if (project.url) {
        const github = makeElement("a", "project-card-action", project.linkLabel ?? "GITHUB ↗");
        github.href = project.url;
        github.target = "_blank";
        github.rel = "noreferrer";
        actions.append(github);
    }
    if (!actions.childElementCount) actions.textContent = "OVERVIEW";
    footer.append(actions);
    body.append(footer);
    if (cover || project.image) inner.append(visual);
    inner.append(body);
    card.append(inner);
    return card;
};

const buildCategory = (category, selectedIds) => {
    const section = makeElement("section", "archive-section");
    section.id = category.id;
    const header = makeElement("div", "archive-section-head");
    header.append(makeElement("p", "kicker mono", category.eyebrow), makeElement("h2", "", category.title));
    const list = makeElement("div", "project-card-grid");
    (category.projects ?? []).forEach((project, index) => list.append(buildProjectCard(project, index, selectedIds, category.eyebrow)));
    section.append(header, list);
    return section;
};

export const initProjects = async () => {
    const root = document.querySelector("[data-projects-root]");
    if (!root) return;
    try {
        const response = await fetch(projectsDataUrl);
        if (!response.ok) throw new Error(`Projects request failed: ${response.status}`);
        const data = await response.json();
        const selectedIds = new Set(data.featuredIds ?? []);
        root.replaceChildren(...(data.projects ?? []).filter((category) => category.projects?.length).map((category) => buildCategory(category, selectedIds)));
    } catch (error) {
        console.error(error);
        root.textContent = "The project archive is unavailable right now.";
    }
};
