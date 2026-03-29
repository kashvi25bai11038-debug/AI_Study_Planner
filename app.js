
// State 
const state = {
  topics: [],       // { id, name, subject, examDate, difficulty }
  schedule: [],     // [ { date, dayIndex, blocks: [...] } ]
  doneBlocks: {},   // { blockId: true/false }
  difficulty: 3,    // current form selection
  nextId: 1,
};

// Constants
const DIFF_LABELS = ["", "Easy", "Simple", "Medium", "Hard", "Expert"];
const DIFF_COLORS = ["", "#4CAF82", "#7BC87A", "#F4A535", "#E0A052", "#E05252"];

// DOM refs
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Init
document.addEventListener("DOMContentLoaded", () => {
  setHeaderDate();
  initTabs();
  initStars();
  initAddTopic();
  initGenerateBtn();
  initBackBtn();

  // Set min date for exam date input to today
  const today = new Date().toISOString().split("T")[0];
  $("#topicDate").min = today;
});

// Header date
function setHeaderDate() {
  const d = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  $("#headerDate").textContent = d.toUpperCase();
}

//Tab switching
function initTabs() {
  $$(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tabId) {
  $$(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
  $$(".tab-section").forEach((s) => s.classList.toggle("active", s.id === `tab-${tabId}`));

  if (tabId === "progress") renderProgress();
}

// Star difficulty
function initStars() {
  $$(".star").forEach((star) => {
    star.addEventListener("click", () => {
      const val = parseInt(star.dataset.val);
      state.difficulty = val;
      updateStars();
    });
  });
  updateStars();
}

function updateStars() {
  $$(".star").forEach((s) => {
    s.classList.toggle("active", parseInt(s.dataset.val) <= state.difficulty);
  });
}

//Add topic 
function initAddTopic() {
  $("#addTopicBtn").addEventListener("click", addTopic);
  $("#topicName").addEventListener("keydown", (e) => e.key === "Enter" && addTopic());
}

function addTopic() {
  const name    = $("#topicName").value.trim();
  const subject = $("#topicSubject").value.trim();
  const date    = $("#topicDate").value;

  if (!name || !subject || !date) {
    showToast("⚠️ Please fill in all fields", "warn");
    return;
  }

  const topic = {
    id: state.nextId++,
    name,
    subject,
    examDate: date,
    difficulty: state.difficulty,
  };

  state.topics.push(topic);
  $("#topicName").value = "";
  $("#topicSubject").value = "";

  renderTopicList();
  updateSummary();
  showToast("✓ Topic added");
}

function removeTopic(id) {
  state.topics = state.topics.filter((t) => t.id !== id);
  renderTopicList();
  updateSummary();
}

function renderTopicList() {
  const list = $("#topicList");
  if (!state.topics.length) {
    list.innerHTML = `<div class="empty-topics">No topics yet. Add one above ↑</div>`;
    return;
  }

  list.innerHTML = state.topics
    .map((t) => {
      const days = getDaysRemaining(t.examDate);
      const stars = "★".repeat(t.difficulty);
      return `
        <div class="topic-item">
          <div>
            <div class="topic-name">${escHtml(t.name)}</div>
            <div class="topic-subject-label">${escHtml(t.subject)}</div>
          </div>
          <div class="diff-badge d${t.difficulty}">${stars} ${DIFF_LABELS[t.difficulty]}</div>
          <div class="days-badge">${days}d left</div>
          <button class="btn btn-danger" onclick="removeTopic(${t.id})">✕</button>
        </div>`;
    })
    .join("");
}

function updateSummary() {
  const subjects = [...new Set(state.topics.map((t) => t.subject))];
  const avgDiff = state.topics.length
    ? (state.topics.reduce((a, t) => a + t.difficulty, 0) / state.topics.length).toFixed(1)
    : "—";

  $("#sumTopics").textContent   = state.topics.length;
  $("#sumHours").textContent    = `${$("#dailyHours").value}h`;
  $("#sumSubjects").textContent = subjects.length;
  $("#sumDiff").textContent     = avgDiff;
}

$("#dailyHours")?.addEventListener("input", updateSummary);

//Schedule generation 
function initGenerateBtn() {
  $("#generateBtn").addEventListener("click", () => {
    if (!state.topics.length) {
      showToast("⚠️ Add at least one topic first", "warn");
      return;
    }
    state.schedule  = generateSchedule(state.topics, parseFloat($("#dailyHours").value) || 4);
    state.doneBlocks = {};
    renderSchedule();
    switchTab("schedule");
    showToast("✓ Schedule generated!");
  });
}

function initBackBtn() {
  $("#backToSetupBtn").addEventListener("click", () => switchTab("setup"));
}

function getDaysRemaining(examDate) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exam  = new Date(examDate); exam.setHours(0, 0, 0, 0);
  return Math.max(1, Math.ceil((exam - today) / 86400000));
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function generateSchedule(topics, dailyHours) {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Score each topic
  const scored = topics.map((t) => {
    const days     = getDaysRemaining(t.examDate);
    const priority = t.difficulty / days;
    return { ...t, days, priority, hoursNeeded: t.difficulty * 0.5 + 0.5 };
  }).sort((a, b) => b.priority - a.priority);

  const maxDays  = Math.max(...scored.map((t) => t.days));
  const schedule = [];
  const remaining = scored.map((t) => ({ ...t, hoursLeft: t.hoursNeeded }));

  for (let d = 0; d < Math.min(maxDays, 30); d++) {
    const dateObj   = addDays(today, d);
    const dateStr   = dateObj.toISOString().split("T")[0];
    let   hoursLeft = dailyHours;
    const blocks    = [];
    let   timeMin   = 0; // offset in minutes from 08:00

    const eligible = remaining
      .filter((t) => t.hoursLeft > 0 && getDaysRemaining(t.examDate) > d)
      .sort((a, b) => b.priority - a.priority);

    for (const topic of eligible) {
      if (hoursLeft <= 0) break;
      const alloc = Math.min(hoursLeft, topic.hoursLeft, 2);
      if (alloc < 0.25) continue;

      const mins    = Math.round(alloc * 60);
      const hh      = 8 + Math.floor(timeMin / 60);
      const mm      = timeMin % 60;
      const startStr = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

      blocks.push({
        id:         `${d}-${topic.id}`,
        topicId:    topic.id,
        name:       topic.name,
        subject:    topic.subject,
        difficulty: topic.difficulty,
        type:       "study",
        hours:      alloc,
        startTime:  startStr,
        duration:   `${mins} min`,
        priority:   topic.priority,
      });

      topic.hoursLeft  = Math.max(0, topic.hoursLeft - alloc);
      hoursLeft       -= alloc;
      timeMin         += mins + 10; // 10-min break
    }

    // Revision block if time remains
    if (hoursLeft >= 0.5 && blocks.length) {
      const mins    = Math.round(hoursLeft * 60);
      const hh      = 8 + Math.floor(timeMin / 60);
      const mm      = timeMin % 60;
      blocks.push({
        id:        `${d}-rev`,
        topicId:   null,
        name:      "Revision & Review",
        subject:   "All subjects",
        type:      "revision",
        hours:     hoursLeft,
        startTime: `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`,
        duration:  `${mins} min`,
        priority:  0,
      });
    }

    if (blocks.length) {
      schedule.push({ date: dateStr, dayIndex: d, blocks });
    }
  }

  return schedule;
}

//Render schedule
function renderSchedule() {
  const hasSchedule = state.schedule.length > 0;
  $("#scheduleEmpty").style.display    = hasSchedule ? "none"  : "block";
  $("#scheduleContent").style.display  = hasSchedule ? "grid"  : "none";
  if (!hasSchedule) return;

  renderScheduleDays();
  renderScheduleSidebar();
  updateOverview();
}

function renderScheduleDays() {
  const container = $("#scheduleDays");
  const days      = state.schedule.slice(0, 14);

  container.innerHTML = days.map((day, di) => {
    const totalHours = day.blocks.reduce((a, b) => a + b.hours, 0).toFixed(1);
    const label      = di === 0 ? "Today" : di === 1 ? "Tomorrow" : fmtDate(day.date);

    const blocksHtml = day.blocks.map((block) => renderBlock(block)).join("");

    return `
      <div class="day-block" style="animation-delay:${di * 0.05}s">
        <div class="day-header">
          <div class="day-label">${label}</div>
          <div class="day-date-tag">${day.date}</div>
          <div class="day-hours-tag">${totalHours}h planned</div>
        </div>
        <div class="day-divider"></div>
        ${blocksHtml}
      </div>`;
  }).join("");

  if (state.schedule.length > 14) {
    container.innerHTML += `
      <div style="text-align:center;color:var(--text-muted);font-size:13px;padding:10px 0">
        + ${state.schedule.length - 14} more days in plan
      </div>`;
  }
}

function renderBlock(block) {
  const done      = !!state.doneBlocks[block.id];
  const typeClass = done ? "done" : `type-${block.type}`;
  const checkHtml = done ? `<div class="block-check checked">✓</div>` : `<div class="block-check"></div>`;

  const diffStars = block.difficulty
    ? `<span class="block-diff-stars" style="color:${DIFF_COLORS[block.difficulty]}">${"★".repeat(block.difficulty)}</span>`
    : "";

  const maxPriority = 1;
  const barWidth = block.priority ? Math.min(100, (block.priority / maxPriority) * 100) : 0;
  const priorityBar = block.type === "study"
    ? `<div class="priority-bar-wrap"><div class="priority-bar" style="width:${barWidth}%"></div></div>`
    : "";

  return `
    <div class="study-block ${typeClass}" onclick="toggleBlock('${block.id}')">
      ${checkHtml}
      <div class="block-content">
        <div class="block-name">${escHtml(block.name)}</div>
        <div class="block-meta">${escHtml(block.subject)}${diffStars}</div>
        ${priorityBar}
      </div>
      <div class="block-time-col">
        <div class="block-time">${block.startTime}</div>
        <div class="block-time">${block.duration}</div>
      </div>
    </div>`;
}

function toggleBlock(blockId) {
  state.doneBlocks[blockId] = !state.doneBlocks[blockId];
  renderScheduleDays();
  updateOverview();
  // Also refresh progress tab if visible
  if ($("#tab-progress").classList.contains("active")) renderProgress();
}

function renderScheduleSidebar() {
  const topicListEl = $("#scheduleTopicList");
  topicListEl.innerHTML = state.topics.map((t) => `
    <div class="sched-topic-item">
      <div class="sched-topic-name">
        <span>${escHtml(t.name)}</span>
        <span style="color:${DIFF_COLORS[t.difficulty]}">${"★".repeat(t.difficulty)}</span>
      </div>
      <div class="sched-topic-meta">${escHtml(t.subject)} · ${getDaysRemaining(t.examDate)}d remaining</div>
    </div>`).join("");
}

function updateOverview() {
  const allBlocks   = state.schedule.flatMap((d) => d.blocks.filter((b) => b.type === "study"));
  const total       = allBlocks.length;
  const done        = allBlocks.filter((b) => state.doneBlocks[b.id]).length;
  const totalHours  = state.schedule.reduce((a, d) =>
    a + d.blocks.reduce((x, b) => x + b.hours, 0), 0).toFixed(1);
  const progress    = total ? Math.round((done / total) * 100) : 0;

  $("#ovTotalDays").textContent   = state.schedule.length;
  $("#ovTotalBlocks").textContent = total;
  $("#ovDone").textContent        = done;
  $("#ovRemaining").textContent   = total - done;
  $("#ovHours").textContent       = `${totalHours}h`;
  $("#ovProgress").textContent    = `${progress}%`;
  $("#ovProgressBar").style.width = `${progress}%`;
}

//Progress tab
function renderProgress() {
  const hasSchedule = state.schedule.length > 0;
  $("#progressEmpty").style.display   = hasSchedule ? "none"  : "block";
  $("#progressContent").style.display = hasSchedule ? "block" : "none";
  if (!hasSchedule) return;

  const allBlocks = state.schedule.flatMap((d) => d.blocks.filter((b) => b.type === "study"));
  const total     = allBlocks.length;
  const done      = allBlocks.filter((b) => state.doneBlocks[b.id]).length;
  const progress  = total ? Math.round((done / total) * 100) : 0;

  $("#pgProgress").textContent  = `${progress}%`;
  $("#pgDone").textContent      = done;
  $("#pgRemaining").textContent = total - done;
  $("#pgTopics").textContent    = state.topics.length;

  // Subject breakdown
  const subjects = [...new Set(state.topics.map((t) => t.subject))];
  $("#subjectBreakdown").innerHTML = subjects.map((subj) => {
    const subjTopics = state.topics.filter((t) => t.subject === subj);
    const subjBlocks = state.schedule.flatMap((d) =>
      d.blocks.filter((b) => b.subject === subj && b.type === "study"));
    const subjDone   = subjBlocks.filter((b) => state.doneBlocks[b.id]).length;
    const pct        = subjBlocks.length ? Math.round((subjDone / subjBlocks.length) * 100) : 0;
    const complete   = pct === 100;

    const chips = subjTopics.map((t) => {
      const bg  = t.difficulty > 3 ? "rgba(224,82,82,0.1)"    : "rgba(244,165,53,0.1)";
      const col = t.difficulty > 3 ? "var(--diff-5)" : DIFF_COLORS[t.difficulty];
      const bdr = t.difficulty > 3 ? "rgba(224,82,82,0.25)"   : "rgba(244,165,53,0.25)";
      return `<span class="topic-chip" style="background:${bg};color:${col};border:1px solid ${bdr}">${escHtml(t.name)}</span>`;
    }).join("");

    return `
      <div class="subject-row">
        <div class="subject-row-header">
          <div>
            <div class="subject-name">${escHtml(subj)}</div>
            <div class="subject-meta">${subjTopics.length} topic${subjTopics.length !== 1 ? "s" : ""} · ${subjBlocks.length} sessions</div>
          </div>
          <div class="subject-pct" style="color:${complete ? "var(--green)" : "var(--amber)"}">${pct}%</div>
        </div>
        <div class="subject-bar-wrap">
          <div class="subject-bar ${complete ? "complete" : ""}" style="width:${pct}%"></div>
        </div>
        <div>${chips}</div>
      </div>`;
  }).join("");
}

// Toast
function showToast(msg, type = "success") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = `toast show ${type === "warn" ? "warn" : type === "err" ? "err" : ""}`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.classList.remove("show");
  }, 2800);
}

//Utility 
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
