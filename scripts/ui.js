export const scrollToContact = (behavior = "smooth") => {
    if (!document.getElementById("contact")) return;
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior });
};

export const initUi = () => {
    document.querySelectorAll("#year").forEach((year) => {
        year.textContent = new Date().getFullYear();
    });

    const header = document.querySelector(".site-header");
    if (header) {
        const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
        updateHeader();
        window.addEventListener("scroll", updateHeader, { passive: true });
    }

    const navToggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("primaryNav");
    if (navToggle && nav) document.documentElement.classList.add("nav-ready");
    const closeNav = () => {
        if (!navToggle || !nav) return;
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open navigation");
        nav.classList.remove("is-open");
    };
    navToggle?.addEventListener("click", () => {
        const isOpen = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", String(!isOpen));
        navToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
        nav?.classList.toggle("is-open", !isOpen);
    });
    nav?.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeNav();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !event.defaultPrevented &&
            navToggle?.getAttribute("aria-expanded") === "true" &&
            !document.querySelector("dialog[open]")) {
            closeNav();
            navToggle?.focus();
        }
    });
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".site-nav")) closeNav();
    });
    window.matchMedia("(min-width: 641px)").addEventListener("change", (event) => {
        if (event.matches) closeNav();
    });

    document.addEventListener("click", (event) => {
        const link = event.target.closest?.('a[href="#top"], a[href="#contact"]');
        if (!link) return;
        event.preventDefault();
        history.pushState(null, "", link.getAttribute("href"));
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        if (link.hash === "#top") window.scrollTo({ top: 0, behavior });
        else scrollToContact(behavior);
    });

    if (window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) {
        document.addEventListener("pointermove", (event) => {
            const card = event.target.closest?.(".project-card");
            if (!card) return;
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - .5;
            const y = (event.clientY - rect.top) / rect.height - .5;
            card.style.setProperty("--tilt-x", `${(-y * 1.4).toFixed(2)}deg`);
            card.style.setProperty("--tilt-y", `${(x * 1.4).toFixed(2)}deg`);
            if (card.classList.contains("has-image")) {
                card.style.setProperty("--image-x", `${(-x * 12).toFixed(1)}px`);
                card.style.setProperty("--image-y", `${(-y * 12).toFixed(1)}px`);
            }
        }, { passive: true });
        document.addEventListener("pointerout", (event) => {
            const card = event.target.closest?.(".project-card");
            if (card && !card.contains(event.relatedTarget)) {
                card.style.removeProperty("--tilt-x");
                card.style.removeProperty("--tilt-y");
                card.style.removeProperty("--image-x");
                card.style.removeProperty("--image-y");
            }
        });
    }

    const archiveLinks = [...document.querySelectorAll('.archive-nav a[href^="#"]')];
    if (archiveLinks.length) {
        const updateArchiveNav = () => {
            const threshold = (header?.offsetHeight ?? 0) + 90;
            let current = archiveLinks[0];
            archiveLinks.forEach((link) => {
                const section = document.getElementById(link.hash.slice(1));
                if (section && section.getBoundingClientRect().top <= threshold) current = link;
            });
            archiveLinks.forEach((link) => {
                if (link === current) link.setAttribute("aria-current", "location");
                else link.removeAttribute("aria-current");
            });
        };
        updateArchiveNav();
        window.addEventListener("scroll", updateArchiveNav, { passive: true });
        const content = document.querySelector(".archive-content");
        if (content) new MutationObserver(updateArchiveNav).observe(content, { childList: true });
    }

    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
};
