/* ================================
   0) NAV HEIGHT → CSS VAR
================================ */
(function setNavHeightVar(){
  const nav = document.querySelector('.nav');
  const set = () =>
    document.documentElement.style.setProperty('--nav-h', (nav ? nav.offsetHeight : 80) + 'px');
  set();
  window.addEventListener('resize', set);
})();

/* ================================
   1) SPOTLIGHT / POINTER FOLLOW
================================ */
(function () {
  const root  = document.documentElement;
  const stage = document.getElementById("stage");
  if (!stage) return;

  let tx = window.innerWidth * 0.5;
  let ty = window.innerHeight * 0.5;
  let cx = tx, cy = ty;

  const setVars = (x, y) => {
    root.style.setProperty("--spot-x", x + "px");
    root.style.setProperty("--spot-y", y + "px");
  };
  const snap = (x, y) => { cx = tx = x; cy = ty = y; setVars(cx, cy); };

  function onMouse(e){ tx = e.clientX; ty = e.clientY; }
  function onTouch(e){ if (e.touches && e.touches[0]){ tx = e.touches[0].clientX; ty = e.touches[0].clientY; } }

  function tick(){
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    setVars(cx, cy);
    requestAnimationFrame(tick);
  }

  stage.addEventListener("mousemove", onMouse,   { passive:true });
  stage.addEventListener("mouseenter", onMouse,  { passive:true });
  stage.addEventListener("touchmove",  onTouch,  { passive:true });
  stage.addEventListener("touchstart", onTouch,  { passive:true });

  window.addEventListener("resize", () => { tx = window.innerWidth*0.5; ty = window.innerHeight*0.5; });

  snap(tx, ty);
  tick();

  stage.addEventListener("click", () => document.body.classList.add("light-on"));
})();

/* ==========================================
   2) ABOUT / EXPERTISE — FAN SPREAD (no flip)
========================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (!(window.gsap && window.ScrollTrigger)) {
    console.error('GSAP or ScrollTrigger is not loaded. Please include both.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const section = document.getElementById('expertise');
  if (!section) return;

  /* --- Split headline into chars (no plugins) --- */
  const hero = section.querySelector('[data-hero]');
  if (hero && !hero.dataset.split) {
    hero.dataset.split = '1';
    const lines = hero.innerHTML.split('<br>');
    hero.innerHTML = lines.map(line =>
      line.replace(/\S+/g, w => `<span class="word">${[...w].map(c=>`<span class="char">${c}</span>`).join('')}</span>`)
    ).join('<br>');
  }
  const chars = hero ? gsap.utils.toArray('.char', hero) : [];

  /* --- Cards --- */
  const cards = gsap.utils.toArray('.xp-card', section);
  if (!cards.length) return;

  // target fan offsets (relative to CENTER)
  const fan = [
    { xPercent: -120, rotate: -10 },
    { xPercent:  -40, rotate:  -2 },
    { xPercent:   40, rotate:   3 },
    { xPercent:  120, rotate:  12 }
  ];

  // baseline: perfectly centered stack
  cards.forEach((el, i) => {
    gsap.set(el, {
      xPercent: -50,           // <-- center baseline
      yPercent: -50,
      rotate: (i - 1.5) * 8,   // slight pre-tilt
      opacity: 0,
      transformOrigin: '50% 50%'
    });
  });

  // ScrollTrigger start below fixed nav
  const navStart = () => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
    const px  = parseFloat(raw) || 0;
    return `top+=${px} top`;
  };

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: {
      trigger: section,
      start: navStart,
      end: '+=220%',
      scrub: true,
      pin: true,
      pinSpacing: true,
      pinReparent: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      // markers: true,
    }
  });

  // 0) Headline + cue
  tl.add('typoIn', 0.02);
  if (hero) {
    gsap.set(hero, {'--xp-tracking': '.14em', '--xp-ink-pos': '0%'});
    gsap.set(chars, { yPercent: 120, rotate: 6, opacity: 0 });

    tl.to(hero, { '--xp-tracking': '.02em', duration: .55, ease: 'power2.out' }, 'typoIn');
    tl.to(chars, {
      yPercent: 0, rotate: 0, opacity: 1,
      duration: .6, ease: 'power3.out',
      stagger: { each: 0.008, from: 'center' }
    }, 'typoIn');
    tl.to(hero, { '--xp-ink-pos': '100%', duration: .8, ease: 'none' }, 'typoIn');
  }

  // underline cue scrub
  const cue = section.querySelector('.xp-cue');
  if (cue) {
    ScrollTrigger.create({
      trigger: section,
      start: navStart,
      end: 'top+=35% top',
      scrub: true,
      onUpdate: (self) => {
        const p = Math.min(1, Math.max(0, self.progress));
        cue.style.setProperty('--u', (p * 100) + '%');
        cue.style.setProperty('--cue-arrow', (.25 + p * .55).toFixed(2));
      }
    });
  }

  // 1) Cards fade in + tiny jiggle
  tl.add('reveal', '+=0.1');
  tl.to(cards, { opacity: 1, duration: 0.5, stagger: 0.08 }, 'reveal');
  cards.forEach((card, i) => {
    tl.to(card, { y: -4, duration: .16, ease: 'sine.out' },  `reveal+=${0.28 + i*0.02}`);
    tl.to(card, { y:  0, duration: .16, ease: 'sine.in'  },  `reveal+=${0.44 + i*0.02}`);
  });

  // 2) Fan spread (relative to center)
  tl.to(cards, {
    xPercent: (i) => -50 + (fan[i]?.xPercent ?? (i-1.5)*80),
    rotate:   (i) =>        (fan[i]?.rotate   ?? (i-1.5)*8),
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.06
  }, 'reveal+=20%');

  // refresh after assets/fonts
  window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 60), { once:true });
});

