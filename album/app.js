// 돌 앨범 — 앱 안 흐름 (춘봉 2026-11-11, 11-12 폰 전용 스토리형으로 교체): 부모(index.html) → albumStart(opts) → 만들기 → 만드는 중 → 스토리 뷰어
// opts = { mode:'make'|'reserve'|'view', input, theme, cover, coverName, first(첫돌), src('real' = 로컬 실데이터 시험) }
(function () {
  const $ = s => document.querySelector(s);
  const B = window.AlbumBuild, ST = window.AlbumStory;
  const Q = new URLSearchParams(location.search);
  const IMG = new URL('../img/', location.href).href;
  const COVERS = [['walk', '첫걸음', '기본'], ['photo', '사진', ''], ['quilt', '열세 칸', ''], ['diary', '일기장', '']];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let O = null, IN = null, cover = 'walk', coverName = '', built = null;
  const post = m => parent !== window && parent.postMessage({ t: 'album', ...m }, location.origin);
  const fmtKo = s => { const d = new Date(s + 'T00:00'); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  // ── 시작 ──
  window.albumStart = async function (opts) {
    O = opts; document.documentElement.dataset.theme = opts.theme || 'dark';
    safeArea();
    cover = opts.cover || 'walk'; coverName = opts.coverName || '';
    IN = opts.input || (opts.src === 'real' ? await loadReal() : null);
    if (!IN) { post({ act: 'close' }); return; }
    IN.img = IMG; if (!coverName) coverName = IN.baby.name;
    document.body.classList.add('in-mk');
    if (opts.mode === 'view') { await make(); return; }
    openMake(opts.mode);
  };

  // 노치·홈 바 높이: iframe 안에선 env(safe-area-inset-*) 가 0 으로 올 수 있어, 같은 출처인 부모 창에 잠깐 자를 대고 잰다 → --psat/--psab (story.css 가 env() 와 큰 쪽을 쓴다)
  function safeArea() {
    try {
      if (parent === window) return; const pd = parent.document, pr = pd.createElement('div');
      pr.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;height:env(safe-area-inset-top,0px);width:env(safe-area-inset-bottom,0px)';
      pd.body.appendChild(pr); const t = pr.offsetHeight, b = pr.offsetWidth; pr.remove();
      document.documentElement.style.setProperty('--psat', t + 'px'); document.documentElement.style.setProperty('--psab', b + 'px');
    } catch (_) {}
  }

  // 로컬 시험용: 시안/돌앨범-1022/실데이터-1111/data.json (배포엔 없음 → 404 면 닫힘). 사진은 비공개 경로라 빈 틀
  async function loadReal() {
    try {
      const r = await fetch('../시안/돌앨범-1022/실데이터-1111/data.json'); if (!r.ok) throw 0;
      const D = await r.json(); const role = m => ({ 'char:mom': '엄마', 'char:dad': '아빠' }[m.avatar_url] || '가족');
      const days = {}; for (const x of D.days) days[x.day] = { diary: x.diary || '', photo: null };
      return { baby: D.baby, members: D.members.map(m => ({ user_id: m.user_id, role: role(m) })), days, logs: D.logs, growth: D.growth, notes: D.notes, checks: D.checks, today: '2026-11-11' };
    } catch (_) { return null; }
  }

  // ── 만들기 화면 ──
  const railEl = $('#cv-rail'), chipsEl = $('#cv-chips'), nameEl = $('#mk-name');
  function openMake(mode) {
    $('#mk').classList.remove('hidden'); $('#prog').classList.add('hidden');
    $('#mk-title').textContent = mode === 'reserve' ? '앨범 예약하기' : '앨범 만들기';
    nameEl.value = coverName; nameHelp();
    const ch = Math.max(210, Math.min(400, Math.round(innerHeight * .44))), cw = Math.round(ch * 393 / 852);   // 표지 카드 = 스토리 첫 컷(393×852)의 축소판. 높이는 화면의 44% — 칩·이름 칸이 첫 화면에 보이게
    railEl.style.setProperty('--cw', cw + 'px'); railEl.style.setProperty('--ch', ch + 'px'); railEl.style.setProperty('--mk', String(cw / 393));   // scale 은 단위 없는 수라 px 변수로 못 나눈다
    chipsEl.innerHTML = COVERS.map(([k, n, s]) => `<button type="button" data-k="${k}">${n}${s ? `<small>${s}</small>` : ''}</button>`).join('');
    chipsEl.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { select(b.dataset.k); const c = railEl.querySelector(`[data-k="${b.dataset.k}"]`); c && c.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }); }));
    const dw = $('#mk-date-wrap'); dw.classList.toggle('hidden', mode !== 'reserve');
    if (mode === 'reserve') { const de = $('#mk-date'); de.min = B.addDays(today(), 1); de.max = O.first; de.value = O.first < de.min ? de.min : O.first; de.oninput = info; }
    $('#mk-go').textContent = mode === 'reserve' ? '예약하기' : '앨범 만들기';
    $('#mk-pay').innerHTML = mode === 'reserve' ? '출시 땐 여기서 <b>9,900원</b> 결제 · 돌 뒤 무료 다시 만들기 1번' : '출시 땐 여기서 <b>9,900원</b> 결제 · 지금은 리허설이라 결제 없이 만들어요';
    renderRail(); select(cover, true); info();
    requestAnimationFrame(() => { const c = railEl.querySelector(`[data-k="${cover}"]`); c && c.scrollIntoView({ inline: 'center', block: 'nearest' }); });
  }
  function info() {
    const b = IN.baby.birth_date, mode = O.mode;
    if (mode === 'reserve') { const d = $('#mk-date').value; $('#mk-info').innerHTML = `<b>${fmtKo(d)} 아침</b>에 완성돼요 · ${B.fmtD(b)} — ${B.fmtD(d, false)} 기록<br>표지·사진 바꾸기는 언제든 무료, 돌이 지나면 돌 당일까지 넣은 완성판을 한 번 더 만들어 드려요.`; }
    else { const t = IN.today, dp = Math.round((new Date(t + 'T00:00') - new Date(b + 'T00:00')) / 86400000) + 1, mo = Math.floor(dp / 30.4375) + 1; $('#mk-info').innerHTML = `<b>지금까지의 기록</b>으로 만들어요 · ${B.fmtD(b)} — ${B.fmtD(t, false)} · D+${dp}<br>표지 → 달마다 그 달의 ${IN.baby.name}·사진·일기 → 숫자 → 성장 곡선 → 기념일 → 가족 한마디. 위 메뉴에서 골라 보는 앨범으로 만들어요. 아직 안 온 달은 만들지 않아요.`; }
  }
  // 표지 4장을 실제 템플릿으로 그려 가로 레일에 — 이름을 바꾸면 넷 다 다시 그린다(실시간 미리보기)
  function renderRail() {
    const keep = railEl.scrollLeft;
    railEl.innerHTML = COVERS.map(([k]) => `<div class="cv-card mini${k === cover ? ' on' : ''}" data-k="${k}">${B.coverP({ ...IN, cover: k, coverName: coverName }, coverCtx())}</div>`).join('');
    railEl.querySelectorAll('.psc').forEach(el => ST.fitCut(el, 1, false));
    railEl.querySelectorAll('.cv-card').forEach(c => c.addEventListener('click', () => { select(c.dataset.k); c.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }); }));
    railEl.scrollLeft = keep;
  }
  const coverCtx = () => { const roles = [...new Set(IN.members.map(m => m.role))]; return { NAME: coverName || IN.baby.name, BIRTH: IN.baby.birth_date, FIRST: B.addMonths(IN.baby.birth_date, 12), SEX: IN.baby.sex || 'm', IMG, DAYS: IN.days, roles }; };
  function select(k, silent) {
    cover = k; if (!silent) railLock = Date.now() + 700;   // 칩·탭으로 고른 뒤 부드러운 스크롤이 지나가는 동안은 스크롤 선택을 막는다
    railEl.querySelectorAll('.cv-card').forEach(c => c.classList.toggle('on', c.dataset.k === k));
    chipsEl.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
    const [, n, s] = COVERS.find(c => c[0] === k); $('#mk-cvname').textContent = `· ${n}${s ? ` (${s})` : ''}`;
  }
  // 레일을 손으로 넘기면 가운데 온 장이 선택된다 (스냅 뒤)
  let railT = 0, railLock = 0;
  railEl.addEventListener('scroll', () => { clearTimeout(railT); railT = setTimeout(() => { if (Date.now() < railLock) return; const mid = railEl.scrollLeft + railEl.clientWidth / 2; let best = null, bd = 1e9; railEl.querySelectorAll('.cv-card').forEach(c => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = c; } }); if (best && best.dataset.k !== cover) select(best.dataset.k, true); }, 80); }, { passive: true });
  function nameHelp() {
    const v = nameEl.value.trim(), n = [...v].length, h = $('#mk-name-help');
    $('#mk-name-x').classList.toggle('hidden', !v);
    if (!v) { h.textContent = '비우면 앱의 아기 이름으로 들어가요.'; h.classList.remove('warn'); }
    else if (n > 8) { h.textContent = `${n}자 — 8자가 넘으면 표지의 이름 줄이 작아져요. 그대로 써도 돼요.`; h.classList.add('warn'); }
    else { h.textContent = '앱의 아기 이름은 그대로 두고, 앨범 표지에만 써요.'; h.classList.remove('warn'); }
  }
  let nameT = 0;
  nameEl.addEventListener('input', () => { coverName = nameEl.value.trim() || IN.baby.name; nameHelp(); clearTimeout(nameT); nameT = setTimeout(renderRail, 120); });
  nameEl.addEventListener('keydown', e => { if (e.key === 'Enter') nameEl.blur(); });
  $('#mk-name-x').addEventListener('click', () => { nameEl.value = ''; coverName = IN.baby.name; nameHelp(); renderRail(); nameEl.focus(); });
  document.querySelector('[data-mk="close"]').addEventListener('click', () => post({ act: 'close' }));
  $('#mk-go').addEventListener('click', async () => {
    if (O.mode === 'reserve') { post({ act: 'reserved', date: $('#mk-date').value, cover, coverName }); return; }
    await make();
  });

  // ── 만드는 중 → 뷰어 ──
  async function make() {
    $('#mk').classList.add('hidden'); $('#prog').classList.remove('hidden');
    const st = $('#pg-st'), bar = $('#pg-bar'); const step = (t, f) => { st.textContent = t; bar.style.width = Math.round(f * 100) + '%'; };
    $('#pg-cv').className = 'pg-cv mini'; $('#pg-cv').innerHTML = B.coverP({ ...IN, cover, coverName }, coverCtx()); ST.fitCut($('#pg-cv').firstElementChild, 1, false);
    step('기록을 모으는 중', .08); await wait(RM ? 0 : 260);
    IN.cover = cover; IN.coverName = coverName;
    built = B.build(IN);
    const urls = B.photoUrls(IN); let n = 0;
    if (urls.length) { step(`사진 불러오는 중 0 / ${urls.length}`, .15); await B.preload(urls, (k, t) => step(`사진 불러오는 중 ${k} / ${t}`, .15 + .55 * k / t)); }
    else { step('사진이 아직 없어 빈 틀로 둬요', .5); await wait(RM ? 0 : 500); }
    step(`${built.count}컷을 만드는 중`, .78);
    await Promise.race([Promise.all([document.fonts.load('19px "Poor Story"'), document.fonts.load('700 26px "Gowun Batang"'), document.fonts.load('400 26px "Gowun Batang"')]).catch(() => 0), wait(4000)]);   // 서체를 기다리되 4초까지만 — 통신이 나빠도 '만드는 중'에 갇히지 않는다(대체 서체로 열림)
    step('마무리', .96); await wait(RM ? 0 : 200);
    built.title = `${coverName || IN.baby.name}의 첫 해`;
    $('#prog').classList.add('hidden'); document.body.classList.remove('in-mk');
    ST.mount(built);
    window.__viewerReady = true;
    post({ act: 'made', cover, coverName, asOf: IN.today, pages: built.count, issues: built.issues });
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // ── 스토리 동작 ── (PDF 는 11-12 폐기. 컷 이미지 저장·공유는 자리만)
  ST.onAct = act => {
    if (act === 'close') { post({ act: 'close' }); return; }
    if (act === 'img') { ST.toast('컷 이미지 저장 — 준비 중이에요'); return; }
    if (act === 'share') { ST.toast('가족에게 공유 — 준비 중이에요'); return; }
  };
  window.__album = { get built() { return built; } };
})();
