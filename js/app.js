/**
 * Jolly & Clean Application Controller
 * Interactive card selection for news sources with pure live scraping
 */

const STANDARD_CATEGORIES = [
  { id: "news", label: "News" },
  { id: "politics", label: "Politics" },
  { id: "business", label: "Business" },
  { id: "sports", label: "Sports" },
  { id: "entertainment", label: "Entertainment & Showbiz" },
  { id: "opinion", label: "Opinion & Features" }
];

const PORTAL_CATEGORY_MAP = {
  "3News": {
    news: ["news"],
    business: ["business"],
    politics: ["news"],
    sports: ["sports"],
    entertainment: ["showbiz"],
    opinion: ["opinion"]
  },
  "MyJoyOnline": {
    news: ["news"],
    business: ["business"],
    politics: ["news"],
    sports: ["sports"],
    entertainment: ["entertainment"],
    opinion: ["opinion"]
  },
  "Ghanaweb": {
    news: ["NewsArchive"],
    business: ["business"],
    politics: ["NewsArchive"],
    sports: ["SportsArchive"],
    entertainment: ["entertainment"],
    opinion: ["features"]
  },
  "Ghana web": {
    news: ["NewsArchive"],
    business: ["business"],
    politics: ["NewsArchive"],
    sports: ["SportsArchive"],
    entertainment: ["entertainment"],
    opinion: ["features"]
  },
  "Modern Ghana": {
    news: ["general", "news"],
    business: ["business"],
    politics: ["news", "general"],
    sports: ["sports"],
    entertainment: ["entertainment"],
    opinion: ["general"]
  },
  "Yen Ghana": {
    news: ["ghana"],
    business: ["business"],
    politics: ["politics", "ghana"],
    sports: ["sports"],
    entertainment: ["entertainment"],
    opinion: ["ghana"]
  }
};

function formatCategoryLabel(cat) {
  if (!cat) return "General";
  const lower = cat.toLowerCase();
  if (lower === "showbiz" || lower === "entertainment") return "Entertainment";
  if (lower === "newsarchive" || lower === "general" || lower === "ghana" || lower === "news") return "News";
  if (lower === "sportsarchive" || lower === "sports") return "Sports";
  if (lower === "business") return "Business";
  if (lower === "features" || lower === "opinion") return "Opinion";
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function normalizeSourceName(s) {
  if (!s) return "";
  const lower = s.toLowerCase().replace(/\s+/g, "");
  if (lower === "ghanaweb") return "ghanaweb";
  if (lower === "3news") return "3news";
  if (lower === "myjoyonline" || lower === "joyonline" || lower === "joynews") return "myjoyonline";
  if (lower === "modernghana") return "modernghana";
  if (lower === "yenghana" || lower === "yen") return "yenghana";
  return lower;
}

function filterArticlesByCriteria(dataset, sourceName, activeCategoriesSet, startDate, endDate) {
  if (!Array.isArray(dataset) || dataset.length === 0) return [];

  const targetSourceNorm = normalizeSourceName(sourceName);
  const d1 = startDate ? startDate.slice(0, 10) : "";
  const d2 = endDate ? endDate.slice(0, 10) : "";
  const minDate = d1 && d2 ? (d1 <= d2 ? d1 : d2) : (d1 || d2);
  const maxDate = d1 && d2 ? (d1 > d2 ? d1 : d2) : (d1 || d2);

  const validCategoryValues = new Set();
  if (activeCategoriesSet && activeCategoriesSet.size > 0) {
    activeCategoriesSet.forEach(stdCat => {
      validCategoryValues.add(stdCat.toLowerCase());
      const mapped = PORTAL_CATEGORY_MAP[sourceName]?.[stdCat];
      if (Array.isArray(mapped)) {
        mapped.forEach(m => validCategoryValues.add(m.toLowerCase()));
      } else if (mapped) {
        validCategoryValues.add(mapped.toLowerCase());
      }
    });
  }

  return dataset.filter(art => {
    if (normalizeSourceName(art.Source) !== targetSourceNorm) return false;

    const artDate = (art["Date Posted"] || "").slice(0, 10);
    if (minDate && maxDate && artDate) {
      if (artDate < minDate || artDate > maxDate) return false;
    }

    if (validCategoryValues.size > 0 && art.Category) {
      const artCat = art.Category.toLowerCase();
      let catMatched = false;
      for (const c of validCategoryValues) {
        if (artCat === c || artCat.includes(c) || c.includes(artCat)) {
          catMatched = true;
          break;
        }
      }
      if (!catMatched) return false;
    }

    return true;
  });
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const today = new Date();
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(today.getDate() - 3);

let state = {
  articles: [],
  cachedDataset: [],
  source1: "3News",
  source2: "MyJoyOnline",
  activeCategories: new Set(["news"]),
  startDate: formatDate(threeDaysAgo),
  endDate: formatDate(today),
  threshold: 50,
  activeTab: "analysis",
  activeView: "charts",
  pairsFilter: "all",
  pairsSearch: "",
  pairsDisplayMode: "cards",
  lastAnalysisData: null
};

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initDateInputs();
  initSourceCards();
  initCategoryPills();
  initSliders();
  initResultTabs();
  initPairsControls();
  initResetButton();
  initQuickCompare();

  // Pre-load saved articles from data/articles.json if available
  fetch("./data/articles.json")
    .then(res => res.ok ? res.json() : [])
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        state.cachedDataset = data;
        state.articles = data;
        const s1Count = data.filter(a => normalizeSourceName(a.Source) === normalizeSourceName(state.source1)).length;
        const s2Count = data.filter(a => normalizeSourceName(a.Source) === normalizeSourceName(state.source2)).length;
        if (s1Count > 0 && s2Count > 0) {
          logTerminal(`Loaded ${data.length} stored articles (${state.source1}: ${s1Count}, ${state.source2}: ${s2Count}).`, 'info');
        }
      }
    })
    .catch(() => { });
});

// Primary Tab Navigation
function initTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => {
        t.classList.remove("active", "bg-slate-100", "text-slate-800");
        t.classList.add("text-slate-600");
      });
      tab.classList.add("active", "bg-slate-100", "text-slate-800");
      tab.classList.remove("text-slate-600");

      const tabTarget = tab.dataset.tab;
      state.activeTab = tabTarget;

      document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
      const activeContent = document.getElementById(`tab-${tabTarget}`);
      if (activeContent) activeContent.classList.remove("hidden");
    });
  });
}

function initDateInputs() {
  const startInput = document.getElementById("scan-start-date");
  const endInput = document.getElementById("scan-end-date");
  const todayStr = formatDate(today);

  if (startInput) {
    startInput.value = state.startDate;
    startInput.max = todayStr;
  }
  if (endInput) {
    endInput.value = state.endDate;
    endInput.max = todayStr;
  }

  startInput?.addEventListener("change", (e) => {
    const val = e.target.value;
    if (state.endDate && val > state.endDate) {
      alert("Invalid Date Range: Start Date cannot be after the End Date.");
      showToast("Start Date cannot be after End Date.", "error");
      startInput.value = state.startDate;
      return;
    }
    state.startDate = val;
  });

  endInput?.addEventListener("change", (e) => {
    const val = e.target.value;
    if (state.startDate && val < state.startDate) {
      alert("Invalid Date Range: The End Date cannot be in the past of the Start Date. Please select a valid date range.");
      showToast("End Date cannot be earlier than Start Date.", "error");
      endInput.value = state.endDate;
      return;
    }
    state.endDate = val;
  });
}