/* =======================================
   3) FADE TITLE while expertise is entering
======================================= */
document.addEventListener('DOMContentLoaded', () => {
  if (!(window.gsap && window.ScrollTrigger)) return;
  const title  = document.getElementById('title');
  const expert = document.getElementById('expertise');
  if (!title || !expert) return;

  gsap.to(title, {
    opacity: 0, ease: 'none',
    scrollTrigger: { trigger: expert, start: 'top 25%', end: 'top 5%', scrub: true, invalidateOnRefresh: true }
  });
});

/* =======================================
   4) MINI REVEALS 
======================================= */
document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('.wordboard');
  if (!el) return;

  const reveal = () => el.classList.add('revealed');

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({ trigger: el, start: 'top 72%', once: true, onEnter: reveal });
  } else {
    const io = new IntersectionObserver((e)=> {
      if (e[0].isIntersecting){ reveal(); io.disconnect(); }
    }, { rootMargin: '0px 0px -28% 0px' });
    io.observe(el);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const faw = document.getElementById('mini-faw');
  if (!faw) return;
  const show = () => faw.classList.add('reveal');

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({ trigger: faw, start: 'top 75%', once: true, onEnter: show });
  } else {
    const io = new IntersectionObserver((e)=>{ if(e[0].isIntersecting){ show(); io.disconnect(); } }, {rootMargin:'0px 0px -25% 0px'});
    io.observe(faw);
  }
});

