// EditSutra website: the live edit bay in the hero, tool tabs, before/after slider, template strip, map query typing
(() => {
  const $ = (id) => document.getElementById(id);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero product film: the chip names the step on screen; step buttons jump to it (times = REEL_ACTS in render-doc.js)
  const vid = $('hero-video'), tool = $('bay-tool'), steps = document.querySelectorAll('#film-steps button');
  if (vid && tool) {
    const ACTS = [[0, 'The problem: raw recording'], [4, 'Silences and retakes cut'], [8.5, 'Captions: English, Hindi, Hinglish'], [13, '16:9 to 9:16 Short'], [17.5, 'Voice clean-up, sound design, music'], [22, 'Colour, transitions, templates'], [27, 'Finished edit'], [30.5, 'Download EditSutra']];
    let last = -1;
    const say = (i) => { tool.querySelector('span').textContent = ACTS[i][1]; tool.classList.remove('flash'); void tool.offsetWidth; tool.classList.add('flash'); steps.forEach((b, k) => b.setAttribute('aria-current', k === Math.min(i, steps.length - 1) ? 'step' : 'false')); };
    const sync = () => { const i = ACTS.filter(([s]) => vid.currentTime >= s).length - 1; if (i !== last) { last = i; say(i); } };
    vid.addEventListener('timeupdate', sync); vid.addEventListener('seeked', sync);
    steps.forEach((b) => b.addEventListener('click', () => { vid.currentTime = +b.dataset.t + 0.05; vid.play().catch(() => {}); }));
    // reduced motion: hold the finished timeline as a still, the visitor can still step through it
    if (still) { vid.removeAttribute('autoplay'); vid.pause(); vid.addEventListener('loadedmetadata', () => { vid.currentTime = 29; }, { once: true }); }
  }

  // Tool tabs
  const tabs = document.querySelectorAll('.fx-tabs [role=tab]');
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.setAttribute('aria-selected', x === t));
    document.querySelectorAll('.group[data-g]').forEach((g) => { g.hidden = g.dataset.g !== t.dataset.g; });
  }));

  // Before / after
  const cmp = $('compare');
  if (cmp) { const r = cmp.querySelector('input'); r.addEventListener('input', () => cmp.style.setProperty('--pos', r.value + '%')); }

  // Template strip (doubled so it loops)
  const track = $('tpl-track');
  if (track && window.ES_TEMPLATES) {
    const html = window.ES_TEMPLATES.map(([f, n, c]) => `<figure><img src="assets/templates/${f}.jpg" alt="${n} template" width="320" height="180" loading="lazy"><figcaption>${n}<span>${c}</span></figcaption></figure>`).join('');
    track.innerHTML = html + html.replace(/alt="[^"]*"/g, 'alt="" aria-hidden="true"');
  }

  // Map box typing
  const q = $('map-q');
  if (q && !still) {
    const list = ['India vs Pakistan', 'Madhya Pradesh', 'Delhi to Mumbai', 'Kerala', 'Mumbai se Goa'];
    let i = 0;
    setInterval(() => { i = (i + 1) % list.length; q.style.opacity = 0; setTimeout(() => { q.textContent = list[i]; q.style.opacity = 1; }, 200); }, 2600);
  }
})();

// Feature demos: play when in view, toggle "before" and "after" every few seconds
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wave = document.getElementById('wave-cut');
  if (wave) { const r = (i) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1; let q = 0;
    for (let i = 0; i < 90; i++) { const b = document.createElement('i'); const quiet = (i % 15) > 10; if (quiet) q++; b.className = quiet ? 'q' : ''; b.style.height = (quiet ? 4 + r(i) * 8 : 20 + r(i) * 80) + '%'; wave.append(b); } }
  const cv = document.getElementById('voice-cv'), x = cv && cv.getContext('2d');
  let clean = false;
  const drawVoice = (t) => {
    if (!x) return; const W = cv.width, H = cv.height; x.clearRect(0, 0, W, H);
    x.strokeStyle = clean ? '#a78bfa' : '#8a8a96'; x.lineWidth = 2; x.beginPath();
    for (let i = 0; i < W; i += 2) { const speech = Math.max(0, Math.sin(i * 0.018 + t * 2)) * Math.sin(i * 0.31 + t * 9) * 70 * (0.6 + 0.4 * Math.sin(i * 0.004)); const noise = clean ? 0 : (Math.sin(i * 1.7 + t * 40) * 0.5 + Math.sin(i * 3.1 - t * 31) * 0.5) * 22; const y = H / 2 + speech + noise; i ? x.lineTo(i, y) : x.moveTo(i, y); }
    x.stroke(); if (!still) requestAnimationFrame((n) => drawVoice(n / 1000));
  };
  drawVoice(0);
  const demos = document.querySelectorAll('.demo-cut, .demo-takes, .demo-voice, .demo-sfx, .demo-short');
  if (still) { demos.forEach((d) => d.classList.add('on')); clean = true; return; }
  const timers = new Map();
  const io = new IntersectionObserver((list) => list.forEach((e) => {
    const d = e.target;
    if (e.isIntersecting && !timers.has(d)) { const flip = () => { d.classList.toggle('on'); if (d.classList.contains('demo-voice')) clean = d.classList.contains('on'); }; setTimeout(flip, 700); timers.set(d, setInterval(flip, 3600)); }
    else if (!e.isIntersecting && timers.has(d)) { clearInterval(timers.get(d)); timers.delete(d); }
  }), { threshold: 0.4 });
  demos.forEach((d) => io.observe(d));
})();
