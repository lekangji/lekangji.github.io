import { element } from "./dom.js?v=7";
import { projectMedia, loadMedia } from "./project-media.mjs?v=7";

const studies = {
    "macro-ups": {
        title: "MacroUPS",
        category: "HARDWARE / POWER ELECTRONICS",
        statement: "Keeping devices alive when the wall power disappears.",
        summary: "A 180 Wh LiFePO₄ backup power system with eight USB outputs, 250 W continuous delivery, a custom PCB, and instantaneous outage switchover.",
        problem: "A power interruption should not take an entire desk of USB-powered devices offline. The useful version of a backup system has to handle multiple outputs and switch over without a noticeable gap.",
        built: "I built MacroUPS as an integrated battery and power-delivery system, combining LiFePO₄ storage, a custom board, eight USB outputs, and the circuitry needed for immediate switchover.",
        difficulty: "The design has to reconcile energy capacity, a high continuous power target, distribution across eight ports, and the transition between input and battery power. Those constraints make this a system-design problem, not just a battery in a box.",
        contribution: "System concept, electronics design, and integration of the backup-power hardware.",
        outcome: "The project is specified for 180 Wh of storage and 250 W continuous delivery across eight USB outputs, with instantaneous outage switchover.",
        stages: ["LiFePO₄ storage", "Power + switchover", "8 USB outputs"],
        repo: "https://github.com/lekangji/MacroUPS"
    },
    "print-failure-detection": {
        title: "3D Print Failure Detection",
        category: "AI / COMPUTER VISION",
        statement: "Catching a failed print before it becomes a spool of waste.",
        summary: "A computer-vision pipeline designed to detect failed 3D prints and reduce filament waste and unattended-printing risk.",
        problem: "A print can fail while nobody is watching. By the time the failure is noticed, the printer may have spent hours producing unusable material.",
        built: "I developed a vision pipeline around camera imagery and model-based detection, using OpenCV, YOLO, and TensorFlow in the project stack.",
        difficulty: "The interesting engineering question is distinguishing a meaningful failure from the normal visual changes of a print in progress. Camera placement, image quality, and model behavior all affect whether detection is useful.",
        contribution: "Computer-vision pipeline and application of detection models to a concrete manufacturing problem.",
        outcome: "A working detection project aimed at identifying failures earlier. Quantitative accuracy and material savings remain to be measured.",
        stages: ["Camera frames", "OpenCV + model", "Failure signal"],
        repo: "https://github.com/lekangji/Print-Failure-Detection"
    },
    "vex-33111a": {
        title: "Competition Robotics",
        category: "ROBOTICS / AUTONOMOUS CONTROL",
        statement: "Writing control software that has to perform on a real field.",
        summary: "Autonomous and driver-control systems developed for VEX V5 as lead programmer and co-captain of a two-time World Championship qualifying team.",
        problem: "Competition code must turn planning into repeatable physical behavior under time pressure. A routine that looks good once is not enough; it has to survive testing, tuning, and changing match conditions.",
        built: "I developed and iterated the team's autonomous and driver-control codebase in C++, coordinating software work with the robot and a sister team.",
        difficulty: "Real mechanisms introduce variability that a simulation cannot remove. The work depends on fast iteration between code, hardware behavior, driver feedback, and competition constraints.",
        contribution: "Lead programming and co-captaincy, with ownership of autonomous and driver-control development.",
        outcome: "The team qualified twice for the VEX World Championship and won the Texas Region 3 Tournament Championship.",
        stages: ["Inputs + strategy", "VEX V5 control", "Robot behavior"],
        repo: "https://github.com/lekangji/33111A-VEX"
    },
    "browser-gaming-platform": {
        title: "55GMS",
        category: "SOFTWARE / WEB PLATFORM",
        statement: "Growing a browser platform beyond the scale of a side project.",
        summary: "A browser-based gaming platform I co-founded that grew to serve millions of users.",
        problem: "A web product is a different engineering problem once people actually depend on it. Usability, deployment, and ongoing changes matter as much as the first release.",
        built: "I co-founded and helped build 55GMS, a JavaScript and Node.js web platform for browser-based games and apps.",
        difficulty: "The repository is a server-backed application rather than a purely static site. That changes how the platform is deployed, maintained, and made accessible to users.",
        contribution: "I co-founded the platform and contributed to its build as the product grew.",
        outcome: "The platform grew to serve millions of users, turning a build into a widely used product.",
        stages: ["Browser interface", "Node.js platform", "Users at scale"],
        repo: "https://github.com/55gms/55GMS"
    }
};


const detail = (label, content) => {
    const block = element("section", "case-detail");
    block.append(element("h2", "mono", label), element("p", "", content));
    return block;
};

export const initCaseStudy = () => {
    const root = document.querySelector("[data-case-study]");
    if (!root) return;
    const id = new URLSearchParams(window.location.search).get("id");
    const study = Object.hasOwn(studies, id) ? studies[id] : null;
    if (!study) {
        document.title = "Case study unavailable - Lekang Ji";
        const missing = element("section", "case-missing");
        const back = element("a", "text-action mono", "BACK TO ALL PROJECTS ↗");
        back.href = "/projects/";
        missing.append(element("h1", "", "Case study unavailable"), element("p", "", "Choose a project from the archive to read its case study."), back);
        root.replaceChildren(missing);
        return;
    }

    document.title = `${study.title} - Lekang Ji`;
    document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').forEach((meta) => meta.setAttribute("content", study.summary));
    document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach((meta) => meta.setAttribute("content", document.title));
    const hero = element("section", "case-hero");
    hero.append(element("p", "kicker mono", study.category), element("h1", "", study.title), element("p", "case-summary", study.summary));
    const repo = element("a", "text-action mono", "EXPLORE THE CODE ↗");
    repo.href = study.repo;
    repo.target = "_blank";
    repo.rel = "noreferrer";
    hero.append(repo);
    for (const asset of projectMedia[id] ?? []) {
        const figure = element("figure", "case-media");
        const image = element("img");
        const caption = element("figcaption", "", "Loading project image…");
        caption.setAttribute("role", "status");
        figure.append(image, caption);
        hero.append(figure);
        loadMedia(image, asset, {
            onLoad: () => {
                figure.classList.add("is-loaded");
                caption.textContent = asset.alt;
            },
            onError: () => { caption.textContent = "Image unavailable. The case study continues below."; },
        });
    }

    const system = element("section", "case-system");
    system.append(element("p", "kicker mono", "SYSTEM / AT A GLANCE"));
    const flow = element("div", "system-flow");
    study.stages.forEach((stage, index) => {
        flow.append(element("div", "system-step", stage));
        if (index < study.stages.length - 1) flow.append(element("span", "system-arrow", "→"));
    });
    system.append(flow, element("p", "system-note mono", "CONCEPTUAL SYSTEM MAP — NOT A PRODUCTION SCHEMATIC"));

    const body = element("div", "case-body");
    body.append(
        detail("01 / THE PROBLEM", study.problem),
        detail("02 / WHAT I BUILT", study.built),
        detail("03 / ENGINEERING FOCUS", study.difficulty),
        detail("04 / MY ROLE", study.contribution),
        detail("05 / RESULT", study.outcome),
    );
    const next = element("a", "case-back mono", "← BACK TO ALL PROJECTS");
    next.href = "/projects/";
    root.replaceChildren(hero, system, body, next);
};
