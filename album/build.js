// 돌 앨범 — 데이터 → 쪽 HTML (춘봉 2026-11-11)
// 시안/돌앨범-1022/실데이터-1111/만들기.py 를 그대로 JS 로 옮긴 것. 규칙·문구·순서를 바꾸지 않는다(같은 데이터면 같은 그림).
// 입력 D = { baby{name,birth_date,sex,photo_url}, members[{user_id,role('엄마'|'아빠'|'가족')}], days{day:{diary,photo(url)}}, logs[], growth[], notes[], checks[], today, cover, coverName, img(그림 폴더 URL) }
window.AlbumBuild = (function () {
  const MON = 30.4375;
  const STAGES = {
    0: { img: '아기-단계-01.webp', bg: ['#e5b3b6', '#e7bcbe', '#e8c2c3'], lab: '#9b4a57' },
    1: { img: '아기-단계-m1.webp', bg: ['#e4b1b4', '#e4b5b7', '#e8babc'], lab: '#9a3f4c' },
    2: { img: '아기-단계-23.webp', bg: ['#c7bbde', '#ccc0de', '#d3c7e1'], lab: '#5e3b91' },
    3: { img: '아기-단계-m3.webp', bg: ['#c5b5d3', '#ccc1da', '#cebfd8'], lab: '#5d4181' },
    4: { img: '아기-단계-45.webp', bg: ['#ecc8ae', '#ebc9b4', '#eacbb6'], lab: '#a3532a' },
    5: { img: '아기-단계-m5.webp', bg: ['#f2cfb8', '#f6d3c0', '#f2dbcc'], lab: '#a85a33' },
    6: { img: '아기-단계-67.webp', bg: ['#b6ded7', '#c2e5df', '#c6e3df'], lab: '#2f9381' },
    7: { img: '아기-단계-m7.webp', bg: ['#a8d2cf', '#a8d2cf', '#badbd7'], lab: '#398983' },
    8: { img: '아기-단계-89.webp', bg: ['#f1e1bd', '#f4e6c1', '#f3e9c6'], lab: '#93700a' },
    9: { img: '아기-단계-m9.webp', bg: ['#e7cea3', '#ead6b5', '#ebddc4'], lab: '#a7721b' },
    10: { img: '아기-단계-1011.webp', bg: ['#c0d5ee', '#d2e6f8', '#d7e9fa'], lab: '#0159c1' },
    11: { img: '아기-단계-m11.webp', bg: ['#cccaea', '#d5d3ef', '#d3cfea'], lab: '#5a4f72' },
    12: { img: '아기-단계-12.webp', bg: ['#ebc1e2', '#f3d2e6', '#fadfed'], lab: '#a91872' },
  };
  const KO_NUM = ['영', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한', '열두'];
  const WD = '월화수목금토일';
  const ITEM_LABEL = { hepb1: 'B형간염 1차', hepb2: 'B형간염 2차', hepb3: 'B형간염 3차', bcg: 'BCG', chk1: '1차 영유아검진', chk2: '2차 영유아검진', dtap1: 'DTaP 1차', ipv1: '폴리오 1차', hib1: 'Hib 1차', pcv1: '폐렴구균 1차', rota1: '로타 1차' };
  const FIRST_RE = /처음|첫/;
  const Z3 = -1.8808, Z97 = 1.8808;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const D_ = s => new Date(s + 'T00:00');
  const days = (a, b) => Math.round((D_(b) - D_(a)) / 86400000);
  const addMonths = (s, n) => { const d = D_(s); const y = d.getFullYear() + Math.floor((d.getMonth() + n) / 12), m = (d.getMonth() + n) % 12; const r = new Date(y, m, d.getDate()); return dstr(r); };
  const addDays = (s, n) => { const d = D_(s); d.setDate(d.getDate() + n); return dstr(d); };
  const fmtD = (s, year = true) => { const d = D_(s); return (year ? `${d.getFullYear()}. ` : '') + `${d.getMonth() + 1}. ${d.getDate()}`; };
  const josa = (w, a, b) => { const c = w ? w.charCodeAt(w.length - 1) : 0; return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b; };
  const oneLine = s => String(s || '').replace(/‍/g, '').replace(/\s+/g, ' ').trim();
  const firstLine = (s, n = 18) => { s = oneLine(String(s || '').split('\n')[0]).replace(/[.。 ]+$/, ''); return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…'; };
  const hm = hours => { let h = Math.floor(hours), m = Math.round((hours - h) * 60); if (m === 60) { h++; m = 0; } return m ? `${h}시간 ${m}분` : `${h}시간`; };
  const nfmt = n => Number(n).toLocaleString('en-US');
  const f1 = x => (Math.round(x * 10) / 10).toFixed(1);
  const g = x => String(+(+x).toFixed(2));   // 파이썬 :g 비슷하게(뒤 0 없이)
  const W = x => { const t = (+x).toFixed(2); return t.endsWith('0') ? t.slice(0, -1) : t; };   // 몸무게: 파이썬 float 표기처럼 소수 최소 한 자리 (5 → 5.0)

  // WHO LMS (앱 표 그대로, 월 사이 선형 보간)
  const WHO = window.WHO_LMS;
  const lmsAt = (key, mo) => { const t = WHO[key]; const x = Math.max(0, Math.min(t.length - 1.001, mo)), i = Math.floor(x), f = x - i; return t[i].map((v, k) => v + (t[i + 1][k] - v) * f); };
  const valAtZ = ([L, M, S], z) => L ? M * Math.pow(1 + L * S * z, 1 / L) : M * Math.exp(S * z);
  const zOf = ([L, M, S], x) => L ? (Math.pow(x / M, L) - 1) / (L * S) : Math.log(x / M) / S;
  const ncdf = z => { const t = 1 / (1 + .2316419 * Math.abs(z)), d = .3989423 * Math.exp(-z * z / 2); const p = d * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; };

  function pickSpread(cands, n, tiers) {   // 등급(0 먼저) → 등급 안에서는 날짜 고르게
    const out = [];
    for (const gq of [...new Set(tiers)].sort((a, b) => a - b)) {
      const pool = cands.filter((c, i) => tiers[i] === gq && !out.includes(c)); const need = n - out.length;
      if (need <= 0) break;
      if (pool.length <= need) { out.push(...pool); continue; }
      const idx = need === 1 ? [Math.floor(pool.length / 2)] : [...new Set([...Array(need)].map((_, i) => Math.round(i * (pool.length - 1) / (need - 1))))].sort((a, b) => a - b);
      out.push(...idx.map(i => pool[i]));
    }
    return out.sort((a, b) => a.d < b.d ? -1 : 1);
  }

  function build(D) {
    const IMG = D.img, NAME = D.coverName || D.baby.name, SEX = D.baby.sex || 'm';
    const BIRTH = D.baby.birth_date, FIRST = addMonths(BIRTH, 12), TODAY = D.today;
    const WHO_W = SEX === 'm' ? 'mw' : 'fw', WHO_L = SEX === 'm' ? 'ml' : 'fl';
    const ROLE = Object.fromEntries((D.members || []).map(m => [m.user_id, m.role]));
    const AV = { '엄마': '엄마-2g-b.png', '아빠': '아빠-2g-b.png' };
    const logs = (D.logs || []).map(l => { const at = new Date(l.at), end = l.ended_at ? new Date(l.ended_at) : null; return { kind: l.kind, at, end, day: dstr(at), det: l.detail || {}, who: ROLE[l.user_id] || '' }; });
    const DAYS = D.days || {};
    const growth = (D.growth || []).slice().sort((a, b) => a.day < b.day ? -1 : 1);
    const notes = (D.notes || []).map(n => ({ ...n, who: ROLE[n.user_id] || '' }));
    const checks = D.checks || [];
    const DP = d => days(BIRTH, d) + 1;
    const ageMo = d => days(BIRTH, d) / MON;
    const stageOf = d => { const a = D_(d), b = D_(BIRTH); let m = (a.getFullYear() - b.getFullYear()) * 12 + a.getMonth() - b.getMonth() - (a.getDate() < b.getDate() ? 1 : 0); return STAGES[Math.min(12, Math.max(0, m))]; };
    const photoOf = d => DAYS[d] && DAYS[d].photo || null;
    const diaryText = d => DAYS[d] && DAYS[d].diary ? oneLine(DAYS[d].diary) : '';
    const kindDays = (ls, kind) => new Set(ls.filter(l => l.kind === kind).map(l => l.day)).size;
    const feedSum = ls => ls.reduce((s, l) => s + (l.kind === 'feed' ? (+l.det.ml || 0) : 0), 0);
    const sleepHours = ls => ls.reduce((s, l) => s + (l.kind === 'sleep' && l.end ? (l.end - l.at) / 3600000 : 0), 0);
    const summarize = ls => { const f = ls.filter(l => l.kind === 'feed'), s = ls.filter(l => l.kind === 'sleep' && l.end), dp = ls.filter(l => l.kind === 'diaper');
      return { feed: f.length, feed_days: kindDays(ls, 'feed'), ml: feedSum(ls), sleep_h: sleepHours(ls), sleep_days: kindDays(ls, 'sleep'), sleep_n: s.length, diaper: dp.length, diaper_days: kindDays(ls, 'diaper'), poo: dp.filter(l => l.det.poo).length, temp: ls.filter(l => l.kind === 'temp').length }; };
    const ISSUES = [];

    // ── 달 나누기 (태어난 날 기준 한 달씩, 오늘까지 온 달만)
    const months = [];
    for (let m = 0; ; m++) { const s = addMonths(BIRTH, m), eFull = addDays(addMonths(BIRTH, m + 1), -1); if (s > TODAY) break; months.push({ i: m, s, e: eFull < TODAY ? eFull : TODAY, e_full: eFull, ongoing: eFull > TODAY }); }

    function monthPages(M, pno) {
      const st = stageOf(M.s), rng = Object.keys(DAYS).filter(d => M.s <= d && d <= M.e).sort();
      const ls = logs.filter(l => M.s <= l.day && l.day <= M.e), S = summarize(ls);
      const gs = growth.filter(x => M.s <= x.day && x.day <= M.e), prev = growth.filter(x => x.day < M.s && x.weight_kg);
      const wLast = [...gs].reverse().find(x => x.weight_kg)?.weight_kg ?? null;
      const wBase = prev.length ? prev[prev.length - 1].weight_kg : (gs.find(x => x.weight_kg)?.weight_kg ?? null);
      const lLast = [...gs].reverse().find(x => x.length_cm)?.length_cm ?? null;
      const pdays = rng.filter(d => DAYS[d].photo).map(d => ({ ...DAYS[d], d }));
      const photos = pickSpread(pdays, 2, pdays.map(x => FIRST_RE.test(x.diary || '') ? 0 : 1));
      const ddays = rng.filter(d => oneLine(DAYS[d].diary)).map(d => ({ ...DAYS[d], d }));
      const tiers = ddays.map(x => x.photo && FIRST_RE.test(x.diary) ? 0 : x.photo ? 1 : FIRST_RE.test(x.diary) ? 2 : 3);
      const cand = pickSpread(ddays, 8, tiers);
      const prio = {}; [...cand].sort((a, b) => (tiers[ddays.indexOf(a)] - tiers[ddays.indexOf(b)]) || (a.d < b.d ? -1 : 1)).forEach((x, i) => prio[x.d] = i);
      const items = cand.map(x => ({ d: fmtD(x.d, false), t: oneLine(x.diary), p: prio[x.d] }));
      const firsts = ddays.filter(x => FIRST_RE.test(x.diary));
      const cap1 = (wBase && wLast ? `${W(wBase)}kg에서 ${W(wLast)}kg이 되었어요. ` : '') + `일기 ${ddays.length}편, 사진 ${pdays.length}장.`;
      const cap2 = firsts.length ? `“${firstLine(firsts[0].diary, 26)}” — ${fmtD(firsts[0].d, false)}` : '';
      const label = M.i === 0 ? '태어난 달' : `${KO_NUM[M.i]} 달`;
      const rngTxt = `${fmtD(M.s)} — ${fmtD(M.e, false)}`;
      const dpTxt = `D+${DP(M.s)} — D+${DP(M.e)}` + (M.ongoing ? ' · 아직 적는 중' : '');
      const left = `
    <article class="pg full month-l" style="--m5a:${st.bg[0]};--m5b:${st.bg[1]};--m5c:${st.bg[2]};--m5l:${st.lab}">
      <div class="mnum"><b>${M.i}</b><span>${label}</span></div>
      <div class="range">${rngTxt}<br>${dpTxt}</div>
      <div class="art"><img src="${IMG}${st.img}" alt="${M.i}개월 ${esc(NAME)}"></div>
      <div class="cap" style="color:${st.lab}"><em>이달의 ${esc(NAME)}</em>${esc(cap1)}<span class="sum" style="vertical-align:5px">AI 요약 자리</span>${cap2 ? '<br>' + esc(cap2) : ''}</div>
      <div class="folio"><span>${label}</span><span>${pno}</span></div>
    </article>`;
      const fig = (x, cls) => {
        if (!x) return `<figure class="photo ${cls}" data-slot="photo-empty"><div class="ph">사진 없음</div><figcaption class="cap"></figcaption></figure>`;
        const src = photoOf(x.d), cap = firstLine(x.diary, cls === 'wide' ? 24 : 19);
        const inner = src ? `<div class="ph" style="background:#eee url(${esc(src)}) center/cover"></div>` : `<div class="ph">사진 · ${fmtD(x.d)}</div>`;
        return `<figure class="photo ${cls}" data-slot="photo-${x.d}">${inner}<figcaption class="cap">${esc(cap)}</figcaption></figure>`;
      };
      const ph = [...photos, null, null].slice(0, 2);
      const wk = wLast ? `${W(wLast)}<small>kg</small>` : '—';
      const wd = (lLast ? `${lLast}cm · ` : '') + (wBase && wLast ? `이달 ${wLast - wBase >= 0 ? '+' : ''}${(wLast - wBase).toFixed(2)}kg` : '');
      if (!lLast) ISSUES.push(`${M.i}개월: 이 달에 잰 키가 없어 숫자 띠에 키가 빠짐`);
      const right = `
    <article class="pg month-r">
      <div class="photos">${fig(ph[0], 'wide')}${fig(ph[1], 'tilt')}</div>
      <div class="diary lines" data-diary data-lines="5" data-items='${esc(JSON.stringify(items))}'></div>
      <div class="mnums">
        <div style="--c:var(--feed)"><em>수유</em><b class="num">${S.feed}<small>번</small></b><span class="d">하루 ${f1(S.feed / Math.max(1, S.feed_days))}번 · 모두 ${f1(S.ml / 1000)}L</span></div>
        <div style="--c:var(--sleep)"><em>잠</em><b class="num">${Math.round(S.sleep_h)}<small>시간</small></b><span class="d">하루 ${hm(S.sleep_h / Math.max(1, S.sleep_days))}</span></div>
        <div style="--c:var(--diaper)"><em>기저귀</em><b class="num">${S.diaper}<small>장</small></b><span class="d">하루 ${f1(S.diaper / Math.max(1, S.diaper_days))}장</span></div>
        <div style="--c:var(--ok)"><em>몸무게 · 키</em><b class="num">${wk}</b><span class="d">${wd}</span></div>
      </div>
      <div class="folio"><span>${D_(M.s).getFullYear()}. ${D_(M.s).getMonth() + 1} — ${D_(M.e).getMonth() + 1}</span><span>${pno + 1}</span></div>
    </article>`;
      return `<section class="spread two" data-page="month-${M.i}">${left}${right}</section>`;
    }

    // ── 숫자 쪽
    const S = summarize(logs);
    const sl = logs.filter(l => l.kind === 'sleep' && l.end).map(l => [(l.end - l.at) / 3600000, l]).sort((a, b) => a[0] - b[0]);
    const longest = sl.length ? sl[sl.length - 1] : null;
    const daysTotal = DP(TODAY), logFirst = logs.length ? logs.map(l => l.day).sort()[0] : BIRTH;
    const sleepPct = S.sleep_h / (Math.max(1, S.sleep_days) * 24) * 100;
    const momN = notes.filter(n => n.who === '엄마').length, dadN = notes.filter(n => n.who === '아빠').length;
    const diaries = Object.values(DAYS).filter(x => oneLine(x.diary));
    const photoDays = Object.values(DAYS).filter(x => x.photo).length;
    const STOP = new Set([NAME, D.baby.name, '오늘', '오늘은', '오늘도', '오늘의', '그냥', '하지만', '같다', '같은데', '아직', '많이', '요새', '엄마', '엄마가', '엄마는', '아빠', '아빠가']);
    const wc = {}; for (const x of diaries) for (const w of (x.diary.match(/[가-힣]{2,}/g) || [])) if (!STOP.has(w)) wc[w] = (wc[w] || 0) + 1;
    const topword = Object.entries(wc).sort((a, b) => b[1] - a[1])[0] || null;
    const picto = (n, per = 100) => '<i></i>'.repeat(Math.floor(n / per)) + (n % per ? '<i class="half"></i>' : '');
    const done = checks.filter(c => c.done_on);
    const chk = done.find(c => c.item.startsWith('chk')) || null;
    const shots = done.filter(c => !c.item.startsWith('chk'));
    const lastShot = shots.length ? shots.reduce((a, b) => a.done_on > b.done_on ? a : b) : null;
    const lday = longest ? longest[1].day : null;
    const statsPg = `
  <section class="spread one" data-page="stats">
    <article class="pg stats">
      <div class="eyebrow">숫자로 본 ${daysTotal}일</div>
      <h2>${esc(NAME)}는 ${daysTotal}일 동안<br>${nfmt(S.feed)}번 먹고, ${Math.round(S.sleep_h / 24)}일을 잤어요.<small>${fmtD(BIRTH)} — ${fmtD(TODAY, false)} · 엄마 아빠가 적은 ${daysTotal}일 (기록은 ${fmtD(logFirst, false)}부터)</small></h2>
      <div class="grid">
        <div class="stat" style="--c:var(--feed)">
          <img src="${IMG}ic-feed.png" alt="">
          <div><b class="num">${nfmt(S.feed)}<small>번</small></b>
            <div class="l">먹었어요 · 모두 <strong>${f1(S.ml / 1000)}L</strong> — 2L 생수 ${Math.round(S.ml / 2000)}병, 하루 ${f1(S.feed / Math.max(1, S.feed_days))}번</div>
            <div class="picto" aria-hidden="true">${picto(S.feed)}</div>
            <div class="l" style="font-size:12.5px;color:var(--fg3)">■ 하나 = 100번</div>
          </div>
        </div>
        <div class="stat" style="--c:var(--sleep)">
          <img src="${IMG}ic-sleep.png" alt="">
          <div><b class="num">${nfmt(Math.round(S.sleep_h))}<small>시간</small></b>
            <div class="l">잤어요 · 기록한 날의 <strong>${Math.round(sleepPct)}%</strong> — 가장 길게 잔 잠은 <strong style="white-space:nowrap">${longest ? hm(longest[0]) : '—'}</strong>${longest ? ` (${D_(lday).getMonth() + 1}월 ${D_(lday).getDate()}일)` : ''}</div>
            <div class="bar"><i style="--w:${Math.round(sleepPct)}%"></i></div>
            <div class="l" style="font-size:12.5px;color:var(--fg3)">잠 ${Math.round(sleepPct)}% · 깨어 있던 시간 ${100 - Math.round(sleepPct)}%</div>
          </div>
        </div>
        <div class="stat" style="--c:var(--diaper)">
          <img src="${IMG}ic-diaper.png" alt="">
          <div><b class="num">${nfmt(S.diaper)}<small>장</small></b>
            <div class="l">기저귀를 갈았어요 · 그중 응가 <strong>${S.poo}번</strong> — 하루 ${f1(S.diaper / Math.max(1, S.diaper_days))}장</div>
            <div class="picto" aria-hidden="true">${picto(S.diaper)}</div>
            <div class="l" style="font-size:12.5px;color:var(--fg3)">■ 하나 = 100장</div>
          </div>
        </div>
        <div class="stat" style="--c:var(--temp)">
          <img src="${IMG}ic-diary.png" alt="">
          <div><b class="num">${diaries.length}<small>편</small></b>
            <div class="l">일기를 썼어요 · 홈 한마디 <strong>${notes.length}개</strong> — 엄마 <strong>${momN}</strong> · 아빠 <strong>${dadN}</strong>${topword ? `, 일기에 가장 자주 나온 말은 <strong>“${esc(topword[0])}”</strong>` : ''}</div>
            <div class="bar" style="background:rgba(212,85,77,.18)"><i style="--w:${Math.round(momN / Math.max(1, notes.length) * 100)}%"></i></div>
            <div class="l" style="font-size:12.5px;color:var(--fg3)">한마디 엄마 ${Math.round(momN / Math.max(1, notes.length) * 100)}% · 아빠 ${Math.round(dadN / Math.max(1, notes.length) * 100)}%</div>
          </div>
        </div>
      </div>
      <div class="foot">
        <div><em>첫 검진</em><b>${chk ? fmtD(chk.done_on) : '—'}</b><span>${chk ? `D+${DP(chk.done_on)} · ${ITEM_LABEL[chk.item] || chk.item}` : ''}</span></div>
        <div><em>접종 ${shots.length}회</em><b>${lastShot ? fmtD(lastShot.done_on) : '—'}</b><span>${lastShot ? `D+${DP(lastShot.done_on)} · ${ITEM_LABEL[lastShot.item] || lastShot.item}` : ''}</span></div>
        <div><em>가장 길게 잔 잠</em><b>${longest ? fmtD(lday) : '—'}</b><span>${longest ? `D+${DP(lday)} · ${hm(longest[0])}` : ''}</span></div>
        <div><em>사진</em><b>${photoDays}<small style="font-size:14px;font-weight:500;color:var(--ink2);margin-left:3px">장</small></b><span>체온 측정 ${S.temp}회</span></div>
      </div>
      <div class="folio"><span>숫자로 본 ${daysTotal}일</span><span>PNO</span></div>
    </article>
  </section>`;
    if (longest && longest[0] > 12) ISSUES.push(`가장 긴 잠 ${hm(longest[0])}(${lday}) — 끝 시각을 안 눌러 늘어난 기록으로 보임`);

    // ── 성장 곡선 (기록된 기간만큼 x축)
    const W_PTS = growth.filter(x => x.weight_kg).map(x => [x.day, +x.weight_kg]);
    const L_PTS = growth.filter(x => x.length_cm).map(x => [x.day, +x.length_cm]);
    const X0 = 40, X1 = 800, Y0 = 40, Y1 = 330, span = Math.max(1, days(BIRTH, TODAY));
    const xt = t => X0 + t / span * (X1 - X0), xs = d => xt(days(BIRTH, d));
    const band = []; for (let t = 0; t <= span; t += 2) band.push([t, valAtZ(lmsAt(WHO_W, t / MON), Z3), valAtZ(lmsAt(WHO_W, t / MON), Z97)]);
    const wmin = Math.min(...band.map(b => b[1]), ...W_PTS.map(p => p[1])) - .2, wmax = Math.max(...band.map(b => b[2]), ...W_PTS.map(p => p[1])) + .2;
    const ys = w => Y1 - (w - wmin) / (wmax - wmin) * (Y1 - Y0);
    const lband = []; for (let t = 0; t <= span; t += 2) lband.push([t, valAtZ(lmsAt(WHO_L, t / MON), Z3), valAtZ(lmsAt(WHO_L, t / MON), Z97)]);
    const lmin = Math.min(...lband.map(b => b[1]), ...L_PTS.map(p => p[1])) - 1, lmax = Math.max(...lband.map(b => b[2]), ...L_PTS.map(p => p[1])) + 1;
    const yl = l => Y1 - (l - lmin) / (lmax - lmin) * (Y1 - Y0);
    const P = x => x.toFixed(1);
    const bandPath = 'M' + band.map(([t, lo]) => `${P(xt(t))} ${P(ys(lo))}`).join(' L') + ' L' + [...band].reverse().map(([t, , hi]) => `${P(xt(t))} ${P(ys(hi))}`).join(' L') + ' Z';
    const hasW = W_PTS.length > 0, hasL = L_PTS.length > 0;
    const wline = hasW ? 'M' + W_PTS.map(([d, w]) => `${P(xs(d))} ${P(ys(w))}`).join(' L') : '';
    const warea = hasW ? wline + ` L${P(xs(W_PTS[W_PTS.length - 1][0]))} ${Y1} L${P(xs(W_PTS[0][0]))} ${Y1} Z` : '';
    const lline = hasL ? 'M' + L_PTS.map(([d, l]) => `${P(xs(d))} ${P(yl(l))}`).join(' L') : '';
    const dots = W_PTS.map(([d, w], i) => `<circle cx="${P(xs(d))}" cy="${P(ys(w))}" r="${0 < i && i < W_PTS.length - 1 ? 4 : 6}"/>`).join('');
    const msDates = [[50, addDays(BIRTH, 49)], [100, addDays(BIRTH, 99)], [200, addDays(BIRTH, 199)], [300, addDays(BIRTH, 299)], ['첫돌', FIRST]];
    const ticks = [[0, '출생'], ...msDates.filter(([n, d]) => typeof n === 'number' && d <= TODAY).map(([n, d]) => [days(BIRTH, d), `${n}일`]), [days(BIRTH, TODAY), `오늘 D+${DP(TODAY)}`]];
    const tickTxt = ticks.map(([t, lab]) => `<text x="${P(xt(t))}" y="360" text-anchor="${t === 0 ? 'start' : t === span ? 'end' : 'middle'}">${lab}</text>`).join('');
    const tickDots = ticks.filter(([t]) => t).map(([t]) => `<circle cx="${P(xt(t))}" cy="380" r="2.5"/>`).join('');
    const [wLastD, wLast] = hasW ? W_PTS[W_PTS.length - 1] : [TODAY, null], [lLastD, lLast] = hasL ? L_PTS[L_PTS.length - 1] : [TODAY, null];
    const wPct = hasW ? ncdf(zOf(lmsAt(WHO_W, ageMo(wLastD)), wLast)) * 100 : 50, lPct = hasL ? ncdf(zOf(lmsAt(WHO_L, ageMo(lLastD)), lLast)) * 100 : 50;
    const inband = W_PTS.filter(([d, w]) => valAtZ(lmsAt(WHO_W, ageMo(d)), Z3) <= w && w <= valAtZ(lmsAt(WHO_W, ageMo(d)), Z97)).length;
    const nearest = dd => W_PTS.reduce((a, p) => Math.abs(days(p[0], dd)) < Math.abs(days(a[0], dd)) ? p : a);
    const midLab = hasW ? msDates.filter(([n, dd]) => typeof n === 'number' && dd <= TODAY).map(([, dd]) => { const [d, w] = nearest(dd); return `<text x="${P(xs(d))}" y="${P(ys(w) - 14)}" text-anchor="middle">${W(w)}</text>`; }).join('') : '';
    const sexWord = SEX === 'm' ? '남아' : '여아';
    const growthPg = `
    <article class="pg growth">
      <div class="eyebrow">성장 곡선</div>
      <h2>${hasW ? `${W(W_PTS[0][1])}kg에서 ${W(wLast)}kg으로,` : '아직 몸무게 기록이 없어요,'}<br>${hasL ? `${g(L_PTS[0][1])}cm에서 ${g(lLast)}cm으로.` : '키도 곧 적어 주세요.'}</h2>
      <p class="lead">옅은 띠는 같은 또래 ${sexWord}의 3~97% 범위예요. ${hasW ? `${esc(NAME)}${josa(NAME, '은', '는')} ${W_PTS.length}번 잰 몸무게 중 ${inband}번이 그 안에 있고, 지금은 또래 상위 ${Math.round(100 - wPct)}%예요.` : ''}</p>
      <div class="chart">
        <svg viewBox="0 0 824 400" width="824" height="400" role="img" aria-label="${daysTotal}일 몸무게·키 성장 곡선">
          <defs><linearGradient id="gw" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2f9e63" stop-opacity=".16"/><stop offset="1" stop-color="#2f9e63" stop-opacity="0"/></linearGradient></defs>
          <g stroke="rgba(69,68,77,.1)" stroke-width="1">
            <line x1="40" y1="40" x2="40" y2="330"/><line x1="40" y1="330" x2="800" y2="330"/>
            <line x1="40" y1="257" x2="800" y2="257" stroke-dasharray="2 5"/><line x1="40" y1="185" x2="800" y2="185" stroke-dasharray="2 5"/><line x1="40" y1="112" x2="800" y2="112" stroke-dasharray="2 5"/><line x1="40" y1="40" x2="800" y2="40" stroke-dasharray="2 5"/>
          </g>
          <path d="${bandPath}" fill="#2f9e63" opacity=".10"/>
          ${hasW ? `<path d="${wline}" fill="none" stroke="#2f9e63" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="${warea}" fill="url(#gw)"/>` : ''}
          ${hasL ? `<path d="${lline}" fill="none" stroke="#3b7bd4" stroke-width="2.5" stroke-linecap="round" opacity=".85"/>` : ''}
          <g fill="#fffdf6" stroke="#2f9e63" stroke-width="3">${dots}</g>
          <g fill="#fffdf6" stroke="#3b7bd4" stroke-width="2.5">${L_PTS.map(([d, l]) => `<circle cx="${P(xs(d))}" cy="${P(yl(l))}" r="5"/>`).join('')}</g>
          <g font-family="Pretendard Variable, Pretendard, sans-serif" font-size="13" font-weight="600" fill="#2f9e63">
            ${hasW ? `<text x="${P(xs(W_PTS[0][0]) - 2)}" y="${P(ys(W_PTS[0][1]) - 16)}" text-anchor="start">${W(W_PTS[0][1])}kg</text>${midLab}<text x="${P(xs(wLastD))}" y="${P(ys(wLast) - 16)}" text-anchor="end">${W(wLast)}kg</text>` : ''}
          </g>
          <g font-family="Pretendard Variable, Pretendard, sans-serif" font-size="13" font-weight="600" fill="#3b7bd4">
            ${hasL ? `<text x="${P(xs(L_PTS[0][0]) + 12)}" y="${P(yl(L_PTS[0][1]) + 18)}">${g(L_PTS[0][1])}cm</text><text x="${P(xs(lLastD))}" y="${P(yl(lLast) - 14)}" text-anchor="middle">${g(lLast)}cm</text>` : ''}
          </g>
          <g font-family="Pretendard Variable, Pretendard, sans-serif" font-size="12.5" fill="#9a9aa3" letter-spacing=".04em">${tickTxt}</g>
          <g fill="#e2557f">${tickDots}</g>
        </svg>
        <div class="legend"><span style="--c:#2f9e63">몸무게</span><span style="--c:#3b7bd4">키</span><span class="band" style="--c:#2f9e63">또래 범위 (WHO 3~97%)</span></div>
      </div>
      <div class="pair">
        <div><em>몸무게 · ${fmtD(wLastD, false)}</em><b class="num">${hasW ? W(wLast) : '—'}<small>kg</small></b><span>${hasW ? `태어날 때보다 <i>+${(wLast - W_PTS[0][1]).toFixed(2)}kg</i> · 또래 상위 ${Math.round(100 - wPct)}%` : ''}</span></div>
        <div><em>키 · ${fmtD(lLastD, false)}</em><b class="num">${hasL ? g(lLast) : '—'}<small>cm</small></b><span>${hasL ? `태어날 때보다 <i>+${(lLast - L_PTS[0][1]).toFixed(1)}cm</i> · 또래 상위 ${Math.round(100 - lPct)}%` : ''}</span></div>
      </div>
      <div class="folio"><span>성장 곡선</span><span>PNO</span></div>
    </article>`;
    if (L_PTS.length < 3) ISSUES.push(`키 기록이 ${L_PTS.length}개뿐 — 성장 곡선의 키 선이 점 ${L_PTS.length}개를 잇는 직선`);

    // ── 기념일
    const dayLogsLine = d => { const s = summarize(logs.filter(l => l.day === d)); return [s.feed ? `수유 ${s.feed}번` : '', s.diaper ? `기저귀 ${s.diaper}장` : '', s.sleep_h ? `잠 ${hm(s.sleep_h)}` : ''].filter(Boolean).join(' · '); };
    let msRows = '', passed = 0;
    for (const [n, d] of msDates) {
      const st = stageOf(d), lab = n === '첫돌' ? '첫돌' : `${n}일`, big = n === '첫돌' ? ' big' : '';
      const src = photoOf(d);
      const img = src ? `<img src="${esc(src)}" alt="">` : `<img src="${IMG}${st.img}" alt="">`;
      const wd = WD[(D_(d).getDay() + 6) % 7];
      if (d <= TODAY) {
        passed++;
        let txt = diaryText(d), fromLogs = false;
        if (!txt) { txt = dayLogsLine(d); fromLogs = true; }
        const gg = growth.filter(x => x.weight_kg && days(x.day, d) >= 0 && days(x.day, d) <= 7), gl = growth.filter(x => x.length_cm && days(x.day, d) >= 0 && days(x.day, d) <= 14);
        const sub = [gg.length ? `<b>${W(gg[gg.length - 1].weight_kg)}kg</b>` : '', gl.length ? `${g(gl[gl.length - 1].length_cm)}cm` : '', fromLogs ? '그날 기록' : ''].filter(Boolean).join(' · ');
        msRows += `<li><div class="dot" style="--mc:${st.bg[1]}">${img}</div><div class="d">${lab}<small>${fmtD(d)} · ${wd}</small></div><div class="t" data-clamp="2"><div class="tx">${esc(txt)}</div><span>${sub}</span></div></li>\n`;
        if (!src) ISSUES.push(`${lab}(${fmtD(d, false)}) 사진이 아직 없어 그 달 캐릭터로 대체`);
      } else {
        msRows += `<li style="opacity:.42"><div class="dot${big}" style="--mc:${st.bg[1]}">${img}</div><div class="d">${lab}<small>${fmtD(d)} · ${wd}</small></div><div class="t"></div></li>\n`;
      }
    }
    const msPg = `
    <article class="pg ms">
      <div class="eyebrow">기념일</div>
      <h2>${KO_NUM[passed]} 번의 축하,<br>그날의 ${esc(NAME)}.</h2>
      <ol>
${msRows}      </ol>
      <div class="folio"><span>기념일</span><span>PNO</span></div>
    </article>`;

    // ── 가족 한마디 (앨범 만들 때 적는 칸 — 데이터 없음. 빈 칸)
    const roles = [...new Set(Object.values(ROLE))];
    let says = '';
    for (const who of ['엄마', '아빠', '가족'].filter(r => roles.includes(r)))
      says += `<div class="say"><div class="av"><img src="${IMG}${AV[who] || '엄마-2g-b.png'}" alt=""></div><div><div class="who">${who}</div><div class="q" data-slot="say-${who}" style="color:var(--fg3)">앨범을 만들 때 적어요.</div></div></div>\n`;
    const wideTxt = `${fmtD(logFirst, false)}부터 ${fmtD(TODAY, false)}까지 ${days(logFirst, TODAY) + 1}일 동안 수유 ${nfmt(S.feed)}번, 기저귀 ${nfmt(S.diaper)}장, 잠 ${nfmt(Math.round(S.sleep_h))}시간을 적었어요. `
      + `일기 ${diaries.length}편과 사진 ${photoDays}장, 홈 한마디 ${notes.length}개(엄마 ${momN} · 아빠 ${dadN}).` + (hasW ? ` 몸무게는 ${W(W_PTS[0][1])}kg에서 ${W(wLast)}kg이 되었어요.` : '');
    const famPg = `
  <section class="spread one" data-page="family">
    <article class="pg fam">
      <div class="eyebrow">${esc(NAME)}에게</div>
      <h2>${daysTotal}일을 함께한 사람들이<br>한마디씩 남겼어요.</h2>
      <div class="list">
${says}        <div class="say wide"><div class="av" style="background:#e8e2f5"><img src="${IMG}왕관-남.png" alt="" style="object-fit:contain;width:72%;height:72%"></div><div><div class="who">기특일기가 돌아본 ${esc(NAME)}의 ${daysTotal}일 <span class="sum" style="margin-left:6px;vertical-align:1px;font-weight:400">AI 요약 자리</span></div><div class="q">${esc(wideTxt)}</div></div></div>
      </div>
      <div class="folio"><span>${esc(NAME)}의 첫 해 · ${BIRTH.slice(0, 4)} — ${FIRST.slice(0, 4)}</span><span class="wm"><i></i>기특일기</span></div>
    </article>
  </section>`;

    // ── 표지 + 조립
    const coverHtml = `<section class="spread one" data-page="cover">${cover(D, { NAME, BIRTH, FIRST, SEX, IMG, DAYS, roles, W_PTS, L_PTS, months, stageOf })}</section>`;
    let pno = 2, monthHtml = '';
    for (const M of months) { monthHtml += monthPages(M, pno); pno += 2; }
    const stats2 = statsPg.replace('PNO', String(pno)); pno += 1;
    const growth2 = growthPg.replace('PNO', String(pno)), ms2 = msPg.replace('PNO', String(pno + 1)); pno += 2;
    const pages = coverHtml + monthHtml + stats2 + `<section class="spread two" data-page="growth">${growth2}${ms2}</section>` + famPg;
    return { pages, issues: ISSUES, count: (pages.match(/<article/g) || []).length, first: FIRST, today: TODAY, dp: daysTotal };
  }

  // ── 표지 4종: 표지/표지.html 의 템플릿 마크업 그대로(①A·S1, ②, ③, ⑤-5). 변수는 DATA 7개 + 이름 길이 띠
  const MC = ['#e7bcbe', '#e4b5b7', '#ccc0de', '#ccc1da', '#ebc9b4', '#f6d3c0', '#c2e5df', '#a8d2cf', '#f4e6c1', '#ead6b5', '#d2e6f8', '#d5d3ef', '#f3d2e6'];
  const CIMG = ['01', 'm1', '23', 'm3', '45', 'm5', '67', 'm7', '89', 'm9', '1011', 'm11', '12'].map(s => `아기-단계-${s}.webp`);
  const PH_SLOTS = [1, 3, 4, 6, 9, 11];   // ③ 사진 칸(10-27 3R) — 그 달 사진 있으면 사진, 없으면 캐릭터
  function cover(D, C) {
    const { NAME, BIRTH, FIRST, SEX, IMG, DAYS, roles } = C;
    const kind = D.cover || 'walk';
    const b = D_(BIRTH), f = D_(FIRST);
    const F = { name: esc(NAME), by: roles.length === 1 ? roles[0] : '엄마 · 아빠',
      birthLong: `${b.getFullYear()}년 ${b.getMonth() + 1}월 ${b.getDate()}일`, firstLong: `${f.getFullYear()}년 ${f.getMonth() + 1}월 ${f.getDate()}일`,
      birthDot: `${b.getFullYear()}. ${b.getMonth() + 1}. ${b.getDate()}`, firstDot: `${f.getFullYear()}. ${f.getMonth() + 1}. ${f.getDate()}`,
      objP: josa(NAME, '을', '를') };
    const photo = D.baby.photo_url || '';
    const NLEN = [...NAME].length;
    const attrs = `data-sex="${SEX}" data-nlen="${Math.min(12, Math.max(2, NLEN))}" data-nband="${NLEN <= 3 ? 's' : NLEN == 4 ? 'm' : NLEN <= 6 ? 'l' : NLEN <= 8 ? 'xl' : 'xxl'}" data-photo="${photo ? 1 : 0}"`;
    const stamp = window.__stamp ? window.__stamp(F.firstDot) : '';
    if (kind === 'photo') return `
    <article class="pg cvr t2" data-tpl="photo" ${attrs}>
      <div class="photo t2-ph" data-slot="cover-photo"><img src="${esc(photo)}" alt="아기 대표 사진"></div>
      <div class="fallback t2-fb"><img src="${IMG}아기-단계-89.webp" alt=""></div>
      <div class="veil"></div>
      <div class="top"><span class="eyebrow">첫 해 앨범 · First Year</span><span>First Birthday</span></div>
      <div class="slot">대표 사진 자리 · 없으면 캐릭터</div>
      <div class="txt">
        <h1><span class="nm">${F.name}의</span><br><b>첫 해</b></h1>
        <div class="sub"><span class="dt">${F.birthDot}</span><i></i><span class="dt">${F.firstDot}</span></div>
      </div>
      <div class="folio"><span>${F.by}가 적은 365일</span><span class="wm"><i></i>기특일기</span></div>
    </article>`;
    if (kind === 'quilt') {
      const monthPhoto = m => { const s = addMonths(BIRTH, m), e = addDays(addMonths(BIRTH, m + 1), -1); const ds = Object.keys(DAYS).filter(d => s <= d && d <= e && DAYS[d].photo).sort(); if (!ds.length) return ''; const first = ds.find(d => FIRST_RE.test(DAYS[d].diary || '')); return DAYS[first || ds[Math.floor(ds.length / 2)]].photo; };
      const tiles = CIMG.map((img, m) => { const url = PH_SLOTS.includes(m) ? monthPhoto(m) : ''; return url ? `<div class="tile ph" data-m="${m}" style="--mc:${MC[m]}"><img src="${esc(url)}" alt="${m}개월 사진"><small>${m}</small></div>` : `<div class="tile" data-m="${m}"><img src="${IMG}${img}" alt=""><small>${m}</small></div>`; }).join('\n      ');
      return `
    <article class="pg cvr t3" data-tpl="quilt" ${attrs}>
      <div class="tile title"><div class="eyebrow">첫 해 앨범 · First Year</div><h1><span class="nm">${F.name}의</span><br><b>열세 달</b></h1><div class="by">${F.by}가 적은 365일</div></div>
      ${tiles}
      <div class="tile date"><b>1st</b><span class="fb">First Birthday</span><span class="dt">${F.birthDot}<br>${F.firstDot}</span><span class="wm"><i></i>기특일기</span></div>
    </article>`;
    }
    if (kind === 'diary') {
      const FIMG = { '엄마': '엄마-2g-전신.png', '아빠': '아빠-2g-전신.png' };
      const fam = roles.filter(r => FIMG[r]).concat(roles.filter(r => !FIMG[r])).slice(0, 6);
      const mem = who => !who ? `<div class="mem ph"><i></i><span>·</span></div>` : FIMG[who] ? `<div class="mem"><img src="${IMG}${FIMG[who]}" alt="${who} 캐릭터"><span>${who}</span></div>` : `<div class="mem ph named" data-slot="family-${who}"><i></i><span style="visibility:visible">${who}</span></div>`;
      const slots = [...fam, '', '', '', '', '', ''].slice(0, 6);
      return `
    <article class="pg cvr t5 v5" data-tpl="diary" ${attrs}>
      <div class="left"><div class="ft">${F.name}${F.objP} 함께 키운 사람들</div><div class="fam" data-n="${fam.length}">${slots.map(mem).join('')}</div></div>
      <div class="eyebrow">첫 해 앨범 · First Year</div>
      <h1><u><span class="nm">${F.name}의</span> <span class="rest">첫 해</span></u></h1>
      <div class="sub">${F.birthLong}부터<br>${F.firstLong}까지, 삼백예순다섯 날</div>
      <div class="pola" data-slot="cover-photo">
        <div class="tape"></div><div class="tape b"></div>
        <div class="ph"><img src="${esc(photo)}" alt="아기 대표 사진" class="only-photo"><img src="${IMG}아기-단계-m9.webp" alt="" class="only-fallback"><div class="slot only-fallback">사진 자리</div></div>
        <div class="cap">첫돌, ${F.firstLong}</div>
      </div>
      <div class="stamp">${stamp}</div>
      <div class="folio"><span>${F.by}가 적음</span><span class="wm"><i></i>기특일기</span></div>
    </article>`;
    }
    return `
    <article class="pg cvr t1 va" data-tpl="walk" ${attrs}>
      <div class="eyebrow">첫 해 앨범 · First Year</div>
      <h1><span class="nm">${F.name}의</span><br><b>첫 해</b></h1>
      <div class="sub"><span class="dt">${F.birthLong}</span>에 만나,<br> <span class="dt">${F.firstLong}</span> 첫돌</div>
      <div class="badge">${stamp}</div>
      <div class="art"><img src="${IMG}아기-단계-12.webp" alt="케이크를 향해 첫걸음을 떼는 12개월 ${F.name}"></div>
      <div class="folio"><span>${F.by}가 적은 365일</span><span class="mid"><span class="dt">${F.birthLong}</span>에 만나, <span class="dt">${F.firstLong}</span> 첫돌</span><span class="wm"><i></i>기특일기</span></div>
    </article>`;
  }

  // 한 달 일기 5줄 예산 · 기념일 2줄 — 만들기.py 의 js_diary 그대로(손글씨 폰트를 실제로 받은 뒤 잰다)
  async function fit(root) {
    await Promise.all([document.fonts.load('25px "Poor Story"'), document.fonts.load('22px "Poor Story"'), document.fonts.load('700 54px "Gowun Batang"')]); await document.fonts.ready;
    root.querySelectorAll('[data-diary]').forEach(el => {
      const budget = +el.dataset.lines, items = JSON.parse(el.dataset.items);
      const probe = t => { el.insertAdjacentHTML('beforeend', `<p style="display:block;-webkit-line-clamp:none;overflow:visible">${t}</p>`); const p = el.lastElementChild, n = Math.round(p.getBoundingClientRect().height / 52) || 1; p.remove(); return n; };
      items.forEach(it => { it.nat = probe(`<span class="dd">${it.d}</span>${esc(it.t)}`); it.lines = Math.min(2, it.nat); });
      let used = 0; const chosen = [];
      for (const it of [...items].sort((a, b) => a.p - b.p)) { if (used + it.lines > budget) continue; used += it.lines; chosen.push(it); }
      chosen.sort((a, b) => items.indexOf(a) - items.indexOf(b));
      el.innerHTML = chosen.map(it => `<p><span class="dd">${it.d}</span>${esc(it.t)}${it.nat > 2 ? '<span class="sum" style="position:absolute;right:0;bottom:15px;margin:0;padding-left:9px;background:var(--paper);box-shadow:-8px 0 8px var(--paper)">AI 요약</span>' : ''}</p>`).join('');
      el.dataset.shown = chosen.length; el.dataset.used = used; el.dataset.dropped = items.length - chosen.length;
    });
    root.querySelectorAll('.ms .t[data-clamp]').forEach(t => {
      const tx = t.querySelector('.tx'), n = Math.round(tx.getBoundingClientRect().height / 33);
      if (n > +t.dataset.clamp) { tx.style.cssText = 'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden'; t.querySelector('span:last-child').insertAdjacentHTML('afterbegin', '<span class="sum" style="display:inline-block;margin:0 8px 0 0;vertical-align:1px">AI 요약</span>'); }
      t.dataset.nat = n;
    });
  }

  // 사진·그림 미리 받기 — 진행 콜백(n, total). 실패한 것도 센다(앨범은 빈 틀로 깨지지 않음)
  async function preload(urls, onStep) {
    const list = [...new Set(urls)]; let n = 0;
    await Promise.all(list.map(u => new Promise(res => { const im = new Image(); im.onload = im.onerror = () => { n++; onStep && onStep(n, list.length); res(); }; im.src = u; })));
    return list.length;
  }
  const photoUrls = D => { const s = new Set(); for (const d of Object.values(D.days || {})) if (d.photo) s.add(d.photo); if (D.baby.photo_url) s.add(D.baby.photo_url); return [...s]; };

  return { build, cover, fit, preload, photoUrls, addMonths, addDays, fmtD, esc };
})();
