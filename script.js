/**
 * 며칠쉬어 — 연차 계산기
 * 공휴일 데이터(holidays-data.js)를 바탕으로 연차 N일로 만들 수 있는
 * 최장 연속 휴일 구간을 계산하고 렌더링한다. 순수 vanilla JS, 빌드 없음.
 */

(function () {
  "use strict";

  const DOW_KR = ["일", "월", "화", "수", "목", "금", "토"];
  const MAX_PTO = 20;

  /**
   * @type {{year:number, n:number, pinnedWindow:({start:number,end:number}|null),
   *   pinnedAnchorIndex:(number|null), sortMode:string}}
   * pinnedAnchorIndex는 "사용자가 보고 있던 연휴가 어디쯤인지"를 기억해두는
   * 위치(인덱스)다. 연차 일수를 바꿔도 이 자리를 계속 붙잡고 그 자리 기준으로
   * 다시 계산해서, 예를 들어 '개천절·한글날'을 보고 있다가 연차를 -1 해도
   * 엉뚱하게 '추석'으로 튀지 않고 같은 명절 근처에 머무르게 한다.
   */
  const state = {
    year: defaultYear(),
    n: 3,
    pinnedWindow: null,
    pinnedAnchorIndex: null,
    sortMode: "soon",
  };

  // ---------- 날짜 유틸 ----------

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatDate(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function todayLocal() {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }

  function defaultYear() {
    const today = todayLocal();
    const years = Object.keys(HOLIDAYS_BY_YEAR)
      .map(Number)
      .sort((a, b) => a - b);
    for (const y of years) {
      if (today.getFullYear() <= y) return y;
    }
    return years[years.length - 1];
  }

  function shortLabel(d) {
    return `${d.getMonth() + 1}/${d.getDate()}(${DOW_KR[d.getDay()]})`;
  }

  /** 연도까지 포함한 날짜 라벨. 연차 신청서 등에 그대로 옮겨 적을 수 있도록. */
  function fullLabel(d) {
    return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}(${DOW_KR[d.getDay()]})`;
  }

  // ---------- 데이터 구성 ----------

  /**
   * 주어진 연도의 1/1~12/31 배열을 구성한다.
   * isOff: 실제로 쉬는 날인지 (주말/공휴일/대체공휴일/선거일)
   */
  function buildYearDays(year) {
    const list = HOLIDAYS_BY_YEAR[year] || [];
    const map = new Map(list.map((h) => [h.date, h]));

    const days = [];
    const cursor = new Date(year, 0, 1);
    while (cursor.getFullYear() === year) {
      const dateStr = formatDate(cursor);
      const dow = cursor.getDay();
      const info = map.get(dateStr);

      const isOff = dow === 0 || dow === 6 || Boolean(info);

      days.push({
        date: new Date(cursor),
        dateStr,
        dow,
        isOff,
        holidayName: info ? info.name : null,
        holidayType: info ? info.type : null,
      });

      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  // ---------- 핵심 알고리즘: 연차 N일로 만드는 최장 연휴 ----------

  /**
   * 예산(budget)일의 연차로 만들 수 있는 최장 연속 구간을 전부 찾는다.
   * (Max Consecutive Ones III 패턴의 투 포인터)
   * floorIndex/ceilIndex를 주면 그 범위[floorIndex, ceilIndex) 안에서만 탐색한다
   * (그 밖의 날짜는 후보에서 제외). "오늘 이후"만 추천하거나, 이미 찾은 구간을
   * 제외한 나머지 구간에서 "다음으로 좋은 옵션"을 찾을 때 사용한다.
   * 기본값(0, days.length)이면 기존과 완전히 동일하게 동작한다.
   * 반환: { bestLen, windows: [{start,end,len}] } — windows는 시간순, 겹치지 않는 구간만.
   */
  function bestWindowsForBudget(days, budget, floorIndex = 0, ceilIndex = days.length) {
    let left = floorIndex;
    let workdaysInWindow = 0;
    let bestLen = 0;
    let windows = [];

    for (let right = floorIndex; right < ceilIndex; right++) {
      if (!days[right].isOff) workdaysInWindow++;

      while (workdaysInWindow > budget) {
        if (!days[left].isOff) workdaysInWindow--;
        left++;
      }

      const len = right - left + 1;
      if (len > bestLen) {
        bestLen = len;
        windows = [{ start: left, end: right, len }];
      } else if (len === bestLen && len > 0) {
        const last = windows[windows.length - 1];
        if (!last || left > last.end) {
          windows.push({ start: left, end: right, len });
        } else {
          // 이전 구간과 겹치는 동일 길이 구간 -> 더 뒤쪽 위치로 갱신
          windows[windows.length - 1] = { start: left, end: right, len };
        }
      }
    }
    return { bestLen, windows };
  }

  function ptoDatesInWindow(days, start, end) {
    return days.slice(start, end + 1).filter((d) => !d.isOff);
  }

  /**
   * 예산(budget) 안에서, 서로 겹치지 않는 "다음으로 좋은" 구간을 최대 k개까지 찾는다.
   * 전체 범위에서 최선의 구간을 하나 찾고, 그 구간으로 나뉜 앞/뒤 나머지 구간에서
   * 다시 최선을 찾는 과정을 반복하는 방식(그리디) — bestWindowsForBudget을
   * 새 알고리즘 없이 그대로 재사용한다.
   */
  function topDistinctWindows(days, budget, floorIndex, k) {
    const results = [];
    let regions = [{ lo: floorIndex, hi: days.length }];

    while (results.length < k && regions.length) {
      let bestRegionIdx = -1;
      let bestWindow = null;
      let bestLen = 0;

      regions.forEach((r, i) => {
        const { bestLen: len, windows } = bestWindowsForBudget(days, budget, r.lo, r.hi);
        if (windows.length && len > bestLen) {
          bestLen = len;
          bestWindow = windows[0];
          bestRegionIdx = i;
        }
      });

      if (bestRegionIdx === -1) break;

      results.push(bestWindow);
      const r = regions[bestRegionIdx];
      const rest = regions.filter((_, i) => i !== bestRegionIdx);
      if (bestWindow.start > r.lo) rest.push({ lo: r.lo, hi: bestWindow.start });
      if (bestWindow.end + 1 < r.hi) rest.push({ lo: bestWindow.end + 1, hi: r.hi });
      regions = rest;
    }
    return results;
  }

  function windowHasHoliday(days, w) {
    for (let i = w.start; i <= w.end; i++) {
      if (days[i].holidayName) return true;
    }
    return false;
  }

  /** 구간 안의 공휴일 이름들을 "추석", "개천절·한글날"처럼 짧게 합친다. */
  function clusterLabel(days, w) {
    const seen = new Set();
    const names = [];
    for (let i = w.start; i <= w.end; i++) {
      const name = days[i].holidayName;
      if (!name) continue;
      const base = name.replace(/\s*(연휴|대체공휴일)$/, "");
      if (!seen.has(base)) {
        seen.add(base);
        names.push(base);
      }
    }
    return names.join("·") || "연휴";
  }

  /** full=true면 연도까지 포함한 라벨(fullLabel)을 쓴다. */
  function formatRange(days, start, end, full) {
    const s = days[start].date;
    const e = days[end].date;
    const label = full ? fullLabel : shortLabel;
    if (s.getTime() === e.getTime()) {
      return label(s);
    }
    return `${label(s)} ~ ${label(e)}`;
  }

  // ---------- 렌더링 ----------

  let cachedDays = null;

  /**
   * cachedDays에서 "실제 오늘(new Date() 기준, 시분초 제거)과 같거나 이후인
   * 첫 인덱스"를 찾는다. 선택된 연도가 이미 전부 지나간 과거라면(오늘 이후로
   * 남은 날짜가 하나도 없다면) cachedDays.length를 반환한다 — 이 값을
   * bestWindowsForBudget에 floorIndex로 그대로 넘기면 탐색 루프가 자연히
   * 한 번도 돌지 않아 windows:[] 로 안전하게 폴백된다.
   * 선택된 연도가 통째로 미래(예: 오늘이 2026년인데 2027년을 보는 중)라면
   * 배열의 첫 날짜부터 이미 오늘 이후이므로 자동으로 0이 반환된다.
   */
  function getFloorIndex() {
    if (!cachedDays || !cachedDays.length) return 0;
    const today = todayLocal();
    const idx = cachedDays.findIndex((d) => d.date.getTime() >= today.getTime());
    return idx === -1 ? cachedDays.length : idx;
  }

  /**
   * 히어로에 지금 보여줘야 할 구간을 정한다. 옵션 리스트에서 특정 항목을
   * 골랐다면(state.pinnedWindow) 그 구간을 그대로 쓰고, 아니면 평소처럼
   * "오늘 이후 예산 안에서 가장 긴 구간"을 자동으로 찾는다.
   */
  function getActiveWindowInfo() {
    if (state.pinnedWindow) {
      const w = state.pinnedWindow;
      return { bestLen: w.end - w.start + 1, windows: [w] };
    }
    return bestWindowsForBudget(cachedDays, state.n, getFloorIndex());
  }

  /** 히어로 결과 위에 붙는 "오늘(8/20) 이후 기준" 같은 안내 문구. */
  function heroBasisText(floorIndex) {
    if (!cachedDays || floorIndex >= cachedDays.length) return "";
    const today = todayLocal();
    if (cachedDays[0].date.getTime() > today.getTime()) {
      return `${state.year}년 전체 기준`;
    }
    return `오늘(${shortLabel(today)}) 이후 기준`;
  }

  function recompute() {
    cachedDays = buildYearDays(state.year);
    state.pinnedWindow = null;
    state.pinnedAnchorIndex = null;
    renderHero();
    renderHeroPreview();
    renderTable();
    renderRibbon();
    renderCalendar();
    renderNextHoliday();
    renderOptionsList();
    syncControls();
    updateDocumentTitle();
    updateTableSub();
  }

  /** 연도를 바꿔도 브라우저 탭 제목이 그대로였던 문제 수정: 선택된 연도를 반영한다. */
  function updateDocumentTitle() {
    document.title = `며칠쉬어 — ${state.year}년 연차 계산기 · 공휴일 대체공휴일 총정리`;
  }

  /** "연차 일수별 한눈에 보기" 표 부제에 연도와 "오늘 이후 기준"임을 명시한다. */
  function updateTableSub() {
    const sub = document.getElementById("table-sub");
    if (sub) {
      sub.textContent = `${state.year}년 · 오늘 이후 기준 · 행을 누르면 위 결과가 바뀌어요`;
    }
  }

  function syncControls() {
    document.querySelectorAll("[data-year-btn]").forEach((btn) => {
      const y = Number(btn.dataset.yearBtn);
      btn.setAttribute("aria-pressed", String(y === state.year));
    });
    const nInput = document.getElementById("n-value");
    if (nInput) nInput.textContent = String(state.n);
    const decBtn = document.getElementById("n-dec");
    const incBtn = document.getElementById("n-inc");
    if (decBtn) decBtn.disabled = state.n <= 1;
    if (incBtn) incBtn.disabled = state.n >= MAX_PTO;
  }

  function renderHero() {
    const floorIndex = getFloorIndex();
    const { bestLen, windows } = getActiveWindowInfo();
    const heroDays = document.getElementById("hero-days");
    const heroRange = document.getElementById("hero-range");
    const heroDetail = document.getElementById("hero-detail");
    const heroAlt = document.getElementById("hero-alt");
    const heroBasis = document.getElementById("hero-basis");

    if (!windows.length || bestLen === 0) {
      heroDays.textContent = "—";
      heroRange.textContent = "해당 연도에 더 이상 남은 연휴 기회가 없어요.";
      heroDetail.innerHTML = "";
      heroAlt.innerHTML = "";
      if (heroBasis) heroBasis.textContent = "";
      return;
    }

    if (heroBasis) heroBasis.textContent = heroBasisText(floorIndex);

    const main = windows[0];
    heroDays.textContent = String(main.len);
    heroRange.textContent = formatRange(cachedDays, main.start, main.end, true);

    const pto = ptoDatesInWindow(cachedDays, main.start, main.end);
    if (pto.length) {
      const ptoLabels = pto.map((d) => fullLabel(d.date)).join(", ");
      heroDetail.innerHTML = `<strong>${pto.length}일</strong> 연차 사용 · ${ptoLabels}`;
    } else {
      heroDetail.innerHTML = "연차 없이도 이미 쉬는 구간이에요.";
    }

    if (windows.length > 1) {
      const alts = windows
        .slice(1, 3)
        .map((w) => formatRange(cachedDays, w.start, w.end, true))
        .join(" · ");
      heroAlt.textContent = `같은 길이로 쉴 수 있는 다른 구간: ${alts}`;
    } else {
      heroAlt.textContent = "";
    }
  }

  function renderTable() {
    const tbody = document.getElementById("table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const floorIndex = getFloorIndex();
    if (floorIndex >= cachedDays.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" class="table-empty">해당 연도에 더 이상 남은 연휴 기회가 없어요.</td>`;
      tbody.appendChild(tr);
      return;
    }

    for (let n = 1; n <= MAX_PTO; n++) {
      const { bestLen, windows } = bestWindowsForBudget(cachedDays, n, floorIndex);
      const tr = document.createElement("tr");
      tr.dataset.n = String(n);
      tr.tabIndex = 0;
      tr.setAttribute("role", "button");
      tr.setAttribute(
        "aria-label",
        `연차 ${n}일로 ${bestLen}일 연휴, 행 선택하기`
      );
      if (n === state.n) tr.classList.add("is-selected");

      const range = windows.length ? formatRange(cachedDays, windows[0].start, windows[0].end, true) : "—";
      const ratio = n > 0 ? (bestLen / n).toFixed(1) : "0.0";

      tr.innerHTML = `
        <td class="num">${n}</td>
        <td class="num strong">${bestLen}</td>
        <td>${range}</td>
        <td class="num ratio">${ratio}<span class="x">x</span></td>
      `;
      tr.addEventListener("click", () => setN(n));
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setN(n);
        }
      });
      tbody.appendChild(tr);
    }
  }

  function dayClass(d) {
    if (d.dow === 0 || d.holidayType === "holiday" || d.holidayType === "substitute") {
      return d.dow === 6 ? "sat-holiday" : "red";
    }
    if (d.dow === 6) return "blue";
    return "";
  }

  function currentPtoSet() {
    const { windows } = bestWindowsForBudget(cachedDays, state.n);
    const set = new Set();
    if (windows.length) {
      const pto = ptoDatesInWindow(cachedDays, windows[0].start, windows[0].end);
      pto.forEach((d) => set.add(d.dateStr));
    }
    return set;
  }

  /**
   * 한 달치 달력 카드(제목 + 요일행 + 날짜 그리드)를 만든다.
   * renderCalendar()(연간 전체 달력)와 renderHeroPreview()(히어로 미니 캘린더)가
   * 이 함수를 공유해서, 같은 마크업/클래스 규칙을 재사용한다.
   * extraClassesFn(day) -> string 으로 day 셀에 추가할 클래스(is-pto, in-window 등)를 지정한다.
   */
  function buildMonthElement(monthDays, extraClassesFn) {
    const m = monthDays[0].date.getMonth();
    const year = monthDays[0].date.getFullYear();
    const first = monthDays[0].date;
    const startDow = first.getDay();
    const today = todayLocal();
    const todayStr = formatDate(today);

    const wrap = document.createElement("div");
    wrap.className = "month";

    const title = document.createElement("h3");
    title.textContent = `${year}년 ${m + 1}월`;
    wrap.appendChild(title);

    const dowRow = document.createElement("div");
    dowRow.className = "month-grid dow-row";
    DOW_KR.forEach((label, i) => {
      const s = document.createElement("span");
      s.className = "dow-label" + (i === 0 ? " red" : i === 6 ? " blue" : "");
      s.textContent = label;
      dowRow.appendChild(s);
    });
    wrap.appendChild(dowRow);

    const grid = document.createElement("div");
    grid.className = "month-grid";
    for (let i = 0; i < startDow; i++) {
      const pad = document.createElement("span");
      pad.className = "day pad";
      grid.appendChild(pad);
    }
    monthDays.forEach((d) => {
      const cell = document.createElement("div");
      let cls = "day " + dayClass(d);
      const isToday = d.dateStr === todayStr;
      if (isToday) {
        cls += " is-today";
      } else if (d.date.getTime() < today.getTime()) {
        cls += " is-past";
      }
      if (extraClassesFn) {
        const extra = extraClassesFn(d);
        if (extra) cls += " " + extra;
      }
      cell.className = cls;
      cell.innerHTML = `<span class="num">${d.date.getDate()}</span>`;
      if (d.holidayName) {
        cell.innerHTML += `<span class="label">${d.holidayName}</span>`;
      }
      const titleParts = [];
      if (isToday) titleParts.push("오늘");
      if (d.holidayName) titleParts.push(d.holidayName);
      if (titleParts.length) cell.title = titleParts.join(" · ");
      grid.appendChild(cell);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function renderRibbon() {
    const el = document.getElementById("ribbon");
    if (!el) return;
    el.innerHTML = "";
    const ptoSet = currentPtoSet();
    const today = todayLocal();
    const todayStr = formatDate(today);

    let monthCursor = -1;
    const monthTicks = document.getElementById("ribbon-months");
    monthTicks.innerHTML = "";

    cachedDays.forEach((d, i) => {
      if (d.date.getMonth() !== monthCursor) {
        monthCursor = d.date.getMonth();
        const tick = document.createElement("span");
        tick.className = "ribbon-tick";
        tick.textContent = `${monthCursor + 1}월`;
        monthTicks.appendChild(tick);
      }
      const cell = document.createElement("span");
      let cls = "ribbon-cell " + dayClass(d);
      if (ptoSet.has(d.dateStr)) cls += " is-pto";
      const isToday = d.dateStr === todayStr;
      if (isToday) {
        cls += " is-today";
      } else if (d.date.getTime() < today.getTime()) {
        cls += " is-past";
      }
      cell.className = cls;
      cell.title = `${isToday ? "오늘 · " : ""}${shortLabel(d.date)}${d.holidayName ? " · " + d.holidayName : ""}`;
      el.appendChild(cell);
    });
  }

  function renderCalendar() {
    const el = document.getElementById("calendar");
    if (!el) return;
    el.innerHTML = "";
    const ptoSet = currentPtoSet();

    for (let m = 0; m < 12; m++) {
      const monthDays = cachedDays.filter((d) => d.date.getMonth() === m);
      el.appendChild(
        buildMonthElement(monthDays, (d) => (ptoSet.has(d.dateStr) ? "is-pto" : ""))
      );
    }
  }

  /**
   * 히어로 영역의 미니 달력. 지금 연차 일수(state.n)로 만들 수 있는 최장 연속
   * 구간(main window)이 걸치는 월(들)만 잘라서, 그 구간 전체를 이어진 띠로,
   * 그중 실제로 연차를 써야 하는 날짜는 진한 금색으로 강조해 보여준다.
   * 계산은 bestWindowsForBudget/ptoDatesInWindow를 그대로 재사용하고,
   * 새 알고리즘은 만들지 않는다.
   */
  function renderHeroPreview() {
    const el = document.getElementById("hero-preview");
    const legend = document.getElementById("hero-preview-legend");
    if (!el) return;
    el.innerHTML = "";

    const { bestLen, windows } = getActiveWindowInfo();
    if (!windows.length || bestLen === 0) {
      if (legend) legend.hidden = true;
      const p = document.createElement("p");
      p.className = "hero-preview-empty";
      p.textContent = "해당 연도에 더 이상 남은 연휴 기회가 없어요.";
      el.appendChild(p);
      return;
    }
    if (legend) legend.hidden = false;

    const main = windows[0];
    const pto = ptoDatesInWindow(cachedDays, main.start, main.end);
    const ptoSet = new Set(pto.map((d) => d.dateStr));
    const windowSet = new Set();
    for (let i = main.start; i <= main.end; i++) {
      windowSet.add(cachedDays[i].dateStr);
    }

    const startMonth = cachedDays[main.start].date.getMonth();
    const endMonth = cachedDays[main.end].date.getMonth();

    for (let m = startMonth; m <= endMonth; m++) {
      const monthDays = cachedDays.filter((d) => d.date.getMonth() === m);
      el.appendChild(
        buildMonthElement(monthDays, (d) => {
          if (ptoSet.has(d.dateStr)) return "is-pto in-window";
          if (windowSet.has(d.dateStr)) return "in-window";
          return "";
        })
      );
    }
  }

  /**
   * 지금 연차 일수(state.n)로 오늘 이후에 고를 수 있는, 서로 겹치지 않는
   * 대표 옵션들을 계산한다. 각 옵션은 실제 공휴일 이름이 붙은 구간만
   * 남기고(순수 주말만인 구간은 제외), 화면에 보여줄 만큼만 자른다.
   */
  function computeOptions() {
    const floorIndex = getFloorIndex();
    if (floorIndex >= cachedDays.length) return [];

    const raw = topDistinctWindows(cachedDays, state.n, floorIndex, 14);
    return raw
      .filter((w) => windowHasHoliday(cachedDays, w))
      .slice(0, 8)
      .map((w) => {
        const pto = ptoDatesInWindow(cachedDays, w.start, w.end);
        return {
          start: w.start,
          end: w.end,
          len: w.len,
          ptoCount: pto.length,
          ratio: pto.length === 0 ? Infinity : w.len / pto.length,
          label: clusterLabel(cachedDays, w),
          rangeLabel: formatRange(cachedDays, w.start, w.end, false),
          startTime: cachedDays[w.start].date.getTime(),
        };
      });
  }

  /**
   * 연차 일수(state.n)가 바뀐 뒤에도, 이전에 고정해뒀던 연휴(state.pinnedAnchorIndex)를
   * 계속 붙잡고 있을 수 있는지 확인한다. 그 자리를 포함하는 옵션이 새 연차
   * 일수 기준으로도 여전히 나온다면 그 구간으로 다시 고정하고, 더 이상 안
   * 나온다면(예산이 너무 작아져서 그 연휴까지 못 미치는 경우 등) 고정을 푼다.
   */
  function tryReanchorPinnedWindow() {
    if (state.pinnedAnchorIndex === null) return;
    const options = computeOptions();
    const match = options.find(
      (o) => state.pinnedAnchorIndex >= o.start && state.pinnedAnchorIndex <= o.end
    );
    if (match) {
      state.pinnedWindow = { start: match.start, end: match.end };
    } else {
      state.pinnedWindow = null;
      state.pinnedAnchorIndex = null;
    }
  }

  function sortOptions(options, mode) {
    const arr = options.slice();
    if (mode === "length") arr.sort((a, b) => b.len - a.len || a.startTime - b.startTime);
    else if (mode === "efficiency") arr.sort((a, b) => b.ratio - a.ratio || a.startTime - b.startTime);
    else arr.sort((a, b) => a.startTime - b.startTime);
    return arr;
  }

  function renderOptionsList() {
    const listEl = document.getElementById("options-list");
    const subEl = document.getElementById("options-sub");
    if (!listEl) return;
    listEl.innerHTML = "";

    const options = sortOptions(computeOptions(), state.sortMode);
    if (subEl) {
      subEl.textContent = options.length
        ? `연차 ${state.n}일 기준 · ${options.length}개 옵션`
        : `연차 ${state.n}일 기준`;
    }

    if (!options.length) {
      const li = document.createElement("li");
      li.className = "option-empty";
      li.textContent = "표시할 옵션이 없어요.";
      listEl.appendChild(li);
      return;
    }

    options.forEach((opt) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-row";
      const isPinned =
        state.pinnedWindow &&
        state.pinnedWindow.start === opt.start &&
        state.pinnedWindow.end === opt.end;
      if (isPinned) btn.classList.add("is-selected");
      btn.setAttribute(
        "aria-label",
        `${opt.label}, ${opt.rangeLabel}, ${opt.len}일 연휴, 연차 ${opt.ptoCount}일 사용, 이 구간 보기`
      );
      btn.innerHTML = `
        <span class="option-row-top">
          <span class="option-name">${opt.label}</span>
          <span class="option-days">${opt.len}<span class="option-days-unit">일</span></span>
        </span>
        <span class="option-row-bottom">
          <span class="option-range">${opt.rangeLabel}</span>
          <span class="option-pto">${opt.ptoCount ? "연차 " + opt.ptoCount + "일" : "연차 없이 쉼"}</span>
        </span>
      `;
      btn.addEventListener("click", () => {
        if (isPinned) {
          // 이미 고정된 옵션을 다시 누르면 고정을 풀고 자동(전역 최적) 추천으로 되돌아간다.
          state.pinnedWindow = null;
          state.pinnedAnchorIndex = null;
        } else {
          state.pinnedWindow = { start: opt.start, end: opt.end };
          state.pinnedAnchorIndex = Math.floor((opt.start + opt.end) / 2);
        }
        renderHero();
        renderHeroPreview();
        renderOptionsList();
      });
      li.appendChild(btn);
      listEl.appendChild(li);
    });
  }

  function setSortMode(mode) {
    state.sortMode = mode;
    document.querySelectorAll("[data-sort]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.sort === mode));
    });
    renderOptionsList();
  }

  function renderNextHoliday() {
    const el = document.getElementById("next-holiday");
    if (!el) return;
    const today = todayLocal();
    const allDays = [...buildYearDays(2026), ...buildYearDays(2027)];
    const next = allDays.find(
      (d) => d.holidayName && d.date.getTime() >= today.getTime()
    );
    if (!next) {
      el.textContent = "";
      return;
    }
    const dday = Math.round((next.date.getTime() - today.getTime()) / 86400000);
    const ddayLabel = dday === 0 ? "오늘" : `D-${dday}`;
    el.textContent = `오늘(${shortLabel(today)}) 기준 다음 공휴일: ${next.holidayName} (${fullLabel(next.date)}) · ${ddayLabel}`;
  }

  // ---------- 이벤트 ----------

  function setN(n) {
    state.n = Math.min(MAX_PTO, Math.max(1, n));
    tryReanchorPinnedWindow();
    renderHero();
    renderHeroPreview();
    renderTable();
    renderRibbon();
    renderCalendar();
    renderOptionsList();
    syncControls();
  }

  function setYear(y) {
    if (!HOLIDAYS_BY_YEAR[y]) return;
    state.year = y;
    recompute();
  }

  function init() {
    document.getElementById("n-dec").addEventListener("click", () => setN(state.n - 1));
    document.getElementById("n-inc").addEventListener("click", () => setN(state.n + 1));

    document.querySelectorAll("[data-year-btn]").forEach((btn) => {
      btn.addEventListener("click", () => setYear(Number(btn.dataset.yearBtn)));
    });

    document.querySelectorAll("[data-sort]").forEach((btn) => {
      btn.addEventListener("click", () => setSortMode(btn.dataset.sort));
    });

    const yearEl = document.getElementById("data-year-note");
    if (yearEl) yearEl.textContent = DATA_LAST_VERIFIED;

    recompute();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