/* ============================================================
   5) FIND-A-WORD + STICKERS DRAGGING
============================================================ */
(function () {
  const root = document;

  const faw = root.querySelector(".faw");
  if (faw) {
    const grid  = faw.querySelector(".grid");
    const cells = grid ? Array.from(grid.querySelectorAll("span")) : [];
    const rings = faw.querySelectorAll(".marks .ring");

    const N = 10;
    const words = [
      { row: 1, c1: 1,  c2: 7,  ring: 0 }, // CHAOTIC
      { row: 2, c1: 2,  c2: 9,  ring: 1 }, // REDBLACK
      { row: 3, c1: 1,  c2: 6,  ring: 2 }, // GRUNGE
      { row: 4, c1: 1,  c2: 10, ring: 3 }, // DAYDREAMER
      { row: 5, c1: 1,  c2: 10, ring: 4 }, // PASSIONATE
      { row: 6, c1: 1,  c2: 8,  ring: 5 }, // CREATIVE
    ];
    words.forEach(w => {
      w.indexes = [];
      for (let c = w.c1; c <= w.c2; c++) {
        const zeroIdx = (w.row - 1) * N + (c - 1);
        if (cells[zeroIdx]) w.indexes.push(zeroIdx);
      }
    });

    function showWord(w){
      if (rings[w.ring]) rings[w.ring].classList.add("on");
      w.indexes.forEach(i => cells[i].classList.add("hot"));
    }
    function hideAll(){
      rings.forEach(r => r.classList.remove("on"));
      cells.forEach(c => c.classList.remove("hot"));
    }

    if (grid){
      grid.addEventListener("pointerover", (e) => {
        const i = cells.indexOf(e.target);
        if (i === -1) return;
        const row = Math.floor(i / N) + 1;
        const col = (i % N) + 1;
        const w = words.find(w => w.row === row && col >= w.c1 && col <= w.c2);
        hideAll();
        if (w) showWord(w);
      }, { passive: true });

      grid.addEventListener("pointerout", (e) => {
        if (!grid.contains(e.relatedTarget)) hideAll();
      }, { passive: true });
    }
  }

  // Generic draggable (CSS vars)
  function getVarPx(el, name, fallback = 0) {
    const v = getComputedStyle(el).getPropertyValue(name).trim();
    return v ? parseFloat(v) : fallback;
  }
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function makeDraggable(el, boundsEl, options = {}) {
    const opt = Object.assign({
      varX: "--x", varY: "--y",
      edge: 0, lockY: false, lockX: false
    }, options);

    let startX = 0, startY = 0, startVarX = 0, startVarY = 0, dragging = false;

    function onDown(e){
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; el.classList.add("is-dragging");
      const p = (e.touches && e.touches[0]) || e;
      startX = p.clientX; startY = p.clientY;
      startVarX = getVarPx(el, opt.varX, getVarPx(el, "--px", 0));
      startVarY = getVarPx(el, opt.varY, getVarPx(el, "--py", 0));
      el.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    }
    function onMove(e){
      if (!dragging) return;
      const p = (e.touches && e.touches[0]) || e;
      let nx = startVarX + (p.clientX - startX);
      let ny = startVarY + (p.clientY - startY);

      if (boundsEl){
        const b = boundsEl.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        nx = clamp(nx, opt.edge, b.width  - r.width  - opt.edge);
        ny = clamp(ny, opt.edge, b.height - r.height - opt.edge);
      }
      if (!opt.lockX) el.style.setProperty(opt.varX, nx + "px");
      if (!opt.lockY) el.style.setProperty(opt.varY, ny + "px");
      e.preventDefault();
    }
    function onUp(){ dragging = false; el.classList.remove("is-dragging"); }

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive:false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  // Polaroids on the board
  if (faw) {
    const board = faw.querySelector(".faw-board");
    const polaroids = faw.querySelectorAll(".polaroid");
    polaroids.forEach(p => makeDraggable(p, board, { varX: "--px", varY: "--py", edge: 6 }));
  }

  // Chips inside area
  if (faw) {
    const area = faw.querySelector(".chips-area");
    const chips = area ? Array.from(area.querySelectorAll(".chip")) : [];
    chips.forEach((chip, i) => {
      if (!getComputedStyle(chip).getPropertyValue("--x").trim()) {
        chip.style.setProperty("--x", (12 + (i * 88) % (area.clientWidth - 120)) + "px");
        chip.style.setProperty("--y", (12 + (i * 36) % (area.clientHeight - 44)) + "px");
      }
      makeDraggable(chip, area, { varX: "--x", varY: "--y", edge: 6 });
      chip.addEventListener("keydown", (e) => {
        const step = e.shiftKey ? 16 : 8;
        let x = getVarPx(chip, "--x", 0);
        let y = getVarPx(chip, "--y", 0);
        if      (e.key === "ArrowLeft")  x -= step;
        else if (e.key === "ArrowRight") x += step;
        else if (e.key === "ArrowUp")    y -= step;
        else if (e.key === "ArrowDown")  y += step;
        else return;
        const b = area.getBoundingClientRect();
        const r = chip.getBoundingClientRect();
        x = clamp(x, 6, b.width  - r.width  - 6);
        y = clamp(y, 6, b.height - r.height - 6);
        chip.style.setProperty("--x", x + "px");
        chip.style.setProperty("--y", y + "px");
        e.preventDefault();
      });
    });
  }
})();
