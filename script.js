// ============================================================
// TWLE game logic
// ============================================================
// This file has no build step and no dependencies — it just runs
// in the browser as-is. It reads the word list from words.js
// (loaded before this file in index.html).

(function () {
  "use strict";

  // ------------------------------------------------------------
  // Config
  // ------------------------------------------------------------

  // Change this ONLY ONCE, before you launch, then never again —
  // it's the anchor that "today's word" counts forward from.
  // Format: year, month (1-12), day.
  const LAUNCH_DATE = new Date(2026, 0, 1); // Jan 1, 2026

  const MAX_GUESSES = 6;

  // ------------------------------------------------------------
  // Word list handling
  // ------------------------------------------------------------

  const WORDS = (typeof TWLE_WORDS !== "undefined" ? TWLE_WORDS : [])
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2);

  if (WORDS.length === 0) {
    document.body.innerHTML =
      "<p style='padding:20px;font-family:sans-serif'>No words configured. Add some words to words.js.</p>";
    throw new Error("TWLE_WORDS is empty");
  }

  function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function daysBetween(a, b) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((bMid - aMid) / msPerDay);
  }

  const today = new Date();
  const dayNumber = Math.max(0, daysBetween(LAUNCH_DATE, today));
  const puzzleNumber = dayNumber + 1;
  const wordIndex = dayNumber % WORDS.length;
  const ANSWER = WORDS[wordIndex];
  const WORD_LENGTH = ANSWER.length;
  const TODAY_KEY = dateKey(today);

  // ------------------------------------------------------------
  // Storage helpers
  // ------------------------------------------------------------

  const STATE_KEY = `twle-state-${TODAY_KEY}`;
  const STATS_KEY = "twle-stats";
  const SEEN_HELP_KEY = "twle-seen-help";

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return { guesses: [], status: "playing" };
      return JSON.parse(raw);
    } catch (e) {
      return { guesses: [], status: "playing" };
    }
  }

  function saveState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function loadStats() {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (!raw) throw new Error("none");
      return JSON.parse(raw);
    } catch (e) {
      return {
        played: 0,
        wins: 0,
        currentStreak: 0,
        maxStreak: 0,
        distribution: [0, 0, 0, 0, 0, 0],
        lastCompletedDay: -1,
      };
    }
  }

  function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  // ------------------------------------------------------------
  // Guess evaluation (handles duplicate letters correctly)
  // ------------------------------------------------------------

  function evaluateGuess(guess, answer) {
    const answerChars = answer.split("");
    const guessChars = guess.split("");
    const result = new Array(guessChars.length).fill("absent");
    const used = new Array(answerChars.length).fill(false);

    for (let i = 0; i < guessChars.length; i++) {
      if (guessChars[i] === answerChars[i]) {
        result[i] = "correct";
        used[i] = true;
      }
    }
    for (let i = 0; i < guessChars.length; i++) {
      if (result[i] === "correct") continue;
      const idx = answerChars.findIndex(
        (c, j) => !used[j] && c === guessChars[i]
      );
      if (idx !== -1) {
        result[i] = "present";
        used[idx] = true;
      }
    }
    return result;
  }

  // ------------------------------------------------------------
  // DOM: board
  // ------------------------------------------------------------

  const boardEl = document.getElementById("board");
  const rows = [];

  for (let r = 0; r < MAX_GUESSES; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    const cells = [];
    for (let c = 0; c < WORD_LENGTH; c++) {
      const cell = document.createElement("div");
      cell.className = "tile";
      rowEl.appendChild(cell);
      cells.push(cell);
    }
    boardEl.appendChild(rowEl);
    rows.push({ el: rowEl, cells });
  }

  // ------------------------------------------------------------
  // DOM: keyboard
  // ------------------------------------------------------------

  const KEYBOARD_ROWS = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ɔ", "ɛ"],
    ["enter", "z", "x", "c", "v", "b", "n", "m", "ŋ", "back"],
  ];

  const keyboardEl = document.getElementById("keyboard");
  const keyEls = {};

  KEYBOARD_ROWS.forEach((rowKeys) => {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    rowKeys.forEach((k) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key";
      if (k === "enter" || k === "back") btn.classList.add("wide");
      btn.textContent = k === "enter" ? "Enter" : k === "back" ? "⌫" : k;
      btn.addEventListener("click", () => handleKey(k));
      rowEl.appendChild(btn);
      keyEls[k] = btn;
    });
    keyboardEl.appendChild(rowEl);
  });

  // Game state variables. Populated for real by init() at the bottom of
  // this file, once every DOM element/function below has been defined —
  // they're declared here (not there) just so every function in between
  // can close over them.
  let state;
  let currentGuess = "";
  let rowIndex = 0;
  let gameOver = false;
  let inputLocked = false;

  function renderGuessInstant(guess, r) {
    const evaluation = evaluateGuess(guess, ANSWER);
    const row = rows[r];
    guess.split("").forEach((letter, c) => {
      row.cells[c].textContent = letter;
      row.cells[c].classList.add("filled", evaluation[c]);
    });
  }

  // ------------------------------------------------------------
  // Input handling
  // ------------------------------------------------------------

  function handleKey(k) {
    if (gameOver || inputLocked) return;
    if (k === "enter") {
      submitGuess();
    } else if (k === "back") {
      currentGuess = currentGuess.slice(0, -1);
      renderCurrentGuess();
    } else {
      if (currentGuess.length < WORD_LENGTH) {
        currentGuess += k;
        renderCurrentGuess();
      }
    }
  }

  function renderCurrentGuess() {
    const row = rows[rowIndex];
    for (let c = 0; c < WORD_LENGTH; c++) {
      const letter = currentGuess[c] || "";
      row.cells[c].textContent = letter;
      row.cells[c].classList.toggle("filled", !!letter);
    }
  }

  document.addEventListener("keydown", (e) => {
    if (gameOver || inputLocked) return;
    const k = e.key.toLowerCase();
    if (k === "enter") handleKey("enter");
    else if (k === "backspace") handleKey("back");
    else if (/^[a-z]$/.test(k)) handleKey(k);
  });

  function submitGuess() {
    if (currentGuess.length < WORD_LENGTH) {
      shakeRow(rowIndex);
      showToast("Not enough letters");
      return;
    }
    const guess = currentGuess;
    const evaluation = evaluateGuess(guess, ANSWER);
    const row = rows[rowIndex];
    inputLocked = true;

    guess.split("").forEach((letter, c) => {
      const cell = row.cells[c];
      setTimeout(() => {
        cell.classList.add("flip");
        setTimeout(() => {
          cell.classList.add(evaluation[c]);
        }, 200);
      }, c * 150);
    });

    const totalDelay = (WORD_LENGTH - 1) * 150 + 500;

    setTimeout(() => {
      updateKeyColors(guess, evaluation);

      state.guesses.push(guess);
      const won = evaluation.every((r2) => r2 === "correct");

      if (won) {
        state.status = "won";
        gameOver = true;
        row.el.classList.add("winner");
        recordCompletion(true, state.guesses.length);
        setTimeout(() => {
          showToast(winMessage(state.guesses.length));
          showShareRow();
        }, 200);
      } else if (state.guesses.length >= MAX_GUESSES) {
        state.status = "lost";
        gameOver = true;
        recordCompletion(false, MAX_GUESSES);
        showToast(`The word was ${ANSWER.toUpperCase()}`, 4000);
        showShareRow();
      } else {
        rowIndex++;
        currentGuess = "";
      }

      saveState(state);
      inputLocked = false;
    }, totalDelay);
  }

  function winMessage(guessCount) {
    const messages = ["Genius", "Magnificent", "Impressive", "Splendid", "Great", "Phew"];
    return messages[guessCount - 1] || "You got it!";
  }

  function shakeRow(r) {
    const row = rows[r];
    row.el.classList.add("shake");
    setTimeout(() => row.el.classList.remove("shake"), 500);
  }

  // ------------------------------------------------------------
  // Keyboard coloring (never downgrade a key's best-known state)
  // ------------------------------------------------------------

  const KEY_PRIORITY = { absent: 0, present: 1, correct: 2 };

  function updateKeyColors(guess, evaluation) {
    guess.split("").forEach((letter, i) => {
      const state2 = evaluation[i];
      const btn = keyEls[letter];
      if (!btn) return;
      const current = btn.dataset.state;
      if (!current || KEY_PRIORITY[state2] > KEY_PRIORITY[current]) {
        btn.dataset.state = state2;
        btn.classList.remove("correct", "present", "absent");
        btn.classList.add(state2);
      }
    });
  }

  function updateAllKeyColors() {
    state.guesses.forEach((guess) => {
      updateKeyColors(guess, evaluateGuess(guess, ANSWER));
    });
  }

  // ------------------------------------------------------------
  // Stats
  // ------------------------------------------------------------

  function recordCompletion(won, guessCount) {
    const stats = loadStats();
    if (stats.lastCompletedDay === dayNumber) return; // already recorded today
    stats.played++;
    if (won) {
      stats.wins++;
      stats.currentStreak++;
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
      stats.distribution[guessCount - 1] = (stats.distribution[guessCount - 1] || 0) + 1;
    } else {
      stats.currentStreak = 0;
    }
    stats.lastCompletedDay = dayNumber;
    saveStats(stats);
  }

  // ------------------------------------------------------------
  // Toasts
  // ------------------------------------------------------------

  const toastContainer = document.getElementById("toast-container");

  function showToast(message, duration) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), duration || 2200);
  }

  // ------------------------------------------------------------
  // Share
  // ------------------------------------------------------------

  const shareRow = document.getElementById("share-row");
  const shareWhatsappBtn = document.getElementById("share-whatsapp-btn");
  const shareCopyBtn = document.getElementById("share-copy-btn");

  function showShareRow() {
    shareRow.classList.remove("hidden");
  }

  function buildShareText() {
    const scoreLabel = state.status === "won" ? `${state.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
    const grid = state.guesses
      .map((guess) =>
        evaluateGuess(guess, ANSWER)
          .map((r) => (r === "correct" ? "🟩" : r === "present" ? "🟨" : "⬜"))
          .join("")
      )
      .join("\n");
    return `Twle #${puzzleNumber} ${scoreLabel}\n\n${grid}\n\n${location.origin}${location.pathname}`;
  }

  shareWhatsappBtn.addEventListener("click", () => {
    const text = buildShareText();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  });

  shareCopyBtn.addEventListener("click", async () => {
    const text = buildShareText();
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied!");
    } catch (e) {
      // Fallback for older in-app browsers without Clipboard API.
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        showToast("Copied!");
      } catch (e2) {
        showToast("Couldn't copy — long-press the button instead");
      }
      textarea.remove();
    }
  });

  // ------------------------------------------------------------
  // Modals
  // ------------------------------------------------------------

  function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
  }
  function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
  }

  document.getElementById("help-btn").addEventListener("click", () => openModal("help-modal"));
  document.getElementById("stats-btn").addEventListener("click", () => {
    renderStats();
    openModal("stats-modal");
  });
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.add("hidden");
    });
  });

  function renderStats() {
    const stats = loadStats();
    document.getElementById("stat-played").textContent = stats.played;
    document.getElementById("stat-winpct").textContent = stats.played
      ? Math.round((stats.wins / stats.played) * 100)
      : 0;
    document.getElementById("stat-streak").textContent = stats.currentStreak;
    document.getElementById("stat-maxstreak").textContent = stats.maxStreak;

    const distEl = document.getElementById("distribution");
    distEl.innerHTML = "";
    const maxVal = Math.max(1, ...stats.distribution);
    stats.distribution.forEach((count, i) => {
      const guessNum = i + 1;
      const isToday = gameOver && state.status === "won" && state.guesses.length === guessNum;
      const rowEl = document.createElement("div");
      rowEl.className = "dist-row";
      rowEl.innerHTML = `
        <div class="dist-label">${guessNum}</div>
        <div class="dist-bar-track">
          <div class="dist-bar${isToday ? " highlight" : ""}" style="width:${Math.max(8, (count / maxVal) * 100)}%">${count}</div>
        </div>
      `;
      distEl.appendChild(rowEl);
    });
  }

  // ------------------------------------------------------------
  // Init — runs once, after every function/element above exists
  // ------------------------------------------------------------

  function init() {
    state = loadState();
    rowIndex = state.guesses.length;
    gameOver = state.status !== "playing";

    // Replay any guesses already made today (e.g. page was reloaded).
    state.guesses.forEach((guess, r) => renderGuessInstant(guess, r));
    if (gameOver) {
      updateAllKeyColors();
      showShareRow();
    }

    if (!localStorage.getItem(SEEN_HELP_KEY)) {
      openModal("help-modal");
      localStorage.setItem(SEEN_HELP_KEY, "true");
    }
  }

  init();
})();