// Source Selection Cards
function initSourceCards() {
  const cards = document.querySelectorAll(".source-card");

  function updateCardStyles() {
    cards.forEach(card => {
      const src = card.dataset.source;
      const slot = card.querySelector(".badge-slot");
      card.classList.remove("selected-s1", "selected-s2");

      if (src === state.source1) {
        card.classList.add("selected-s1");
        if (slot) slot.innerHTML = `<span class="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">Source 1</span>`;
      } else if (src === state.source2) {
        card.classList.add("selected-s2");
        if (slot) slot.innerHTML = `<span class="bg-sky-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">Source 2</span>`;
      } else {
        if (slot) slot.innerHTML = `<span class="text-slate-400 font-semibold text-[10px]">Tap to select</span>`;
      }
    });

    const indicator = document.getElementById("selected-sources-indicator");
    if (indicator) {
      if (state.source1 && state.source2) {
        indicator.textContent = `${state.source1} vs ${state.source2}`;
        indicator.className = "text-xs font-bold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-300";
      } else {
        indicator.textContent = "Select 2 sources";
        indicator.className = "text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full";
      }
    }
  }

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const src = card.dataset.source;

      if (src === state.source1) {
        // Deselect or keep
        return;
      } else if (src === state.source2) {
        // Swap sources
        const temp = state.source1;
        state.source1 = state.source2;
        state.source2 = temp;
      } else {
        // Replace source 2
        state.source2 = src;
      }

      updateCardStyles();
      initCategoryPills();
    });
  });

  updateCardStyles();

  document.getElementById("run-scan-btn")?.addEventListener("click", () => {
    executeLiveScrapingAndCheck();
  });
}

// Category Pills
function initCategoryPills() {
  const container = document.getElementById("active-categories-container");
  if (!container) return;

  container.innerHTML = "";

  STANDARD_CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.type = "button";
    const isActive = state.activeCategories.has(cat.id);
    btn.className = `cat-pill ${isActive ? "active" : ""} px-3 py-1 text-xs font-semibold rounded-xl border`;
    btn.textContent = cat.label;

    btn.addEventListener("click", () => {
      if (state.activeCategories.has(cat.id)) {
        if (state.activeCategories.size > 1) {
          state.activeCategories.delete(cat.id);
          btn.classList.remove("active");
        }
      } else {
        state.activeCategories.add(cat.id);
        btn.classList.add("active");
      }
    });

    container.appendChild(btn);
  });
}

function initSliders() {
  const slider = document.getElementById("threshold-slider");
  const valueDisplay = document.getElementById("threshold-value");
  const presets = document.querySelectorAll(".btn-thresh-preset");

  function updatePresetButtons(val) {
    presets.forEach(btn => {
      const bVal = parseInt(btn.dataset.val, 10);
      if (bVal === val) {
        btn.classList.add("bg-emerald-600", "text-white");
        btn.classList.remove("bg-slate-100", "text-slate-700");
      } else {
        btn.classList.remove("bg-emerald-600", "text-white");
        btn.classList.add("bg-slate-100", "text-slate-700");
      }
    });
  }

  function handleThresholdChange(val) {
    state.threshold = val;
    if (slider) slider.value = val;
    if (valueDisplay) valueDisplay.textContent = `${val}%`;
    updatePresetButtons(val);

    if (state.lastAnalysisData) {
      renderThresholdAnalysis();
    }
  }

  slider?.addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    handleThresholdChange(val);
  });

  presets.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseInt(btn.dataset.val, 10);
      if (!isNaN(val)) {
        handleThresholdChange(val);
      }
    });
  });

  updatePresetButtons(state.threshold);
}

function initResultTabs() {
  const resTabs = document.querySelectorAll(".res-tab");
  resTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      resTabs.forEach(t => {
        t.classList.remove("active", "bg-slate-100", "text-slate-900", "font-bold");
        t.classList.add("text-slate-600", "font-semibold");
      });
      tab.classList.add("active", "bg-slate-100", "text-slate-900", "font-bold");
      tab.classList.remove("text-slate-600", "font-semibold");

      const viewTarget = tab.dataset.view;
      state.activeView = viewTarget;

      document.querySelectorAll(".res-view").forEach(v => v.classList.add("hidden"));
      const activeViewEl = document.getElementById(`view-${viewTarget}`);
      if (activeViewEl) activeViewEl.classList.remove("hidden");

      // Re-render charts when switching to visual charts or duplicates tab
      if ((viewTarget === "charts" || viewTarget === "duplicates") && state.lastAnalysisData) {
        const { s1Cleaned, s2Cleaned, s1DupInfo, s2DupInfo, betweenPairs, dataScores } = state.lastAnalysisData;
        try {
          if (typeof renderAnalysisCharts === "function") {
            renderAnalysisCharts(s1Cleaned, s2Cleaned, s1DupInfo, s2DupInfo, betweenPairs.length, dataScores);
          }
        } catch (e) {
          console.warn("Chart re-render error:", e);
        }
      }
    });
  });
}

function initPairsControls() {
  // Search input
  const searchInput = document.getElementById("pairs-search-input");
  searchInput?.addEventListener("input", (e) => {
    state.pairsSearch = e.target.value.toLowerCase().trim();
    applyPairsFilterAndRender();
  });

  // Severity filter buttons
  const sevButtons = document.querySelectorAll(".filter-sev-btn");
  sevButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      sevButtons.forEach(b => {
        b.classList.remove("active", "bg-white", "text-slate-800", "shadow-xs");
        b.classList.add("hover:text-slate-900");
      });
      btn.classList.add("active", "bg-white", "text-slate-800", "shadow-xs");
      btn.classList.remove("hover:text-slate-900");

      state.pairsFilter = btn.dataset.sev;
      applyPairsFilterAndRender();
    });
  });

  // View mode switcher (Cards vs Table)
  const btnCards = document.getElementById("btn-mode-cards");
  const btnTable = document.getElementById("btn-mode-table");

  btnCards?.addEventListener("click", () => {
    state.pairsDisplayMode = "cards";
    btnCards.classList.add("active", "bg-white", "text-slate-800", "shadow-xs");
    btnCards.classList.remove("text-slate-600");
    btnTable?.classList.remove("active", "bg-white", "text-slate-800", "shadow-xs");
    btnTable?.classList.add("text-slate-600");

    document.getElementById("pairs-cards-container")?.classList.remove("hidden");
    document.getElementById("pairs-table-container")?.classList.add("hidden");
  });

  btnTable?.addEventListener("click", () => {
    state.pairsDisplayMode = "table";
    btnTable.classList.add("active", "bg-white", "text-slate-800", "shadow-xs");
    btnTable.classList.remove("text-slate-600");
    btnCards?.classList.remove("active", "bg-white", "text-slate-800", "shadow-xs");
    btnCards?.classList.add("text-slate-600");

    document.getElementById("pairs-cards-container")?.classList.add("hidden");
    document.getElementById("pairs-table-container")?.classList.remove("hidden");
  });

  // Export CSV
  document.getElementById("export-results-btn")?.addEventListener("click", () => {
    exportReportCSV();
  });

  // Zero State: Lower Threshold Button
  document.getElementById("zero-lower-threshold-btn")?.addEventListener("click", () => {
    const btn = document.getElementById("zero-lower-threshold-btn");
    const targetThreshold = parseInt(btn.dataset.targetThreshold, 10);
    if (!isNaN(targetThreshold) && targetThreshold > 0) {
      state.threshold = targetThreshold;
      const slider = document.getElementById("threshold-slider");
      const valDisp = document.getElementById("threshold-value");
      if (slider) slider.value = targetThreshold;
      if (valDisp) valDisp.textContent = `${targetThreshold}%`;

      showToast(`Threshold adjusted to ${targetThreshold}%. Re-analyzing...`, "info");
      renderThresholdAnalysis();
    }
  });
}

