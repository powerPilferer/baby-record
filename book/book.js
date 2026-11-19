/* 기특일기 성장 앨범 — 펼친 책 (11-16 2판, 춘봉)
   펼침 한 면 = 하루. 왼쪽 쪽 = 사진, 오른쪽 쪽 = 날짜·일기. 오른쪽 쪽이 책등을 축으로 왼쪽으로 넘어간다.
   시안 전용 주소 옵션: ?d=2026-11-10  ?safe=59,34  ?case=nodiary|nophoto  ?orient=landscape  ?flip=0.45(음수=뒤로)  ?mo=1  ?open=1(표지 건너뛰기)  ?cv=0.6(여는 중간 고정)  ?cover=sky|butter|coral  ?name=이름  ?fam=5  ?statusbar=1(캡처 전용)  ?mark=star|sun|moon|heart|flower|cloud  ?persp=1500(넘김 원근, 칸) */
(() => {
'use strict';
const Q = new URLSearchParams(location.search);
const DATA = '../시안/돌앨범-1022/실데이터-1111/data.json';   // 로컬 전용 실데이터
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const WD = '일월화수목금토';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
let EMBED = false; try { EMBED = parent !== window && !!parent.document && !Q.get('local'); } catch (_) {}   // 앱 안(같은 출처 iframe)에서 열렸는지

if (Q.get('statusbar') && false) {   // 가로 고정 뒤로는 가짜 상태바를 그리지 않는다   // 캡처 전용 — 상태바 자리가 비어 보이지 않게 가짜 상태바를 그린다
  const se = innerHeight < 700, sb = document.createElement('div'); sb.className = 'fake-sb' + (se ? ' se' : ''); sb.setAttribute('aria-hidden', 'true');
  sb.innerHTML = `<span>9:41</span><i class="isl"></i><span class="ic"><svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 17 12"><path d="M8.5 2.3c2.4 0 4.6.9 6.3 2.5l1.1-1.2A10.6 10.6 0 0 0 8.5.6C5.700.6 3.100 1.700 1.100 3.600l1.100 1.200a9 9 0 0 1 6.300-2.500Zm0 3.700c1.400 0 2.700.5 3.700 1.500l1.100-1.200a7 7 0 0 0-9.600 0l1.100 1.200c1-1 2.300-1.500 3.700-1.500Zm0 3.600c-.8 0-1.500.3-2 .8l2 2.100 2-2.100c-.5-.5-1.200-.8-2-.8Z"/></svg><svg viewBox="0 0 27 12"><rect x=".5" y=".5" width="22" height="11" rx="3.200" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="19" height="8" rx="1.800"/><rect x="24" y="4" width="2" height="4" rx="1" opacity=".45"/></svg></span>`;
  document.body.appendChild(sb);
  if (!se) { const hb = document.createElement('i'); hb.className = 'fake-hb'; document.body.appendChild(hb); }
}
/* ── 가로 고정 (11-19 사장님: "앨범은 가로형으로 고정") ─────────────────────────────
   아이폰은 화면 방향을 잠글 수 없어서, 폰이 세로일 때는 화면 전체(body)를 시계 방향으로 90° 돌려 가로로 그린다 → 폰을 왼쪽으로 눕히면 바로 보인다(노치가 왼쪽, 홈 바가 오른쪽).
   폰이 실제로 가로면 돌리지 않는다. 돌린 동안에는 손가락 좌표와 요소 자리를 '보이는 방향' 기준으로 바꿔 준다 — 아래 넘기기·표지·누르기 코드는 좌표가 돌아간 줄 모르고 그대로 돈다. */
let ROT = false;
{ const gbr = Element.prototype.getBoundingClientRect, cx = Object.getOwnPropertyDescriptor(MouseEvent.prototype, 'clientX').get, cy = Object.getOwnPropertyDescriptor(MouseEvent.prototype, 'clientY').get;
  Element.prototype.getBoundingClientRect = function () { const r = gbr.call(this); return ROT ? new DOMRect(r.top, innerWidth - r.right, r.height, r.width) : r; };   // 보이는 방향의 x = 화면의 y, 보이는 방향의 y = 화면 폭 − x
  Object.defineProperty(MouseEvent.prototype, 'clientX', { get() { return ROT ? cy.call(this) : cx.call(this); }, configurable: true });
  Object.defineProperty(MouseEvent.prototype, 'clientY', { get() { return ROT ? innerWidth - cx.call(this) : cy.call(this); }, configurable: true }); }
function orient() {
  const de = document.documentElement; ROT = innerHeight > innerWidth; document.body.classList.toggle('rot', ROT);
  document.documentElement.classList.toggle('narrow', Math.max(innerWidth, innerHeight) < 700);   // 작은 폰(가로 700 미만): 우상단 단추와 책갈피 아기가 부딪히지 않게 책을 조금 더 내린다
  de.style.setProperty('--W', (ROT ? innerHeight : innerWidth) + 'px'); de.style.setProperty('--H', (ROT ? innerWidth : innerHeight) + 'px');
  // 안전영역(노치·홈 바): 화면 기준 네 변을 재서 보이는 방향으로 옮긴다. 앱 안(iframe)에서는 env() 가 0 일 수 있어 부모 창에서 잰다. ?safe=위,아래,왼,오른 은 시안 확인용
  let t = 0, r = 0, b = 0, l = 0;
  if (Q.get('safe')) { const v = Q.get('safe').split(',').map(Number); [t, b, l, r] = [v[0] || 0, v[1] || 0, v[2] || 0, v[3] || 0]; if (!ROT && innerWidth > innerHeight && !v[2] && !v[3]) [t, b, l, r] = [0, 21, v[0] || 0, v[0] || 0]; }   // 가로 화면에 세로 값만 주면 노치는 좌우로
  else try { const w = EMBED ? parent : window, pr = w.document.createElement('div'); pr.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;width:0;height:0;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    w.document.body.appendChild(pr); const c = w.getComputedStyle(pr); [t, r, b, l] = [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft].map(parseFloat); pr.remove(); } catch (_) {}
  const [T, R, B, L] = ROT ? [l, b, r, t] : [t, r, b, l];   // 돌린 화면: 왼쪽 = 폰 위(노치), 오른쪽 = 폰 아래(홈 바)
  de.style.setProperty('--sat', T + 'px'); de.style.setProperty('--sar', R + 'px'); de.style.setProperty('--sab', B + 'px'); de.style.setProperty('--sal', L + 'px');
}
orient();

/* ── 낙서: 날짜로 정해지는 규칙 ───────────────────────────── */
const AR = { diaper: [185, 122], 'pillow-zzz': [173, 149], notebook: [161, 177], checkup: [151, 131],   /* 11-18 숫자 장 항목 그림(신화방) */
  bear: [160, 200], bottle: [88, 204], 'cloud-1': [220, 120], 'cloud-2': [150, 100], 'cloud-3': [240, 90], duck: [180, 150], 'flower-blossom': [130, 130], 'flower-daisy': [130, 200], 'flower-lavender': [90, 200], grass: [200, 90], heart: [140, 130], moon: [132, 139], rainbow: [220, 130], rattle: [140, 200], socks: [180, 170], sprout: [130, 140], star: [170, 150], sun: [180, 180] };
const TAPES = ['tape-check', 'tape-stripe', 'tape-plain', 'tape-dot'];
const SKY = ['sun', 'cloud-1', 'cloud-2', 'moon', 'star', 'rainbow', 'cloud-3'];
const SMALL = ['heart', 'star', 'cloud-2', 'flower-blossom', 'socks', 'bottle', 'rattle', 'sun', 'moon'];
const FRIEND = ['bear', 'duck', 'rattle', 'bear', 'socks', 'bottle', 'sprout'];   // 곰은 고정이 아니라 날마다 뽑히는 친구 중 하나 (11-16 사장님)
const EMOJI = { '🍼': 'bottle', '🛁': 'duck', '👶': 'rattle', '🎉': 'rainbow', '💉': 'heart', '🏥': 'heart', '😭': 'cloud-2', '🙃': 'sun', '💩': 'sprout' };   // 그날 붙인 스티커 → 낙서

const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

function compose(p) {
  const r = rng(hash('book:' + p.day)), used = new Set();
  const take = pool => { const c = pool.filter(n => !used.has(n)); const n = c[Math.floor(r() * c.length)] || pool[0]; used.add(n); return n; };
  const fromSticker = (p.sticker || '').split('|').map(e => EMOJI[e]).filter(Boolean);
  const c = {};
  c.rot = (r() * 3.6 - 1.8).toFixed(2);
  c.tape = TAPES[Math.floor(r() * 4)];
  c.tapePos = ['tl', 'tl', 'tr', 'tc'][Math.floor(r() * 4)];
  c.tape2 = r() < .38 ? TAPES[(TAPES.indexOf(c.tape) + 1 + Math.floor(r() * 3)) % 4] : null;
  c.tape2Pos = c.tapePos === 'tr' ? 'bl' : 'br';
  c.hero = fromSticker[0] || take(['sun', 'rainbow', 'duck', 'moon', 'star']);   // 사진 없는 날 그림 자리
  used.add(c.hero);
  c.mark = Q.get('mark') || (MS[p.n] ? 'heart' : ['star', 'sun', 'moon', 'flower', 'cloud'][Math.floor(r() * 5)]);   // 날수 오른쪽 위 작은 낙서(작은 크기 전용 그림 mini-*) — 기념일은 하트로 고정
  c.sky = take(SKY);
  c.sky2 = take(['cloud-2', 'star', 'cloud-1', 'sun', 'moon']);
  const row = fromSticker.filter(n => !used.has(n) && p.photo).slice(0, 1); row.forEach(n => used.add(n));
  if (!row.length) row.push(take(SMALL));                                   // 날짜 줄 오른쪽 낙서는 하나만 — 날수 옆 낙서와 몰리지 않게
  c.row = row;
  c.flower = take(['flower-daisy', 'flower-lavender', 'flower-blossom']);
  c.lmid = r() < .6 ? take(['sprout', 'flower-lavender', 'flower-daisy', 'heart']) : null;
  c.rmid = r() < .5 ? take(['duck', 'sprout', 'socks', 'rattle', 'flower-blossom']) : null;
  c.friend = take(FRIEND);
  c.tilt = () => (r() * 12 - 6).toFixed(1);
  return c;
}
// 크기는 책 안의 칸(--u) 단위 — 책이 줄면 낙서도 같이 준다
const dd = (name, h, rot = 0) => { const [w, hh] = AR[name]; return `<img class="dd" src="doodles/${name}.svg" alt="" width="${Math.round(h * w / hh)}" height="${Math.round(h)}" style="width:calc(${(h * w / hh).toFixed(1)} * var(--u))${rot ? `;transform:rotate(${rot}deg)` : ''}">`; };

/* ── 데이터 ───────────────────────────── */
let baby, pages = [], idx = 0, ND = 0;                  // pages = 일기 장(앞 ND개, 하루 한 펼침) + 덤 장(사진첩·숫자·성장)
const dayNo = d => Math.floor((new Date(d + 'T00:00') - new Date(baby.birth_date + 'T00:00')) / 86400000) + 1;
const MS = { 50: 1, 100: 1, 200: 1, 300: 1 };
const SAMPLE = ['01', 'm1', '12', '01', 'm1'];
const SAMPLE_BG = ['#f3d9c4', '#d9e6f2', '#e5ecd2', '#f2e2b8', '#ecd8e4'];
function model(d) {
  const h = hash('photo:' + d.day), dt = new Date(d.day + 'T00:00');
  return {
    day: d.day, diary: (d.diary || '').replace(/\s+$/, ''), sticker: d.sticker || '',
    photo: !!d.photo,
    url: d.url || '', thumb: d.thumb || d.url || '',                                    // 앱에서 넘겨받은 사진 주소(서명). 없으면 로컬 시안 — 샘플 그림으로 채운다
    orient: d.url ? 'portrait' : (h % 10 < 3 ? 'landscape' : 'portrait'),   // 실제 사진은 받아 본 뒤 가로·세로를 읽어 고친다
    sample: `../img/아기-단계-${SAMPLE[h % 5]}.webp`, sampleBg: SAMPLE_BG[(h >>> 4) % 5],
    n: dayNo(d.day), label: `${dt.getMonth() + 1}. ${dt.getDate()}. (${WD[dt.getDay()]})`, m: d.day.slice(0, 7),
  };
}

/* 가족·댓글 — 앱에 붙으면 부모 창이 넘겨 준다(bookStart). 혼자 열면(로컬 시안) 메모리에서 흉내 */
const CH = { mom: { name: '엄마', img: '../img/엄마-2g-b.png' }, dad: { name: '아빠', img: '../img/아빠-2g-b.png' } };
const COMMENTS = false;                                  // 가족 댓글 켜고 끄기 (11-19 사장님: 책에서 댓글은 뺀다). true 로 바꾸면 댓글 목록·입력·지우기가 그대로 돌아온다. 꺼 둔 동안은 서버(baby_comments)를 부르지 않는다
let members = [], ME = '', API = null, cmOk = true;      // members: [{ id, name, img }] · cmOk=false 면 댓글 준비 중(서버 표 없음)
const who = id => members.find(m => m.id === id) || { name: '가족', img: CH.dad.img };
const comments = {};                                     // day → [{ id, user_id, text, created_at }]
const cmTime = c => { const d = new Date(c.created_at); if (isNaN(d)) return ''; const h = d.getHours(); return `${d.getMonth() + 1}. ${d.getDate()}. ${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`; };
function localApi() {                                    // 로컬 시안용 — 새로 고치면 사라진다
  const rows = [], at = (day, h, m) => `${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`, mom = (members.find(m => m.img === CH.mom.img) || members[0]).id, dad = ME;
  const last = pages[ND - 1].day, d50 = pages.find(p => p.n === 50); let k = 0;
  const add = (day, user_id, text, h, m) => rows.push({ id: 'l' + (++k), day, user_id, text, created_at: at(day, h, m) });
  add(last, mom, '오늘 표정 진짜 최고였어. 자꾸 다시 보게 돼', 21, 12); add(last, dad, '퇴근하고 여기부터 펼쳐 봤어. 내일 목욕은 아빠가!', 22, 40); add(last, mom, '약속했다 ♥', 22, 43);
  if (d50) { add(d50.day, dad, '벌써 50일이라니. 우리 셋 다 고생 많았어', 8, 5); add(d50.day, mom, '100일엔 더 크게 웃어 주기!', 8, 31); }
  return { list: async () => rows.slice(), add: async (day, text) => { const r = { id: 'l' + (++k), day, user_id: ME, text, created_at: new Date().toISOString() }; rows.push(r); return r; }, del: async id => { const i = rows.findIndex(r => r.id === id); if (i >= 0) rows.splice(i, 1); } };
}
async function loadComments() {
  for (const k of Object.keys(comments)) delete comments[k];
  try { const rows = await API.list(); cmOk = true; for (const r of rows || []) (comments[r.day] = comments[r.day] || []).push(r); }
  catch (_) { cmOk = false; }                            // 표가 아직 없거나 통신이 안 될 때 — 책은 그대로, 댓글만 '준비 중'
}

/* ── 하루 = 왼쪽 쪽 + 오른쪽 쪽 ───────────────────────────── */
function build(p) {
  if (p.kind) return buildExtra(p);                       // 덤 장 쪽은 아래 '덤 장' 절에서 그린다
  const c = compose(p), L = document.createElement('article'), R = document.createElement('article');
  L.className = 'pg L' + (p.photo ? '' : ' nophoto'); R.className = 'pg R';
  L.setAttribute('aria-label', `${p.label} 사진 쪽`); R.setAttribute('aria-label', `${p.label} ${p.n}일 일기 쪽`);
  const a = dd(c.sky, AR[c.sky][0] > AR[c.sky][1] * 1.5 ? 17 : 22, c.tilt()), b = dd(c.sky2, 16, c.tilt());
  let mid;
  if (p.photo) {
    const ph = p.url ? `<span class="ph" data-slot="photo"><img src="${esc(p.url)}" alt="${p.label} 사진" draggable="false" decoding="async"></span>`
      : `<span class="ph" style="background:${p.sampleBg}" data-slot="photo"><img src="${p.sample}" alt="${p.label} 사진" draggable="false"><small>샘플</small></span>`;
    const tapes = `<img class="tape ${c.tapePos}" src="doodles/${c.tape}.svg" alt="">${c.tape2 ? `<img class="tape ${c.tape2Pos}" src="doodles/${c.tape2}.svg" alt="">` : ''}`;
    mid = `<figure class="frame ${p.orient}" style="--rot:${c.rot}deg">${ph}${tapes}</figure>`;
  } else mid = `<div class="scene">${dd(c.hero, c.hero === 'rainbow' || c.hero === 'cloud-2' ? 78 : 108, c.tilt())}</div>`;
  L.innerHTML = `<div class="band ${p.photo ? c.tapePos : ''}">${c.tapePos === 'tr' ? a + b : b + a}</div><div class="slot">${mid}</div>
    <div class="ground"><div class="g">${dd('grass', 26)}${dd(c.flower, c.flower === 'flower-blossom' ? 24 : 40)}</div>${c.lmid ? dd(c.lmid, c.lmid === 'heart' ? 20 : c.lmid === 'sprout' ? 26 : 34) : ''}</div>`;
  R.innerHTML = `<p class="date">${p.label}</p>
    <div class="crow"><div class="dn"><b>${p.n}일</b><img class="dd" src="doodles/mini-${c.mark}.svg" alt="" width="15" height="15" style="transform:rotate(${c.tilt()}deg)"></div><div class="wr">${c.row.map(n => dd(n, 24, c.tilt())).join('')}</div></div>
    <div class="diary"><span>${esc(p.diary)}</span></div>
    <div class="ground">${c.rmid ? dd(c.rmid, 22) : ''}${dd(c.friend, c.friend === 'bear' ? 31 : 27)}</div>`;
  if (p.photo && p.url) {                                 // 실제 사진: 받아 보고 가로·세로 그대로 (세로 4:5 · 가로 5:4)
    const im = L.querySelector('.ph img'), fit = () => { if (im.naturalWidth > im.naturalHeight) { p.orient = 'landscape'; const f = L.querySelector('.frame'); f.classList.remove('portrait'); f.classList.add('landscape'); } };
    if (im.complete && im.naturalWidth) fit(); else im.addEventListener('load', fit, { once: true });
    im.addEventListener('error', () => { im.style.visibility = 'hidden'; }, { once: true });   // 주소가 끊겨도 깨진 그림 표시 대신 빈 사진 자리
  }
  return { L, R };
}
const cache = new Map();
function pg(i) {
  if (!cache.has(i)) { cache.set(i, build(pages[i])); if (cache.size > 10) { for (const k of cache.keys()) { if (Math.abs(k - idx) > 3) { cache.delete(k); break; } } } }
  return cache.get(i);
}

/* ── 넘기기 (11-17 모선 — 레퍼6 "정직하게") ─────────────────────────────
   넘어가는 종이 한 장 = 앞면(앞 날의 오른쪽 쪽) + 뒷면(뒷 날의 왼쪽 쪽). t = 0(앞 날) ~ 1(뒷 날), 각도 φ = t × 180°.
   판판한 종이가 책등을 축으로 돈다(말림 없음). 원근은 .book perspective, 그늘은 각도에서 바로 계산한다:
   · 면 그늘 = 왼쪽 앞에서 오는 빛과 종이 면이 이루는 각(램버트)  · 바닥 그늘 = 들린 종이가 아래 쪽에 떨어뜨리는 그림자(폭·농도 = 각도)
   움직임 언어 하나: 탭은 천천히 들렸다가 빨리 넘고 길게 내려앉는 곡선(레퍼 실측: 90°까지 40%), 손을 떼면 그 속도에서 출발해 같은 꼬리로 내려앉는다. 튕김 없음. */
const book = $('book'), hl = $('hl'), hr = $('hr'), sheet = $('sheet'), front = $('front'), back = $('back');
const mk = c => { const e = document.createElement('i'); e.className = c; e.setAttribute('aria-hidden', 'true'); return e; };
const SH = { f: mk('msh mf'), b: mk('msh mb'), r: mk('mcast mr'), l: mk('mcast ml') };   // 면 그늘 2 · 바닥 그늘 2 — opacity·transform 만 바꾼다(레이아웃 없음)
const PERSP = +Q.get('persp') || 1500;                         // 원근 = 칸 단위(쪽 폭의 약 8배). 레퍼는 6~7배 — 더 세면 넘어가는 쪽이 위 타이틀·아래 줄을 많이 덮는다
book.style.perspective = `calc(${PERSP} * var(--u))`; book.style.perspectiveOrigin = '50% 48%';
const LA = 25 * Math.PI / 180, CA = Math.cos(LA);              // 빛: 왼쪽 앞 25°
const TURN_MS = 540, LAND_MS = [220, 460];                     // 탭 한 장 · 놓은 뒤 정착 범위
const bez = (x1, y1, x2, y2) => x => { if (x <= 0) return 0; if (x >= 1) return 1; let lo = 0, hi = 1, u = x; for (let i = 0; i < 22; i++) { u = (lo + hi) / 2; const X = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u; if (X < x) lo = u; else hi = u; } return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u; };
const TURN_EZ = bez(.5, 0, .25, 1);                            // 레퍼6 넘김: 들림(느림) → 90°에서 가장 빠름(40%) → 긴 착지
let tr = null, t = 0, v = 0, anim = 0, drag = null, pend = 0;
function rest() {
  const d = pg(idx); hl.replaceChildren(d.L, SH.l); hr.replaceChildren(d.R, SH.r); front.replaceChildren(); back.replaceChildren();
  sheet.hidden = true; book.classList.remove('turning'); for (const k in SH) { SH[k].style.opacity = 0; } tr = null; v = 0;
  if (idx > 0) pg(idx - 1); if (idx < pages.length - 1) pg(idx + 1);        // 이웃 날 미리 그려 둠
  sync();
}
function setup(a, b, t0) {
  tr = { a, b }; t = t0;
  hl.replaceChildren(pg(a).L, SH.l); hr.replaceChildren(pg(b).R, SH.r); front.replaceChildren(pg(a).R, SH.f); back.replaceChildren(pg(b).L, SH.b);
  sheet.hidden = false; book.classList.add('turning'); apply();
}
const cl = x => Math.max(0, Math.min(1, x));
function shade(phi) {                                          // φ(라디안) → [앞면, 뒷면, 오른쪽 바닥(폭, 농도), 왼쪽 바닥(폭, 농도)]
  const s = Math.sin(phi), c = Math.cos(phi);
  const f = cl(1 - Math.cos(phi - LA) / CA), bk = cl(1 + Math.cos(phi - LA) / CA);   // 쉬던 쪽과 같은 밝기 = 0
  const rw = cl(c + .26 * s), lw = cl(-c + .14 * s);          // 그림자 끝 = 종이 끝의 바닥 위치 + 빛 각도만큼 더
  const soft = 1 - .45 * s;                                    // 높이 들릴수록 흐리고 옅다
  return [f * .42, bk * .36, rw, rw > 0 ? Math.min(1, s * 3.2) * soft : 0, lw, lw > 0 ? Math.min(1, s * 3.2) * soft : 0];
}
function apply() {
  const phi = t * Math.PI, [f, bk, rw, ro, lw, lo] = shade(phi);
  sheet.style.transform = `rotateY(${(-t * 180).toFixed(3)}deg)`;
  SH.f.style.opacity = f.toFixed(3); SH.b.style.opacity = bk.toFixed(3);
  SH.r.style.opacity = ro.toFixed(3); SH.r.style.transform = `scaleX(${rw.toFixed(4)})`;
  SH.l.style.opacity = lo.toFixed(3); SH.l.style.transform = `scaleX(${lw.toFixed(4)})`;
}
// t0 → T. m0 = 출발 속도(t/초). 탭(m0 = 0, 한 장 전체)은 TURN_EZ, 나머지는 속도를 이어받는 3차 에르미트(끝 기울기 0 = 같은 착지 꼬리).
function settle(T, m0 = 0, tap = false) {
  cancelAnimationFrame(anim);
  if (REDUCED) return done(T);
  const t0 = t, D = T - t0, dir = Math.sign(D) || 1;
  let ms, ez;
  if (tap) { ms = TURN_MS * Math.max(.45, Math.abs(D)); ez = TURN_EZ; }
  else {
    const sp = Math.max(0, m0 * dir);                          // 반대로 가는 속도는 버린다(되튐 방지)
    ms = sp > .05 ? Math.min(LAND_MS[1], Math.max(LAND_MS[0], 3 * Math.abs(D) / sp * 1000)) : LAND_MS[1] * Math.max(.7, Math.sqrt(Math.abs(D)));
    const k = Math.min(3, sp * ms / 1000 / Math.max(1e-4, Math.abs(D)));   // 정규화된 출발 기울기 — 3 넘으면 넘침이 생기므로 묶는다
    ez = u => { const a = k - 2, b = 3 - 2 * k; return k * u + b * u * u + a * u * u * u; };   // p(0)=0 p(1)=1 p'(0)=k p'(1)=0
    if (!tap && sp <= .05) ez = bez(.33, 0, .25, 1);           // 거의 멈춰서 놓으면 살짝 들렸다 내려앉는 곡선
  }
  const st = performance.now();
  const step = now => {
    const u = Math.min(1, (now - st) / ms); t = t0 + D * ez(u);
    if (u >= 1) return done(T);
    apply(); anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}
function done(T) { anim = 0; idx = T === 1 ? tr.b : tr.a; rest(); if (pend) { const d = pend; pend = 0; requestAnimationFrame(() => go(d)); } }
function jump(j) {
  if (anim || drag || cdrag || j === idx || j < 0 || j >= pages.length) return;
  if (Math.abs(j - idx) > 1) return flurry(j);                   // 멀리 갈 때는 촤라락
  v = 0; if (j > idx) { setup(idx, j, 0); settle(1, 0, true); } else { setup(j, idx, 1); settle(0, 0, true); }
}

/* ── 촤라락 (11-18 사장님: "한번에 멀리 이동할때는 책이 촤라락 넘어갔으면") ─────────────────────────────
   건너뛰는 쪽 수에 따라 2~7장이 겹쳐 넘어간다. 첫 장 = 지금 보이던 쪽(진짜), 마지막 장 = 도착 쪽(진짜), 사이 장은 흐린 줄 종이(가벼운 빈 쪽).
   장마다 같은 판판한 회전·같은 그늘 식. 사이 장은 빠른 날갯짓 곡선, 마지막 장만 한 장 넘김과 같은 TURN_EZ 540ms 로 내려앉는다. 전체 0.8~1.15초.
   쌓임: 출발 쪽에 누운 동안은 먼저 넘어갈 장이 위, 도착 쪽에 누우면 나중에 온 장이 위. 넘어가는 동안 끌기·책갈피·단추는 anim 으로 막힌다. */
const FL = [];                                                  // 사이 장 풀(처음 필요할 때 만든다)
const blank = side => { const e = document.createElement('article'); e.className = 'pg fl ' + side; e.setAttribute('aria-hidden', 'true'); return e; };
function flSheet(k) {
  if (!FL[k]) {
    const s = document.createElement('div'); s.className = 'sheet fls'; s.hidden = true; s.setAttribute('aria-hidden', 'true');
    const f = document.createElement('div'), b = document.createElement('div'); f.className = 'face front'; b.className = 'face back';
    const sf = mk('msh mf'), sb = mk('msh mb'), pf = blank('R'), pb = blank('L'); f.append(pf, sf); b.append(pb, sb); s.append(f, b);
    book.insertBefore(s, book.querySelector('.spine'));
    FL[k] = { s, f, b, sf, sb, pf, pb };
  }
  return FL[k];
}
const FLAP_EZ = bez(.42, 0, .3, 1), FLAP_MS = 400;              // 사이 장: 들림이 짧고 빨리 넘어가는 날갯짓
function flurry(j) {
  const fwd = j > idx, a = idx, dist = Math.abs(j - a);
  if (REDUCED) { idx = j; return rest(); }
  const n = Math.min(7, 1 + Math.ceil(Math.log2(dist)));        // 2쪽 → 2장, 3~4 → 3, 5~8 → 4, 9~16 → 5, 17~32 → 6, 33~ → 7
  const T = Math.min(1150, 800 + (n - 2) * 70), gap = (T - TURN_MS) / (n - 1);
  // 바닥: 앞으로면 왼쪽 = 지금 날, 오른쪽 = 도착 날 / 뒤로면 반대
  const A = pg(a), J = pg(j);
  hl.replaceChildren((fwd ? A : J).L, SH.l); hr.replaceChildren((fwd ? J : A).R, SH.r);
  // 장 0 = 진짜 sheet(지금 보이던 쪽 + 빈 뒷면), 장 n-1 = 도착 쪽을 품은 장
  const bl0 = flSheet(7).pb, br0 = flSheet(7).pf;                // 진짜 sheet 의 빈 면은 풀 8번째 장의 빈 쪽을 빌린다
  if (fwd) { front.replaceChildren(A.R, SH.f); back.replaceChildren(bl0, SH.b); } else { front.replaceChildren(br0, SH.f); back.replaceChildren(A.L, SH.b); }
  const L = [{ s: sheet, sf: SH.f, sb: SH.b }];
  for (let k = 1; k < n; k++) { const q = flSheet(k - 1); q.f.replaceChildren(q.pf, q.sf); q.b.replaceChildren(q.pb, q.sb); L.push(q); }
  const last = L[n - 1];
  if (fwd) last.b.replaceChildren(J.L, last.sb); else last.f.replaceChildren(J.R, last.sf);
  L.forEach((q, k) => { q.s.hidden = false; q.st = k * gap; q.d = k === n - 1 ? TURN_MS : FLAP_MS; q.ez = k === n - 1 ? TURN_EZ : FLAP_EZ; });
  tr = { a: Math.min(a, j), b: Math.max(a, j), fl: L }; book.classList.add('turning', 'flurry');
  const T0 = fwd ? 0 : 1, T1 = fwd ? 1 : 0;
  const draw = ms => {
    let first = null, lastT = null;
    L.forEach((q, k) => {
      const u = cl((ms - q.st) / q.d), tt = T0 + (T1 - T0) * q.ez(u), [f, bk] = shade(tt * Math.PI);
      q.s.style.transform = `rotateY(${(-tt * 180).toFixed(3)}deg)`;
      q.s.style.zIndex = ((fwd ? tt < .5 : tt > .5) ? 20 - k : 20 + k);   // 출발 쪽에선 먼저 갈 장이 위, 도착 쪽에선 나중 온 장이 위
      const g = k && k < n - 1 ? 1.7 : 1;                         // 사이 장은 그늘을 조금 더 — 빈 종이끼리 겹쳐도 장마다 갈려 보이게
      q.sf.style.opacity = Math.min(.8, f * g).toFixed(3); q.sb.style.opacity = Math.min(.8, bk * g).toFixed(3);
      if (k === 0) first = tt; if (k === n - 1) lastT = tt;
    });
    const sf = shade(first * Math.PI), sl = shade(lastT * Math.PI);   // 출발 쪽 바닥 = 첫 장의 그림자, 도착 쪽 바닥 = 마지막 장의 그림자
    const [rw, ro, lw, lo] = fwd ? [sl[2], sl[3], sf[4], sf[5]] : [sf[2], sf[3], sl[4], sl[5]];
    SH.r.style.opacity = ro.toFixed(3); SH.r.style.transform = `scaleX(${rw.toFixed(4)})`;
    SH.l.style.opacity = lo.toFixed(3); SH.l.style.transform = `scaleX(${lw.toFixed(4)})`;
  };
  draw(0);
  const st = performance.now();
  const step = now => {
    const ms = now - st;
    if (ms >= T) { flEnd(); idx = j; return rest(); }
    draw(ms); anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}
function flEnd() {
  anim = 0; book.classList.remove('flurry');
  FL.forEach(q => { q.s.hidden = true; q.s.style.transform = ''; q.s.style.zIndex = ''; q.f.replaceChildren(q.pf, q.sf); q.b.replaceChildren(q.pb, q.sb); });
  sheet.style.zIndex = '';
}
const go = dir => { if (anim) { pend = dir; return; } if (dir < 0 && idx === 0) return closeBook(); jump(idx + dir); };   // 넘기는 중 한 번 더 누르면 이어서 한 장

// 손가락: 잡은 점이 손가락 아래에 머문다. 잡은 점의 바닥 위치 = 책등 + r·cosφ → φ = acos. 양 끝(기울기 무한)은 선형과 섞어 떨림을 없앤다.
const fingerT = (dx, d) => {
  const c0 = d.fwd ? 1 : -1, c = Math.max(-1, Math.min(1, c0 + dx / d.r));
  const ac = Math.acos(c) / Math.PI, ln = (1 - c) / 2, w = cl(Math.min(ln, 1 - ln) / .12);
  return ac * w + ln * (1 - w);
};
book.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  const b = book.getBoundingClientRect(), S = b.left + b.width / 2, pw = b.width / 2;
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, t0: e.timeStamp, on: false, S, pw, s: [], act: e.target.closest && e.target.closest('[data-go], [data-day]') };
});
book.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.on) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    if (anim || Math.abs(dx) < Math.abs(dy) * 1.3) { drag = null; return; }                          // 넘어가는 중에는 탭(이어 넘기기)만 받는다
    const fwd = dx < 0;
    if (!fwd && idx <= 0) { const d = drag; drag = null; if (!closed && !canim) { try { book.setPointerCapture(e.pointerId); } catch (_) {} coverGrab(d, e); } return; }   // 첫 날에서 더 뒤로 끌면 표지가 손가락을 따라 덮인다
    if (fwd && idx >= pages.length - 1) { drag = null; return; }                                   // 끝 날 뒤에는 넘길 종이가 없다
    drag.on = true; drag.fwd = fwd; try { book.setPointerCapture(e.pointerId); } catch (_) {}
    drag.r = Math.max(drag.pw * .55, Math.min(drag.pw, Math.abs(drag.x0 - drag.S)));               // 책등 가까이 잡아도 너무 예민하지 않게
    if (fwd) setup(idx, idx + 1, 0); else setup(idx - 1, idx, 1);
  }
  t = fingerT(dx, drag);
  drag.s.push([e.timeStamp, t]); while (drag.s.length > 2 && e.timeStamp - drag.s[0][0] > 90) drag.s.shift();
  apply();
});
const release = e => {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  if (!d.on) {                                                   // 끌지 않고 뗀 것(탭)
    if (e.type === 'pointerup' && e.timeStamp - d.t0 < 400 && Math.abs(e.clientX - d.x0) < 8 && d.act) pageAct(d.act);   // 쪽 안의 단추(달 타일·사진·기념일)만 눌린다. 쪽을 눌러 넘기는 건 뺐다 — 책장은 끌어서만 넘긴다 (11-17 사장님)
    return;
  }
  const a = d.s[0], b = d.s[d.s.length - 1];
  v = a && b && b[0] > a[0] && e.timeStamp - b[0] < 80 ? (b[1] - a[1]) / (b[0] - a[0]) * 1000 : 0; v = Math.max(-6, Math.min(6, v));   // 멈췄다 놓으면(80ms 넘게 안 움직임) 속도 0
  const proj = t + v * .16;
  settle(d.fwd ? (proj > .4 ? 1 : 0) : (proj < .6 ? 0 : 1), v);
};
book.addEventListener('pointerup', release); book.addEventListener('pointercancel', release);
addEventListener('keydown', e => { if (closed) return; if (openEl) { if (e.key === 'Escape') closeSheet(); return; } if (e.target.tagName === 'INPUT') return; if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });

