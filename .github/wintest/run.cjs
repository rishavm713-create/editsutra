// EditSutra on a clean Windows machine (GitHub Actions): after the real installer ran, every engine is used the way
// the panel uses it, seeing only what a buyer's PC has (EDITSUTRA_STRICT). Premiere itself is not on the runner.
const path = require('path'), fs = require('fs');
process.env.EDITSUTRA_STRICT = '1';
const PANEL = process.env.ES_PANEL, MEDIA = process.env.ES_MEDIA;
process.env.EDITSUTRA_PANEL = PANEL;
const e = require(path.join(PANEL, 'js', 'engine.js')), P = require(path.join(PANEL, 'js', 'platform.js'));
let failed = 0;
const check = (n, ok, d = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); };
const m = (f) => path.join(MEDIA, f);
const step = async (name, fn) => { const t = Date.now(); try { await fn(); } catch (x) { check(name, false, String(x && x.message || x).split('\n').slice(0, 3).join(' | ')); } console.log(`   (${name}: ${((Date.now() - t) / 1000).toFixed(0)}s)`); };
const quiet = () => {};

(async () => {
  for (const [k, f] of Object.entries(e.BIN)) check(`tool ${k} installed`, fs.existsSync(f), f);
  for (const t of ['sherpa-onnx-offline-source-separation', 'sherpa-onnx-offline-speaker-diarization']) check(`tool ${t} installed`, fs.existsSync(P.bin(t)), P.bin(t));
  check('Hinglish model installed', fs.existsSync(e.MODELS.hinglish), e.MODELS.hinglish);

  await step('Hinglish captions', async () => {
    const w = await e.transcribeMedia(m('hinglish40.wav'), 'hinglish', quiet);
    check('Hinglish captions', w.length > 40, `${w.length} words: ${w.slice(0, 8).map((x) => x.text).join(' ')}`);
  });
  await step('Language check', async () => {
    const l = await e.spokenLanguage(m('hinglish40.wav'));
    check('Hinglish speech recognised as Hindi/Hinglish', l === 'hi', l);
  });
  await step('English captions (Parakeet)', async () => {
    const w = await e.transcribeMedia(m('lab_en.wav'), 'english', console.log);
    check('English captions (Parakeet)', w.length > 30 && /friends/i.test(w.map((x) => x.text).join(' ')), `${w.length} words: ${w.slice(0, 8).map((x) => x.text).join(' ')}`);
  });
  await step('Hindi captions (IndicConformer)', async () => {
    const w = await e.transcribeMedia(m('lab_hi.wav'), 'hindi', console.log);
    check('Hindi captions (IndicConformer)', w.length > 20 && /[ऀ-ॿ]/.test(w.map((x) => x.text).join(' ')), `${w.length} words: ${w.slice(0, 6).map((x) => x.text).join(' ')}`);
  });
  await step('Remove background music', async () => {
    const r = await e.separateAudio(m('mix2.wav'), 0, 10, quiet);
    check('Remove background music', fs.existsSync(r.voice) && fs.statSync(r.voice).size > 100000 && fs.existsSync(r.music), `${(fs.statSync(r.voice).size / 1024).toFixed(0)} KB voice`);
  });
  await step('Speaker markers', async () => {
    const s = await e.speakers(m('two-speakers.mp4'), 0, quiet);
    check('Speaker markers', new Set(s.map((x) => x.speaker)).size === 2 && s.length >= 6, `${s.length} turns`);
  });
  await step('Beat markers', async () => {
    const b = await e.beats(m('music.wav'), 0, 30);
    check('Beat markers', Math.abs(b.bpm - 152) < 4 && b.beats.length > 50, `${b.bpm} BPM, ${b.beats.length} beats`);
  });
  await step('Black frames', async () => {
    const r = await e.blackFrames(m('two-speakers.mp4'));
    check('Black frames', r.length === 1 && Math.abs(r[0][0] - 6) < 0.2, JSON.stringify(r));
  });
  await step('Silences', async () => {
    const s = await e.adaptiveSilences(m('hinglish40.wav'), 'medium');
    check('Silence finder', Array.isArray(s) && s.length > 0, `${s.length} pauses`);
  });
  console.log(failed ? `\n${failed} check(s) failed` : '\nAll Windows checks passed');
  process.exit(failed ? 1 : 0);
})().catch((x) => { console.log('CRASH', x.stack); process.exit(2); });