function initResetButton() {
  document.getElementById("reset-btn")?.addEventListener("click", () => {
    state.source1 = "3News";
    state.source2 = "MyJoyOnline";
    state.threshold = 50;
    state.startDate = formatDate(threeDaysAgo);
    state.endDate = formatDate(today);
    state.activeCategories = new Set(["news"]);
    state.articles = [];
    state.activeView = "charts";
    state.pairsFilter = "all";
    state.pairsSearch = "";
    state.pairsDisplayMode = "cards";
    state.lastAnalysisData = null;

    const slider = document.getElementById("threshold-slider");
    const valDisp = document.getElementById("threshold-value");
    if (slider) slider.value = 50;
    if (valDisp) valDisp.textContent = "50%";

    const presets = document.querySelectorAll(".btn-thresh-preset");
    presets.forEach(btn => {
      const bVal = parseInt(btn.dataset.val, 10);
      if (bVal === 50) {
        btn.classList.add("bg-emerald-600", "text-white");
        btn.classList.remove("bg-slate-100", "text-slate-700");
      } else {
        btn.classList.remove("bg-emerald-600", "text-white");
        btn.classList.add("bg-slate-100", "text-slate-700");
      }
    });

    const searchInput = document.getElementById("pairs-search-input");
    if (searchInput) searchInput.value = "";

    initDateInputs();
    initSourceCards();
    initCategoryPills();

    document.querySelectorAll(".res-tab").forEach(t => {
      if (t.dataset.view === "charts") {
        t.classList.add("active", "bg-slate-100", "text-slate-900", "font-bold");
        t.classList.remove("text-slate-600", "font-semibold");
      } else {
        t.classList.remove("active", "bg-slate-100", "text-slate-900", "font-bold");
        t.classList.add("text-slate-600", "font-semibold");
      }
    });
    document.querySelectorAll(".res-view").forEach(v => v.classList.add("hidden"));
    document.getElementById("view-charts")?.classList.remove("hidden");

    document.getElementById("analysis-results")?.classList.add("hidden");
    document.getElementById("live-terminal")?.classList.add("hidden");
    document.getElementById("no-results-banner")?.classList.add("hidden");
    document.getElementById("export-results-btn")?.classList.add("hidden");
    showToast("Reset to defaults.", "info");
  });
}

function logTerminal(message, type = 'info') {
  const terminal = document.getElementById("live-terminal");
  const logBox = document.getElementById("terminal-logs");
  if (!logBox) return;

  if (terminal) terminal.classList.remove("hidden");

  const line = document.createElement("div");
  const timestamp = new Date().toLocaleTimeString();

  let prefix = '>';
  let color = 'text-slate-300';
  if (type === 'success') { prefix = '✓'; color = 'text-emerald-400 font-bold'; }
  if (type === 'warn') { prefix = '!'; color = 'text-amber-400 font-medium'; }
  if (type === 'error') { prefix = '✕'; color = 'text-rose-400 font-medium'; }

  line.className = `flex items-start gap-2 ${color}`;
  line.innerHTML = `<span class="text-slate-500 select-none">${timestamp}</span> <span>${prefix}</span> <span>${message}</span>`;
  logBox.appendChild(line);
  logBox.scrollTop = logBox.scrollHeight;
}

function checkDuplicates(articlesList) {
  const seenUrls = new Set();
  const cleaned = [];
  let duplicates = 0;

  articlesList.forEach(art => {
    const url = art.URL || "";
    if (url && seenUrls.has(url)) {
      duplicates++;
    } else {
      if (url) seenUrls.add(url);
      cleaned.push(art);
    }
  });

  return { cleaned, duplicates, total: articlesList.length };
}

/**
 * Functional Scraping Execution
 */