/* ── 책 아래: 이어 읽기 + 가족 댓글 ───────────────────────────── */
let shown = -1;
function sync() {
  const p = pages[idx];
  if (false) $('under').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'cubic-bezier(.16, 1, .3, 1)' });   // 넘김이 내려앉으면 아래 글·댓글은 갈아 끼우며 살짝 차오른다(툭 바뀜 방지)
  shown = idx;
  const ch = chOf(idx), ex = !!p.kind;
  $('btn-month').style.visibility = ex ? 'hidden' : ''; if (!ex) $('lb-month').textContent = +p.m.slice(5) + '월';
  if (ex) { const a = CHS[ch].at, n = CHS[ch].n; $('folio').textContent = `${CHS[ch].name}${n > 1 ? ` ${idx - a + 1} / ${n}` : ''}`; $('folio').removeAttribute('aria-label'); }
  else { $('folio').textContent = `${idx + 1} / ${ND}`; $('folio').setAttribute('aria-label', `${ND}일 가운데 ${idx + 1}번째 날`); }
  $('btn-today').classList.toggle('gone', idx === ND - 1);
  $('nav-next').disabled = idx >= pages.length - 1; $('nav-prev').setAttribute('aria-label', idx === 0 ? '표지 덮기' : '앞 날');   // 맨 끝에서는 다음 화살표가 흐려지고, 첫 날의 앞 화살표는 표지를 덮는다
  document.querySelectorAll('#bm-list button, #tabs button').forEach(b => { const on = b.dataset.ch === ch; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'true' : 'false'); });
  drawUnder(true);
}
// 댓글을 꺼 둔 동안: 책 아래 전체가 그날의 공책 한 장. 머리 = 날짜 + 그날 기록 한 줄, 그 아래 괘선 위에 일기 전문(책 쪽 일곱 줄에 다 못 담은 날만 — 짧은 날은 책에 다 있으니 되풀이하지 않고 빈 괘선으로 둔다)
let dayStat = {};
function dayStats(logs) {       // 날짜 → '수유 8번 · 잠 14시간 · 기저귀 7장'
  const by = {}, at = l => (by[lday(l.at)] = by[lday(l.at)] || { f: 0, d: 0, s: 0 });
  for (const l of logs) { if (l.kind === 'feed') at(l).f++; else if (l.kind === 'diaper') at(l).d++; else if (l.kind === 'sleep' && l.ended_at) { const h = (new Date(l.ended_at) - new Date(l.at)) / 36e5; if (h > 0 && h < 14) at(l).s += h; } }
  const out = {}; for (const k in by) { const x = by[k], a = []; if (x.f) a.push(`수유 ${x.f}번`); if (x.s >= .5) a.push(`잠 ${Math.round(x.s)}시간`); if (x.d) a.push(`기저귀 ${x.d}장`); if (a.length) out[k] = a.join(' · '); }
  return out;
}
function drawNote(top) {
  const p = pages[idx]; let head, sub = '', body = '';
  if (p.kind) { head = esc(p.title); body = esc(p.note); }
  else { const sp = pg(idx).R.querySelector('.diary span'), cut = sp.scrollHeight > sp.clientHeight + 2 || Q.get('short') === 'full';   // ?short=full = 짧은 날도 전문을 되풀이해 보는 비교용
    head = `${p.label} · ${p.n}일`; sub = dayStat[p.day] || ''; body = cut ? esc(p.diary) : ''; }
  $('under').innerHTML = `<section class="np"><h3>${head}${sub ? `<small>${sub}</small>` : ''}</h3><p>${body}</p></section>`;
  if (top) $('under').scrollTop = 0;
}
function drawUnder(top) {
  if (!COMMENTS) return markMore();          // 11-19 가로 고정: 책 아래 영역은 없앴다. 긴 일기는 쪽 끝 '더보기' → 오른쪽에서 열리는 종이
  if (pages[idx].kind) { $('under').innerHTML = `<section class="cms solo xnote"><h3>${esc(pages[idx].title)}</h3><p>${esc(pages[idx].note)}</p></section>`; $('cm-form').hidden = true; if (top) $('under').scrollTop = 0; return; }
  $('cm-form').hidden = false;
  const p = pages[idx], list = comments[p.day] || [], sp = pg(idx).R.querySelector('.diary span');
  const cut = sp.scrollHeight > sp.clientHeight + 2;       // 오른쪽 쪽 일곱 줄에 다 안 들어간 날만 아래에서 이어 읽는다
  const item = c => { const w = who(c.user_id), mine = c.user_id === ME; return `<li data-id="${esc(c.id)}"><img src="${esc(w.img)}" alt=""><div class="bub"><p class="who">${esc(w.name)}<time>${cmTime(c)}</time>${mine ? '<button type="button" class="more" aria-label="내 댓글 메뉴">⋯</button>' : ''}</p><p class="tx">${esc(c.text)}</p></div></li>`; };
  $('under').innerHTML = (cut ? `<section class="full"><h3>${p.label} 일기<small>책에 다 못 담은 글</small></h3><p>${esc(p.diary)}</p></section>` : '')
    + `<section class="cms${cut ? '' : ' solo'}"><h3>가족 댓글${list.length ? `<em>${list.length}</em>` : ''}<small>초대된 가족만 보고 써요</small></h3><ol class="cm-list">${!cmOk
      ? `<li class="empty"><img src="doodles/sprout.svg" alt="">댓글은 준비 중이에요. 곧 열려요.</li>`
      : list.length ? list.map(item).join('')
      : `<li class="empty"><img src="doodles/heart.svg" alt="">아직 댓글이 없어요. 첫 한마디를 남겨 보세요.</li>`}</ol></section>`;
  $('cm-form').classList.toggle('off', !cmOk); $('cm-input').disabled = !cmOk; if (!cmOk) $('cm-send').disabled = true;
  if (top) $('under').scrollTop = 0;
}
$('cm-input').addEventListener('input', e => { $('cm-send').disabled = !e.target.value.trim(); });
let cmBusy = false;
$('cm-form').addEventListener('submit', async e => {
  e.preventDefault(); const tx = $('cm-input').value.trim(); if (!tx || cmBusy || !cmOk) return;
  const day = pages[idx].day; cmBusy = true; $('cm-send').disabled = true;
  try { const r = await API.add(day, tx); (comments[day] = comments[day] || []).push(r); $('cm-input').value = ''; }
  catch (_) { cmNote('댓글을 남기지 못했어요. 잠시 뒤 다시 해 주세요.'); $('cm-send').disabled = false; }
  cmBusy = false; if (pages[idx].day === day) { drawUnder(false); const u = $('under'); u.scrollTop = u.scrollHeight; }
});
// 내 댓글 지우기: ⋯ → '지우기'가 나오고, 한 번 더 누르면 지운다 (다른 곳을 누르면 접힌다)
$('under').addEventListener('click', async e => {
  const b = e.target.closest('.more, .del'), li = e.target.closest('li[data-id]');
  $('under').querySelectorAll('.del').forEach(d => { if (d !== b) { d.className = 'more'; d.textContent = '⋯'; d.setAttribute('aria-label', '내 댓글 메뉴'); } });
  if (!b || !li) return;
  if (b.classList.contains('more')) { b.className = 'del'; b.textContent = '지우기'; b.setAttribute('aria-label', '이 댓글 지우기'); return; }
  const day = pages[idx].day, id = li.dataset.id; b.disabled = true;
  try { await API.del(id); comments[day] = (comments[day] || []).filter(c => String(c.id) !== id); if (pages[idx].day === day) drawUnder(false); }
  catch (_) { b.disabled = false; cmNote('지우지 못했어요. 잠시 뒤 다시 해 주세요.'); }
});
function cmNote(t) { let n = document.querySelector('.cm-note'); if (!n) { n = document.createElement('p'); n.className = 'cm-note'; n.setAttribute('role', 'status'); $('cm-form').before(n); } n.textContent = t; clearTimeout(cmNote.t); cmNote.t = setTimeout(() => n.remove(), 2600); }

