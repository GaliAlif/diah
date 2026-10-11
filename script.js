(() => {
  const canvas = document.getElementById("flowerCanvas");
  const ctx = canvas.getContext("2d");
  const loading = document.getElementById("loading");
  const button = document.getElementById("bloomButton");
  const burstLayer = document.getElementById("burstLayer");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0, height = 0, dpr = 1, particles = [], startTime = 0, raf = 0;
  let burstCooldown = false;

  const palette = ["#e987b5", "#f2a7ca", "#d9b8f1", "#c9a5e8", "#f6c3dc", "#d982b8", "#fff1f8"];
  const rand = (min, max) => min + Math.random() * (max - min);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildFlower();
  }

  // Build the flower from many "love u" text particles sampled from a rose-like silhouette.
  function buildFlower() {
    particles = [];
    const cx = width * 0.5;
    const cy = height * 0.43;
    const scale = Math.min(width / 360, height / 430);
    const total = Math.max(430, Math.min(1050, Math.floor(width * height / 210)));
    const petalColors = palette.slice(0, 6);

    // Layered rose petals, using a polar rose-like boundary and several inner folds.
    for (let i = 0; i < total; i++) {
      const layer = Math.random();
      let x, y;
      if (layer < 0.78) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        const petalWave = 0.78 + 0.22 * Math.cos(5 * a + 0.4) + 0.08 * Math.cos(9 * a);
        const radiusX = 113 * scale;
        const radiusY = 112 * scale;
        x = cx + Math.cos(a) * radiusX * r * petalWave;
        y = cy + Math.sin(a) * radiusY * r * petalWave * 0.88;
        // Curl the inner petals inward to suggest a rose spiral.
        const dist = Math.hypot(x - cx, y - cy);
        if (dist < 40 * scale) {
          const angle = Math.atan2(y - cy, x - cx) + (1 - dist / (40 * scale)) * 1.7;
          x = cx + Math.cos(angle) * dist;
          y = cy + Math.sin(angle) * dist;
        }
      } else {
        // Stem and two small leaves.
        const stemT = Math.random();
        if (Math.random() < 0.66) {
          x = cx + rand(-3, 3) * scale;
          y = cy + 60 * scale + stemT * 116 * scale;
        } else {
          const side = Math.random() < 0.5 ? -1 : 1;
          const t = Math.random();
          x = cx + side * (12 + t * 57) * scale;
          y = cy + (75 + t * 48) * scale + rand(-12, 12) * scale;
        }
      }
      const isStem = y > cy + 65 * scale;
      const text = "love u";
      particles.push({
        x, y,
        fromX: cx + rand(-width * .45, width * .45),
        fromY: height + rand(10, height * 1.1),
        delay: Math.random() * 1.5,
        color: isStem ? (Math.random() > .5 ? "#9dbea1" : "#83ad91") : petalColors[Math.floor(Math.random() * petalColors.length)],
        size: rand(5.2, 8.5) * Math.max(.78, scale),
        rotation: rand(-0.22, 0.22),
        text
      });
    }
    startTime = performance.now();
    if (raf) cancelAnimationFrame(raf);
    animate(startTime);
  }

  function animate(now) {
    ctx.clearRect(0, 0, width, height);
    const elapsed = reduceMotion ? 8 : (now - startTime) / 1000;
    const progress = Math.min(1, elapsed / 3.1);
    const eased = 1 - Math.pow(1 - progress, 3);

    // Soft glow behind the bloom.
    const cx = width * .5, cy = height * .43;
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.min(width, height) * .42);
    glow.addColorStop(0, "rgba(255, 214, 237, .34)");
    glow.addColorStop(1, "rgba(255, 244, 251, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    for (const p of particles) {
      const local = Math.max(0, Math.min(1, (elapsed - p.delay * .25) / 2.8));
      const e = 1 - Math.pow(1 - local, 3);
      const x = p.fromX + (p.x - p.fromX) * e;
      const y = p.fromY + (p.y - p.fromY) * e;
      const alpha = Math.min(1, local * 1.7);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(p.rotation);
      ctx.font = `600 ${p.size}px "DM Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }

    // Tiny floating sparkles.
    if (progress >= 1) {
      for (let i = 0; i < 16; i++) {
        const t = now / 950 + i * 2.4;
        const x = cx + Math.cos(t) * (width * .34);
        const y = cy + Math.sin(t * .9) * (height * .31);
        ctx.globalAlpha = .3 + .4 * (Math.sin(t * 2) + 1) / 2;
        ctx.fillStyle = i % 2 ? "#e6b5de" : "#fff";
        ctx.font = "12px serif";
        ctx.fillText("✦", x, y);
      }
      ctx.globalAlpha = 1;
    }
    if (progress < 1 || !reduceMotion) raf = requestAnimationFrame(animate);
  }

  function loveBurst(clientX, clientY) {
    if (burstCooldown) return;
    burstCooldown = true;
    setTimeout(() => burstCooldown = false, 250);
    const rect = canvas.getBoundingClientRect();
    const originX = clientX ?? rect.left + rect.width / 2;
    const originY = clientY ?? rect.top + rect.height * .43;
    const count = window.innerWidth < 500 ? 32 : 54;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "burst";
      el.textContent = i % 4 === 0 ? "♡" : "love u";
      el.style.left = `${originX}px`;
      el.style.top = `${originY}px`;
      el.style.color = palette[Math.floor(Math.random() * palette.length)];
      el.style.setProperty("--dx", `${rand(-180, 180)}px`);
      el.style.setProperty("--dy", `${rand(-210, 150)}px`);
      el.style.setProperty("--rot", `${rand(-90, 90)}deg`);
      el.style.animationDelay = `${rand(0, .18)}s`;
      burstLayer.appendChild(el);
      el.addEventListener("animationend", () => el.remove(), { once: true });
    }
  }

  canvas.addEventListener("click", (event) => loveBurst(event.clientX, event.clientY));
  button.addEventListener("click", (event) => {
    loveBurst(window.innerWidth / 2, window.innerHeight * .48);
    button.innerHTML = "A thousand love u's for you <span>♡</span>";
    setTimeout(() => button.innerHTML = 'Send a little love <span>♡</span>', 2200);
  });

  document.fonts.ready.then(() => {
    resize();
    loading.classList.add("hidden");
    setTimeout(() => loading.remove(), 500);
  });
  window.addEventListener("resize", () => {
    clearTimeout(window.__flowerResizeTimer);
    window.__flowerResizeTimer = setTimeout(resize, 150);
  });
  // Fallback if web fonts are slow or unavailable.
  setTimeout(() => { if (!particles.length) { resize(); loading.classList.add("hidden"); } }, 1500);
})();