async function executeLiveScrapingAndCheck() {
  const btn = document.getElementById("run-scan-btn");
  const spinner = document.getElementById("btn-spinner");
  const logBox = document.getElementById("terminal-logs");
  const terminal = document.getElementById("live-terminal");

  if (!state.source1 || !state.source2) {
    showToast("Please select two news sources to compare.", "warning");
    return;
  }

  if (state.startDate && state.endDate && state.startDate > state.endDate) {
    alert("Invalid Date Range: The End Date cannot be earlier than (in the past of) the Start Date. Please select a valid date range.");
    showToast("End Date cannot be earlier than Start Date.", "error");
    return;
  }

  if (logBox) logBox.innerHTML = "";
  if (terminal) terminal.classList.remove("hidden");
  if (btn) btn.disabled = true;
  if (spinner) spinner.classList.remove("hidden");

  logTerminal(`Connecting to ${state.source1} and ${state.source2}...`);

  const cats1 = [
    ...new Set(
      Array.from(state.activeCategories).flatMap(c => {
        const val = PORTAL_CATEGORY_MAP[state.source1]?.[c];
        if (Array.isArray(val)) return val;
        if (val) return [val];
        return [c];
      })
    )
  ];
  const cats2 = [
    ...new Set(
      Array.from(state.activeCategories).flatMap(c => {
        const val = PORTAL_CATEGORY_MAP[state.source2]?.[c];
        if (Array.isArray(val)) return val;
        if (val) return [val];
        return [c];
      })
    )
  ];

  const payload = {
    source_1: state.source1,
    source_2: state.source2,
    source_1_data: {
      start_date: state.startDate,
      end_date: state.endDate,
      categories: cats1
    },
    source_2_data: {
      start_date: state.startDate,
      end_date: state.endDate,
      categories: cats2
    }
  };

  let newArticles = [];
  let pythonApiSuccess = false;

  // 1. Try Python Scraper API
  try {
    logTerminal("Connecting to Python scraper API (/api/scrape)...");
    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(240000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        pythonApiSuccess = true;
        logTerminal(`Scraped ${data.source1_count} articles from ${state.source1}.`, 'success');
        logTerminal(`Scraped ${data.source2_count} articles from ${state.source2}.`, 'success');
        newArticles = [...(data.articles1 || []), ...(data.articles2 || [])];
      }
    } else {
      logTerminal(`Python scraper API responded with status ${res.status}.`, 'warn');
    }
  } catch (err) {
    if (err.name === 'TimeoutError') {
      logTerminal("Python scraper API timed out (>4 min).", 'warn');
    } else {
      logTerminal("Python server endpoint not detected (Static / GitHub Pages mode).", 'info');
    }
  }

  // 2. Static GitHub Pages Mode: Query Verified News Archive Dataset
  if (!pythonApiSuccess) {
    if (!state.cachedDataset || state.cachedDataset.length === 0) {
      try {
        const fetchRes = await fetch("./data/articles.json");
        if (fetchRes.ok) {
          state.cachedDataset = await fetchRes.json();
        }
      } catch (e) { }
    }

    const s1Arts = filterArticlesByCriteria(state.cachedDataset, state.source1, state.activeCategories, state.startDate, state.endDate);
    const s2Arts = filterArticlesByCriteria(state.cachedDataset, state.source2, state.activeCategories, state.startDate, state.endDate);

    if (s1Arts.length > 0 && s2Arts.length > 0) {
      logTerminal(`Loaded ${s1Arts.length} articles from ${state.source1} from verified archive.`, 'success');
      logTerminal(`Loaded ${s2Arts.length} articles from ${state.source2} from verified archive.`, 'success');
      newArticles = [...s1Arts, ...s2Arts];
    } else {
      logTerminal(`Archive has ${s1Arts.length} for ${state.source1} and ${s2Arts.length} for ${state.source2} in selected date range. Checking live scraper...`, 'info');
      try {
        const live1 = s1Arts.length > 0 ? s1Arts : await NewsScraper.scrapeSourceClientSide(
          state.source1,
          cats1,
          state.startDate,
          state.endDate,
          msg => logTerminal(msg)
        );

        const live2 = s2Arts.length > 0 ? s2Arts : await NewsScraper.scrapeSourceClientSide(
          state.source2,
          cats2,
          state.startDate,
          state.endDate,
          msg => logTerminal(msg)
        );

        if (live1.length > 0 || live2.length > 0) {
          newArticles = [...live1, ...live2];
          logTerminal(`Scraped ${live1.length} articles from ${state.source1} and ${live2.length} from ${state.source2}.`, 'success');
        }
      } catch (err) {
        logTerminal(`Live browser scraper note: ${err.message}`, 'warn');
      }

      // If still insufficient, fall back to all available articles in dataset for the selected sources
      const currentS1Count = newArticles.filter(a => normalizeSourceName(a.Source) === normalizeSourceName(state.source1)).length;
      const currentS2Count = newArticles.filter(a => normalizeSourceName(a.Source) === normalizeSourceName(state.source2)).length;
      if (currentS1Count === 0 || currentS2Count === 0) {
        const allS1 = filterArticlesByCriteria(state.cachedDataset, state.source1, null, null, null);
        const allS2 = filterArticlesByCriteria(state.cachedDataset, state.source2, null, null, null);
        if (allS1.length > 0 && allS2.length > 0) {
          logTerminal(`Date range had limited articles. Retrieved ${allS1.length} articles from ${state.source1} and ${allS2.length} from ${state.source2} from archive.`, 'warn');
          newArticles = [...allS1, ...allS2];
        }
      }
    }
  }

  if (newArticles.length > 0) {
    state.articles = newArticles;
  }

  if (btn) btn.disabled = false;
  if (spinner) spinner.classList.add("hidden");

  if (state.articles.length === 0) {
    logTerminal("No articles were retrieved. Check your internet connection or date range.", 'warn');
    showToast("No articles retrieved. Check date range or connection.", "warning");
    return;
  }

  logTerminal(`Scraping complete. Running plagiarism analysis on ${state.articles.length} articles...`, 'info');
  showToast(`Scraped ${state.articles.length} articles. Calculating similarities...`, "success");

  try {
    runPlagiarismCheck();
  } catch (err) {
    console.error("Plagiarism analysis error:", err);
    logTerminal(`Analysis error: ${err.message}`, 'error');
    showToast(`Error calculating plagiarism: ${err.message}`, 'error');
  }
}

/**
 * Source badge and styling lookup
 */
const SOURCE_STYLES = {
  "3News": { badge: "bg-sky-100 text-sky-800 border border-sky-200", border: "border-sky-300" },
  "MyJoyOnline": { badge: "bg-amber-100 text-amber-800 border border-amber-200", border: "border-amber-300" },
  "Ghanaweb": { badge: "bg-emerald-100 text-emerald-800 border border-emerald-200", border: "border-emerald-300" },
  "Ghana web": { badge: "bg-emerald-100 text-emerald-800 border border-emerald-200", border: "border-emerald-300" },
  "Modern Ghana": { badge: "bg-indigo-100 text-indigo-800 border border-indigo-200", border: "border-indigo-300" },
  "Yen Ghana": { badge: "bg-rose-100 text-rose-800 border border-rose-200", border: "border-rose-300" }
};

function getSourceStyle(sourceName) {
  return SOURCE_STYLES[sourceName] || { badge: "bg-slate-100 text-slate-800 border border-slate-200", border: "border-slate-300" };
}

function getSnippet(text, maxChars = 160) {
  if (!text) return "No content preview available.";
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxChars) return cleaned;
  return cleaned.substring(0, maxChars).trim() + "…";
}

/**
 * Main Plagiarism Check execution
 */