/* ── 쪽 찾기 ───────────────────────────── */
let openEl = null, lastFocus = null;
function openSheet(el) {
  lastFocus = document.activeElement; openEl = el; el.hidden = false; $('scrim').hidden = false;
  el.getBoundingClientRect(); el.classList.add('on'); $('scrim').classList.add('on'); $('app').setAttribute('inert', '');
}
function closeSheet() {
  if (!openEl) return; const el = openEl; openEl = null;
  el.classList.remove('on'); $('scrim').classList.remove('on'); $('app').removeAttribute('inert');
  setTimeout(() => { if (openEl !== el) el.hidden = true; if (!openEl) $('scrim').hidden = true; }, 240);
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}
$('scrim').addEventListener('click', closeSheet);
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeSheet));
function drawMonths() {
  const by = {}; pages.slice(0, ND).forEach((p, i) => (by[p.m] = by[p.m] || []).push([p, i]));
  $('mo-list').innerHTML = Object.keys(by).reverse().map(m => `<h3>${m.slice(0, 4)}년 ${+m.slice(5)}월<span>${by[m].length}일</span></h3><div class="days">${by[m].map(([p, i]) => `<button type="button" data-i="${i}" class="${p.photo ? '' : 'np'}" aria-label="${p.label}${p.photo ? '' : ' 사진 없는 날'}"${i === idx ? ' aria-current="true"' : ''}>${+p.day.slice(8)}</button>`).join('')}</div>`).join('')
    + `<p class="key"><i></i>사진 없이 글만 쓴 날</p>`;
}
$('btn-month').addEventListener('click', () => { drawMonths(); openSheet($('sheet-mo')); const c = $('mo-list').querySelector('[aria-current]'); if (c) c.scrollIntoView({ block: 'center' }); });
$('mo-list').addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (!b) return; closeSheet(); setTimeout(() => jump(+b.dataset.i), 200); });
$('btn-today').addEventListener('click', () => jump(ND - 1));
// 화살표: 누르면 한 장 — 끌어 넘길 때와 같은 넘김(go)을 그대로 부른다. 쪽을 눌러 넘기는 것은 여전히 없다 (11-19 사장님)
$('nav-prev').addEventListener('click', () => { if (!closed) go(-1); }); $('nav-next').addEventListener('click', () => { if (!closed) go(1); });
$('btn-back').addEventListener('click', () => { if (EMBED) parent.postMessage({ t: 'book', act: 'close' }, location.origin); else if (history.length > 1) history.back(); });   // 앱 안에서는 통계 탭으로 돌아간다

