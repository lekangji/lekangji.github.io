import { getCssVar, rgbaFromHex } from "./utils.js";

const PARTICLE_COUNT = 48;

export const initParticles = () => {
    const canvas = document.getElementById("particleCanvas");
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    const context = canvas.getContext("2d");
    const particles = [];
    let animationId;
    let themeColor = getCssVar("--accent");

    const seed = () => {
        particles.length = 0;
        for (let index = 0; index < PARTICLE_COUNT; index += 1) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 1.4 + 0.4,
            });
        }
    };

    const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        seed();
    };

    const draw = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((particle) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            if (particle.x <= 0 || particle.x >= canvas.width) particle.vx *= -1;
            if (particle.y <= 0 || particle.y >= canvas.height) particle.vy *= -1;

            context.beginPath();
            context.fillStyle = rgbaFromHex(themeColor, 0.35);
            context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            context.fill();
        });

        for (let first = 0; first < particles.length; first += 1) {
            for (let second = first + 1; second < particles.length; second += 1) {
                const xDistance = particles[first].x - particles[second].x;
                const yDistance = particles[first].y - particles[second].y;
                const distance = Math.hypot(xDistance, yDistance);
                if (distance >= 120) continue;

                context.beginPath();
                context.strokeStyle = rgbaFromHex(themeColor, 0.12 * (1 - distance / 120));
                context.lineWidth = 0.5;
                context.moveTo(particles[first].x, particles[first].y);
                context.lineTo(particles[second].x, particles[second].y);
                context.stroke();
            }
        }
        animationId = window.requestAnimationFrame(draw);
    };

    const updateThemeColor = () => {
        themeColor = getCssVar("--accent");
    };
    document.addEventListener("theme-change", updateThemeColor);
    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
        window.cancelAnimationFrame(animationId);
        window.removeEventListener("resize", resize);
        document.removeEventListener("theme-change", updateThemeColor);
    };
};
