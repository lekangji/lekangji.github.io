export const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) {
        const arrow = text.match(/[↗↑↓→←]/)?.[0];
        node.textContent = text.replace(/[↗↑↓→←]/g, "").trim();
        if (arrow) node.append(icon({ "↗": "external", "↑": "up", "↓": "down", "→": "right", "←": "left" }[arrow]));
    }
    return node;
};

export const icon = (direction = "external") => {
    const node = element("span", `icon icon-${direction}`);
    node.setAttribute("aria-hidden", "true");
    return node;
};

export const link = (label, href, external = false, className = "text-action", direction = "external") => {
    const node = element("a", className, label);
    node.href = href;
    node.append(icon(direction));
    if (external) {
        node.target = "_blank";
        node.rel = "noopener noreferrer";
    }
    return node;
};