function runPlagiarismCheck() {
  const resultsEl = document.getElementById("analysis-results");
  const noResultsEl = document.getElementById("no-results-banner");

  if (resultsEl) resultsEl.classList.add("hidden");
  if (noResultsEl) noResultsEl.classList.add("hidden");

  const s1ArticlesRaw = state.articles.filter(a => normalizeSourceName(a.Source) === normalizeSourceName(state.source1));
  const s2ArticlesRaw = state.articles.filter(a => normalizeSourceName(a.Source) === normalizeSourceName(state.source2));

  const s1DupInfo = checkDuplicates(s1ArticlesRaw);
  const s2DupInfo = checkDuplicates(s2ArticlesRaw);

  const s1Cleaned = s1DupInfo.cleaned;
  const s2Cleaned = s2DupInfo.cleaned;

  if (s1Cleaned.length === 0 || s2Cleaned.length === 0) {
    if (noResultsEl) {
      noResultsEl.classList.remove("hidden");
      noResultsEl.querySelector("p").textContent =
        `Need articles from both sources to compare. Found ${s1Cleaned.length} from ${state.source1} and ${s2Cleaned.length} from ${state.source2}.`;
    }
    return;
  }

  const combinedArticles = [...s1Cleaned, ...s2Cleaned];

  const processedDocs = combinedArticles.map(a => NLP.cleanText(a.Content || ""));
  const vectorizer = new NLP.TfidfVectorizer();
  const tfidfMatrix = vectorizer.fitTransform(processedDocs);
  const simMatrix = NLP.computeCosineSimilarity(tfidfMatrix);

  // Compute all cross-source pairs directly from simMatrix
  const s1Len = s1Cleaned.length;
  const totalLen = combinedArticles.length;
  const allCrossPairs = [];
  let maxCrossScore = 0;

  for (let i = 0; i < s1Len; i++) {
    for (let j = s1Len; j < totalLen; j++) {
      const score = simMatrix[i][j];
      if (score > maxCrossScore) maxCrossScore = score;
      allCrossPairs.push({ i, j, score });
    }
  }

  allCrossPairs.sort((a, b) => b.score - a.score);

  // Cache data for real-time slider threshold adjustment, filtering, and export
  state.lastAnalysisData = {
    combinedArticles,
    s1Cleaned,
    s2Cleaned,
    s1DupInfo,
    s2DupInfo,
    simMatrix,
    allCrossPairs,
    maxCrossScore,
    betweenPairs: [],
    closestBelow: [],
    dataScores: null
  };

  // Perform threshold analysis and UI rendering
  renderThresholdAnalysis();

  // On analysis completion, start on Visual Charts
  state.activeView = "charts";
  document.querySelectorAll(".res-tab").forEach(t => {
    if (t.dataset.view === "charts") {
      t.classList.add("active", "bg-slate-100", "text-slate-900", "font-bold");
      t.classList.remove("text-slate-600", "font-semibold");
    } else {
      t.classList.remove("active", "bg-slate-100", "text-slate-900", "font-bold");
      t.classList.add("text-slate-600", "font-semibold");
    }
  });
  document.querySelectorAll(".res-view").forEach(v => v.classList.add("hidden"));
  document.getElementById("view-charts")?.classList.remove("hidden");

  if (resultsEl) resultsEl.classList.remove("hidden");
  resultsEl.scrollIntoView({ behavior: "smooth" });

  const terminalBadge = document.getElementById("terminal-badge");
  if (terminalBadge) {
    terminalBadge.className = "inline-flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold";
    terminalBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span> Completed';
  }

  const numPlagiarized = state.lastAnalysisData?.betweenPairs?.length || 0;
  logTerminal(
    numPlagiarized > 0
      ? `Analysis complete: Found ${numPlagiarized} suspect article pair(s) above ${state.threshold}% threshold.`
      : `Analysis complete: 0 plagiarized articles found (peak similarity: ${(maxCrossScore * 100).toFixed(1)}%).`,
    numPlagiarized > 0 ? 'warn' : 'success'
  );
}

/**
 * Real-time Threshold Re-analysis & Render
 * Dynamically re-filters cached cross-source similarity matrix in <1ms
 */
