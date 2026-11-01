// EditSutra website: feature library (from features.js) and the "Try it yourself" playground.
// The playground is a simulation: every op is a pure flag, the preview and timeline are drawn from the set of flags,
// so ops combine in any order, Compare shows the raw clip, Reset clears everything.
(() => {
  const $ = (id) => document.getElementById(id);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- feature library ----------
  const ICON = {
    cut: 'M6 4a2 2 0 100 4 2 2 0 000-4zm0 12a2 2 0 100 4 2 2 0 000-4zM8 7l12 10M8 17L20 7', cc: 'M3 6h18v12H3zM7 13h4M13 13h4M7 10h10',
    shorts: 'M8 3h8v18H8zM11 18h2', voice: 'M12 4v10M8 8v6M16 8v6M4 11v2M20 11v2M9 20h6', sound: 'M9 18V6l10-2v12M9 18a2 2 0 11-4 0 2 2 0 014 0zm10-2a2 2 0 11-4 0 2 2 0 014 0z',
    gfx: 'M4 20V10M10 20V4M16 20v-7M22 20H2', motion: 'M3 7h13l-3-3M21 17H8l3 3', colour: 'M12 3a9 9 0 100 18c1 0 1.5-.8 1.5-1.6 0-1.4 1-2 2-2H18a3 3 0 003-3c0-6-4-11.4-9-11.4z',
    lib: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', util: 'M14 7l3-3 3 3-3 3M17 4v9a4 4 0 01-4 4H4',
  };
  const KIND = { core: 'Core tool', template: 'Template', preset: 'Preset', utility: 'Utility', soon: 'Coming soon' };
  const tabs = $('lib-tabs'), grid = $('lib-grid');
  if (tabs && window.ES_FEATURES) {
    const cats = [['all', 'All'], ...window.ES_CATS];
    tabs.innerHTML = cats.map(([k, n], i) => `<button role="tab" aria-selected="${i === 0}" data-k="${k}">${n}</button>`).join('');
    // status stays internal (data-status) until launch; every card shows its own animation of how the tool works
    const card = ([c, name, line, kind, status, anim]) => `<article class="feat" data-status="${status}"><canvas data-mini="${anim}" aria-hidden="true"></canvas><h3>${name}</h3><p>${line}</p><i class="kb ${kind}">${KIND[kind]}</i></article>`;
    const show = (k) => {
      tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', b.dataset.k === k));
      const list = window.ES_FEATURES.filter((f) => k === 'all' || f[0] === k);
      grid.innerHTML = k === 'all'
        ? window.ES_CATS.map(([c, n]) => `<h3 class="lib-h">${n}<span>${list.filter((f) => f[0] === c).length}</span></h3>${list.filter((f) => f[0] === c).map(card).join('')}`).join('')
        : list.map(card).join('');
      if (window.ESMini) window.ESMini.watch(grid);
    };
    tabs.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(b.dataset.k); });
    tabs.addEventListener('keydown', (e) => {
      if (!/Arrow(Left|Right)/.test(e.key)) return; const all = [...tabs.querySelectorAll('button')], i = all.indexOf(document.activeElement);
      const n = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]; n.focus(); show(n.dataset.k);
    });
    // opens on one group so the page stays short; "All" shows every card
    show('cut');
  }

  // ---------- playground ----------
  const pg = $('pg'); if (!pg) return;
  const frame = $('pg-frame'), status = $('pg-status'), chip = $('pg-chip'), len = $('pg-len'), ccEl = $('pg-cc'), sfxEl = $('pg-sfx');
  const cams = { a: frame.querySelector('.cam.a'), b: frame.querySelector('.cam.b'), desk: frame.querySelector('.cam.desk') };
  // reduced motion: the preview footage holds still
  if (still) Object.values(cams).forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
  const on = new Set(); let level = 1, lang = 'en', compare = false, tick = 0, cam = 'a', line = 0, word = 0;
  const LINES = {
    en: ["Today I'll show you my editing setup", 'One mic, one light, one camera', "Let's start with the cuts"],
    hi: ['आज मैं आपको अपना एडिटिंग सेटअप दिखाऊँगा', 'एक माइक, एक लाइट, एक कैमरा', 'चलिए कट्स से शुरू करते हैं'],
    hinglish: ['Aaj main aapko apna editing setup dikhaunga', 'Ek mic, ek light, ek camera', 'Chaliye cuts se shuru karte hain'],
  };
  const LANG_NAME = { en: 'English', hi: 'Hindi', hinglish: 'Hinglish' };
  const SAY = {
    cut: 'Silences cut: 2:10 of pauses gone, a breath left at each cut.', retakes: 'Retakes removed: the two false starts are gone, the last take stays.',
    jump: 'Jump-cut cleanup: alternate punch-ins hide the jumps.', cc: () => `Captions: ${LANG_NAME[lang]} SRT, added as a caption track (C1).`,
    anim: 'Animated captions: word by word, rendered as a see-through video on V3.', short: 'Short made: a 45 s, 9:16 timeline from the best moment.',
    reframe: 'Auto reframe: the speaker stays centred in 9:16.', voice: 'Voice clean-up: fan and room noise removed on A1.',
    sfx: 'Sound design: whoosh, pop and ka-ching placed on A2.', duck: 'Music on A3, ducked under the voice.',
    lut: 'LUT applied: warm film colour on V1.', trans: 'Transitions on the cuts (V3).', title: 'Motion title template on V3.',
    zoom: 'Auto zoom: punch-ins on the key lines (keyframes on V1).', tag: 'Name tag template on V3.', preset: 'Film look preset: grain and letterbox.',
    multicam: 'Multicam: cuts to the camera of whoever is talking.', download: 'Downloaded at 1080p and placed after the last clip, with a gap.', broll: 'B-roll on V2, matched to what is said.',
  };
  const OFF = { cut: 'Pauses back.', retakes: 'Retakes back.', short: 'Back to 16:9.', reframe: 'Reframe off.' };

  // V1/A1 from the raw clip: speech, pauses, retakes
  const PARTS = [['sp', 5], ['pa', 2], ['sp', 6], ['re', 3], ['sp', 4], ['pa', 3], ['sp', 7], ['pa', 1.5], ['sp', 5], ['re', 2.5], ['sp', 6], ['pa', 2], ['sp', 5]];
  const total = PARTS.reduce((s, p) => s + p[1], 0), share = (k) => PARTS.filter((p) => p[0] === k).reduce((s, p) => s + p[1], 0) / total;
  const v1 = $('pg-v1'), a1 = $('pg-a1');
  const dlClip = [v1, a1].map((lane) => { const b = document.createElement('i'); b.className = 'clip dl'; b.style.flexGrow = 0; lane.append(b); return b; });
  const clips = PARTS.map(([k, g], i) => [v1, a1].map((lane) => { const b = document.createElement('i'); b.className = 'clip ' + k; b.dataset.i = i; b.dataset.g = g; b.style.flexGrow = g; lane.append(b); return b; }));
  const lanes = { c: $('pg-c'), v3: $('pg-v3'), v2: $('pg-v2'), a2: $('pg-a2'), a3: $('pg-a3') };
  const blk = (lane, cls, l, w, label) => { const b = document.createElement('i'); b.className = 'drop in ' + cls; b.style.left = l + '%'; b.style.width = w + '%'; if (label) b.textContent = label; lanes[lane].append(b); };

  const draw = () => {
    const s = compare ? new Set() : on;
    // timeline
    clips.forEach(([v, a], i) => {
      const k = PARTS[i][0], gone = (k === 'pa' && s.has('cut') && level > 0) || (k === 're' && s.has('retakes'));
      const g = k === 'pa' && s.has('cut') && level === 0 ? PARTS[i][1] * 0.4 : k === 'sp' && s.has('cut') && level === 2 ? PARTS[i][1] * 0.95 : PARTS[i][1];
      [v, a].forEach((c) => { c.style.flexGrow = gone ? 0 : g; c.classList.toggle('gone', gone); });
      v.classList.toggle('camb', s.has('multicam') && k === 'sp' && i % 4 === 2);
      v.classList.toggle('graded', s.has('lut') || s.has('preset')); v.classList.toggle('kf', (s.has('zoom') || s.has('jump')) && k === 'sp');
      a.classList.toggle('clean', s.has('voice'));
    });
    dlClip.forEach((c) => { c.style.flexGrow = s.has('download') ? 6 : 0; c.classList.toggle('gone', !s.has('download')); });
    Object.values(lanes).forEach((l) => (l.innerHTML = ''));
    if (s.has('cc')) [[2, 15], [20, 16], [39, 17], [59, 15], [78, 18]].forEach(([l, w], i) => blk('c', 'cc', l, w, i ? '' : `Captions · ${LANG_NAME[lang]}`));
    if (s.has('anim')) blk('v3', 'anim', 2, 94, 'Animated captions .mov');
    if (s.has('title')) blk('v3', 'gfx', 1, 12, 'Title');
    if (s.has('tag')) blk('v3', 'tag', 24, 14, 'Name tag');
    if (s.has('trans')) [16, 41, 63, 84].forEach((l) => blk('v3', 'trans', l, 3));
    if (s.has('broll')) [[30, 9], [55, 8], [80, 9]].forEach(([l, w], i) => blk('v2', 'broll', l, w, i ? '' : 'B-roll'));
    if (s.has('sfx')) [8, 17, 30, 42, 55, 64, 77, 88, 12, 36, 70, 94].slice(0, [4, 8, 12][level]).forEach((l) => blk('a2', 'sfx', l, 2));
    if (s.has('duck')) blk('a3', 'music', 0, 100, 'Music −20 dB under voice');
    pg.querySelector('.pg-tracks').classList.toggle('is-short', s.has('short'));
    // length
    const cutK = s.has('cut') ? [0.6, 1, 1][level] * share('pa') + (level === 2 ? 0.05 * share('sp') : 0) : 0, secs = 600 * (1 - cutK - (s.has('retakes') ? share('re') : 0));
    len.textContent = s.has('short') ? '0:45 · 9:16' : `${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')}`;
    // preview
    ['lut', 'preset', 'short', 'reframe', 'title', 'tag', 'cc', 'anim', 'voice', 'duck', 'zoom', 'download'].forEach((k) => frame.classList.toggle('op-' + k, s.has(k)));
    frame.classList.toggle('has-pause', !s.has('cut')); frame.classList.toggle('has-retake', !s.has('retakes'));
    frame.dataset.cam = s.has('multicam') ? cam : 'a';
    frame.classList.toggle('show-broll', false); frame.dataset.int = level;
    if (s.has('cc') || s.has('anim')) caption(s);
    else ccEl.textContent = '';
    if (s.has('download') && !s.has('sfx')) sfxEl.textContent = 'Downloaded · 1080p'; else if (!s.has('sfx')) sfxEl.textContent = '';
    chip.textContent = compare ? 'Raw clip (compare)' : s.size ? [...s].map((k) => pg.querySelector(`[data-op="${k}"]`).textContent.replace(/ \(.*\)/, '')).join(' + ') : 'Raw clip';
    pg.querySelectorAll('[data-op]').forEach((b) => b.setAttribute('aria-pressed', on.has(b.dataset.op)));
  };
  const caption = (s) => {
    const text = LINES[lang][line % 3];
    ccEl.lang = lang === 'hi' ? 'hi' : 'en';
    if (s.has('anim')) { const w = text.split(' '); ccEl.innerHTML = w.map((x, i) => `<span class="${i === word % w.length ? 'now' : i < word % w.length ? 'said' : ''}">${x}</span>`).join(' '); }
    else ccEl.textContent = text;
  };
  // timed parts of the preview: camera switches, B-roll, transitions, punch-ins, sound pops, the next caption line
  const beat = () => {
    if (compare || !on.size) { tick++; frame.classList.toggle('blink', tick % 2 === 0); return; }
    tick++; line++; word = 0;
    if (on.has('multicam')) { cam = cam === 'a' ? 'b' : 'a'; frame.dataset.cam = cam; cams[cam].play().catch(() => {}); }
    const br = on.has('broll') && tick % 3 === 1; frame.classList.toggle('show-broll', br); if (br) cams.desk.play().catch(() => {});
    if (on.has('trans') && (on.has('multicam') || on.has('broll') || on.has('cut'))) { frame.classList.remove('flash'); void frame.offsetWidth; frame.classList.add('flash'); }
    if (on.has('jump') || on.has('zoom')) frame.classList.toggle('punch', tick % 2 === 1);
    if (on.has('sfx')) { sfxEl.textContent = ['whoosh', 'pop', 'ka-ching', 'riser'][tick % 4]; sfxEl.classList.remove('pop'); void sfxEl.offsetWidth; sfxEl.classList.add('pop'); }
    if (on.has('cc') || on.has('anim')) caption(on);
  };
  if (!still) { setInterval(beat, 2600); setInterval(() => { if (on.has('anim') && !compare) { word++; caption(on); } }, 380); }

  const toggle = (k, force) => {
    const want = force !== undefined ? force : !on.has(k);
    if (want) on.add(k); else on.delete(k);
    if (k === 'reframe' && want) on.add('short');
    if (k === 'short' && !want) on.delete('reframe');
    compare = false; $('pg-compare').setAttribute('aria-pressed', 'false');
    draw();
    const say = SAY[k]; status.textContent = want ? (typeof say === 'function' ? say() : say) : (OFF[k] || `${pg.querySelector(`[data-op="${k}"]`).textContent} removed.`);
  };
  pg.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.cat && b.getAttribute('role') === 'tab') {
      pg.querySelectorAll('.pg-cats [role=tab]').forEach((t) => t.setAttribute('aria-selected', t === b));
      pg.querySelectorAll('.pg-ops > div').forEach((d) => (d.hidden = d.dataset.cat !== b.dataset.cat));
    } else if (b.dataset.op) toggle(b.dataset.op);
    else if (b.dataset.lang) {
      lang = b.dataset.lang; pg.querySelectorAll('[data-lang]').forEach((x) => x.setAttribute('aria-checked', x === b));
      if (!on.has('cc') && !on.has('anim')) on.add('cc');
      draw(); status.textContent = SAY.cc();
    } else if (b.dataset.recipe) {
      on.clear(); b.dataset.recipe.split(' ').forEach((k) => on.add(k)); compare = false; $('pg-compare').setAttribute('aria-pressed', 'false'); draw();
      status.textContent = `Recipe "${b.textContent}": ${b.dataset.recipe.split(' ').map((k) => pg.querySelector(`[data-op="${k}"]`).textContent).join(', ')}.`;
    } else if (b.id === 'pg-compare') {
      compare = !compare; b.setAttribute('aria-pressed', compare); draw();
      status.textContent = compare ? 'Showing the raw clip. Click again to see your edit.' : 'Back to your edit.';
    } else if (b.id === 'pg-reset') {
      on.clear(); compare = false; lang = 'en'; cam = 'a'; $('pg-compare').setAttribute('aria-pressed', 'false');
      pg.querySelectorAll('[data-lang]').forEach((x) => x.setAttribute('aria-checked', x.dataset.lang === 'en'));
      draw(); status.textContent = 'Reset: back to the raw clip.';
    }
  });
  // arrow keys move between the group tabs
  pg.querySelector('.pg-cats').addEventListener('keydown', (e) => {
    if (!/Arrow(Left|Right)/.test(e.key)) return; const all = [...pg.querySelectorAll('.pg-cats [role=tab]')], i = all.indexOf(document.activeElement);
    const n = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]; n.focus(); n.click();
  });
  pg.querySelector('.pg-int').addEventListener('click', (e) => {
    const b = e.target.closest('[data-int]'); if (!b) return; level = +b.dataset.int;
    pg.querySelectorAll('[data-int]').forEach((x) => x.setAttribute('aria-checked', x === b)); draw();
    status.textContent = `Intensity: ${['Subtle (Light pace, fewer sounds, softer colour)', 'Normal (Medium pace)', 'Bold (Fast pace, more zoom, more sounds)'][level]}.`;
  });
  draw();

  // style library and recipes (features.js); "Load in preview" applies a recipe to the playground above
  const LABEL = { on: ['core', 'Available'], feasible: ['preset', 'Feasible addition'], road: ['soon', 'Roadmap'] };
  const sg = $('st-groups'), rg = $('rc-grid');
  if (sg && window.ES_STYLES) sg.innerHTML = window.ES_STYLES.map(([g, list]) => `<div class="st-g"><h3>${g}</h3><ul>${list.map(([n, line, st]) => `<li data-status="${st}"><b>${n}</b><span>${line}</span></li>`).join('')}</ul></div>`).join('');
  if (rg && window.ES_RECIPES) {
    rg.innerHTML = window.ES_RECIPES.map(([n, ops, result, auto, you], i) => `<article class="rc"><h4>${n}</h4><p>${result}</p><dl><dt>EditSutra does</dt><dd>${auto}</dd><dt>You choose</dt><dd>${you}</dd><dt>Tools</dt><dd>${ops.split(' ').map((k) => pg.querySelector(`[data-op="${k}"]`).textContent).join(' · ')}</dd></dl><p class="rc-meta">Premiere Pro only</p><button class="btn btn-ghost btn-sm" data-load="${i}">Load in preview</button></article>`).join('');
    rg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-load]'); if (!b) return; const r = window.ES_RECIPES[+b.dataset.load];
      const btn = [...pg.querySelectorAll('[data-recipe]')].find((x) => x.dataset.recipe === r[1]);
      if (btn) btn.click(); else { on.clear(); r[1].split(' ').forEach((k) => on.add(k)); draw(); status.textContent = `Recipe "${r[0]}" loaded.`; }
      pg.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
    });
  }
})();
