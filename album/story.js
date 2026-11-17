// 성장 앨범 — 폰 전용 앨범 뷰어 (춘봉 2026-11-12 스토리형 → 11-13 앱 형식)
// 11-13 사장님: "위에 스토리 형식의 바는 삭제 하고 그냥 앱처럼 가자 위에 카테고리 메뉴가 있고 여기는 1달 부터 12달까지 파일칩이고 누르면 이미지폴더같이 쌓여있고
//   위아래로 스크롤되고 하나 누르면 그때 쓴 일기의 내용과 사진이 같이 나오는 형식. 우선 여기까지"
// 위 = 제목 + 닫기 + 카테고리 메뉴(표지·사진첩·달마다·숫자·성장·기념일·가족). 아래 = 고른 카테고리 화면, 세로 스크롤.
// 사진첩(11-13 정정 "기존에 작업햇던 모양이 1~12달의 파일칩이고 그걸 누르면 그달의 일기가 차트처럼 촤라락") = 달 타일 판 → 그 달 하루하루가 쌓인 카드 → 그날 사진 + 일기 전문. 다른 카테고리는 어제 컷을 높이 그대로 세로로 이어 담았다.
// 없앤 것: 챕터 진행 막대, 탭으로 컷 넘김, 꾹 누름, 자동 넘김(?auto=1), 목차 컷. 옛 판은 album.bak-1113/.
// 가로 폰·태블릿: 같은 화면을 폰 비율 틀(393×852)에 담아 가운데에 scale 로.
window.AlbumStory = (function () {
  const $ = s => document.querySelector(s);
  const root = $('#story'), frame = $('#pframe'), cutsEl = $('#pcuts'), tabsEl = $('.p-tabs'), ttEl = $('.p-bar .tt');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ORDER = ['표지', '사진첩', '달마다', '숫자', '성장', '기념일', '가족'], HDR = 84;   // HDR = 제목 줄 40 + 메뉴 44 (story.css .pcat top 과 같은 값)
  let built = null, cuts = [], els = [], cats = [], cat = 0, io = null;
  let LW = 0, LHt = 0, scale = 1, k = 1, sat = 0, still = false;
  const api = { onAct: null };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const catOf = c => c.pane ? c.ch : /개월$/.test(c.ch) ? '달마다' : c.ch;

  // ── 조립: 컷을 카테고리별 화면에 담는다 ──
  function mount(b) {
    built = b; cuts = b.phone.scenes.filter(c => c.name !== '목차');
    cats = ORDER.map(name => ({ name, cuts: cuts.filter(c => catOf(c) === name) })).filter(c => c.cuts.length);
    cutsEl.innerHTML = cats.map((c, i) => `<div class="pcat${c.cuts[0].pane ? ' pane' : ''}" data-cat="${i}" role="tabpanel" aria-label="${c.name}">${c.cuts.map(x => x.html).join('')}</div>`).join('');
    tabsEl.innerHTML = cats.map((c, i) => `<button type="button" role="tab" data-cat="${i}">${c.name}</button>`).join('');
    cats.forEach((c, i) => { c.el = cutsEl.children[i]; c.cuts.forEach((x, j) => { x.el = c.el.children[j]; x.ci = i; }); });
    els = cuts.map(c => c.el);
    els.forEach(el => [...el.querySelectorAll('.p-in > *')].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 6))));
    els.forEach(el => el.querySelectorAll('img').forEach(im => { if (!im.complete) im.addEventListener('load', () => { clearTimeout(mount.t); mount.t = setTimeout(layout, 60); }, { once: true }); }));
    ttEl.textContent = built.title || '';
    document.body.classList.add('st-on');                  // 먼저 보이게 — 숨은 채로 재면 크기가 전부 0 이다
    if (io) io.disconnect();
    // 컷이 화면에 절반쯤 들어오면 한 번만: 덩어리가 12px 올라오며 켜지고 큰 숫자가 세어 올라간다(어제 컷 등장 그대로)
    io = RM ? null : new IntersectionObserver(es => es.forEach(e => { const el = e.target; if (e.isIntersecting && !el._played && !still) { el._played = true; el.classList.add('on', 'play'); countUp(el); } }), { root: frame, threshold: .45 });
    cat = 0; layout(); go(0, true);
    if (io) els.forEach(el => { if (el.classList.contains('psc')) io.observe(el); });
  }

  // ── 화면에 맞추기: 폰 세로 = 화면 그대로 / 그 밖 = 393×852 틀을 줄여 가운데 ──
  function layout() {
    const W = innerWidth, H = innerHeight, phone = W <= H && W <= 560;
    if (phone) { LW = W; LHt = H; scale = 1; } else { LW = 393; LHt = 852; scale = Math.min((H - 24) / LHt, (W - 24) / LW); }
    frame.classList.toggle('boxed', !phone);
    frame.style.width = LW + 'px'; frame.style.height = LHt + 'px'; frame.style.transform = `translate(-50%, -50%) scale(${scale})`;
    const probe = document.createElement('i'); probe.style.cssText = 'position:absolute;visibility:hidden;height:var(--sat);width:var(--sab)'; frame.appendChild(probe);
    sat = probe.offsetHeight; const sab = probe.offsetWidth; probe.remove();
    k = Math.max(0, Math.min(1, (LHt - sat - sab - 620) / 140));   // 0 = 작은 폰(375×667) … 1 = 큰 폰(393×852~)
    frame.style.setProperty('--k', k.toFixed(3));
    // 컷 높이: 어제 스토리 컷의 안쪽 높이를 그대로 지킨다(화면 − 노치 − 44). 메뉴가 그보다 38px 더 먹어서 컷이 화면보다 그만큼 길다 — 세로로 이어 미는 화면이라 괜찮다.
    // 컷이 하나뿐인 카테고리(표지·성장·기념일)는 38px 만 밀리는 게 어색해서 화면 높이에 딱 맞춘다(넘치면 --fz 안전망).
    const full = LHt - sat - 44, pane = LHt - sat - HDR;
    cats.forEach(c => { const one = c.cuts.length === 1; c.cuts.forEach(x => { if (!x.pane) x.el.style.setProperty('--cuth', (one ? pane : full) + 'px'); }); c.el.style.overflowY = one ? 'hidden' : ''; });
    const cur = cats[cat] && cats[cat].el; cats.forEach(c => c.el.classList.add('on'));   // 재려면 전부 보여야 한다
    els.forEach(el => fitCut(el, k, true));
    cats.forEach(c => c.el.classList.toggle('on', c.el === cur));
    if (lbOn()) sizePhoto();
  }

  // 한 컷 안의 '화면 크기에서 나오는 것'들: 캐릭터 크기 · 일기 · 성장 곡선. 넘치면 --fz 로 한 단계씩 줄인다(아주 작은 폰 안전망)
  function fitCut(el, kk, guard) {
    const inn = el.querySelector('.p-in'); if (!inn) return;
    const steps = guard ? [1, .95, .9, .85, .8, .75] : [1];
    for (const fz of steps) {
      el.style.setProperty('--fz', fz);
      fitArt(el); fitDiary(el); fitChart(el);
      if (!overflow(el)) break;
    }
  }
  function overflow(el) {   // 흐름 안의 마지막 덩어리가 안쪽 상자 바닥을 넘는가 (바닥까지 걸치는 그림·아이콘은 일부러 넘는 것이라 뺀다)
    const inn = el.querySelector('.p-in'), cs = getComputedStyle(inn);
    const kids = [...inn.children].filter(c => !c.classList.contains('p-art') && !c.classList.contains('ic'));
    const limit = inn.clientHeight - parseFloat(cs.paddingBottom) + 1, last = kids[kids.length - 1];
    return !!last && last.offsetTop + last.offsetHeight > limit;
  }
  function fitArt(el) {
    el.querySelectorAll('[data-art]').forEach(box => {
      const im = box.querySelector('img'), w = box.clientWidth, h = box.clientHeight; let s, top;
      if (box.dataset.art === 'mo') { s = Math.max(w * 1.42, h / .72); top = -.12 * s; }   // 달 그림: 화면 폭의 1.42배로 크게 — 아기가 상자 위에서 시작해 아래로 걸친다
      else { s = Math.min(w * 1.12, h * 1.1); top = (h - s) / 2 + s * .03; }
      im.style.cssText = `width:${s}px;height:${s}px;left:${(w - s) / 2}px;top:${top}px`;
    });
  }
  function fitDiary(el) {   // 고른 일기(그 달 최대 8편)를 줄이지 않고 다 싣는다 — 칸 안에서 세로로 밀고, 끝에 닿으면 바깥 화면이 이어서 밀린다
    const d = el.querySelector('.p-diary'); if (!d || d.dataset.done) return;
    const items = JSON.parse(d.dataset.items);
    d.innerHTML = items.map(it => `<p><span class="dd">${it.d}</span>${esc(it.t)}</p>`).join(''); d.dataset.done = 1; d.dataset.shown = items.length;
  }
  function fitChart(el) {
    const c = el.querySelector('[data-chart]'); if (!c || !built) return;
    c.innerHTML = ''; const w = c.clientWidth, h = c.clientHeight; if (w > 40 && h > 80) c.innerHTML = built.phone.chart(w, Math.min(h, w * 1.1));
  }
  // 큰 숫자 세어 올리기(숫자 컷): 900ms, expo-out — 끝에서 길게 눕는다. 값은 dt 가 아니라 경과 시간으로 계산
  function countUp(el) {
    el.querySelectorAll('[data-count]').forEach(b => {
      const n = +b.dataset.count, t0 = performance.now(), D = 900; if (!(n > 0)) return;
      const f = now => { const t = Math.min(1, (now - t0 - 150) / D), e = t <= 0 ? 0 : 1 - Math.pow(2, -10 * t); b.textContent = Math.round(n * (t >= 1 || still ? 1 : e)).toLocaleString('en-US'); if (t < 1 && !still) requestAnimationFrame(f); };
      b.textContent = '0'; requestAnimationFrame(f);
    });
  }

  // ── 카테고리 고르기 ──
  function go(i, first) {
    i = Math.max(0, Math.min(cats.length - 1, i)); closePhoto(true); board(); cat = i;
    cats.forEach((c, j) => c.el.classList.toggle('on', j === i));
    [...tabsEl.children].forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', j === i); });
    const t = tabsEl.children[i]; if (t) tabsEl.scrollTo({ left: t.offsetLeft - (tabsEl.clientWidth - t.offsetWidth) / 2, behavior: first || RM || still ? 'auto' : 'smooth' });
    if (!first) cats[i].el.scrollTop = 0;
  }
  function goScene(id, instant) {   // 숫자 칩 · '다시 보기' 처럼 컷 이름으로 가기
    const x = cuts.find(c => c.el.dataset.scene === id); if (!x) return;
    if (x.ci !== cat) go(x.ci);
    if (!x.pane) cats[x.ci].el.scrollTo({ top: x.el.offsetTop, behavior: instant || RM || still ? 'auto' : 'smooth' });
  }

  // ── 사진첩: 달 타일을 누르면 그 달 카드 스택, 뒤로 가면 다시 타일 판(밀어 둔 자리 그대로) ──
  function month(m) {
    const bk = cutsEl.querySelector('.pbk'); if (!bk) return; const tile = bk.querySelector(`.p-tile[data-m="${m}"]`); if (!tile || tile.disabled) return;
    bk.querySelectorAll('.bk-stack').forEach(s => s.classList.toggle('on', s.dataset.m === String(m)));
    bk.classList.add('open'); bk.classList.toggle('play', !RM && !still); bk.dataset.m = m;
    bk.querySelector('.bk-body').scrollTop = 0; bk.querySelector('.bk-back').focus({ preventScroll: true });
  }
  function board() {
    const bk = cutsEl.querySelector('.pbk'); if (!bk || !bk.classList.contains('open')) return false;
    bk.classList.remove('open', 'play'); const t = bk.querySelector(`.p-tile[data-m="${bk.dataset.m}"]`); if (t) t.focus({ preventScroll: true }); return true;
  }

  // ── 카드 하나 = 그날 사진 + 일기 전문. 카드 색이 카드 자리에서 화면으로 번지고 내용이 열린다. 닫으면 그 카드로 돌아간다(기본 전환 — 다듬기는 모선)
  let lb = null, lbCard = null, lbT = 0;
  const lbOn = () => !!lb && lb.classList.contains('on') && !lb.classList.contains('out');
  function lbEl() {
    if (lb) return lb;
    lb = document.createElement('div'); lb.className = 'p-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', '그날 사진과 일기');
    lb.innerHTML = '<div class="lb-bar"><button type="button" class="lb-back" data-act="lbclose" aria-label="사진첩으로 돌아가기"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg><span></span></button></div>'
      + '<div class="lb-sc"><div class="lb-in"><div class="lb-head"><div class="lb-date"></div><div class="lb-sub"></div></div><figure class="lb-ph"><div class="ph"><img alt=""></div><span class="wk"></span></figure><p class="lb-text"></p></div></div>';
    lb.querySelector('img').addEventListener('load', sizePhoto);
    frame.appendChild(lb); return lb;
  }
  function insetOf(t) {   // 카드에서 실제로 보이는 띠(다음 카드에 덮이지 않은 부분, 스크롤 칸 안)
    const f = frame.getBoundingClientRect(), r = t.getBoundingClientRect(), nx = t.nextElementSibling, body = t.closest('.bk-body').getBoundingClientRect(), q = v => (v / scale).toFixed(1) + 'px';
    const top = Math.max(r.top, body.top), bot = Math.max(top + 24 * scale, Math.min(r.bottom, body.bottom, nx ? nx.getBoundingClientRect().top + 26 * scale : 1e9));
    return `inset(${q(top - f.top)} ${q(f.right - r.right)} ${q(f.bottom - bot)} ${q(r.left - f.left)} round 26px)`;
  }
  const FULL = 'inset(0px 0px 0px 0px round 0px)';
  function sizePhoto() {   // 사진 모양 그대로(세로·가로·정사각 어느 비율이든) 가운데에 크게 — 폭을 다 쓰되(양옆 36px + 흰 틀) 화면 높이의 46% 를 넘지 않게. 나머지는 밀어서 읽는다
    if (!lb) return; const im = lb.querySelector('img'), box = lb.querySelector('.lb-ph .ph');
    const ar = im.naturalWidth ? im.naturalWidth / im.naturalHeight : .8, w = Math.min(LW - 72 - 20, LHt * .46 * ar);
    box.style.width = w + 'px'; box.style.height = w / ar + 'px';
  }
  function openPhoto(i, card, instant) {
    const p = built && built.phone.photos[i]; if (!p) return; const L = lbEl(), im = L.querySelector('img');
    L.style.setProperty('--db', p.db); L.style.setProperty('--tf', p.f); L.classList.toggle('lt', p.lt);   // 바탕 = 그 카드 색(흰 글자 카드는 본문 대비가 나오게 조금 깊게), 글 = 카드 글자색
    L.querySelector('.lb-ph').hidden = !p.src; if (p.src && im.getAttribute('src') !== p.src) im.src = p.src; im.alt = p.alt;
    L.querySelector('.lb-back span').textContent = `${p.mi + 1}달`;
    L.querySelector('.lb-date').textContent = p.head; L.querySelector('.lb-sub').textContent = p.dn; L.querySelector('.wk').textContent = p.dn;
    const tx = L.querySelector('.lb-text'); tx.textContent = p.diary || '이날은 일기를 쓰지 않았어요.'; tx.classList.toggle('no', !p.diary);
    lbCard = card || null; clearTimeout(lbT); L.classList.remove('out'); sizePhoto(); L.querySelector('.lb-sc').scrollTop = 0;
    if (card && !RM && !instant && !still) { L.style.transition = 'none'; L.style.clipPath = insetOf(card); L.classList.add('on'); void L.offsetWidth; L.style.transition = ''; }
    L.style.clipPath = FULL; L.classList.add('on', 'in');
    L.querySelector('.lb-back').focus({ preventScroll: true });
  }
  function closePhoto(instant) {
    if (!lb || !lb.classList.contains('on')) return; clearTimeout(lbT);
    const t = lbCard, done = () => { lb.classList.remove('on', 'in', 'out'); lb.style.clipPath = FULL; };
    if (t && t.isConnected) t.focus({ preventScroll: true });
    if (instant || RM || still || !t || !t.isConnected) return done();
    lb.classList.remove('in'); lb.classList.add('out'); lb.style.clipPath = insetOf(t); lbT = setTimeout(done, 280);
  }

  // ── 누르기: 전부 버튼. 빈 곳을 눌러도 아무 일도 없다(앱처럼) ──
  root.addEventListener('contextmenu', e => { if (!e.target.closest('.lb-text')) e.preventDefault(); });
  root.addEventListener('click', e => {
    if (lb && lb.classList.contains('on')) { if (lbOn() && e.target.closest('[data-act="lbclose"]')) closePhoto(); return; }
    const tab = e.target.closest('.p-tabs button'); if (tab) { go(+tab.dataset.cat); return; }
    const tile = e.target.closest('.p-tile'); if (tile) { month(+tile.dataset.m); return; }
    const ph = e.target.closest('button[data-photo]'); if (ph) { openPhoto(+ph.dataset.photo, ph); return; }
    const g = e.target.closest('button[data-go]'); if (g) { goScene(g.dataset.go); return; }
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'again') go(0); else if (a === 'bkback') board(); else api.onAct && api.onAct(a);
  });
  addEventListener('keydown', e => {
    if (!document.body.classList.contains('st-on')) return;
    if (lb && lb.classList.contains('on')) { if (e.key === 'Escape') closePhoto(); return; }
    if (e.key === 'ArrowRight') go(cat + 1); else if (e.key === 'ArrowLeft') go(cat - 1);
    else if (e.key === 'Escape') { if (!board()) api.onAct && api.onAct('close'); }
  });
  let rt = 0; addEventListener('resize', () => { if (!els.length) return; clearTimeout(rt); rt = setTimeout(layout, 80); });

  let tt; const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 1600); };

  // 검수·캡처용: 정지 상태(등장 모션 없이) + 넘침 목록
  const settle = () => { still = true; els.forEach(el => { el._played = true; el.classList.remove('play'); el.querySelectorAll('[data-count]').forEach(b => { b.textContent = (+b.dataset.count).toLocaleString('en-US'); }); }); };
  window.__story = {
    get at() { return cat; }, get n() { return cuts.length; }, get names() { return cuts.map(c => c.name); }, get cats() { return cats.map(c => c.name); }, get k() { return k; },
    set(i) { settle(); const x = cuts[i]; go(x.ci, true); if (!x.pane) cats[x.ci].el.scrollTop = x.el.offsetTop; },
    cat(name) { settle(); go(cats.findIndex(c => c.name === name), true); cats[cat].el.scrollTop = 0; },
    month(m) { settle(); month(m); }, board() { board(); }, get opened() { const b = cutsEl.querySelector('.pbk'); return b.classList.contains('open') ? +b.dataset.m : -1; }, scroll(y) { const b = cutsEl.querySelector('.bk-body'); b.scrollTop = y; return b.scrollTop; }, bscroll(y) { const b = cutsEl.querySelector('.bk-board'); b.scrollTop = y; return b.scrollTop; },
    zoom(i) { settle(); openPhoto(i, cutsEl.querySelector(`[data-photo="${i}"]`), true); }, unzoom() { closePhoto(true); }, get zoomed() { return lbOn(); },
    live() { still = false; }, layout,
    safe(t, b) { document.documentElement.style.setProperty('--psat', t + 'px'); document.documentElement.style.setProperty('--psab', b + 'px'); layout(); },
    check() {
      const fr = frame.getBoundingClientRect(), cur = cats[cat].el; cats.forEach(c => c.el.classList.add('on'));
      const res = cuts.map((c, i) => { const el = c.el, out = [], er = el.getBoundingClientRect();
        if (c.pane) {
          const tabs = tabsEl.getBoundingClientRect(); if (tabs.bottom > el.getBoundingClientRect().top + 1) out.push('메뉴가 화면을 덮음');
          const open = el.classList.contains('open'); el.classList.remove('open');
          el.querySelectorAll('.p-tile').forEach(t => { const r = t.getBoundingClientRect(), nm = t.querySelector('b').textContent, sm = t.querySelector('small').getBoundingClientRect(), skEl = t.querySelector('.stk'), em = t.querySelector('em').getBoundingClientRect();
            if (r.left < fr.left - 1 || r.right > fr.right + 1) out.push('타일이 가로 밖: ' + nm);
            if (skEl) { const sk = skEl.getBoundingClientRect(); if (em.bottom > sk.top + 4 * scale) out.push('스티커가 글에 닿음: ' + nm); if (sm.left < sk.right - 6 * scale) out.push('스티커가 숫자에 닿음: ' + nm); }
            if (em.right > r.right) out.push('타일 날짜 넘침: ' + nm); });
          el.classList.add('open');
          el.querySelectorAll('.bk-stack').forEach(s => { const was = s.classList.contains('on'); s.classList.add('on');
            s.querySelectorAll('.bk-card').forEach(t => { const b = t.querySelector('b'), skEl = t.querySelector('.stk'), sk = skEl ? skEl.getBoundingClientRect() : { left: 1e9 }, r = t.getBoundingClientRect(), nm = (b.textContent || '').slice(0, 10);
              if (b.scrollHeight > b.clientHeight + 1) out.push('카드 이름 잘림: ' + nm);
              if (b.getBoundingClientRect().right > sk.left - 2) out.push('이름이 스티커에 닿음: ' + nm);
              if (r.left < fr.left - 1 || r.right > fr.right + 1) out.push('카드가 가로 밖: ' + nm); });
            s.classList.toggle('on', was); });
          el.classList.toggle('open', open);
          return { i, name: c.name, out };
        }
        const fz = +el.style.getPropertyValue('--fz') || 1; if (fz < 1) out.push('fz=' + fz); if (overflow(el)) out.push('세로 넘침');
        el.querySelectorAll('.p-in *').forEach(x => { if (x.closest('.p-art, svg, .tile, .dot, .av, .pola, .bg, .picto, .bar, .p-scroll') || x.classList.contains('ic')) return; const r = x.getBoundingClientRect(); if (!r.width || !r.height) return;
          if (r.right > fr.right + 1 || r.left < fr.left - 1) out.push('가로 밖: ' + (x.className || x.tagName) + ' ' + (x.textContent || '').slice(0, 14));
          if (r.bottom > er.bottom + 1) out.push('컷 아래 밖: ' + (x.className || x.tagName));
          const st = getComputedStyle(x); if (st.whiteSpace === 'nowrap' && st.overflow === 'hidden' && x.scrollWidth > x.clientWidth + 1) out.push('말줄임: ' + (x.textContent || '').slice(0, 16)); });
        return { i, name: c.name, out }; });
      cats.forEach(c => c.el.classList.toggle('on', c.el === cur)); return res;
    },
  };
  return Object.assign(api, { mount, layout, fitCut, toast, go, goScene, month, board, get at() { return cat; } });
})();
