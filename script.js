/**
 * 며칠쉬어 — 연차 계산기
 * 공휴일 데이터(holidays-data.js)를 바탕으로 연차 N일로 만들 수 있는
 * 최장 연속 휴일 구간을 계산하고 렌더링한다. 순수 vanilla JS, 빌드 없음.
 */

(function () {
  "use strict";

  const DOW_KR = ["일", "월", "화", "수", "목", "금", "토"];
  const MAX_PTO = 10;

  /** @type {{year:number, includeWorker:boolean, n:number}} */
  const state = {
    year: defaultYear(),
    includeWorker: true,
    n: 3,
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

  // ---------- 데이터 구성 ----------

  /**
   * 주어진 연도의 1/1~12/31 배열을 구성한다.
   * isOff: 실제로 쉬는 날인지 (주말/공휴일/대체공휴일/선거일, 근로자의 날은 토글 반영)
   */
  function buildYearDays(year, includeWorker) {
    const list = HOLIDAYS_BY_YEAR[year] || [];
    const map = new Map(list.map((h) => [h.date, h]));

    const days = [];
    const cursor = new Date(year, 0, 1);
    while (cursor.getFullYear() === year) {
      const dateStr = formatDate(cursor);
      const dow = cursor.getDay();
      const info = map.get(dateStr);

      let isOff = dow === 0 || dow === 6;
      if (info) {
        if (info.type === "worker") {
          if (includeWorker) isOff = true;
        } else {
          isOff = true;
        }
      }

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
   * 반환: { bestLen, windows: [{start,end,len}] } — windows는 시간순, 겹치지 않는 구간만.
   */
  function bestWindowsForBudget(days, budget) {
    let left = 0;
    let workdaysInWindow = 0;
    let bestLen = 0;
    let windows = [];

    for (let right = 0; right < days.length; right++) {
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

  function formatRange(days, start, end) {
    const s = days[start].date;
    const e = days[end].date;
    if (s.getMonth() === e.getMonth() && s.getDate() === e.getDate()) {
      return shortLabel(s);
    }
    return `${shortLabel(s)} ~ ${shortLabel(e)}`;
  }

  // ---------- 렌더링 ----------

  let cachedDays = null;

  function recompute() {
    cachedDays = buildYearDays(state.year, state.includeWorker);
    renderHero();
    renderTable();
    renderRibbon();
    renderCalendar();
    renderNextHoliday();
    syncControls();
  }

  function syncControls() {
    document.querySelectorAll("[data-year-btn]").forEach((btn) => {
      const y = Number(btn.dataset.yearBtn);
      btn.setAttribute("aria-pressed", String(y === state.year));
    });
    const nInput = document.getElementById("n-value");
    if (nInput) nInput.textContent = String(state.n);
    const workerToggle = document.getElementById("worker-toggle");
    if (workerToggle) workerToggle.checked = state.includeWorker;
    const decBtn = document.getElementById("n-dec");
    const incBtn = document.getElementById("n-inc");
    if (decBtn) decBtn.disabled = state.n <= 1;
    if (incBtn) incBtn.disabled = state.n >= MAX_PTO;
  }

  function renderHero() {
    const { bestLen, windows } = bestWindowsForBudget(cachedDays, state.n);
    const heroDays = document.getElementById("hero-days");
    const heroRange = document.getElementById("hero-range");
    const heroDetail = document.getElementById("hero-detail");
    const heroAlt = document.getElementById("hero-alt");

    if (!windows.length || bestLen === 0) {
      heroDays.textContent = "—";
      heroRange.textContent = "해당 연도에 쉬는 날이 없어요.";
      heroDetail.innerHTML = "";
      heroAlt.innerHTML = "";
      return;
    }

    const main = windows[0];
    heroDays.textContent = String(main.len);
    heroRange.textContent = formatRange(cachedDays, main.start, main.end);

    const pto = ptoDatesInWindow(cachedDays, main.start, main.end);
    if (pto.length) {
      const ptoLabels = pto.map((d) => shortLabel(d.date)).join(", ");
      heroDetail.innerHTML = `<strong>${pto.length}일</strong> 연차 사용 · ${ptoLabels}`;
    } else {
      heroDetail.innerHTML = "연차 없이도 이미 쉬는 구간이에요.";
    }

    if (windows.length > 1) {
      const alts = windows
        .slice(1, 3)
        .map((w) => formatRange(cachedDays, w.start, w.end))
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

    for (let n = 1; n <= MAX_PTO; n++) {
      const { bestLen, windows } = bestWindowsForBudget(cachedDays, n);
      const tr = document.createElement("tr");
      tr.dataset.n = String(n);
      tr.tabIndex = 0;
      tr.setAttribute("role", "button");
      tr.setAttribute(
        "aria-label",
        `연차 ${n}일로 ${bestLen}일 연휴, 행 선택하기`
      );
      if (n === state.n) tr.classList.add("is-selected");

      const range = windows.length ? formatRange(cachedDays, windows[0].start, windows[0].end) : "—";
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
    if (d.holidayType === "worker") return "worker";
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

  function renderRibbon() {
    const el = document.getElementById("ribbon");
    if (!el) return;
    el.innerHTML = "";
    const ptoSet = currentPtoSet();

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
      cell.className = "ribbon-cell " + dayClass(d);
      if (ptoSet.has(d.dateStr)) cell.classList.add("is-pto");
      cell.title = `${shortLabel(d.date)}${d.holidayName ? " · " + d.holidayName : ""}`;
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
      const first = monthDays[0].date;
      const startDow = first.getDay();

      const wrap = document.createElement("div");
      wrap.className = "month";

      const title = document.createElement("h3");
      title.textContent = `${m + 1}월`;
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
        cell.className = "day " + dayClass(d);
        if (ptoSet.has(d.dateStr)) cell.classList.add("is-pto");
        cell.innerHTML = `<span class="num">${d.date.getDate()}</span>`;
        if (d.holidayName) {
          cell.innerHTML += `<span class="label">${d.holidayName}</span>`;
          cell.title = d.holidayName;
        }
        grid.appendChild(cell);
      });
      wrap.appendChild(grid);
      el.appendChild(wrap);
    }
  }

  function renderNextHoliday() {
    const el = document.getElementById("next-holiday");
    if (!el) return;
    const today = todayLocal();
    const allDays = [
      ...buildYearDays(2026, state.includeWorker),
      ...buildYearDays(2027, state.includeWorker),
    ];
    const next = allDays.find(
      (d) => d.holidayName && d.date.getTime() >= today.getTime()
    );
    if (!next) {
      el.textContent = "";
      return;
    }
    const dday = Math.round((next.date.getTime() - today.getTime()) / 86400000);
    const ddayLabel = dday === 0 ? "오늘" : `D-${dday}`;
    el.textContent = `다음 공휴일: ${next.holidayName} (${shortLabel(next.date)}) · ${ddayLabel}`;
  }

  // ---------- 이벤트 ----------

  function setN(n) {
    state.n = Math.min(MAX_PTO, Math.max(1, n));
    renderHero();
    renderTable();
    renderRibbon();
    renderCalendar();
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

    document.getElementById("worker-toggle").addEventListener("change", (e) => {
      state.includeWorker = e.target.checked;
      recompute();
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