function renderThresholdAnalysis() {
  if (!state.lastAnalysisData) return;

  const {
    combinedArticles,
    s1Cleaned,
    s2Cleaned,
    s1DupInfo,
    s2DupInfo,
    simMatrix,
    allCrossPairs,
    maxCrossScore
  } = state.lastAnalysisData;

  const thresholdVal = state.threshold / 100.0;
  const betweenPairs = allCrossPairs.filter(p => p.score >= thresholdVal);
  const closestBelow = allCrossPairs.filter(p => p.score < thresholdVal).slice(0, 3);
  const numPlagiarized = betweenPairs.length;
  const dataScores = NLP.checkSimilarityScores(thresholdVal, simMatrix, combinedArticles);

  state.lastAnalysisData.betweenPairs = betweenPairs;
  state.lastAnalysisData.closestBelow = closestBelow;
  state.lastAnalysisData.dataScores = dataScores;

  // Sync Slider UI and Preset Buttons
  const slider = document.getElementById("threshold-slider");
  const valueDisplay = document.getElementById("threshold-value");
  if (slider && parseInt(slider.value, 10) !== state.threshold) {
    slider.value = state.threshold;
  }
  if (valueDisplay) {
    valueDisplay.textContent = `${state.threshold}%`;
  }

  const presets = document.querySelectorAll(".btn-thresh-preset");
  presets.forEach(btn => {
    const bVal = parseInt(btn.dataset.val, 10);
    if (bVal === state.threshold) {
      btn.classList.add("bg-emerald-600", "text-white");
      btn.classList.remove("bg-slate-100", "text-slate-700");
    } else {
      btn.classList.remove("bg-emerald-600", "text-white");
      btn.classList.add("bg-slate-100", "text-slate-700");
    }
  });

  // Update Dynamic Hero Banner
  const banner = document.getElementById("results-hero-banner");
  const statusBadge = document.getElementById("results-status-badge");
  const titleCountEl = document.getElementById("report-title-count");
  const reportSubtitle = document.getElementById("report-subtitle");

  if (numPlagiarized > 0) {
    if (banner) {
      banner.className = "bg-slate-900 border border-rose-500/50 rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4";
    }
    if (statusBadge) {
      statusBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30";
      statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Plagiarism Detected';
    }
    if (titleCountEl) {
      titleCountEl.textContent = `${numPlagiarized} Suspect Pair${numPlagiarized === 1 ? '' : 's'}`;
    }
    if (reportSubtitle) {
      reportSubtitle.textContent = `Article pairs exceeding the ${state.threshold}% similarity threshold.`;
    }
  } else {
    if (banner) {
      banner.className = "bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4";
    }
    if (statusBadge) {
      statusBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
      statusBadge.innerHTML = '<svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> Clean Scan';
    }
    if (titleCountEl) {
      titleCountEl.textContent = "0 Plagiarized Articles Found";
    }
    if (reportSubtitle) {
      reportSubtitle.textContent = `All cross-source comparisons scored below ${state.threshold}%.`;
    }
  }

  // Summary pills in hero
  const s1Pill = document.getElementById("s1-summary-pill");
  const s2Pill = document.getElementById("s2-summary-pill");
  if (s1Pill) {
    s1Pill.textContent = `${state.source1}: ${s1Cleaned.length}`;
    s1Pill.className = "text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 px-2.5 py-1 rounded-lg";
  }
  if (s2Pill) {
    s2Pill.textContent = `${state.source2}: ${s2Cleaned.length}`;
    s2Pill.className = "text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/25 px-2.5 py-1 rounded-lg";
  }

  // Update KPI Cards
  const kpiTotal = document.getElementById("kpi-total-articles");
  const kpiSources = document.getElementById("kpi-sources-breakdown");
  const kpiPairs = document.getElementById("kpi-plagiarized-count");
  const kpiPairsIcon = document.getElementById("kpi-pairs-icon");
  const kpiPeak = document.getElementById("kpi-peak-score");
  const kpiThresh = document.getElementById("kpi-threshold-level");

  if (kpiTotal) kpiTotal.textContent = combinedArticles.length;
  if (kpiSources) kpiSources.textContent = `${state.source1} (${s1Cleaned.length}) vs ${state.source2} (${s2Cleaned.length})`;
  if (kpiPairs) {
    kpiPairs.textContent = numPlagiarized;
    kpiPairs.className = `text-2xl font-black ${numPlagiarized > 0 ? 'text-rose-600' : 'text-emerald-600'}`;
  }
  if (kpiPairsIcon) {
    kpiPairsIcon.className = `w-4 h-4 ${numPlagiarized > 0 ? 'text-rose-600' : 'text-emerald-600'}`;
  }
  if (kpiPeak) kpiPeak.textContent = `${(maxCrossScore * 100).toFixed(1)}%`;
  if (kpiThresh) kpiThresh.textContent = `${state.threshold}%`;

  const badgeTab = document.getElementById("tab-pairs-badge");
  if (badgeTab) badgeTab.textContent = numPlagiarized;

  const badgeDups = document.getElementById("tab-dups-badge");
  if (badgeDups) badgeDups.textContent = (s1DupInfo.duplicates || 0) + (s2DupInfo.duplicates || 0);

  const exportBtn = document.getElementById("export-results-btn");
  if (exportBtn) {
    if (numPlagiarized > 0) exportBtn.classList.remove("hidden");
    else exportBtn.classList.add("hidden");
  }

  // Handle Display: Zero State vs Detected Pairs
  const zeroCard = document.getElementById("zero-results-card");
  const toolbar = document.getElementById("pairs-toolbar");
  const cardsContainer = document.getElementById("pairs-cards-container");
  const tableContainer = document.getElementById("pairs-table-container");

  if (numPlagiarized === 0) {
    if (zeroCard) zeroCard.classList.remove("hidden");
    if (toolbar) toolbar.classList.add("hidden");
    if (cardsContainer) cardsContainer.classList.add("hidden");
    if (tableContainer) tableContainer.classList.add("hidden");

    const zeroDesc = document.getElementById("zero-state-description");
    if (zeroDesc) {
      const s1Len = s1Cleaned.length;
      const totalLen = combinedArticles.length;
      const comparisonsCount = (s1Len * (totalLen - s1Len)).toLocaleString();
      zeroDesc.textContent = `${comparisonsCount} comparisons evaluated — all below ${state.threshold}%.`;
    }

    const zeroHighest = document.getElementById("zero-highest-score");
    if (zeroHighest) {
      zeroHighest.textContent = `${(maxCrossScore * 100).toFixed(1)}%`;
    }

    const actionBox = document.getElementById("zero-state-action-box");
    const lowerBtn = document.getElementById("zero-lower-threshold-btn");
    const btnLabel = document.getElementById("zero-btn-label");

    const peakPctInt = Math.floor(maxCrossScore * 100);
    if (maxCrossScore >= 0.10 && peakPctInt < state.threshold) {
      const suggestedThreshold = Math.max(10, peakPctInt);
      if (actionBox) actionBox.classList.remove("hidden");
      if (lowerBtn) lowerBtn.dataset.targetThreshold = suggestedThreshold;
      if (btnLabel) btnLabel.textContent = `Set Threshold to ${suggestedThreshold}% & Re-analyze`;
    } else if (actionBox) {
      actionBox.classList.add("hidden");
    }

    // Render closest matches preview section
    const closestSection = document.getElementById("closest-matches-section");
    const closestContainer = document.getElementById("closest-matches-container");

    if (closestBelow.length > 0) {
      if (closestSection) closestSection.classList.remove("hidden");
      if (closestContainer) {
        closestContainer.innerHTML = "";
        closestBelow.forEach(p => {
          const art1 = combinedArticles[p.i];
          const art2 = combinedArticles[p.j];
          const pct = (p.score * 100).toFixed(1);

          const item = document.createElement("div");
          item.className = "bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors";
          item.innerHTML = `
            <div class="space-y-1.5 max-w-xl">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  ${pct}% Similarity
                </span>
                <span class="text-[11px] font-semibold text-slate-400">
                  <span class="font-bold text-slate-600">${art1.Source}</span> &harr; <span class="font-bold text-slate-600">${art2.Source}</span>
                </span>
              </div>
              <div class="text-xs font-bold text-slate-900 leading-snug">
                <span class="font-normal text-slate-400 mr-1">${art1.Source}:</span> ${DiffViewer.escapeHtml(art1.Title || 'Untitled')}
              </div>
              <div class="text-xs text-slate-600 font-medium leading-snug">
                <span class="font-normal text-slate-400 mr-1">${art2.Source}:</span> ${DiffViewer.escapeHtml(art2.Title || 'Untitled')}
              </div>
            </div>
            <button type="button" class="btn-inspect-closest self-start sm:self-auto px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors">
              Inspect
            </button>
          `;

          item.querySelector(".btn-inspect-closest")?.addEventListener("click", () => {
            openDiffModal(art1, art2, p.score);
          });

          closestContainer.appendChild(item);
        });
      }
    } else if (closestSection) {
      closestSection.classList.add("hidden");
    }
  } else {
    if (zeroCard) zeroCard.classList.add("hidden");
    if (toolbar) toolbar.classList.remove("hidden");
    applyPairsFilterAndRender();
  }

  // Render Charts & Tables defensively
  try {
    if (typeof renderAnalysisCharts === "function") {
      renderAnalysisCharts(s1Cleaned, s2Cleaned, s1DupInfo, s2DupInfo, numPlagiarized, dataScores);
    }
  } catch (chartErr) {
    console.warn("Chart rendering failed:", chartErr);
  }

  try {
    renderWithinSourceTables(dataScores.withinSourcePairs, combinedArticles);
  } catch (tableErr) {
    console.warn("Within-source tables rendering failed:", tableErr);
  }
}

function applyPairsFilterAndRender() {
  if (!state.lastAnalysisData) return;

  const { betweenPairs, combinedArticles } = state.lastAnalysisData;
  let filtered = [...betweenPairs];

  // Severity filter
  if (state.pairsFilter === "critical") {
    filtered = filtered.filter(p => p.score >= 0.70);
  } else if (state.pairsFilter === "moderate") {
    filtered = filtered.filter(p => p.score >= 0.35 && p.score < 0.70);
  } else if (state.pairsFilter === "low") {
    filtered = filtered.filter(p => p.score < 0.35);
  }

  // Keyword search
  if (state.pairsSearch) {
    const q = state.pairsSearch;
    filtered = filtered.filter(p => {
      const art1 = combinedArticles[p.i];
      const art2 = combinedArticles[p.j];
      const text1 = `${art1.Title || ''} ${art1.Category || ''} ${art1.Content || ''}`.toLowerCase();
      const text2 = `${art2.Title || ''} ${art2.Category || ''} ${art2.Content || ''}`.toLowerCase();
      return text1.includes(q) || text2.includes(q);
    });
  }

  renderPairsCards(filtered, combinedArticles);
  renderPlagiarizedTable(filtered, combinedArticles);

  const cardsContainer = document.getElementById("pairs-cards-container");
  const tableContainer = document.getElementById("pairs-table-container");

  if (state.pairsDisplayMode === "cards") {
    cardsContainer?.classList.remove("hidden");
    tableContainer?.classList.add("hidden");
  } else {
    cardsContainer?.classList.add("hidden");
    tableContainer?.classList.remove("hidden");
  }
}