/* ── 닫힌 책 ↔ 펼침 (11-17 모선 — 레퍼6) ─────────────────────────────
   u = 0(닫힌 책) ~ 1(펼침), 한 곡선 위에서 세 가지가 같이 간다:
   · 표지 각도 = bez(.7,0,.3,1) — 레퍼 실측(살짝 들림 → 90°를 지나 빠르게 → 길게 내려앉음)
   · 책 자리(가운데·1.42배 → 펼침의 오른쪽 반) = 앞 85% 동안 ease-in-out — 열리는 동안 책이 옆으로 비켜 펼침이 가운데에 온다
   · 카메라(소실점)는 화면 가운데에 고정 — 책이 움직여도 원근이 따라 움직이지 않는다
   표지 안쪽 면 = 펼친 책의 왼쪽 반(가장자리 + 그날 사진 쪽), 표지 아래 = 오른쪽 반. 다 열리면 진짜 책과 같은 그림이라 바꿔 끼워도 티가 없다. */
const cover = $('cover'), cbook = $('cbook'), cbCover = $('cb-cover'), vb = $('view-book');
let closed = true, co = 0, canim = 0, pose = { tx: 0, ty: 0, s: 1 }, dockW = 0;
const ez = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const OPEN_EZ = bez(.7, 0, .3, 1), MOVE_EZ = bez(.65, 0, .35, 1), OPEN_MS = 940, CLOSE_MS = 760;
const CV = { base: null, in: null, cast: mk('mcast mr cvc'), ish: mk('msh mb') };
function coverLayout() {
  const a = $('app').getBoundingClientRect(), b = book.getBoundingClientRect();
  const dock = { x: b.left - a.left + b.width / 2, y: b.top - a.top, w: b.width / 2, h: b.height }; dockW = dock.w;
  cbook.style.left = dock.x + 'px'; cbook.style.top = dock.y + 'px'; cbook.style.width = dock.w + 'px'; cbook.style.height = dock.h + 'px';
  cbook.style.perspective = `calc(${PERSP} * var(--u))`;
  const sab = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sab')) || 0;
  let s, y0;
  {
    // 책 + 서브 문구 한 줄을 한 덩어리로 보고, 화면 전체(상태바 아래 ~ 홈 바 위)의 세로 가운데에 둔다 — 책만 가운데 두면 아래 문구 때문에 처져 보인다
    const small = a.height < 700, sat = parseFloat(getComputedStyle($('app')).paddingTop), top = sat, bot = a.height - sab, g = 20, subH = 20;
    s = Math.min(1.08, (bot - top - g - subH - 26) / dock.h);                // 가로 고정: 뒤로 버튼은 왼쪽 옆에 있으니 높이에만 맞춰 가운데에
    const yOf = k => top + (bot - top - (dock.h * k + g + subH)) / 2;
    y0 = yOf(s);
    pose = { tx: a.width / 2 - dock.w * s / 2 - dock.x, ty: y0 - dock.y, s, cx: a.width / 2 - dock.x, cy: dock.h * .48 };
    $('cv-info').style.top = (y0 + dock.h * s + g) + 'px';
  }
  cover.querySelectorAll('.cv-slot').forEach((e, i) => { const w = dock.w * s, hh = dock.h * s * .82, x = a.width / 2 - w / 2; e.style.cssText = `width:${w}px;height:${hh}px;top:${y0 + dock.h * s * .09}px;left:${i ? x + w + 22 : x - w - 22}px`; });
  coverApply();
}
// 펼친 책(지금 날)을 그대로 떠서 표지 아래(오른쪽 반)·표지 안쪽(왼쪽 반)에 깐다. 쪽 노드는 옮기지 않고 복제한다
function coverSpread() {
  if (!pages.length) return;
  const b = book.getBoundingClientRect(), mkc = (left, clip) => {
    const c = book.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); c.querySelectorAll('.sheet, .mcast, .msh').forEach(e => e.remove());
    c.classList.remove('turning'); c.setAttribute('aria-hidden', 'true'); c.removeAttribute('aria-live'); c.removeAttribute('aria-roledescription');
    c.style.cssText = `position:absolute;margin:0;left:${left}px;top:0;width:${b.width}px;height:${b.height}px;aspect-ratio:auto;z-index:0;clip-path:${clip};pointer-events:none;text-align:start;font:15px/1.35 var(--ui);color:var(--ink);letter-spacing:normal;word-spacing:normal;white-space:normal;text-indent:0;text-transform:none;cursor:default`;   // .cbook 은 버튼이라 가운데 정렬·line-height normal 이 쪽으로 새 들어온다(10-27 교훈) — body 값으로 되돌림
    return c;
  };
  CV.base && CV.base.remove(); CV.in && CV.in.remove();
  CV.base = mkc(-b.width / 2, 'inset(0 0 0 50%)'); CV.base.classList.add('cb-base'); CV.base.querySelector('.hr').appendChild(CV.cast);
  cbook.insertBefore(CV.base, cbook.querySelector('.cb-pages'));
  CV.in = mkc(0, 'inset(0 50% 0 0)'); CV.in.querySelector('.hl').appendChild(CV.ish); cbook.querySelector('.cb-in').replaceChildren(CV.in); cbook.classList.add('cin-page');   // 표지 안쪽 = 그날 사진 쪽 (11-17 사장님 확정)
}
function coverApply() {
  const u = co, A = MOVE_EZ(cl(u / .85)), R = OPEN_EZ(u), phi = R * Math.PI;
  const sc = 1 + (pose.s - 1) * (1 - A), tx = pose.tx * (1 - A), ty = pose.ty * (1 - A);
  cbook.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${sc.toFixed(4)})`;
  cbook.style.perspectiveOrigin = `${((pose.cx - tx) / sc).toFixed(1)}px ${(pose.cy || 0).toFixed(1)}px`;   // 소실점 = 화면 가운데(펼침이면 책등)
  cbCover.style.transform = R > 0 ? `rotateY(${(-R * 180).toFixed(3)}deg)` : '';
  const [f, bk, rw, ro] = shade(phi);
  $('cb-front').style.setProperty('--shade', (f * 1.2).toFixed(3));
  CV.ish.style.opacity = bk.toFixed(3);
  CV.cast.style.opacity = ro.toFixed(3); CV.cast.style.transform = `scaleX(${rw.toFixed(4)})`;
  if (CV.base) CV.base.style.visibility = R > .002 ? 'visible' : 'hidden';
  const pk = 1 - cl((R - .01) / .2); cbook.querySelectorAll('.cb-back, .cb-pages, .cb-ribbon, .cb-shadow, .cb-peek').forEach(e => e.style.opacity = pk);   // 쪽 뭉치 옆면은 표지가 들리는 동안 진짜 쪽으로 바뀐다(표지 밑이라 안 보이는 사이)
  $('cv-info').style.opacity = 1 - cl(u / .2); $('cv-logo').style.opacity = 1 - cl(u / .2); if (DESIGN === 'd') cover.style.backgroundColor = `rgba(251, 246, 236, ${(1 - A).toFixed(3)})`; cover.querySelectorAll('.cv-slot').forEach(e => e.style.opacity = 1 - cl(u / .2));
  $('ttl-h').style.opacity = cl((u - .5) / .35);
  const ui = cl((u - .55) / .35); $('bar').style.opacity = ui; document.querySelector('.under').style.opacity = ui;
  book.style.opacity = u >= .9 ? 1 : 0; cover.style.opacity = (1 - cl((u - .9) / .1)).toFixed(3);   // 마지막 10%(책 자리는 이미 도착, 표지 179°↑): 같은 그림끼리 겹쳐 바꾼다 — 3D 래스터와 평면 래스터의 글자 결 차이가 한 프레임에 튀지 않게
}
// co 를 from → to 로. ez = 시간 진행(0~1) → 이동 비율. 탭은 직선(곡선은 OPEN_EZ 가 이미 품고 있다), 손을 뗀 뒤는 속도를 이어받는 곡선
function coverRun(to, ms, ez = k => k) {
  cancelAnimationFrame(canim); cover.classList.remove('gone');
  const from = co, t0 = performance.now(), end = () => { co = to; coverApply(); canim = 0; closed = to === 0; cover.classList.toggle('gone', to === 1); vb.toggleAttribute('inert', closed); };
  if (REDUCED) return end();
  const step = now => { const k = cl((now - t0) / ms); co = from + (to - from) * ez(k); coverApply(); if (k < 1) canim = requestAnimationFrame(step); else end(); };
  canim = requestAnimationFrame(step);
}
const openBook = () => { if (!closed || canim || cdrag) return; coverSpread(); coverRun(1, OPEN_MS); };
function closeBook() { if (closed || canim || anim || cdrag) return; coverLayout(); coverSpread(); coverRun(0, CLOSE_MS); }

/* 표지 끌기 (11-17 사장님: "드래그로 넘길수 있게") — 책장 끌기와 같은 함수(fingerT)로 표지 각도를 정하고, 그 각도에 맞는 진행도로 책 자리·배율도 같이 간다.
   놓으면 속도를 이어받아 열리거나 덮인다. 튕김 없음. */
let cdrag = null;
const invOpen = R => { let lo = 0, hi = 1; for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (OPEN_EZ(m) < R) lo = m; else hi = m; } return (lo + hi) / 2; };
function coverGrab(d, e) {                                       // d = 시작한 손가락(x0·id), e = 지금 이벤트
  if (canim) return;
  cover.classList.remove('gone'); if (!closed) { coverLayout(); coverSpread(); co = 1; coverApply(); } else coverSpread();
  const a = $('app').getBoundingClientRect(), spine0 = parseFloat(cbook.style.left) + a.left + (closed ? pose.tx : 0), sc0 = closed ? pose.s : 1;
  const g = Math.max(.55, Math.min(1, Math.abs(d.x0 - spine0) / (sc0 * dockW)));   // 책등 가까이 잡아도 너무 예민하지 않게
  cdrag = { id: d.id, x0: d.x0, from: closed ? 0 : 1, r: g * dockW, s: [] };    // 반지름은 펼친 크기(1배) 기준 — 1.42배로 잡으면 다 열 때 손가락이 화면 밖까지 가야 한다
  coverMove(e);
}
function coverMove(e) {
  if (!cdrag || e.pointerId !== cdrag.id) return;
  co = invOpen(fingerT(e.clientX - cdrag.x0, { fwd: !cdrag.from, r: cdrag.r }));   // 책장과 같은 손맛: 잡은 점 = 책등 + r·cosφ, 표지 각도 → 진행도(책 자리도 같이)
  cdrag.s.push([e.timeStamp, co]); while (cdrag.s.length > 2 && e.timeStamp - cdrag.s[0][0] > 90) cdrag.s.shift();
  coverApply();
}
function coverRelease(e) {
  if (!cdrag || e.pointerId !== cdrag.id) return;
  const d = cdrag; cdrag = null; if (d.from === 0) cbook.dataset.dragged = '1';
  const a = d.s[0], b = d.s[d.s.length - 1];
  const vu = Math.max(-8, Math.min(8, a && b && b[0] > a[0] && e.timeStamp - b[0] < 80 ? (b[1] - a[1]) / (b[0] - a[0]) * 1000 : 0));
  const R = OPEN_EZ(co), vR = (OPEN_EZ(cl(co + .01)) - OPEN_EZ(cl(co - .01))) / .02 * vu, proj = R + vR * .16;   // 판정은 책장과 같이 '각도'로: 열 때 72°, 덮을 때 108° 넘기면
  const T = d.from === 0 ? (proj > .4 ? 1 : 0) : (proj < .6 ? 0 : 1), D = T - co;
  if (Math.abs(D) < .001) { co = T; return coverRun(T, 1); }
  const ms = (T ? OPEN_MS : CLOSE_MS) * Math.max(.3, Math.abs(D));    // 남은 길을 탭과 같은 빠르기로
  const k = Math.min(3, Math.max(0, vu * Math.sign(D)) * ms / 1000 / Math.abs(D));
  coverRun(T, ms, u => k * u + (3 - 2 * k - 1) * u * u + (k - 2 + 1) * u * u * u);   // 에르미트: p'(0)=k(손가락 속도) · p'(1)=1(탭 열기의 같은 꼬리로 이어짐)
}
cbook.addEventListener('click', () => { if (cbook.dataset.dragged) { delete cbook.dataset.dragged; return; } openBook(); });   // 탭 열기 그대로 (끌고 난 뒤 따라오는 click 은 버린다)
cbook.addEventListener('pointerdown', e => { delete cbook.dataset.dragged; if (e.button > 0 || !closed || canim) return; cdrag = null; cbook._p = { id: e.pointerId, x0: e.clientX, y0: e.clientY }; });
cbook.addEventListener('pointermove', e => {
  const p = cbook._p;
  if (cdrag) return coverMove(e);
  if (!p || e.pointerId !== p.id) return;
  const dx = e.clientX - p.x0, dy = e.clientY - p.y0;
  if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
  cbook._p = null;
  if (dx > 0 || Math.abs(dx) < Math.abs(dy) * 1.3) return;        // 책장과 같은 판정: 가로가 세로의 1.3배 이상, 오른쪽 → 왼쪽만 연다
  try { cbook.setPointerCapture(e.pointerId); } catch (_) {}
  coverGrab(p, e);
});
cbook.addEventListener('pointerup', e => { cbook._p = null; coverRelease(e); });
cbook.addEventListener('pointercancel', e => { cbook._p = null; coverRelease(e); });
book.addEventListener('pointermove', coverMove); book.addEventListener('pointerup', coverRelease); book.addEventListener('pointercancel', coverRelease);   // 첫 날에서 끌어 덮을 때는 책이 손가락을 쥐고 있다
addEventListener('resize', () => { orient(); if (closed) coverLayout(); moreClose(); });   // 폰을 돌리면 방향·안전영역을 다시 잡는다. 보고 있던 날(idx)은 그대로
function drawCover() {
  const nm = baby.name, n = [...nm].length, nc = 'cb-name' + (n > 9 ? ' n12' : n > 6 ? ' n9' : n > 4 ? ' n6' : '');
  cbook.setAttribute('aria-label', `${nm}의 성장앨범 펼치기`); cbook.dataset.design = DESIGN; cover.dataset.design = DESIGN; $('cv-tt').textContent = `${nm}의 성장앨범`; $('cv-l1').textContent = `${nm}의`;
  const fam = [{ img: '../img/아기-2g-원형.png', name: nm, me: 1 }].concat(members);   // 아기 + 초대된 가족 수만큼
  const extra = Math.max(0, (+Q.get('fam') || 0) - fam.length); for (let i = 0; i < extra; i++) fam.push(CH[i % 2 ? 'dad' : 'mom']);          // ?fam= 은 여섯 명일 때 확인용
  const face = (f, k) => `<img src="${esc(f.img)}" alt="${esc(f.name)}" style="z-index:${20 - k}">`;                 // 앞 얼굴이 위로 — 아기가 온전히 보인다
  if (Q.get('fam')) fam.length = Math.min(fam.length, +Q.get('fam'));                                        // ?fam= 은 1~6명 확인용
  fam.length = Math.min(fam.length, 6);                                                                       // 최대 6명 — 앱 초대 인원 제한과 맞춘다
  const rows = fam.length <= 3 ? [fam] : fam.length === 4 ? [fam.slice(0, 2), fam.slice(2)] : [fam.slice(0, 3), fam.slice(3)];   // 3명까지 한 줄, 4명 2+2 · 5명 3+2 · 6명 3+3 (둘째 줄은 반 칸 어긋나게 끼워 벌집처럼)
  // 표지(11-16 사장님 확정): 짙은 초록 납작 하드커버, 흰 손글씨 큰 제목 두 줄 + 작은 괄호 한 줄 + 가족 얼굴 + 세로 고무 밴드
  let h;
  {
    const ch = [...nm], two = n > 7, per = two ? Math.ceil((n + 1) / 2) : n + 1, fs = Math.min(two ? 23 : 32, 136 / (per * .92));
    const nameHtml = two ? `${esc(ch.slice(0, per).join(''))}<br>${esc(ch.slice(per).join(''))}의` : `${esc(nm)}의`;
    h = `<span class="g-wrap"><span class="g-nm" style="font-size:calc(${fs.toFixed(1)} * var(--u))">${nameHtml}</span><span class="g-sb">성장앨범</span><span class="fam${rows.length > 1 && rows[1].length === rows[0].length ? ' hex' : ''}">${rows.map(r => `<span class="row">${r.map(face).join('')}</span>`).join('')}</span></span><span class="g-pr">엄마 아빠가 매일 쓰는 이야기</span><span class="g-band"></span>`;   // 괄호 문구는 임시 — 단비 몫
  }
  $('cb-front').innerHTML = h;
  $('cv-st').textContent = `일기 ${pages.filter(p => p.diary).length}편 · 사진 ${pages.filter(p => p.photo).length}장`;   // 임시 문구 — 단비 몫
}
const DESIGN = 'g';                                   // 지난 안(a~f)은 걷어냄 — 코드는 ../book.bak-1116o/
document.body.classList.add('flat');                  // 속지 그늘 덜어낸 판(11판 통과분)
// 표지 색 세 가지 — ?cover=green(기본)|navy|brick. [표지, 책등, 표지 안쪽 면, 고무 밴드]
const COVERS = { green: ['#2f6b5c', '#27594d', '#e2eee9', '#f3c85a'], navy: ['#34477f', '#2b3b6b', '#e2e7f3', '#ee9c8f'], brick: ['#a5503f', '#8c4335', '#f6e5df', '#f3c85a'] };
{ const c = COVERS[Q.get('cover')] || COVERS.green; ['--cv', '--cv-d', '--cv-in', '--band'].forEach((k, i) => document.documentElement.style.setProperty(k, c[i])); }

/* ── 덤 장: 사진첩 · 숫자 · 성장 (11-17) ─────────────────────────────
   매일 일기가 주인공이고, 이 장들은 책갈피로 찾아 들어가는 덤. 같은 펼친 책 안에 그리고 같은 넘김으로 넘긴다.
   쪽 모델: { kind, ch, title, note, … } — build() 가 kind 를 보고 buildExtra 로 넘긴다. 일기 장 뒤에 이어 붙어 있어 끝 날에서 더 넘기면 사진첩이 나온다. */
const CHS = { diary: { name: '일기', at: 0, n: 0, c: '#9dbfef' } };          // 장 → { name, at(첫 쪽 번호), n(펼침 수), c(탭 색) }
const chOf = i => { let k = 'diary'; for (const c in CHS) if (c !== 'diary' && i >= CHS[c].at && i < CHS[c].at + CHS[c].n) k = c; return k; };
const TILE = ['#f8dfa6', '#f5e79c', '#d3e8b0', '#b7e2cc', '#b9dcf0', '#c3cdf3', '#d9c8f0', '#f8dfa6', '#f5e79c', '#d3e8b0', '#b7e2cc', '#b9dcf0'];   // 레드 계열 없음   // 1~12달 타일 색
const monthNo = day => { const b = baby.birth_date, m = (+day.slice(0, 4) - +b.slice(0, 4)) * 12 + (+day.slice(5, 7) - +b.slice(5, 7)) - (day.slice(8) < b.slice(8) ? 1 : 0); return m + 1; };   // 태어나서 몇째 달
const md = day => `${+day.slice(5, 7)}. ${+day.slice(8)}.`;
const lday = iso => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const num = (x, f = 0) => Number(x).toLocaleString('ko-KR', { minimumFractionDigits: f, maximumFractionDigits: f });
function extraPages(d) {
  const days = pages, out = [], add = (ch, name, c, list) => { if (!list.length) return; CHS[ch] = { name, at: ND + out.length, n: list.length, c }; list.forEach(p => out.push({ ...p, ch, day: '', m: '' })); };
  CHS.diary.n = ND;
  const logs = d.logs || [], today = d.today || [days[ND - 1].day].concat(logs.length ? [lday(logs[logs.length - 1].at)] : []).sort().pop(), N = dayNo(today);
  // ── 사진첩: 달 타일 판 → 달마다 사진 펼침
  const ph = days.filter(p => p.photo), byM = {}; ph.forEach(p => (byM[monthNo(p.day)] = byM[monthNo(p.day)] || []).push(p));
  if (ph.length) {
    const list = [{ kind: 'pidx', title: '사진첩', note: '달 타일을 누르면 그 달 사진이 펼쳐져요. 사진을 누르면 그날 일기로 가요.', total: ph.length, byM }];
    Object.keys(byM).map(Number).sort((a, b) => a - b).forEach(m => { const all = byM[m];
      list.push({ kind: 'pmon', title: `${m}달 사진`, note: `${md(all[0].day)} ~ ${md(all[all.length - 1].day)} · 사진 ${all.length}장. 사진을 누르면 그날 일기가 펼쳐져요.`, m0: m, all, L: null, R: all.slice(0, 12) });
      for (let i = 12; i < all.length; i += 24) list.push({ kind: 'pmon', title: `${m}달 사진`, note: `${m}달 사진이 이어져요.`, m0: m, all, L: all.slice(i, i + 12), R: all.slice(i + 12, i + 24) }); });
    list.forEach((p, i) => { if (p.kind === 'pmon' && !p.L) byM[p.m0].at = i; });       // 타일이 가리킬 쪽(장 안 순번)
    add('photo', '사진', '#f5d37a', list);
  }
  // ── 숫자로 본 N일: 기록표의 수유·잠·기저귀를 더한다. 끝나지 않은 채 12시간을 넘긴 잠, 14시간 이상인 잠은 뺀다
  const now = d.today ? Date.now() : new Date(today + 'T23:59').getTime(), feeds = logs.filter(l => l.kind === 'feed'), dia = logs.filter(l => l.kind === 'diaper');
  const sleeps = logs.filter(l => l.kind === 'sleep').map(l => { const a = new Date(l.at).getTime(), b = l.ended_at ? new Date(l.ended_at).getTime() : now; return { at: l.at, h: (b - a) / 36e5, open: !l.ended_at }; }).filter(x => x.h > 0 && !(x.open && x.h > 12) && x.h < 14);   // 11-17 사장님 "14시간 이상은 빼" — 끝난 잠도 14시간 넘으면 끄는 걸 늦게 누른 기록으로 본다
  const ml = feeds.reduce((a, l) => a + (+(l.detail || {}).ml || 0), 0), sleepH = sleeps.reduce((a, x) => a + x.h, 0), longest = sleeps.slice().sort((a, b) => b.h - a.h)[0];
  const checks = (Array.isArray(d.checks) ? d.checks : Object.values(d.checks || {})).filter(c => c.done_on).sort((a, b) => a.done_on < b.done_on ? -1 : 1);
  const hm = h => { const m = Math.round(h * 60); return m % 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m / 60}시간`; };
  const rows = [];
  if (feeds.length) rows.push(['bottle', `${num(feeds.length)}번`, ml ? `먹었어요 · 분유·유축 ${num(ml / 1000, 1)}L` : '먹었어요']);
  if (dia.length) rows.push(['diaper', `${num(dia.length)}장`, `기저귀를 갈았어요${dia.some(l => (l.detail || {}).poo) ? ` · 응가 ${num(dia.filter(l => (l.detail || {}).poo).length)}번` : ''}`]);
  if (sleeps.length) rows.push(['moon', `${num(Math.round(sleepH))}시간`, `잤어요 · ${num(sleeps.length)}번`]);
  if (longest) rows.push(['pillow-zzz', hm(longest.h), `가장 길게 잔 잠 · ${md(lday(longest.at))}`]);
  rows.push(['notebook', `${num(days.filter(p => p.diary).length)}편`, `일기를 썼어요${ph.length ? ` · 사진 ${num(ph.length)}장` : ''}`]);
  if (checks.length) rows.push(['checkup', md(checks[0].done_on), `첫 접종·검진${checks.length > 1 ? ` · 지금까지 ${checks.length}번` : ''}`]);
  if (rows.length > 1) { const k = Math.ceil(rows.length / 2); add('num', '숫자', '#f5d37a', [{ kind: 'nums', title: `숫자로 본 ${num(N)}일`, note: '기록표에 남긴 수유·잠·기저귀 기록을 더했어요. 끄는 걸 잊었거나 14시간 넘게 이어진 잠은 뺐어요.', N, L: rows.slice(0, k), R: rows.slice(k) }]); }
  // ── 성장: 몸무게 곡선 + 기념일
  const gw = (d.growth || []).filter(g => g.weight_kg != null).sort((a, b) => a.day < b.day ? -1 : 1), last = k => (d.growth || []).filter(g => g[k] != null).sort((a, b) => a.day < b.day ? -1 : 1);
  const b0 = new Date(baby.birth_date + 'T00:00'), at = n => { const x = new Date(b0); x.setDate(x.getDate() + n - 1); return lday(x); }, one = new Date(b0); one.setFullYear(one.getFullYear() + 1);
  const miles = [['50일', at(50)], ['100일', at(100)], ['200일', at(200)], ['300일', at(300)], ['첫돌', lday(one)]].map(([n, day]) => ({ n, day, left: Math.round((new Date(day + 'T00:00') - new Date(today + 'T00:00')) / 864e5), has: days.some(p => p.day === day) }));
  const g = [];
  if (gw.length) g.push({ kind: 'grow', title: '성장 곡선', note: `몸무게를 ${gw.length}번 쟀어요. 성장 탭에 적은 기록 그대로예요.`, gw, len: last('length_cm'), head: last('head_cm') });
  g.push({ kind: 'miles', title: '기념일', note: '지난 기념일 가운데 일기를 쓴 날은 눌러서 펼쳐 볼 수 있어요.', miles });
  add('grow', '성장', '#a9d6a4', g);
  return out;
}
// 덤 장 머리: 제목은 왼쪽 쪽에만 있고 장마다 높이가 달라도 된다. 오른쪽 쪽은 위를 비워 두되, 왼쪽 머리와 똑같은 높이의 보이지 않는 자리(ghost)를 둬서 본문이 왼쪽 본문과 같은 높이에서 시작한다 (11-17 사장님)
const head = (t, sub) => `<div class="xh"><h2>${t}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;
const ghost = h => h.replace('<div class="xh">', '<div class="xh ghost" aria-hidden="true">');
const xpg = (side, html) => { const e = document.createElement('article'); e.className = 'pg x ' + side; e.innerHTML = html; return e; };
const foot = (...n) => `<div class="ground xg">${n.map(([k, h]) => dd(k, h)).join('')}</div>`;
const pimg = p => p.thumb ? `<img src="${esc(p.thumb)}" alt="${p.label} 사진" draggable="false" loading="lazy" decoding="async">` : `<img src="${p.sample}" alt="${p.label} 사진" draggable="false" style="background:${p.sampleBg}">`;
function buildExtra(p) {
  let L = '', R = '';
  if (p.kind === 'pidx') {            // 1~12달 색 타일 — 사진 있는 달만 눌린다
    const tile = m => { const a = p.byM[m]; return a ? `<button type="button" class="tile" style="--c:${TILE[m - 1]}" data-go="${CHS.photo.at + a.at}" aria-label="${m}달 사진 ${a.length}장"><b>${m}</b><i>달</i><small>${a.length}장</small></button>` : `<span class="tile none" aria-hidden="true"><b>${m}</b><i>달</i></span>`; };
    L = `${head('사진첩', `사진 ${num(p.total)}장 · 달마다 모았어요`)}<div class="tiles">${[1, 2, 3, 4, 5, 6].map(tile).join('')}</div>${foot(['grass', 24], ['flower-daisy', 36])}`;
    R = `${ghost(head('사진첩', `사진 ${num(p.total)}장 · 달마다 모았어요`))}<div class="tiles">${[7, 8, 9, 10, 11, 12].map(tile).join('')}</div>${foot(['duck', 26])}`;
  } else if (p.kind === 'pmon') {     // 한 달: 왼쪽에 사진 더미(맨 위 석 장), 오른쪽에 그 달 사진 전부
    const th = a => `<div class="thumbs">${a.map((q, i) => `<button type="button" class="th" data-day="${q.day}" style="--r:${[-1.6, 1.2, -.6, 1.8][i % 4]}deg" aria-label="${q.label} 일기 펼치기">${pimg(q)}</button>`).join('')}</div>`;
    const H = p.L ? head(`${p.m0}달`, '이어서') : head(`${p.m0}달`, `${md(p.all[0].day)} ~ ${md(p.all[p.all.length - 1].day)} · ${p.all.length}장`);
    if (p.L) L = `${H}${th(p.L)}`;
    else { const top = p.all.slice(-3).reverse(), rot = [-3, 6, -8], dx = [0, 13, -12], dy = [0, 5, 9];
      L = `${H}<div class="stack">${top.map((q, i) => `<button type="button" class="pol" data-day="${q.day}" style="z-index:${3 - i};transform:translate(calc(${dx[i]} * var(--u)), calc(${dy[i]} * var(--u))) rotate(${rot[i]}deg)" aria-label="${q.label} 일기 펼치기">${pimg(q)}</button>`).join('')}<img class="tape tc" src="doodles/tape-check.svg" alt=""></div>${foot(['grass', 24], ['flower-blossom', 22])}`; }
    R = ghost(H) + th(p.R) + (p.R.length <= 9 ? foot(['sprout', 24]) : '');
  } else if (p.kind === 'nums') {
    const row = ([k, v, l]) => `<div class="nrow">${dd(k, 26)}<div><b>${esc(v)}</b><span>${esc(l)}</span></div></div>`;
    const H = head(`숫자로 본<br><em>${num(p.N)}</em>일`);            // 58 = 코랄, 조금 크게
    L = `${H}${p.L.map(row).join('')}`; R = `${ghost(H)}${p.R.map(row).join('')}${foot(['rattle', 28])}`;
  } else if (p.kind === 'grow') {     // 몸무게 곡선 — 손으로 그은 듯한 굵은 선 + 점
    const gw = p.gw, t0 = new Date(gw[0].day).getTime(), t1 = Math.max(new Date(gw[gw.length - 1].day).getTime(), t0 + 864e5), ws = gw.map(x => x.weight_kg), lo = Math.floor(Math.min(...ws)), hi = Math.ceil(Math.max(...ws) + .01);
    const X = x => 16 + (new Date(x.day).getTime() - t0) / (t1 - t0) * 124, Y = x => 150 - (x.weight_kg - lo) / (hi - lo) * 128, pts = gw.map(x => `${X(x).toFixed(1)},${Y(x).toFixed(1)}`);
    const grid = []; for (let k = lo; k <= hi; k++) grid.push(`<line x1="14" x2="144" y1="${Y({ weight_kg: k })}" y2="${Y({ weight_kg: k })}"/><text x="10" y="${Y({ weight_kg: k }) + 3}" text-anchor="end">${k}</text>`);
    const H = head('성장 곡선', `몸무게(kg) · ${md(gw[0].day)} ~ ${md(gw[gw.length - 1].day)}`);
    L = `${H}<svg class="chart" viewBox="0 0 150 166" role="img" aria-label="몸무게 ${gw[0].weight_kg}kg 에서 ${gw[gw.length - 1].weight_kg}kg"><g class="gr">${grid.join('')}</g><polyline points="${pts.join(' ')}"/>${gw.map(x => `<circle cx="${X(x).toFixed(1)}" cy="${Y(x).toFixed(1)}" r="2.3"/>`).join('')}</svg>`;
    const a = gw[0], b = gw[gw.length - 1], row = (k, v, l) => `<div class="nrow">${dd(k, 26)}<div><b>${v}</b><span>${l}</span></div></div>`, rs = [row('heart', `${a.weight_kg} → ${b.weight_kg}kg`, `몸무게 · ${b.weight_kg >= a.weight_kg ? '+' : ''}${num(b.weight_kg - a.weight_kg, 2)}kg`)];
    if (p.len.length) { const x = p.len[0], y = p.len[p.len.length - 1]; rs.push(row('flower-daisy', p.len.length > 1 ? `${x.length_cm} → ${y.length_cm}cm` : `${y.length_cm}cm`, `키 · ${md(y.day)}`)); }
    if (p.head.length) { const y = p.head[p.head.length - 1]; rs.push(row('sun', `${y.head_cm}cm`, `머리둘레 · ${md(y.day)}`)); }
    R = `${ghost(H)}${rs.join('')}${foot(['bear', 30])}`;
  } else {                            // 기념일
    const row = m => { const done = m.left <= 0, t = `<span class="mrow${done ? ' done' : ''}">${`<img class="dd" src="doodles/mini-${done ? 'heart' : 'star'}.svg" alt="" style="width:calc(13 * var(--u))">`}<b>${m.n}</b><span>${md(m.day)}</span><em>${done ? (m.has ? '일기 보기' : '지났어요') : 'D-' + m.left}</em></span>`; return m.has && done ? `<button type="button" class="mbtn" data-day="${m.day}" aria-label="${m.n} 일기 펼치기">${t}</button>` : t; };
    const nx = p.miles.find(m => m.left > 0);
    L = `${head('기념일', '태어난 날부터 세었어요')}<div class="mlist">${p.miles.map(row).join('')}</div>`;
    R = `${ghost(head('기념일', '태어난 날부터 세었어요'))}<div class="next">${dd('rainbow', 44)}${nx ? `<p>다음은 <b>${nx.n}</b></p><p class="big">${num(nx.left)}일 남았어요</p>` : `<p class="big">첫돌을 지났어요</p>`}</div>${foot(['grass', 24], ['flower-lavender', 36])}`;
  }
  return { L: xpg('L', L), R: xpg('R', R) };
}
// 쪽 안 단추: 달 타일 → 그 달 펼침, 사진·기념일 → 그날 일기 (넘김 문법 그대로 한 장 넘어간다)
function pageAct(el) { const go2 = el.dataset.go != null ? +el.dataset.go : pages.findIndex((p, i) => i < ND && p.day === el.dataset.day); if (go2 >= 0) jump(go2); }
book.addEventListener('click', e => { if (e.detail === 0) { const el = e.target.closest('[data-go], [data-day]'); if (el) pageAct(el); else if (e.target.closest('[data-more]')) moreOpen(); } });   // 키보드(Enter)로 눌렀을 때
// 책갈피: 누르면 아래로 길게 열려 장 목록이 나온다 → 고르면 그 장으로 가고 접힌다. 바깥을 누르면 접힌다. (열고 접는 손맛은 모선 몫)
const bm = $('bm');
function drawTabs() { $('bm-list').innerHTML = Object.keys(CHS).map(k => `<button type="button" role="menuitem" data-ch="${k}">${CHS[k].name}</button>`).join(''); bm.hidden = Object.keys(CHS).length < 2; bmOpen(false);  drawIdxTabs(); }
// 색인 탭: 글자 없이 선 아이콘만(같은 굵기·둥근 끝으로 한 벌). 이름은 aria-label·title 로 남긴다
const TABI = {
  diary: '<path d="M6.5 4.500h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-9z"/><path d="M6.500 4.500v15M10 9h4.500M10 12.500h4.500"/>',              // 공책
  photo: '<rect x="4.500" y="4" width="15" height="16" rx="2"/><rect x="7" y="6.500" width="10" height="8" rx="1"/><path d="M9.500 17.500h5"/>',   // 붙인 사진
  num: '<path d="M5 19.500h14"/><path d="M7.500 19.500v-5M12 19.500V8M16.500 19.500v-8"/>',                                                         // 막대
  grow: '<path d="M12 20v-8"/><path d="M12 12c0-3.500-2.500-5.500-6-5.500 0 3.500 2.500 5.500 6 5.500z"/><path d="M12 14.500c0-3 2-5 5.500-5 0 3-2 5-5.500 5z"/>',   // 새싹
};
function drawIdxTabs() { const t = $('tabs'); t.classList.toggle('b', Q.get('tabs') === 'b');   // ?tabs=b = 리본 안(비교용)
  t.innerHTML = Object.keys(CHS).map(k => `<button type="button" data-ch="${k}" aria-label="${CHS[k].name}" title="${CHS[k].name}"><svg viewBox="0 0 24 24" aria-hidden="true">${TABI[k] || ''}</svg></button>`).join(''); t.hidden = Object.keys(CHS).length < 2; }
$('tabs').addEventListener('pointerdown', e => e.stopPropagation());                // 탭을 누르는 건 책장 끌기가 아니다
$('tabs').addEventListener('click', e => { const b = e.target.closest('button[data-ch]'); if (!b || closed) return; const c = CHS[b.dataset.ch]; if (chOf(idx) !== b.dataset.ch) jump(b.dataset.ch === 'diary' ? ND - 1 : c.at); });
function bmOpen(on) { bm.classList.toggle('open', on); $('bm-tog').setAttribute('aria-expanded', on); $('bm-list').querySelectorAll('button').forEach(b => { b.tabIndex = on ? 0 : -1; }); }
bm.addEventListener('pointerdown', e => e.stopPropagation());                       // 책갈피를 누르는 건 책장 끌기·넘김이 아니다
$('bm-tog').addEventListener('click', () => bmOpen(!bm.classList.contains('open')));
$('bm-list').addEventListener('click', e => { const b = e.target.closest('button[data-ch]'); if (!b || closed) return; bmOpen(false); const c = CHS[b.dataset.ch]; if (chOf(idx) !== b.dataset.ch) jump(b.dataset.ch === 'diary' ? ND - 1 : c.at); });
addEventListener('pointerdown', e => { if (bm.classList.contains('open') && !e.target.closest('#bm')) bmOpen(false); }, true);
addEventListener('keydown', e => { if (e.key === 'Escape') bmOpen(false); });

/* ── 긴 일기 '더보기' (11-19) — 책 쪽 일곱 줄에 다 안 들어간 날만 마지막 줄 끝에 '더보기'. 누르면 화면 오른쪽에서 종이가 밀려 들어와 그날 일기 전문을 보여 준다 ─────────────────────────────
   닫기: 바깥 누르기 · × · 오른쪽으로 밀기 · Esc. 열려 있는 동안 책은 inert(넘김 멈춤). 열고 닫는 손맛은 모선 몫. */
const more = $('more'), moreScrim = $('more-scrim');
function markMore() {            // 지금 펼친 날의 오른쪽 쪽에 '더보기' 를 달지 정한다
  const p = pages[idx]; if (!p || p.kind) return; const d = pg(idx).R.querySelector('.diary'), sp = d && d.querySelector('span'); if (!sp) return;
  const cut = sp.scrollHeight > sp.clientHeight + 2; d.classList.toggle('cut', cut);
  if (cut && !d.querySelector('.more-btn')) d.insertAdjacentHTML('beforeend', '<button type="button" class="more-btn" data-more aria-haspopup="dialog">더보기</button>');
}
function moreOpen() {
  const p = pages[idx]; if (!p || p.kind || closed || anim || canim || book.classList.contains('turning')) return;
  $('more-h').innerHTML = `${p.label} · ${p.n}일${dayStat[p.day] ? `<small>${dayStat[p.day]}</small>` : ''}`; $('more-body').textContent = p.diary; $('more-scroll').scrollTop = 0;
  more.hidden = false; moreScrim.hidden = false; more.getBoundingClientRect(); more.classList.add('on'); moreScrim.classList.add('on'); moreAt = performance.now(); $('app').setAttribute('inert', '');
}
function moreClose() { if (more.hidden) return; more.classList.remove('on'); moreScrim.classList.remove('on'); $('app').removeAttribute('inert'); setTimeout(() => { if (!more.classList.contains('on')) { more.hidden = true; moreScrim.hidden = true; } }, 240); }
let moreAt = 0;
moreScrim.addEventListener('click', () => { if (performance.now() - moreAt > 350) moreClose(); });
$('more-x').addEventListener('click', moreClose);
{ let m = null;                                                        // 오른쪽으로 밀어 닫기 (세로로 읽는 스크롤과는 방향으로 가른다)
  more.addEventListener('pointerdown', e => { m = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
  more.addEventListener('pointerup', e => { const d = m; m = null; if (d && e.pointerId === d.id && e.clientX - d.x > 56 && Math.abs(e.clientX - d.x) > Math.abs(e.clientY - d.y) * 1.5) moreClose(); });
  more.addEventListener('pointercancel', () => { m = null; }); }
addEventListener('keydown', e => { if (e.key === 'Escape') moreClose(); });

/* ── 사진 크게 보기 (11-18) — 일기 쪽 사진을 누르면 앱 다이어리처럼 크게. 넘기기 절과 따로 돈다 ─────────────────────────────
   '누름' = 8px 안 움직이고 0.4초 안에 뗀 것. 끌다가 놓은 것, 넘어가는 중(.turning), 표지가 덮인 동안은 치지 않는다. */
const pv = $('phview'); let pvAt = 0;
function photoOpen() {
  const p = pages[idx]; if (!p || p.kind || !p.photo || closed || anim || canim || book.classList.contains('turning')) return;
  const d = new Date(p.day + 'T00:00'); pv.querySelector('img').src = p.url || p.sample; pv.querySelector('p').textContent = `D+${p.n} · ${d.getMonth() + 1}월 ${d.getDate()}일`;
  pv.hidden = false; pvAt = performance.now(); $('app').setAttribute('inert', '');
}
function photoClose() { if (pv.hidden) return; pv.hidden = true; pv.querySelector('img').src = ''; $('app').removeAttribute('inert'); }
{ let dn = null;
  book.addEventListener('pointerdown', e => { const el = e.target.closest && e.target.closest('#hl .frame .ph, #hr [data-more]'); dn = el ? { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId, more: el.hasAttribute('data-more') } : null; }, true);
  addEventListener('pointerup', e => { const d = dn; dn = null; if (d && e.pointerId === d.id && e.timeStamp - d.t < 400 && Math.abs(e.clientX - d.x) < 8 && Math.abs(e.clientY - d.y) < 8) { if (d.more) moreOpen(); else photoOpen(); } }, true);
  addEventListener('pointercancel', () => { dn = null; }, true); }
pv.addEventListener('click', () => { if (performance.now() - pvAt > 350) photoClose(); });   // 여는 그 누름의 click 이 바로 닫지 않게
pv.addEventListener('touchmove', e => e.preventDefault(), { passive: false });   // 뒤로 스크롤 안 새게
addEventListener('keydown', e => { if (e.key === 'Escape') photoClose(); });

/* ── 시작 ───────────────────────────── */
// d = { baby:{name,birth_date}, days:[{day,diary,sticker,photo,url,thumb}], members:[{id,name,img}], me, api:{list,add,del}, logs, growth, checks, today }
async function start(d) {
  baby = d.baby; if (Q.get('name')) baby = { ...baby, name: Q.get('name') };   // ?name= 은 이름 길이 확인용
  members = d.members; ME = d.me;
  { const im = $('cm-form').querySelector('img'), w = who(ME); im.src = w.img; im.alt = w.name; }   // 댓글 입력칸 옆 얼굴 = 내가 고른 캐릭터
  pages = d.days.filter(x => x.diary || x.photo).sort((a, b) => a.day < b.day ? -1 : 1).map(model);
  { const n = [...baby.name].length; $('ttl').textContent = baby.name; $('ttl-h').className = n > 7 ? 'xlong' : n > 4 ? 'long' : ''; document.title = `${baby.name}의 성장앨범`; }
  try { await Promise.race([document.fonts.load('16px "Poor Story"'), new Promise(r => setTimeout(r, 1500))]); } catch (_) {}
  if (!pages.length) {                                   // 아직 일기도 사진도 없는 책 — 표지만 보여 주고 열리지 않는다
    drawCover(); coverLayout(); $('cv-st').textContent = '다이어리에 첫 일기를 쓰면 여기에 쌓여요'; cbook.disabled = true; vb.setAttribute('inert', '');
    window.__book = { pages, get closed() { return true; }, get idx() { return 0; } }; return;
  }
  ND = pages.length; pages = pages.concat(extraPages(d)); drawTabs();     // 일기 장 뒤에 사진첩·숫자·성장 장을 잇는다
  const want = Q.get('d'); idx = ND - 1;                                   // 열면 가장 최근 날
  if (CHS[Q.get('ch')]) idx = CHS[Q.get('ch')].at + (+Q.get('pg') || 0);   // ?ch=photo|num|grow&pg=1 — 덤 장 확인용
  if (want) { const i = pages.findIndex(p => p.day === want); if (i >= 0) idx = i; }
  if (Q.get('case') === 'nodiary') pages[idx].diary = '';
  if (Q.get('case') === 'nophoto') pages[idx].photo = false;
  if (Q.get('orient')) pages[idx].orient = Q.get('orient');
  dayStat = dayStats(d.logs || []);
  if (COMMENTS) { API = d.api || localApi(); await loadComments(); } else $('cm-form').hidden = true;
  drawCover(); rest(); coverLayout(); coverSpread(); coverApply();
  if (Q.get('open')) { co = 1; coverApply(); closed = false; cover.classList.add('gone'); } else { vb.setAttribute('inert', ''); if (Q.get('cv')) { co = +Q.get('cv'); coverApply(); } }
  const f = +Q.get('flip');
  if (f > 0 && idx < pages.length - 1) setup(idx, idx + 1, f); else if (f < 0 && idx > 0) setup(idx - 1, idx, 1 + f);
  if (Q.get('mo')) $('btn-month').click();
  window.__book = { go, jump, pages, ND, CHS, openBook, closeBook, get closed() { return closed; }, friend: i => compose(pages[i]).friend, get idx() { return idx; } };
}
const fail = err => { $('under').innerHTML = `<p style="padding:30px 4px;font-size:14px">기록을 불러오지 못했어요. (${esc(err && err.message || err)})</p>`; };
if (EMBED) {
  // 앱(통계 탭 성장앨범 카드)이 iframe 으로 연다 — 부모가 bookStart(자료)를 부른다
  window.bookStart = d => start(d).catch(fail);
} else {
  // 혼자 열었을 때 = 로컬 시안 확인용. 이 자료 파일은 배포에 올라가지 않는다(배포.sh 가 뺀다)
  fetch(DATA).then(r => r.json()).then(d => {
    const ms = d.members.map(m => ({ id: m.user_id, ...CH[m.avatar_url === 'char:mom' ? 'mom' : 'dad'] }));
    return start({ baby: d.baby, days: d.days, members: ms, me: (ms.find(m => m.img === CH.dad.img) || ms[0]).id, logs: d.logs, growth: d.growth, checks: d.checks });
  }).catch(fail);
}
})();
