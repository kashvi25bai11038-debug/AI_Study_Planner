<div align="center">

# StudyAI — Smart Study Planner

**A priority-driven, browser-based study scheduler that thinks like a tutor.**



<br/>


</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [Usage Guide](#usage-guide)
  - [Step 1 — Add Your Topics](#step-1--add-your-topics)
  - [Step 2 — Generate a Schedule](#step-2--generate-a-schedule)
  - [Step 3 — Track Your Progress](#step-3--track-your-progress)
- [Project Structure](#project-structure)
- [Technical Details](#technical-details)
  - [Scheduling Algorithm](#scheduling-algorithm)
  - [Architecture Decisions](#architecture-decisions)
- [Customisation](#customisation)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

StudyAI is a **zero-dependency, single-page web application** that generates a personalised study schedule from your list of exam topics. Instead of treating all subjects equally, it uses a priority formula to allocate more time to **harder topics with closer exam dates** — exactly the way a good tutor would advise you.

Open one HTML file in any browser. No install, no account, no server.

---

## Features

| Feature | Description |
|---|---|
| **Smart Prioritisation** | Topics scored by difficulty ÷ days remaining — urgent and hard topics come first |
| **Auto-Schedule Generator** | Produces a day-by-day plan across up to 30 days, respecting your daily hour budget |
| **Progress Tracking** | Click any block to mark it done; overall and per-subject progress updates live |
| **Difficulty Rating** | 5-star input maps topics to Easy → Expert, influencing both scheduling weight and hours allocated |
| **Subject Breakdown** | Progress tab shows completion bars and topic chips grouped by subject |
| **Fully Responsive** | Works on desktop, tablet, and mobile — no layout breakage at any screen size |
| **XSS-Safe** | All user input is HTML-escaped before rendering — no injection vulnerabilities |
| **No Dependencies** | Pure HTML + CSS + JavaScript; nothing to install or configure |

---

## How It Works

```
You provide:                   StudyAI produces:
─────────────────────          ──────────────────────────────────────
Topic name          ──┐        Day 1 │ 08:00 Sorting Algorithms  90m
Subject             ──┤  algo  Day 1 │ 09:40 Calculus            60m
Exam date           ──┼──────► Day 1 │ 10:50 Revision & Review   30m
Difficulty (1–5)    ──┤        Day 2 │ 08:00 Sorting Algorithms  60m
Daily hours budget  ──┘        Day 2 │ 09:10 Linear Algebra      90m
                               ...and so on until all exams pass
```

The scheduling engine scores every topic with:

```
priority = difficulty / days_remaining
```

Higher scores get scheduled earlier and with more time each day.

---

## Getting Started

### Prerequisites

StudyAI has **no prerequisites**. You only need:

- A modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- The three project files: `index.html`, `style.css`, `app.js`

No Node.js. No npm. No Python. No server.

---

### Installation

**Option A — Clone the repository**

```bash
git clone https://github.com/your-username/studyai.git
cd studyai
```

**Option B — Download as ZIP**

1. Click the green **Code** button on this page
2. Select **Download ZIP**
3. Extract the ZIP to any folder on your computer

**Option C — Copy the three files manually**

Download or copy `index.html`, `style.css`, and `app.js` into the same folder.

---

### Running the App

**Simplest method — open directly in your browser:**

```bash
# macOS
open index.html

# Windows
start index.html

# Linux
xdg-open index.html
```

Or just double-click `index.html` in your file explorer.

**Alternative — serve locally (optional, for development):**

```bash
# Python 3
python -m http.server 8000

# Node.js (if installed)
npx serve .

# Then open: http://localhost:8000
```

>  A local server is **not required** for StudyAI to function. It works identically when opened as a local file.

---

## Usage Guide

### Step 1 — Add Your Topics

On the **Setup** tab:

1. Enter a **Topic Name** (e.g., *Sorting Algorithms*)
2. Enter the **Subject** it belongs to (e.g., *Data Structures*)
3. Pick your **Exam Date** using the date picker
4. Click the stars to set a **Difficulty Level** (1 = Easy, 5 = Expert)
5. Click **+ Add Topic**

Repeat for every topic you need to study. Topics appear in a list below the form — click **✕** to remove any.

> **Tip:** Group related topics under the same Subject name. The Progress tab will then show a single progress bar for the whole subject.

---

### Step 2 — Generate a Schedule

1. In the **Study Settings** card, set your **Daily Study Hours** (default: 4 h)
2. Click **Generate Schedule**

StudyAI switches to the **Schedule** tab and displays:

- A day-by-day plan for up to 14 days on screen (the full plan covers up to 30 days)
- Each block shows the topic name, subject, start time, and duration
- A colour-coded sidebar tracks total days, blocks, hours, and live completion percentage

**Marking a block as done:**  
Click any study block to toggle it complete. It turns green and strikes through. Click again to undo.

---

### Step 3 — Track Your Progress

Switch to the **Progress** tab at any time to see:

- Overall completion percentage
- Blocks completed vs. remaining
- A per-subject breakdown with progress bars
- Topic chips colour-coded by difficulty level

---

## Project Structure

```
studyai/
├── index.html      # App shell — all HTML markup and tab structure
├── style.css       # All styling, CSS variables, animations, responsive rules
├── app.js          # State management, scheduling algorithm, DOM rendering
└── README.md       # This file
```

There are no build artifacts, no compiled assets, and no hidden config files.

---

## Technical Details

### Scheduling Algorithm

The core of the application is the `generateSchedule()` function in `app.js`.

**Inputs:** array of topic objects, daily hours budget  
**Output:** array of day objects, each containing ordered study blocks

**Process:**

1. **Score** — each topic is assigned `priority = difficulty / daysRemaining`
2. **Sort** — topics are sorted descending by priority score
3. **Allocate** — for each day (up to 30), fill the daily hour budget greedily:
   - Take the highest-priority eligible topic
   - Allocate `min(hoursLeft for day, hoursLeft for topic, 2h)` — never more than 2 h on one topic per day
   - Add a 10-minute break before the next block
   - Repeat until the daily budget is exhausted or no eligible topics remain
4. **Revise** — any leftover time becomes a *Revision & Review* block
5. **Terminate** — topics stop appearing once their exam date has passed

**Complexity:** O(D × T) where D = days (≤ 30) and T = number of topics.

---

### Architecture Decisions

**Why no framework?**  
The app is simple enough that a framework adds more boilerplate than it removes. Plain JavaScript keeps the codebase readable, the deployment trivial (one HTML file), and the learning curve zero for contributors.

**Why a centralised state object?**  
All mutable data lives in a single `state` object at the top of `app.js`. Every render function reads from this object; no component holds its own hidden state. This makes debugging straightforward: the entire application state is inspectable in the browser console with `window.state` (after assigning it).

**Why HTML-escape user input?**  
Topic names and subjects are rendered via `innerHTML`. The `escHtml()` utility converts `<`, `>`, `&`, and `"` to HTML entities, preventing any injected markup or script tags from executing.

---

## Customisation

All visual variables live at the top of `style.css` as CSS custom properties:

```css
:root {
  --navy:        #0D1B2A;   /* background */
  --amber:       #F4A535;   /* primary accent */
  --green:       #4CAF82;   /* completed state */
  --blue:        #4A90D9;   /* generate button / revision blocks */
  --text:        #D4C5A8;   /* body text */
  /* ... */
}
```

Change any of these values to re-theme the entire application instantly.

**Other easy customisations in `app.js`:**

| Constant / Value | Location | What it controls |
|---|---|---|
| `hoursNeeded: difficulty * 0.5 + 0.5` | `generateSchedule()` | Total hours budgeted per topic |
| `Math.min(..., 2)` | Block allocation loop | Maximum hours on one topic per day |
| `timeMin += mins + 10` | Block allocation loop | Break duration between blocks (minutes) |
| `Math.min(maxDays, 30)` | `generateSchedule()` | Maximum days in the plan |
| `days.slice(0, 14)` | `renderScheduleDays()` | Days shown on screen before "X more days" |

---

## Known Limitations

- **No persistence** — refreshing the page resets all topics and progress. Browser `localStorage` support is planned (see below).
- **Single session** — the app holds state in memory only; multiple tabs do not sync.
- **No calendar export** — blocks cannot yet be exported to Google Calendar or iCal.
- **English only** — date formatting uses `en-US` locale strings. Internationalisation is not yet implemented.
- **Schedule cap** — the planner covers a maximum of 30 days. Topics with exams beyond 30 days will not appear in the generated schedule.

---

## Future Improvements

- [ ] **localStorage persistence** — save topics and progress across browser sessions
- [ ] **Pomodoro timer** — built-in countdown timer that activates when starting a block
- [ ] **iCal / Google Calendar export** — add study blocks to an external calendar
- [ ] **Dark/light mode toggle** — manual theme override
- [ ] **Drag-to-reorder topics** — manual priority override before generating
- [ ] **AI difficulty estimator** — paste syllabus text and have the difficulty pre-filled
- [ ] **Repeat / recurring topics** — schedule ongoing subjects without a fixed exam date

---

## Contributing

Contributions are welcome! To get started:

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes to `index.html`, `style.css`, or `app.js`
4. Test by opening `index.html` directly in your browser
5. Commit with a clear message: `git commit -m "feat: add localStorage persistence"`
6. Push and open a Pull Request

**Code style:** vanilla JS, no transpilation, no bundler. Keep functions small and well-named. Escape all HTML output. Comment non-obvious logic.

---

---

<div align="center">

</div>
