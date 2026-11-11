// 돌 앨범 — 앱 안 뷰어 (모선 10-27 시안/돌앨범-1022/뷰어/틀.html 의 JS 그대로. 춘봉이 바꾼 줄은 '앱 안:' 주석)
// C 책장 넘김 · 세로 = 위아래 두 쪽 + 쪽 지도 시트 · 가로 = 펼침면 · 두 손가락 확대. 넘김 물리(SETTLE·flipAngle)는 손대지 않았다.
window.AlbumViewer = window.AlbumViewer || {};
(function () {
  const Q = new URLSearchParams(location.search);
  const MODE = ['a', 'b', 'c', 'd'].includes(Q.get('m')) ? Q.get('m') : 'c';   // 앱 안 기본 = C 책장 넘김 (10-27 확정)   // a 밀기 · b 겹침 · c 책장 넘김(딱딱한 장) · d 종이 휨
  const BOOK = MODE === 'c' || MODE === 'd';
  const LAY = ['stack', 'map', 'single'].includes(Q.get('lay')) ? Q.get('lay') : (MODE === 'c' ? 'stack' : '');   // 5R: C 세로 기본 = 위아래 두 쪽, 쪽 지도는 시트로   // 4R 세로 채우기: stack = 두 쪽 위·아래(달력 넘김) · map = 큰 한 쪽 + 쪽 지도
  const VERT = () => BOOK && MODE === 'c' && !land && LAY === 'stack';
  const MAP = () => BOOK && !land && LAY === 'map';
  const SHORT = () => BOOK && land && innerHeight < 500;              // 가로로 돌린 폰: 바를 숨기고 쪽을 키운다
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (Q.get('tag')) document.getElementById('tag').textContent = { a: 'A 밀기', b: 'B 겹침', c: 'C 책장 넘김', d: 'D 종이 휨' }[MODE] + ({ stack: ' · 위아래 두 쪽', map: ' · 쪽 지도' }[LAY] || '');
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), zoomEl = $('#zoom'), countEl = $('#count'), progEl = $('.prog i');

  // 원본 앨범의 펼침 묶음(.spread.one / .two)을 그대로 읽는다 — 가로에서는 이 묶음이 한 화면
  let PAGES = [], SPREADS = [];
  let units = [], slots = [], land = null, S = 0, cx = 0, cy = 0, W = 0, H = 0;
  let p = 0;                                               // 지금 위치(단위 = 화면 한 장, 실수)
  let pageAt = 0;                                          // 지금 보고 있는 첫 쪽 번호(회전해도 유지)

  function collect() {
    document.querySelectorAll('#src > section').forEach(sec => {
      const arts = [...sec.querySelectorAll(':scope > article')];
      SPREADS.push(arts.map(a => PAGES.push(a) - 1));
    });
  }

  function build() {
    const L = innerWidth > innerHeight * 1.1;              // 가로·태블릿 가로 = 펼침면
    if (L === land && slots.length) { measure(); render(); return; }
    land = L;
    if (BOOK) { buildBook(); return; }
    units = land ? SPREADS.map(s => s.slice()) : PAGES.map((_, i) => [i]);
    zoomEl.innerHTML = '';
    slots = units.map(u => {
      const el = document.createElement('div');
      el.className = 'slot spread ' + (u.length === 2 ? 'two' : 'one');
      u.forEach(i => el.appendChild(PAGES[i]));
      zoomEl.appendChild(el);
      return { el, n: u.length };
    });
    p = units.findIndex(u => u.includes(pageAt)); if (p < 0) p = 0;
    measure(); render();
  }

  function measure() {
    W = innerWidth; H = innerHeight;
    let top = 48, bot = window.AlbumViewer.BOT ? window.AlbumViewer.BOT() : 44;   // 앱 안: 아래 바가 동작 버튼 줄이라 높이를 바깥에서 받는다
    document.body.classList.toggle('short', SHORT());
    if (SHORT()) { top = 10; bot = 10; }                              // 바는 쪽 위에 떠서 나왔다 숨는다 — 자리를 잡지 않는다
    if (land) S = Math.min((W - 48) / 2, H - top - bot - (SHORT() ? 0 : 16));
    else if (VERT()) S = Math.min(W - 16, (H - top - bot - 8) / 2);   // 두 쪽 위·아래 = 화면 높이를 거의 다
    else if (MAP()) S = W - 16;
    else S = Math.min(W - 32, H - top - bot - 40);
    cx = W / 2; cy = top + (H - top - bot) / 2;
    if (MAP()) cy = top + 4 + S / 2;                                   // 쪽은 위로 붙이고 아래를 쪽 지도에
  }

  const SPACE = () => BOOK ? 2 * S : W + (MODE === 'a' ? 0 : 40);   // 책: 장 끝이 손가락을 따라오도록 쪽 폭의 2배(모서리가 반대편 끝까지 가는 길)          // 한 장 넘김 = 화면 폭(손가락 이동 = 쪽 이동 1:1)

  function render() {
    if (BOOK) { renderBook(); return; }
    const k = S / 1000;
    for (let u = 0; u < slots.length; u++) {
      const s = slots[u], d = u - p, uw = S * s.n;
      let x = 0, sc = 1, dim = 0, z = 100 - u, vis = true;
      if (MODE === 'a') {
        x = d * SPACE(); vis = Math.abs(d) < 1.6;
      } else {
        // B 겹침: 위 장은 손가락 따라 옆으로 빠지고, 아래 장은 3% 작고 30% 어두운 데서 올라온다
        if (d <= -1) vis = false;
        else if (d <= 0) x = d * SPACE();
        else if (d < 1) { sc = 1 - .03 * d; dim = .3 * d; }
        else vis = false;
      }
      if (!vis) { s.el.style.visibility = 'hidden'; continue; }
      s.el.style.visibility = 'visible';
      s.el.style.zIndex = z;
      const left = cx - uw / 2 + uw * (1 - sc) / 2 + x, top = cy - S / 2 + S * (1 - sc) / 2;
      s.el.style.transform = `translate3d(${left}px,${top}px,0) scale(${k * sc})`;
      s.el.style.setProperty('--dim', dim);
    }
    // 쪽 표시: 펼침면이면 "2–3 / 7"
    const r = Math.max(0, Math.min(units.length - 1, Math.round(p))), u = units[r];
    countEl.textContent = (u.length === 2 ? `${u[0] + 1}–${u[1] + 1}` : `${u[0] + 1}`) + ` / ${PAGES.length}`;
    // 진행 띠는 손가락에 붙어 연속으로 (쪽 표시의 직접 조작 피드백)
    const lo = Math.floor(p), f = p - lo, a = units[Math.max(0, Math.min(units.length - 1, lo))], b = units[Math.max(0, Math.min(units.length - 1, lo + 1))];
    const last = x => x[x.length - 1] + 1;
    progEl.style.transform = `scaleX(${(last(a) + (last(b) - last(a)) * f) / PAGES.length})`;
  }


  // ════════ C·D 책 모드 ════════
  // 세로: 한 쪽 = 오른쪽 장, 제본선 = 왼쪽 가장자리. 가로: 앨범의 묶음을 책 펼침면(왼·오)으로 — 표지는 오른쪽만, 마지막은 왼쪽만.
  // 넘김 lo → lo+1 (f 0→1): 넘어가는 장 앞면 = R(lo), 뒷면 = L(lo+1)(세로는 종이 뒷면), 그 아래 드러나는 쪽 = R(lo+1).
  let bu = [], bslot = {}, grabTop = false, bsh = null;
  function mkSlot(content, cls) {
    const el = document.createElement('div'); el.className = 'slot one bk' + (cls ? ' ' + cls : '');
    if (content) el.appendChild(content);
    const fx = document.createElement('div'); fx.className = 'fx'; const fold = document.createElement('i'); fold.className = 'fold'; fx.appendChild(fold); el.appendChild(fx);
    zoomEl.appendChild(el); return { el, fx, fold };
  }
  function buildBook() {
    document.body.classList.add('book-on');
    zoomEl.innerHTML = '';
    bsh = document.createElement('div'); bsh.className = 'bsh'; zoomEl.appendChild(bsh);
    if (!land && !VERT()) bu = PAGES.map((_, i) => ({ L: null, R: i }));
    else bu = SPREADS.map((s, j) => j === 0 && s.length === 1 ? { L: null, R: s[0] } : s.length === 2 ? { L: s[0], R: s[1] } : j === SPREADS.length - 1 ? { L: s[0], R: null } : { L: s[0], R: 'blank' });
    units = bu.map(u => [u.L, u.R].filter(v => typeof v === 'number'));
    bslot = {};
    PAGES.forEach((pg, i) => bslot[i] = mkSlot(pg));
    bslot.blank = mkSlot(null, 'paper');
    bslot.paper = mkSlot(null, 'paper back');
    slots = Object.values(bslot);
    p = units.findIndex(u => u.includes(pageAt)); if (p < 0) p = 0;
    buildMap();
    measure(); render();
  }
  // 쪽 지도(map): 큰 쪽 아래 남는 자리에 지금 쪽 이름 + 모든 쪽 썸네일. 썸네일은 일기를 채운 뒤의 쪽을 복제(id 제거)해 축소만 한다 — 새 그림 없음
  let mapEl = null, thumbs = [];
  function buildMap() {
    document.body.classList.toggle('map', MAP());
    if (mapEl) { mapEl.remove(); mapEl = null; thumbs = []; }
    if (!MAP()) return;
    mapEl = document.createElement('div'); mapEl.id = 'map';
    mapEl.innerHTML = '<div class="mt"><b></b><span></span></div><div class="grid"></div>';
    const grid = mapEl.querySelector('.grid');
    PAGES.forEach((pg, i) => {
      const t = document.createElement('button'); t.type = 'button'; t.className = 'th';
      const c = pg.cloneNode(true); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); c.removeAttribute('id');
      const w = document.createElement('div'); w.className = 'thw'; w.appendChild(c); t.appendChild(w);
      t.addEventListener('click', () => { const u = units.findIndex(x => x.includes(i)); goTo(u, 0); });
      grid.appendChild(t); thumbs.push(t);
    });
    document.body.appendChild(mapEl);
  }
  const pageName = i => { const pg = PAGES[i], e = pg.querySelector('.eyebrow'), f = pg.querySelector('.folio > span'); return (e ? e.textContent : f ? f.textContent : '').trim(); };
  function renderMap(r) {
    if (!mapEl) return;
    const top = cy + S / 2 + 18, n = Math.min(4, PAGES.length), tw = (W - 16 - 8 * (n - 1)) / n;
    mapEl.style.top = `${top}px`;
    thumbs.forEach((t, i) => { t.style.width = t.style.height = `${tw}px`; t.firstChild.style.transform = `scale(${tw / 1000})`; t.classList.toggle('on', units[r].includes(i)); });
    const i = units[r][0];
    mapEl.querySelector('.mt b').textContent = pageName(i);
    mapEl.querySelector('.mt span').textContent = `${i + 1} / ${PAGES.length}`;
  }
  // 쪽 지도 시트(5R): 위 바 격자 버튼 → 아래에서 올라오는 시트. 썸네일 탭 → 시트 닫고 그 쪽까지 넘긴다.
  const sheet = document.getElementById('sheet'); let sheetThumbs = [];
  function buildSheet() {
    const grid = sheet.querySelector('.grid'); grid.innerHTML = ''; sheetThumbs = [];
    PAGES.forEach((pg, i) => {
      const t = document.createElement('button'); t.type = 'button'; t.className = 'th';
      const c = pg.cloneNode(true); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
      const w = document.createElement('div'); w.className = 'thw'; w.appendChild(c); t.appendChild(w);
      const n = document.createElement('em'); n.textContent = i + 1; t.appendChild(n);
      t.addEventListener('click', () => { closeSheet(); const u = units.findIndex(x => x.includes(i)); setTimeout(() => goTo(u, 0), 140); });
      grid.appendChild(t); sheetThumbs.push(t);
    });
  }
  function layoutSheet() {
    const cols = land ? 6 : 4, pw = Math.min(W, land ? 720 : W) - 32, tw = (pw - 10 * (cols - 1)) / cols;
    sheet.querySelector('.panel').style.width = `${pw + 32}px`;
    const r = Math.max(0, Math.min(units.length - 1, Math.round(p)));
    sheetThumbs.forEach((t, i) => { t.style.width = t.style.height = `${tw}px`; t.firstChild.style.transform = `scale(${tw / 1000})`; t.classList.toggle('on', units[r].includes(i)); });
    sheet.querySelector('.mt span').textContent = countEl.textContent;
  }
  function openSheet() { if (!sheetThumbs.length) buildSheet(); layoutSheet(); sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false'); }
  function closeSheet() { sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); }
  sheet.querySelector('.scrim').addEventListener('click', closeSheet);
  const clipHalf = (n, md, keepNeg) => {             // 1000² 사각형 ∩ 반평면 (x·n − md ≤ 0 이면 앞면 쪽)
    const R = [[0, 0], [1000, 0], [1000, 1000], [0, 1000]], out = [], g = q => (q[0] * n[0] + q[1] * n[1] - md) * (keepNeg ? -1 : 1);
    for (let i = 0; i < 4; i++) {
      const a = R[i], b = R[(i + 1) % 4], ga = g(a), gb = g(b);
      if (ga >= 0) out.push(a);
      if ((ga >= 0) !== (gb >= 0)) { const t = ga / (ga - gb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out;
  };
  const poly = pts => pts.length ? 'polygon(' + pts.map(q => `${q[0].toFixed(2)}px ${q[1].toFixed(2)}px`).join(',') + ')' : 'polygon(0 0)';
  function foldShade(s, M, n, grad) {                // 접힌 선을 따라가는 띠: 3000² 판을 접힌 선 방향으로 돌려 놓고 가로 그라데이션
    s.fold.style.display = 'block';
    s.fold.style.transform = `translate(${M[0] - 1500}px,${M[1] - 1500}px) rotate(${Math.atan2(n[1], n[0])}rad)`;
    s.fold.style.background = grad;
  }
  function put(s, tf, z, side) {
    s.el.style.visibility = 'visible'; s.el.style.transform = tf; s.el.style.zIndex = z;
    const v = VERT();
    s.el.classList.toggle('sL', !v && side === 'L'); s.el.classList.toggle('sR', !v && side === 'R');
    s.el.classList.toggle('sB', v && side === 'L'); s.el.classList.toggle('sT', v && side === 'R');   // 위아래 책: 위 쪽은 아래 가장자리, 아래 쪽은 위 가장자리가 제본선
  }
  function renderBook() {
    const k = S / 1000, last = bu.length - 1, V = VERT(), two = land || V;
    const pc = Math.max(0, Math.min(last, p)); let lo = Math.min(last, Math.floor(pc)), f = pc - lo;
    if (lo === last) f = 0;
    const B = bu[Math.min(last, lo + 1)], A = bu[lo];
    const off = u => !two ? -S / 2 : (u.L == null ? -S / 2 : u.R == null ? S / 2 : 0);   // 닫힌 표지·뒤표지는 화면 가운데로
    // sp = 제본선 좌표(가로 책: x, 위아래 책: y), cr = 그 직각 방향의 쪽 시작(가로 책: 쪽 위 y, 위아래 책: 쪽 왼쪽 x)
    const sm = f * f * (3 - 2 * f);                                  // 5R: 표지 단독 → 펼침면 자리 옮김도 양 끝 속도 0(툭 출발·툭 정지 없이)
    const sp = (V ? cy : cx) + off(A) + (off(B) - off(A)) * sm, cr = V ? cx - S / 2 : cy - S / 2;
    const at = side => V ? [cr, side === 'L' ? sp - S : sp] : [side === 'L' ? sp - S : sp, cr];
    const pv = `${S * 5}px`, po = V ? `${cx}px ${sp.toFixed(1)}px` : `${sp.toFixed(1)}px ${cy}px`;   // 원근 = 쪽 크기×5 (3.2배는 들린 장이 바를 덮었다)
    if (zoomEl.style.perspective !== pv) zoomEl.style.perspective = pv;
    if (zoomEl.style.perspectiveOrigin !== po) zoomEl.style.perspectiveOrigin = po;   // 소실점 = 제본선 (4R: 이 줄이 주석에 먹혀 화면 가운데였다)
    for (const s of slots) { s.el.style.visibility = 'hidden'; s.el.style.clipPath = ''; s.fx.style.background = ''; s.fold.style.display = 'none'; }
    const get = id => id == null ? null : bslot[id];
    // 5R: 누운 장도 넘기는 장과 같은 3D 변환 꼴(회전 0°)로 — 2D↔3D 로 그리는 길이 바뀌면 착지 순간 글자 선명도가 '띡' 바뀐다
    const R0 = side => MODE !== 'c' ? '' : V ? (side === 'L' ? `translateY(${S}px) rotateX(0deg) translateY(${-S}px)` : 'rotateX(0deg)') : (side === 'L' ? `translateX(${S}px) rotateY(0deg) translateX(${-S}px)` : 'rotateY(0deg)');
    const flat = (s, side) => { if (!s) return; const q = at(side); put(s, `translate3d(${q[0]}px,${q[1]}px,0) ${R0(side)} scale(${k})`, 10, side); };
    // 책 그림자: 바닥에 누운 두 장(A.L, 넘기는 중엔 B.R)만 감싼다
    // 5R: 넘어가는 장이 바닥에 닿는 만큼 그림자도 같이 넓힌다(표지를 열 때 왼쪽 그림자가 마지막에 툭 생기던 것)
    const cth = Math.cos(flipAngle(f)), fl = f < 1e-4 ? 0 : 1;
    const a0 = sp - Math.max(A.L != null ? S : 0, fl * (two ? 1 : 0) * S * Math.max(0, -cth));
    const a1 = sp + Math.max((f < 1e-4 ? A.R : B.R) != null ? S : 0, fl * S * Math.max(0, cth));
    if (V) { bsh.style.transform = `translate3d(${cr}px,${a0}px,0)`; bsh.style.width = `${S}px`; bsh.style.height = `${Math.max(0, a1 - a0)}px`; }
    else { bsh.style.transform = `translate3d(${a0}px,${cr}px,0)`; bsh.style.width = `${Math.max(0, a1 - a0)}px`; bsh.style.height = `${S}px`; }
    if (f < 1e-4) { flat(get(A.L), 'L'); flat(get(A.R), 'R'); }
    else {
      const left = get(A.L), under = get(B.R), front = get(A.R), back = two ? get(B.L) : bslot.paper;
      flat(left, 'L'); flat(under, 'R');
      if (MODE === 'c') flipC(front, back, left, under, f, at, k, V);
      else curlD(front, back, under, f, sp, cr, k);
    }
    const r = Math.max(0, Math.min(last, Math.round(p))), u = units[r];
    countEl.textContent = (u.length === 2 ? `${u[0] + 1}–${u[1] + 1}` : `${u[0] + 1}`) + ` / ${PAGES.length}`;
    const lp = x => x.length ? x[x.length - 1] + 1 : 0, ua = units[lo], ub = units[Math.min(last, lo + 1)];
    progEl.style.transform = `scaleX(${(lp(ua) + (lp(ub) - lp(ua)) * f) / PAGES.length})`;
    renderMap(r);
  }
  // C: 딱딱한 장. 장 끝의 화면 위치가 손가락을 따라오도록 θ = acos(1 − 2f).
  // 가로 책은 rotateY(제본선 = 세로줄), 위아래 책은 rotateX(제본선 = 가로줄, 달력처럼 아래 쪽이 위로 넘어간다). 그림자·빛 방향도 같이 90° 돈다.
  // 5R: acos(1−2f) 는 양 끝에서 기울기가 무한대라, 정착 마지막 한 프레임에 장이 몇 도씩 '툭' 내려앉았다(사장님 "띡").
  // 가운데는 손가락 따라오는 acos, 양 끝으로 갈수록 πf(기울기 유한)로 섞는다 → 마지막 프레임과 정지 화면이 거의 같은 각도.
  function flipAngle(f) {
    const lin = Math.PI * f, w = Math.sqrt(Math.max(0, 4 * f * (1 - f))), th = lin + (Math.acos(Math.max(-1, Math.min(1, 1 - 2 * f))) - lin) * w;
    const E = .6 * Math.PI / 180;                                     // 0.6° 안쪽은 정지 각도로 딱 붙인다 — 3D 래스터 ↔ 평면 래스터가 바뀌는 순간을 착지 직전 한 프레임 안에 숨김
    return th < E ? 0 : th > Math.PI - E ? Math.PI : th;
  }
  function flipC(front, back, left, under, f, at, k, V) {
    const th = flipAngle(f), s = Math.sin(th), deg = th * 180 / Math.PI, S_ = S;
    const dF = V ? 180 : 90, dB = V ? 0 : 270;                     // 그라데이션 방향: 제본선 → 바깥
    if (deg < 90) {
      const q = at('R');
      front && put(front, `translate3d(${q[0]}px,${q[1]}px,0) ${V ? `rotateX(${deg}deg)` : `rotateY(${-deg}deg)`} scale(${k})`, 20, 'R');
      if (front) front.fx.style.background = `linear-gradient(${dF}deg, rgba(255,255,255,${.10 * s}) 0, rgba(0,0,0,${.04 * s}) 40%, rgba(0,0,0,${.26 * s}) 100%)`;
      const pw = Math.cos(th) * 1000;                   // 들린 장이 아래 쪽에 드리우는 그림자: 제본선에서 장 끝 너머까지
      if (under) under.fx.style.background = `linear-gradient(${dF}deg, rgba(0,0,0,${.30 * s}) 0, rgba(0,0,0,${.12 * s}) ${pw}px, rgba(0,0,0,0) ${pw + 40 + 160 * s}px)`;
    } else {
      const q = at('L');
      const rot = V ? `translateY(${S_}px) rotateX(${-(180 - deg)}deg) translateY(${-S_}px)` : `translateX(${S_}px) rotateY(${180 - deg}deg) translateX(${-S_}px)`;
      back && put(back, `translate3d(${q[0]}px,${q[1]}px,0) ${rot} scale(${k})`, 20, 'L');
      if (back) back.fx.style.background = `linear-gradient(${dB}deg, rgba(255,255,255,${.10 * s}) 0, rgba(0,0,0,${.04 * s}) 40%, rgba(0,0,0,${.26 * s}) 100%)`;
      const pw = -Math.cos(th) * 1000;
      if (left) left.fx.style.background = `linear-gradient(${dB}deg, rgba(0,0,0,${.30 * s}) 0, rgba(0,0,0,${.12 * s}) ${pw}px, rgba(0,0,0,0) ${pw + 40 + 160 * s}px)`;
    }
  }
  // D: 얇은 종이. 잡은 모서리 C 가 손가락 F 로 오고, 접힌 선 = C·F 의 수직이등분선. 접혀 넘어간 부분은 그 선에 대칭으로 뒤집혀 뒷면을 보인다.
  // 모서리 경로가 제본선 두 끝에서 쪽 폭 안에 머물러(|F − 제본 끝| ≤ 폭) 접힌 선이 제본선을 가로지르지 않는다.
  function curlD(front, back, under, f, spX, top, k) {
    if (!front) return;
    const cyC = grabTop ? 0 : 1000, lift = 120 * Math.sin(Math.PI * f);
    const C = [1000, cyC], F = [1000 - 2000 * f, grabTop ? lift : 1000 - lift];
    let n = [C[0] - F[0], C[1] - F[1]]; const len = Math.hypot(n[0], n[1]); n = [n[0] / len, n[1] / len];
    const M = [(C[0] + F[0]) / 2, (C[1] + F[1]) / 2], md = M[0] * n[0] + M[1] * n[1];
    const a = Math.min(1, f * 10) * Math.min(1, (1 - f) * 5);   // 접힘 그림자 세기: 막 들릴 때 생기고, 다 넘어가기 직전 0으로(남으면 제본선에 검은 띠가 남는다)
    const base = `translate3d(${spX}px,${top}px,0) scale(${k})`;
    put(front, base, 20, 'R'); front.el.style.clipPath = poly(clipHalf(n, md, true));
    foldShade(front, M, n, `linear-gradient(90deg, rgba(0,0,0,0) 1410px, rgba(0,0,0,${.16 * a}) 1500px, rgba(0,0,0,0) 1500px)`);
    if (under) foldShade(under, M, n, `linear-gradient(90deg, rgba(0,0,0,0) 1500px, rgba(0,0,0,${.34 * a}) 1500px, rgba(0,0,0,0) ${1500 + 70 + 90 * a}px)`);
    if (!back) return;
    const A0 = 1 - 2 * n[0] * n[0], B0 = -2 * n[0] * n[1], D0 = 1 - 2 * n[1] * n[1], e = 2 * md * n[0], g = 2 * md * n[1];
    const flapPoly = clipHalf(n, md, false);
    const flapGrad = `linear-gradient(90deg, rgba(0,0,0,0) 1500px, rgba(0,0,0,${.10 * a}) 1500px, rgba(255,255,255,${.30 * a}) 1528px, rgba(255,255,255,0) 1650px, rgba(0,0,0,${.10 * a}) 2500px)`;
    if (!land) {                                      // 세로: 종이 뒷면(빈 종이)을 대칭으로
      put(back, `${base} matrix(${A0},${B0},${B0},${D0},${e},${g})`, 30, 'L'); back.el.style.clipPath = poly(flapPoly);
      foldShade(back, M, n, flapGrad);
    } else {                                          // 가로: 뒷면 = 다음 펼침면의 왼쪽 쪽. 대칭 두 번(좌우 + 접힌 선) = 회전이라 글자가 바로 읽힌다
      put(back, `${base} matrix(${-A0},${-B0},${B0},${D0},${1000 * A0 + e},${1000 * B0 + g})`, 30, 'L');
      back.el.style.clipPath = poly(flapPoly.map(q => [1000 - q[0], q[1]]));
      foldShade(back, [1000 - M[0], M[1]], [-n[0], n[1]], flapGrad);
    }
  }

  // ── 트윈: rAF + 직접 짠 이징 (WAAPI 대신, render(p) 한 길로) ──
  const bez = (x1, y1, x2, y2) => t => {          // cubic-bezier 평가 (뉴턴)
    const cxp = 3 * x1, bx = 3 * (x2 - x1) - cxp, ax = 1 - cxp - bx, cyp = 3 * y1, by = 3 * (y2 - y1) - cyp, ay = 1 - cyp - by;
    let s = t; for (let i = 0; i < 6; i++) { const xx = ((ax * s + bx) * s + cxp) * s - t, dx = (3 * ax * s + 2 * bx) * s + cxp; if (Math.abs(dx) < 1e-6) break; s -= xx / dx; }
    s = Math.max(0, Math.min(1, s)); return ((ay * s + by) * s + cyp) * s;
  };
  const SETTLE = bez(.22, .61, .36, 1);           // 넘김 정착 = easeOutCubic(출발 기울기 3 → 놓은 손가락 속도를 이어 받음)
  const BACK = bez(.16, 1, .3, 1);                // 확대 복귀
  let tw = null;
  function tween(from, to, ms, ease, step, done) {
    cancelAnimationFrame(tw); const t0 = performance.now();
    if (RM || ms <= 0) { step(to); done && done(); return; }
    const f = now => { const t = Math.min(1, (now - t0) / ms), e = ease(t); step(from + (to - from) * e); if (t < 1) tw = requestAnimationFrame(f); else { tw = null; done && done(); } };
    tw = requestAnimationFrame(f);
  }
  function goTo(target, vPxMs) {
    target = Math.max(0, Math.min(units.length - 1, target));
    const distPx = Math.abs(target - p) * SPACE();
    // 놓은 속도를 이어 받는 길이: easeOutCubic 은 출발 기울기 3 → dur = 3·거리/속도. 180~340ms 사이로 묶는다
    let ms = vPxMs > .25 ? 3 * distPx / vPxMs : 300;
    ms = Math.max(180, Math.min(BOOK ? 400 : 340, ms));   // 책장은 도는 길이 길어 상한 400
    if (distPx < 1) ms = 0;
    const many = Math.abs(target - p) > 1.2;                          // 쪽 지도에서 멀리 이동: 장마다 260ms, 최대 900ms, 시작·끝 부드럽게
    if (many) ms = Math.min(900, 260 * Math.abs(target - p));
    tween(p, target, ms, many ? bez(.45, 0, .25, 1) : SETTLE, v => { p = v; render(); }, () => { pageAt = units[target][0]; });
  }

  // ── 손가락: 한 손가락 = 넘김, 두 손가락 = 확대(놓으면 제자리) ──
  const ptr = new Map();
  let drag = null, pinch = null, zoomZ = 1, zoomT = [0, 0], tapOK = false, ignoreUntilUp = false;
  const applyZoom = () => { zoomEl.style.transform = (zoomZ === 1 && !zoomT[0] && !zoomT[1]) ? '' : `translate3d(${zoomT[0]}px,${zoomT[1]}px,0) scale(${zoomZ})`; };

  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId);
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptr.size === 1 && !ignoreUntilUp) {
      cancelAnimationFrame(tw); tw = null;                  // 넘어가는 중에 잡으면 그 자리에서 잡힌다
      grabTop = e.clientY < cy;                             // D: 위쪽을 잡으면 위 모서리부터 휜다
      drag = { x0: e.clientX, y0: e.clientY, p0: p, axis: null, hist: [[e.timeStamp, e.clientX]], t0: e.timeStamp };
      tapOK = true;
    } else if (ptr.size === 2) {
      // 두 번째 손가락: 넘김을 놓고(가장 가까운 장으로) 확대로
      if (drag) { drag = null; goTo(Math.round(p), 0); }
      tapOK = false;
      const [a, b] = [...ptr.values()];
      cancelAnimationFrame(zw);
      document.body.classList.add('zooming');
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), z0: zoomZ, t0: zoomT.slice(), m0: [(a.x + b.x) / 2, (a.y + b.y) / 2] };
    }
  });
  stage.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return;
    ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptr.size >= 2) {
      const [a, b] = [...ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y), m = [(a.x + b.x) / 2, (a.y + b.y) / 2];
      let z = pinch.z0 * d / pinch.d0;
      if (z < 1) z = 1 - (1 - z) * .35;                       // 1배 아래로는 고무줄
      z = Math.min(z, 4);
      const c = [(pinch.m0[0] - pinch.t0[0]) / pinch.z0, (pinch.m0[1] - pinch.t0[1]) / pinch.z0];   // 처음 두 손가락 사이에 있던 쪽 위의 점
      zoomZ = z; zoomT = [m[0] - c[0] * z, m[1] - c[1] * z]; applyZoom();
      // 손가락이 움직이는 동안만 합성 레이어(부드럽게), 멈추면 120ms 뒤 풀어서 그 배율로 다시 선명하게 그린다
      zoomEl.style.willChange = 'transform'; clearTimeout(wcT); wcT = setTimeout(() => zoomEl.style.willChange = '', 120);
      return;
    }
    if (!drag) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.axis && Math.hypot(dx, dy) > 8) drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (Math.hypot(dx, dy) > 6) tapOK = false;
    if (drag.axis !== 'x' && !(drag.axis === 'y' && VERT())) return;   // 위아래 책은 위로 쓸어 올려도 넘어간다(달력)
    if (!drag.locked) { drag.locked = true; drag.hist = [[e.timeStamp, drag.axis === 'y' ? e.clientY : e.clientX]]; }
    const dd = drag.axis === 'y' ? dy : dx;
    let np = drag.p0 - dd / SPACE();
    if (np < 0) np = -(-np) * .3; else if (np > units.length - 1) np = units.length - 1 + (np - units.length + 1) * .3;   // 끝 장은 고무줄
    p = np; render();
    drag.hist.push([e.timeStamp, drag.axis === 'y' ? e.clientY : e.clientX]); while (drag.hist.length > 2 && e.timeStamp - drag.hist[0][0] > 90) drag.hist.shift();
  });
  let zw = null, wcT = null;
  function endPointer(e) {
    if (!ptr.has(e.pointerId)) return;
    ptr.delete(e.pointerId);
    if (pinch) {
      if (ptr.size < 2) {
        pinch = null; ignoreUntilUp = ptr.size > 0;
        // 놓으면 제자리: 260ms ease-out
        const z0 = zoomZ, t0 = zoomT.slice(), t1 = performance.now(), ms = RM ? 0 : 260;
        clearTimeout(wcT); zoomEl.style.willChange = 'transform';
        const f = now => { const t = ms ? Math.min(1, (now - t1) / ms) : 1, k = BACK(t);
          zoomZ = z0 + (1 - z0) * k; zoomT = [t0[0] * (1 - k), t0[1] * (1 - k)];
          if (t >= 1) { zoomZ = 1; zoomT = [0, 0]; document.body.classList.remove('zooming'); zoomEl.style.willChange = ''; } applyZoom(); if (t < 1) zw = requestAnimationFrame(f); };
        zw = requestAnimationFrame(f);
      }
      return;
    }
    if (ptr.size === 0) ignoreUntilUp = false;
    if (!drag) return;
    const d = drag; drag = null;
    if (tapOK && e.timeStamp - d.t0 < 260) { document.body.classList.toggle('chrome-off'); return; }
    if (d.axis !== 'x' && !(d.axis === 'y' && VERT())) { goTo(Math.round(p), 0); return; }
    const h = d.hist, dt = h[h.length - 1][0] - h[0][0], v = dt > 0 ? (h[h.length - 1][1] - h[0][1]) / dt : 0;   // px/ms, 오른쪽 +
    const moved = p - d.p0;                                 // + = 앞으로(왼쪽으로) 끌었음
    let target = Math.round(p);
    if (Math.abs(v) > .35) target = v < 0 ? Math.floor(d.p0) + 1 : Math.ceil(d.p0) - 1;   // 튕김: 속도 방향으로 한 장
    else if (Math.abs(moved) > .22) target = moved > 0 ? Math.floor(d.p0) + 1 : Math.ceil(d.p0) - 1;   // 천천히: 22% 넘게 끌면 넘어간다
    else target = Math.round(d.p0);
    goTo(target, Math.abs(v));
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  addEventListener('keydown', e => { if (e.key === 'ArrowRight') goTo(Math.round(p) + 1, 0); if (e.key === 'ArrowLeft') goTo(Math.round(p) - 1, 0); });
  addEventListener('resize', () => { if (PAGES.length) build(); });

  // 상단 버튼: 시안이라 동작 대신 안내만
  let tt; const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 1600); };
  document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => b.dataset.act === 'toc' ? openSheet() : (window.AlbumViewer.onAct && window.AlbumViewer.onAct(b.dataset.act, b))));   // 앱 안: 동작은 app.js 가 받는다

  // 앱 안: 쪽을 다 만들고(일기 줄 수 계산 끝) app.js 가 부른다 — 쪽을 꺼내 와서 등장
  window.AlbumViewer.init = () => requestAnimationFrame(() => {
    PAGES = []; SPREADS = []; slots = []; land = null; pageAt = 0; p = 0; sheetThumbs = [];
    collect(); build();
    requestAnimationFrame(() => { document.body.classList.remove('pre'); document.body.classList.add('entering'); });
    setTimeout(() => document.body.classList.remove('entering'), 700);
    if (SHORT()) setTimeout(() => document.body.classList.add('chrome-off'), 1400);   // 가로 폰: 1.4초 보여 줬다가 숨김, 탭하면 다시
    window.__viewerReady = true;
  });
  window.AlbumViewer.pages = () => PAGES;
  window.AlbumViewer.toast = toast;
  window.AlbumViewer.goTo = i => goTo(units.findIndex(u => u.includes(i)), 0);
  window.__viewer = { get p() { return p; }, get units() { return units.length; }, set(v, top) { grabTop = !!top; p = v; render(); } };   // set: 정지 컷 검수용(녹화엔 안 씀)
  addEventListener('keydown', e => { if (e.key === 'Escape') window.AlbumViewer.onAct && window.AlbumViewer.onAct('back'); });
})();
