import { element as makeElement } from "./dom.js?v=7";
const awardsDataUrl = new URL("../data/awards.json", import.meta.url);


const buildAwardCard = (item, category, index, preview = false) => {
    const card = makeElement("article", "project-card award-card");
    const inner = makeElement("div", "project-card-inner");
    const body = makeElement("div", "project-card-body");
    body.append(
        makeElement("p", "project-card-meta mono", category.eyebrow),
        makeElement("h3", "", item.title),
        makeElement("p", "project-card-description", preview ? item.summary ?? item.description : item.description),
    );
    const footer = makeElement("div", "project-card-footer mono");
    footer.append(
        makeElement("span", "", item.year),
        makeElement("span", "", (item.badges ?? [])[0] ?? "RECOGNITION"),
    );
    body.append(footer);
    inner.append(body);
    card.append(inner);
    return card;
};

const buildAwardCategory = (category) => {
    const section = makeElement("section", "archive-section");
    section.id = category.id;
    const header = makeElement("div", "archive-section-head");
    header.append(makeElement("p", "kicker mono", category.eyebrow), makeElement("h2", "", category.title));
    const list = makeElement("div", "timeline-list award-timeline");
    (category.items ?? []).forEach((item) => {
        const entry = makeElement("article");
        const details = makeElement("div");
        details.append(makeElement("h3", "", item.title), makeElement("p", "", item.description));
        entry.append(makeElement("span", "timeline-year mono", item.year), details);
        list.append(entry);
    });
    section.append(header, list);
    return section;
};

export const initAwards = async () => {
    const root = document.querySelector("[data-awards-root]");
    const featuredRoot = document.querySelector("[data-awards-featured]");
    if (!root && !featuredRoot) return;
    try {
        const response = await fetch(awardsDataUrl);
        if (!response.ok) throw new Error(`Awards request failed: ${response.status}`);
        const data = await response.json();
        const categories = (data.categories ?? []).filter((category) => category.items?.length);
        if (root) root.replaceChildren(...categories.map(buildAwardCategory));
        if (featuredRoot) {
            const items = new Map(categories.flatMap((category) =>
                (category.items ?? []).map((item) => [item.id, { item, category }]),
            ));
            const featured = (data.featuredIds ?? []).map((id) => items.get(id)).filter(Boolean);
            featuredRoot.replaceChildren(...featured.map(({ item, category }, index) => buildAwardCard(item, category, index, true)));
        }
    } catch (error) {
        console.error(error);
        if (root) root.textContent = "Awards and service details are unavailable right now.";
        if (featuredRoot) featuredRoot.textContent = "Highlights are unavailable right now.";
    }
};