function renderPairsCards(pairs, articles) {
  const container = document.getElementById("pairs-cards-container");
  if (!container) return;

  container.innerHTML = "";

  if (pairs.length === 0) {
    container.innerHTML = `
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
        No article pairs match your active search or filter criteria.
      </div>
    `;
    return;
  }

  pairs.forEach(pair => {
    const art1 = articles[pair.i];
    const art2 = articles[pair.j];
    const pct = (pair.score * 100).toFixed(1);
    const isHigh = pair.score >= 0.70;
    const isModerate = pair.score >= 0.35 && pair.score < 0.70;

    const s1Style = getSourceStyle(art1.Source);
    const s2Style = getSourceStyle(art2.Source);

    const scoreBadgeClass = isHigh
      ? "bg-red-50 text-red-700 border border-red-200"
      : (isModerate ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-slate-100 text-slate-700 border border-slate-200");

    const meterBarClass = isHigh ? "bg-red-600" : (isModerate ? "bg-amber-500" : "bg-slate-400");
    const riskLabel = isHigh ? "High Overlap" : (isModerate ? "Moderate Overlap" : "Low Similarity");

    const card = document.createElement("div");
    card.className = "pair-card bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4";
    card.innerHTML = `
      <!-- Card Header: Score Meter & Categories -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${scoreBadgeClass}">
            ${pct}% &bull; ${riskLabel}
          </span>
          <div class="hidden sm:block w-28 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div class="h-full ${meterBarClass} rounded-full" style="width: ${pct}%"></div>
          </div>
        </div>
        <div class="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
          <span>${formatCategoryLabel(art1.Category)}</span>
          <span>&harr;</span>
          <span>${formatCategoryLabel(art2.Category)}</span>
        </div>
      </div>

      <!-- Comparative Columns -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Source 1 Article -->
        <div class="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 flex flex-col justify-between space-y-2.5">
          <div>
            <div class="flex items-center justify-between text-[11px] mb-1.5">
              <span class="font-bold px-2 py-0.5 rounded-md ${s1Style.badge}">${art1.Source}</span>
              <span class="text-slate-400 font-medium">${art1["Date Posted"] || '-'}</span>
            </div>
            <h4 class="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
              ${DiffViewer.escapeHtml(art1.Title || 'Untitled')}
            </h4>
            <p class="text-slate-500 text-[11px] leading-relaxed mt-2 line-clamp-3">
              ${DiffViewer.escapeHtml(getSnippet(art1.Content, 160))}
            </p>
          </div>
          <div class="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
            <a href="${art1.URL}" target="_blank" rel="noopener noreferrer" class="text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-1">
              <span>Read original</span>
              <span>&nearr;</span>
            </a>
          </div>
        </div>

        <!-- Source 2 Article -->
        <div class="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 flex flex-col justify-between space-y-2.5">
          <div>
            <div class="flex items-center justify-between text-[11px] mb-1.5">
              <span class="font-bold px-2 py-0.5 rounded-md ${s2Style.badge}">${art2.Source}</span>
              <span class="text-slate-400 font-medium">${art2["Date Posted"] || '-'}</span>
            </div>
            <h4 class="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
              ${DiffViewer.escapeHtml(art2.Title || 'Untitled')}
            </h4>
            <p class="text-slate-500 text-[11px] leading-relaxed mt-2 line-clamp-3">
              ${DiffViewer.escapeHtml(getSnippet(art2.Content, 160))}
            </p>
          </div>
          <div class="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
            <a href="${art2.URL}" target="_blank" rel="noopener noreferrer" class="text-sky-700 hover:text-sky-800 font-bold hover:underline inline-flex items-center gap-1">
              <span>Read original</span>
              <span>&nearr;</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-between pt-1">
        <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Direct text overlap detected
        </span>
        <button type="button" class="btn-inspect-diff px-4 py-2 bg-[#2e7d32] hover:bg-[#256628] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          <span>Inspect Comparison</span>
        </button>
      </div>
    `;

    card.querySelector(".btn-inspect-diff")?.addEventListener("click", () => {
      openDiffModal(art1, art2, pair.score);
    });

    container.appendChild(card);
  });
}

function renderPlagiarizedTable(pairs, articles) {
  const tbody = document.getElementById("plagiarism-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (pairs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-400 font-medium">No plagiarized articles match active filters.</td></tr>`;
    return;
  }

  pairs.forEach(pair => {
    const art1 = articles[pair.i];
    const art2 = articles[pair.j];
    const pct = (pair.score * 100).toFixed(1);

    const s1Style = getSourceStyle(art1.Source);
    const s2Style = getSourceStyle(art2.Source);

    const isHigh = pair.score >= 0.70;
    const isModerate = pair.score >= 0.35 && pair.score < 0.70;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition-colors border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-4 py-3.5 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${isHigh ? 'bg-red-50 text-red-700 border border-red-200' : (isModerate ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200')}">
          ${pct}%
        </span>
      </td>
      <td class="px-4 py-3.5">
        <div class="font-bold text-slate-900 leading-snug">${DiffViewer.escapeHtml(art1.Title || 'Untitled')}</div>
        <div class="text-[11px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
          <span class="font-bold px-1.5 py-0.2 rounded ${s1Style.badge}">${art1.Source}</span>
          <span>&middot;</span>
          <span>${formatCategoryLabel(art1.Category)}</span>
          <span>&middot;</span>
          <span>${art1["Date Posted"] || '-'}</span>
          <a href="${art1.URL}" target="_blank" rel="noopener noreferrer" class="text-slate-600 hover:text-slate-900 font-semibold hover:underline">Link ↗</a>
        </div>
      </td>
      <td class="px-4 py-3.5">
        <div class="font-bold text-slate-900 leading-snug">${DiffViewer.escapeHtml(art2.Title || 'Untitled')}</div>
        <div class="text-[11px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
          <span class="font-bold px-1.5 py-0.2 rounded ${s2Style.badge}">${art2.Source}</span>
          <span>&middot;</span>
          <span>${formatCategoryLabel(art2.Category)}</span>
          <span>&middot;</span>
          <span>${art2["Date Posted"] || '-'}</span>
          <a href="${art2.URL}" target="_blank" rel="noopener noreferrer" class="text-slate-600 hover:text-slate-900 font-semibold hover:underline">Link ↗</a>
        </div>
      </td>
      <td class="px-4 py-3.5 text-right whitespace-nowrap">
        <button type="button" class="compare-btn px-3 py-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200">
          Compare
        </button>
      </td>
    `;

    tr.querySelector(".compare-btn")?.addEventListener("click", () => {
      openDiffModal(art1, art2, pair.score);
    });

    tbody.appendChild(tr);
  });
}

