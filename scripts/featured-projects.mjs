import { projectMedia, loadMedia } from "./project-media.mjs?v=5";

const projects = {
    "macro-ups": {
        title: "MacroUPS",
        category: "Hardware & power",
        description: "A 180 Wh LiFePO₄ backup power system with eight USB outputs, 250 W continuous delivery, and instantaneous outage switchover.",
        stack: ["Power delivery", "LiFePO₄", "Custom PCB"],
        github: "https://github.com/lekangji/MacroUPS",
        caseStudy: "projects/case-study.html?id=macro-ups",
    },
    "print-failure-detection": {
        title: "3D Print Failure Detection",
        category: "Computer vision",
        description: "A computer-vision pipeline designed to detect failed 3D prints and reduce filament waste and unattended-printing risk.",
        stack: ["TensorFlow", "YOLO", "OpenCV"],
        github: "https://github.com/lekangji/Print-Failure-Detection",
        caseStudy: "projects/case-study.html?id=print-failure-detection",
    },
    "browser-gaming-platform": {
        title: "55GMS",
        category: "Web platform",
        description: "A browser-based gaming platform I co-founded that grew to serve millions of users.",
        stack: ["JavaScript", "Node.js", "Web platform"],
        github: "https://github.com/55gms/55GMS",
        demo: "https://55gms.com/",
        caseStudy: "projects/case-study.html?id=browser-gaming-platform",
    },
};

export function getImageMotion(top, height, viewportHeight) {
    const progress = Math.max(0, Math.min(1, (viewportHeight - top) / (viewportHeight + height)));
    return {
        progress,
        shift: Math.round((progress - .5) * 220),
        scale: 1.12 + .05 * (1 - Math.abs(progress - .5) * 2),
    };
}

function makeLink(label, href, external = false) {
    const link = document.createElement("a");
    link.className = "featured-panel-link";
    link.textContent = label;
    link.href = href;
    if (external) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    }
    return link;
}

export function initFeaturedProjects() {
    const section = document.getElementById("work");
    const panel = section?.querySelector("#featuredProjectPanel");
    if (!panel) return;

    const title = panel.querySelector("#featuredPanelTitle");
    const category = panel.querySelector("[data-panel-category]");
    const description = panel.querySelector("[data-panel-description]");
    const stack = panel.querySelector("[data-panel-stack]");
    const links = panel.querySelector("[data-panel-links]");
    const gallery = panel.querySelector("[data-panel-gallery]");
    let opener;
    let scrollPosition;
    let wasLocked;

    for (const trigger of section.querySelectorAll("[data-featured-project]")) {
        const id = trigger.dataset.featuredProject;
        const project = projects[id];
        if (!project) continue;
        const assets = projectMedia[id] ?? [];
        if (assets.length) {
            const image = document.createElement("img");
            image.className = "featured-image";
            trigger.insertBefore(image, trigger.querySelector(".featured-shade"));
            loadMedia(image, assets[0], {
                onLoad: () => trigger.classList.add("has-featured-image"),
                onError: () => trigger.classList.remove("has-featured-image"),
            });
        }
        trigger.disabled = false;

        trigger.addEventListener("click", () => {
            if (typeof panel.showModal !== "function") {
                window.location.href = project.caseStudy;
                return;
            }
            title.textContent = project.title;
            category.textContent = project.category;
            description.textContent = project.description;
            stack.replaceChildren(...project.stack.map((technology) => {
                const item = document.createElement("li");
                item.textContent = technology;
                return item;
            }));
            links.replaceChildren(
                makeLink("View GitHub ↗", project.github, true),
                ...(project.demo ? [makeLink("Live demo ↗", project.demo, true)] : []),
                makeLink("Read case study ↗", project.caseStudy),
            );
            gallery.replaceChildren();
            const fallback = trigger.querySelector(".featured-fallback").cloneNode(true);
            fallback.classList.add("featured-panel-fallback");
            gallery.append(fallback);
            if (assets.length) {
                assets.forEach((asset) => {
                    const figure = document.createElement("figure");
                    const image = document.createElement("img");
                    const caption = document.createElement("figcaption");
                    caption.setAttribute("role", "status");
                    caption.textContent = "Loading project image…";
                    figure.append(image, caption);
                    gallery.append(figure);
                    loadMedia(image, asset, {
                        onLoad: () => {
                            fallback.remove();
                            figure.classList.add("is-loaded");
                            caption.textContent = asset.alt;
                        },
                        onError: () => {
                            caption.textContent = "Image unavailable. Project details remain below.";
                        },
                    });
                });
            }
            opener = trigger;
            scrollPosition = { top: window.scrollY, left: window.scrollX, behavior: "instant" };
            wasLocked = document.body.classList.contains("featured-panel-open");
            panel.showModal();
            panel.scrollTop = 0;
            document.body.classList.add("featured-panel-open");
            panel.querySelector(".featured-panel-close").focus({ preventScroll: true });
        });
    }

    panel.querySelector(".featured-panel-close").addEventListener("click", () => panel.close());
    panel.addEventListener("click", (event) => {
        const rect = panel.getBoundingClientRect();
        if (event.target === panel && (event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom)) panel.close();
    });
    panel.addEventListener("close", () => {
        if (!wasLocked) document.body.classList.remove("featured-panel-open");
        opener?.focus({ preventScroll: true });
        if (scrollPosition) window.scrollTo(scrollPosition);
    });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const triggers = [...section.querySelectorAll("[data-featured-project]")];
    let queued = false;
    const updateMotion = () => {
        queued = false;
        for (const trigger of triggers) {
            if (reduceMotion.matches) {
                trigger.style.removeProperty("--featured-shift");
                trigger.style.removeProperty("--featured-scale");
                continue;
            }
            const rect = trigger.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
            const motion = getImageMotion(rect.top, rect.height, window.innerHeight);
            trigger.style.setProperty("--featured-shift", `${motion.shift}px`);
            trigger.style.setProperty("--featured-scale", motion.scale.toFixed(3));
        }
    };
    const queueMotion = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(updateMotion);
    };
    updateMotion();
    window.addEventListener("scroll", queueMotion, { passive: true });
    window.addEventListener("resize", queueMotion, { passive: true });
    reduceMotion.addEventListener("change", queueMotion);
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initFeaturedProjects, { once: true });
    else initFeaturedProjects();
}