function exportReportCSV() {
  if (!state.lastAnalysisData || !state.lastAnalysisData.betweenPairs) {
    showToast("No analysis data available to export.", "warning");
    return;
  }

  const { betweenPairs, combinedArticles } = state.lastAnalysisData;
  if (betweenPairs.length === 0) {
    showToast("No plagiarized article pairs above threshold to export.", "info");
    return;
  }

  const headers = ["Similarity Score", "Source 1", "Source 1 Title", "Source 1 Date", "Source 1 Category", "Source 1 URL", "Source 2", "Source 2 Title", "Source 2 Date", "Source 2 Category", "Source 2 URL"];
  const rows = [headers];

  betweenPairs.forEach(p => {
    const a1 = combinedArticles[p.i];
    const a2 = combinedArticles[p.j];
    const scorePct = (p.score * 100).toFixed(1) + "%";
    rows.push([
      `"${scorePct}"`,
      `"${(a1.Source || '').replace(/"/g, '""')}"`,
      `"${(a1.Title || '').replace(/"/g, '""')}"`,
      `"${(a1["Date Posted"] || '').replace(/"/g, '""')}"`,
      `"${(a1.Category || '').replace(/"/g, '""')}"`,
      `"${(a1.URL || '').replace(/"/g, '""')}"`,
      `"${(a2.Source || '').replace(/"/g, '""')}"`,
      `"${(a2.Title || '').replace(/"/g, '""')}"`,
      `"${(a2["Date Posted"] || '').replace(/"/g, '""')}"`,
      `"${(a2.Category || '').replace(/"/g, '""')}"`,
      `"${(a2.URL || '').replace(/"/g, '""')}"`
    ]);
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `plagiarism_report_${state.source1}_vs_${state.source2}_${state.startDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Plagiarism report exported to CSV.", "success");
}

function renderWithinSourceTables(withinPairs, articles) {
  const container = document.getElementById("within-source-tables-container");
  if (!container) return;
  container.innerHTML = "";

  [state.source1, state.source2].forEach(sourceName => {
    const pairs = withinPairs[sourceName] || [];
    const sec = document.createElement("div");
    sec.className = "bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs";

    sec.innerHTML = `
      <div class="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800">
        <span>Similar Articles: ${sourceName}</span>
        <span class="text-[11px] font-semibold text-slate-500">${pairs.length} found</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <tbody class="divide-y divide-slate-100">
            ${pairs.length === 0 ? '<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400">No duplicate content found.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;

    const tbody = sec.querySelector("tbody");
    pairs.forEach(p => {
      const art1 = articles[p.i];
      const art2 = articles[p.j];
      const pct = (p.score * 100).toFixed(1);
      const row = document.createElement("tr");
      row.className = "hover:bg-slate-50 transition-colors";
      row.innerHTML = `
        <td class="px-4 py-3 whitespace-nowrap font-bold text-slate-800">${pct}%</td>
        <td class="px-4 py-3 font-semibold text-slate-900">${DiffViewer.escapeHtml(art1.Title || 'Untitled')}</td>
        <td class="px-4 py-3 font-semibold text-slate-900">${DiffViewer.escapeHtml(art2.Title || 'Untitled')}</td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <button type="button" class="btn-diff text-xs font-bold text-emerald-700 hover:underline">Compare</button>
        </td>
      `;
      row.querySelector(".btn-diff")?.addEventListener("click", () => openDiffModal(art1, art2, p.score));
      tbody.appendChild(row);
    });

    container.appendChild(sec);
  });
}

function openDiffModal(art1, art2, score) {
  const modal = document.getElementById("diff-modal");
  if (!modal) return;

  const pct = (score * 100).toFixed(1);
  document.getElementById("modal-score-badge").textContent = `${pct}% Similarity`;

  document.getElementById("modal-source1-label").textContent = `${art1.Source} &middot; ${art1.Category || ''}`;
  document.getElementById("modal-source2-label").textContent = `${art2.Source} &middot; ${art2.Category || ''}`;

  document.getElementById("modal-title1").textContent = art1.Title || "Untitled";
  document.getElementById("modal-title2").textContent = art2.Title || "Untitled";

  document.getElementById("modal-url1").href = art1.URL || "#";
  document.getElementById("modal-url2").href = art2.URL || "#";

  const diffResult = DiffViewer.highlightPlagiarizedSentences(art1.Content || "", art2.Content || "", 0.65);

  document.getElementById("modal-content1").innerHTML = diffResult.htmlA;
  document.getElementById("modal-content2").innerHTML = diffResult.htmlB;

  document.getElementById("modal-stats1").textContent = `${diffResult.matchedSentencesA} of ${diffResult.totalSentencesA} sentences matched`;
  document.getElementById("modal-stats2").textContent = `${diffResult.matchedSentencesB} of ${diffResult.totalSentencesB} sentences matched`;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeDiffModal() {
  const modal = document.getElementById("diff-modal");
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "";
}

document.getElementById("close-modal-btn")?.addEventListener("click", closeDiffModal);
document.getElementById("diff-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "diff-modal") closeDiffModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDiffModal();
});

// Quick Text Comparison
function initQuickCompare() {
  const btn = document.getElementById("quick-compare-btn");
  btn?.addEventListener("click", () => {
    const textA = document.getElementById("quick-text-a")?.value || "";
    const textB = document.getElementById("quick-text-b")?.value || "";

    if (!textA.trim() || !textB.trim()) {
      showToast("Please enter text in both fields to compare.", "warning");
      return;
    }

    const sim = NLP.compareTwoTexts(textA, textB);
    const pct = (sim * 100).toFixed(1);

    const resultBox = document.getElementById("quick-result-box");
    const scoreEl = document.getElementById("quick-score-text");
    const gaugeBar = document.getElementById("quick-gauge-bar");

    if (resultBox) resultBox.classList.remove("hidden");
    if (scoreEl) scoreEl.textContent = `${pct}%`;
    if (gaugeBar) gaugeBar.style.width = `${pct}%`;

    const diff = DiffViewer.highlightPlagiarizedSentences(textA, textB, 0.60);
    document.getElementById("quick-diff-a").innerHTML = diff.htmlA;
    document.getElementById("quick-diff-b").innerHTML = diff.htmlB;
  });
}

function showToast(message, type = "info") {
  const toast = document.getElementById("app-toast");
  if (!toast) return;

  const bgColors = {
    info: "bg-slate-900 text-white",
    success: "bg-[#2e7d32] text-white",
    warning: "bg-amber-600 text-white",
    error: "bg-red-600 text-white"
  };

  toast.className = `fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-2xl shadow-lg transition-all duration-300 transform font-bold text-xs flex items-center gap-2 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `<span>${message}</span>`;
  toast.classList.remove("translate-y-16", "opacity-0");

  setTimeout(() => {
    toast.classList.add("translate-y-16", "opacity-0");
  }, 3500);
}
