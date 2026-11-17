/**
 * Main Application Controller for News Plagiarism Checker
 * Pure Live Web Scraping Mode (No Archived Dataset)
 */

const SOURCE_CATEGORIES = {
  "Ghanaweb": ["NewsArchive", "business", "entertainment", "africa", "SportsArchive", "features"],
  "3News": ["news", "elections", "business", "showbiz", "sports", "health", "opinion"],
  "MyJoyOnline": ["news", "business", "entertainment", "sports", "opinion"],
  "Modern Ghana": ["general", "news", "business", "entertainment", "sports"],
  "Yen Ghana": ["Ghana", "Politics", "Business", "Entertanment", "Sports", "World"]
};

const ALL_SOURCES = Object.keys(SOURCE_CATEGORIES);

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
  source1: "Ghanaweb",
  source2: "3News",
  source1Categories: [...SOURCE_CATEGORIES["Ghanaweb"]],
  source2Categories: [...SOURCE_CATEGORIES["3News"]],
  source1StartDate: formatDate(today),
  source1EndDate: formatDate(threeDaysAgo),
  source2StartDate: formatDate(today),
  source2EndDate: formatDate(threeDaysAgo),
  threshold: 70,
  activeTab: "analysis",
  activeView: "table"
};

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initDateInputs();
  initSelectors();
  initSliders();
  initResultTabs();
  initFileUpload();
  initQuickCompare();
});

// Primary Tab Navigation (Comparison, Quick Compare, Dataset, Methodology)
function initTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => {
        t.classList.remove("active", "bg-slate-100", "text-slate-900");
        t.classList.add("text-slate-600");
      });
      tab.classList.add("active", "bg-slate-100", "text-slate-900");
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
  const s1Start = document.getElementById("s1-start-date");
  const s1End = document.getElementById("s1-end-date");
  const s2Start = document.getElementById("s2-start-date");
  const s2End = document.getElementById("s2-end-date");

  if (s1Start) s1Start.value = state.source1StartDate;
  if (s1End) s1End.value = state.source1EndDate;
  if (s2Start) s2Start.value = state.source2StartDate;
  if (s2End) s2End.value = state.source2EndDate;

  s1Start?.addEventListener("change", (e) => state.source1StartDate = e.target.value);
  s1End?.addEventListener("change", (e) => state.source1EndDate = e.target.value);
  s2Start?.addEventListener("change", (e) => state.source2StartDate = e.target.value);
  s2End?.addEventListener("change", (e) => state.source2EndDate = e.target.value);
}

// Result Views Navigation (Table, Charts, Duplicates)
function initResultTabs() {
  const resTabs = document.querySelectorAll(".res-tab");
  resTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      resTabs.forEach(t => {
        t.classList.remove("active", "text-slate-900", "border-slate-900");
        t.classList.add("text-slate-500", "border-transparent");
      });
      tab.classList.add("active", "text-slate-900", "border-slate-900");
      tab.classList.remove("text-slate-500", "border-transparent");

      const viewTarget = tab.dataset.view;
      state.activeView = viewTarget;

      document.querySelectorAll(".res-view").forEach(v => v.classList.add("hidden"));
      const activeViewEl = document.getElementById(`view-${viewTarget}`);
      if (activeViewEl) activeViewEl.classList.remove("hidden");
    });
  });
}

// Terminal Log Helper
function logTerminal(message, type = 'info') {
  const terminal = document.getElementById("live-terminal");
  const logBox = document.getElementById("terminal-logs");
  if (!logBox) return;

  if (terminal) terminal.classList.remove("hidden");

  const line = document.createElement("div");
  const timestamp = new Date().toLocaleTimeString();

  let prefix = '>';
  let color = 'text-slate-300';
  if (type === 'success') { prefix = '✓'; color = 'text-emerald-400 font-medium'; }
  if (type === 'warn') { prefix = '!'; color = 'text-amber-400'; }
  if (type === 'error') { prefix = '✕'; color = 'text-rose-400'; }

  line.className = `flex items-start gap-2 ${color}`;
  line.innerHTML = `<span class="text-slate-500 select-none">${timestamp}</span> <span>${prefix}</span> <span>${message}</span>`;
  logBox.appendChild(line);
  logBox.scrollTop = logBox.scrollHeight;
}

// Initialize Selectors
function initSelectors() {
  const sel1 = document.getElementById("source-1-select");
  const sel2 = document.getElementById("source-2-select");

  populateSelect(sel1, ALL_SOURCES, state.source1);
  updateSource2Options();

  sel1?.addEventListener("change", (e) => {
    state.source1 = e.target.value;
    updateSource2Options();
    renderCategoriesUI(1);
  });

  sel2?.addEventListener("change", (e) => {
    state.source2 = e.target.value;
    renderCategoriesUI(2);
  });

  renderCategoriesUI(1);
  renderCategoriesUI(2);

  document.getElementById("run-check-btn")?.addEventListener("click", () => {
    executeLiveScrapingAndCheck();
  });
}

function updateSource2Options() {
  const sel2 = document.getElementById("source-2-select");
  const options = ALL_SOURCES.filter(s => s !== state.source1);
  if (!options.includes(state.source2)) {
    state.source2 = options[0];
  }
  populateSelect(sel2, options, state.source2);
  renderCategoriesUI(2);
}

function populateSelect(selectEl, options, selectedVal) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  options.forEach(opt => {
    const el = document.createElement("option");
    el.value = opt;
    el.textContent = opt;
    if (opt === selectedVal) el.selected = true;
    selectEl.appendChild(el);
  });
}

function renderCategoriesUI(sourceNum) {
  const sourceName = sourceNum === 1 ? state.source1 : state.source2;
  const container = document.getElementById(`s${sourceNum}-categories-container`);
  if (!container) return;

  const cats = SOURCE_CATEGORIES[sourceName] || [];
  if (sourceNum === 1) state.source1Categories = [...cats];
  else state.source2Categories = [...cats];

  container.innerHTML = "";
  cats.forEach(cat => {
    const badge = document.createElement("button");
    badge.type = "button";
    badge.className = "cat-pill active px-2 py-0.5 text-[11px] font-medium rounded border";
    badge.textContent = cat;

    badge.addEventListener("click", () => {
      const activeList = sourceNum === 1 ? state.source1Categories : state.source2Categories;
      const idx = activeList.indexOf(cat);
      if (idx > -1) {
        activeList.splice(idx, 1);
        badge.classList.remove("active");
      } else {
        activeList.push(cat);
        badge.classList.add("active");
      }
    });

    container.appendChild(badge);
  });
}

function initSliders() {
  const slider = document.getElementById("threshold-slider");
  const valueDisplay = document.getElementById("threshold-value");

  slider?.addEventListener("input", (e) => {
    state.threshold = parseInt(e.target.value, 10);
    if (valueDisplay) valueDisplay.textContent = `${state.threshold}%`;
  });
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
 * Functional Scraping Dispatcher
 * Calls Python Scraper API if available, or browser client-side proxy scraper if on GitHub Pages
 */
async function executeLiveScrapingAndCheck() {
  const btn = document.getElementById("run-check-btn");
  const spinner = document.getElementById("btn-spinner");
  const logBox = document.getElementById("terminal-logs");
  const terminal = document.getElementById("live-terminal");

  if (logBox) logBox.innerHTML = "";
  if (terminal) terminal.classList.remove("hidden");
  if (btn) btn.disabled = true;
  if (spinner) spinner.classList.remove("hidden");

  logTerminal(`Initiating scraper for ${state.source1} and ${state.source2}...`);

  const payload = {
    source_1: state.source1,
    source_2: state.source2,
    source_1_data: {
      start_date: state.source1StartDate,
      end_date: state.source1EndDate,
      categories: state.source1Categories
    },
    source_2_data: {
      start_date: state.source2StartDate,
      end_date: state.source2EndDate,
      categories: state.source2Categories
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
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        pythonApiSuccess = true;
        logTerminal(`Scraped ${data.source1_count} articles from ${state.source1}.`, 'success');
        logTerminal(`Scraped ${data.source2_count} articles from ${state.source2}.`, 'success');
        newArticles = [...(data.articles1 || []), ...(data.articles2 || [])];
      }
    }
  } catch (err) {
    // Continue to client-side scraper
  }

  // 2. Client-side scraper fallback (GitHub Pages)
  if (!pythonApiSuccess) {
    logTerminal("Python server endpoint not detected (Static / GitHub Pages mode).", 'info');
    logTerminal("Running browser client-side scraper via CORS proxy...", 'info');

    try {
      const arts1 = await NewsScraper.scrapeSourceClientSide(
        state.source1,
        state.source1Categories,
        state.source1StartDate,
        state.source1EndDate,
        msg => logTerminal(msg)
      );

      const arts2 = await NewsScraper.scrapeSourceClientSide(
        state.source2,
        state.source2Categories,
        state.source2StartDate,
        state.source2EndDate,
        msg => logTerminal(msg)
      );

      newArticles = [...arts1, ...arts2];
      logTerminal(`Scraping finished. Total ${newArticles.length} articles extracted.`, 'success');
    } catch (err) {
      logTerminal(`Scraper error: ${err.message}`, 'error');
    }
  }

  state.articles = newArticles;

  if (btn) btn.disabled = false;
  if (spinner) spinner.classList.add("hidden");

  if (state.articles.length === 0) {
    logTerminal("No articles were retrieved from the selected feeds. Check connection or date range.", 'warn');
    showToast("No articles retrieved. Please check date range or connection.", "warning");
    return;
  }

  showToast(`Successfully scraped ${state.articles.length} articles. Calculating similarities...`, "success");
  runPlagiarismCheck();
}

/**
 * Main Plagiarism Check execution
 */
function runPlagiarismCheck() {
  const resultsEl = document.getElementById("analysis-results");
  const noResultsEl = document.getElementById("no-results-banner");

  if (resultsEl) resultsEl.classList.add("hidden");
  if (noResultsEl) noResultsEl.classList.add("hidden");

  const s1ArticlesRaw = state.articles.filter(a => a.Source === state.source1);
  const s2ArticlesRaw = state.articles.filter(a => a.Source === state.source2);

  const s1DupInfo = checkDuplicates(s1ArticlesRaw);
  const s2DupInfo = checkDuplicates(s2ArticlesRaw);

  const s1Cleaned = s1DupInfo.cleaned;
  const s2Cleaned = s2DupInfo.cleaned;

  document.getElementById("s1-stats-badge").textContent = `${s1Cleaned.length} articles`;
  document.getElementById("s2-stats-badge").textContent = `${s2Cleaned.length} articles`;

  if (s1Cleaned.length === 0 || s2Cleaned.length === 0) {
    if (noResultsEl) {
      noResultsEl.classList.remove("hidden");
      noResultsEl.querySelector("p").textContent = 
        `Insufficient articles to compare. Scraped ${s1Cleaned.length} from ${state.source1} and ${s2Cleaned.length} from ${state.source2}.`;
    }
    return;
  }

  const combinedArticles = [...s1Cleaned, ...s2Cleaned];

  // Process text and TF-IDF
  const processedDocs = combinedArticles.map(a => NLP.cleanText(a.Content || ""));
  const vectorizer = new NLP.TfidfVectorizer();
  const tfidfMatrix = vectorizer.fitTransform(processedDocs);
  const simMatrix = NLP.computeCosineSimilarity(tfidfMatrix);

  // Group scores
  const thresholdVal = state.threshold / 100.0;
  const dataScores = NLP.checkSimilarityScores(thresholdVal, simMatrix, combinedArticles);

  const pairKey1 = `${state.source1}__${state.source2}`;
  const pairKey2 = `${state.source2}__${state.source1}`;
  const betweenPairs = dataScores.betweenSourcePairs[pairKey1] || dataScores.betweenSourcePairs[pairKey2] || [];
  const numPlagiarized = betweenPairs.length;

  // Update KPI Cards
  const pairsCountEl = document.getElementById("metric-pairs-count");
  if (pairsCountEl) pairsCountEl.textContent = numPlagiarized;

  const badgeTab = document.getElementById("tab-pairs-badge");
  if (badgeTab) badgeTab.textContent = numPlagiarized;

  const s1Rate = s1Cleaned.length > 0 ? ((numPlagiarized / s1Cleaned.length) * 100).toFixed(1) : 0;
  const s2Rate = s2Cleaned.length > 0 ? ((numPlagiarized / s2Cleaned.length) * 100).toFixed(1) : 0;

  document.getElementById("metric-s1-title").textContent = `${state.source1} Duplication`;
  document.getElementById("metric-s1-rate").textContent = `${s1Rate}%`;
  document.getElementById("metric-s1-desc").textContent = `${numPlagiarized} of ${s1Cleaned.length} articles flagged`;

  document.getElementById("metric-s2-title").textContent = `${state.source2} Duplication`;
  document.getElementById("metric-s2-rate").textContent = `${s2Rate}%`;
  document.getElementById("metric-s2-desc").textContent = `${numPlagiarized} of ${s2Cleaned.length} articles flagged`;

  // Render Charts & Tables
  renderAnalysisCharts(s1Cleaned, s2Cleaned, s1DupInfo, s2DupInfo, numPlagiarized, dataScores);
  renderPlagiarizedTable(betweenPairs, combinedArticles);
  renderWithinSourceTables(dataScores.withinSourcePairs, combinedArticles);

  if (resultsEl) resultsEl.classList.remove("hidden");
  resultsEl.scrollIntoView({ behavior: "smooth" });
}

// Render Charts
function renderAnalysisCharts(s1Articles, s2Articles, s1DupInfo, s2DupInfo, numPlagiarized, dataScores) {
  const s1Plagiarized = Math.min(numPlagiarized, s1Articles.length);
  const s1Unplagiarized = Math.max(0, s1Articles.length - s1Plagiarized);
  ChartManager.renderPieChart("chart-proportion-s1", state.source1, {
    "Plagiarized": s1Plagiarized,
    "Original": s1Unplagiarized
  }, 'plagiarism');

  const s2Plagiarized = Math.min(numPlagiarized, s2Articles.length);
  const s2Unplagiarized = Math.max(0, s2Articles.length - s2Plagiarized);
  ChartManager.renderPieChart("chart-proportion-s2", state.source2, {
    "Plagiarized": s2Plagiarized,
    "Original": s2Unplagiarized
  }, 'plagiarism');

  ChartManager.renderBarChart("chart-categories-s1", state.source1, dataScores.source1Categories || {}, '#0f172a');
  ChartManager.renderBarChart("chart-categories-s2", state.source2, dataScores.source2Categories || {}, '#334155');

  const withinPairs = dataScores.withinSourcePairs || {};
  const s1Similar = (withinPairs[state.source1] || []).length;
  const s2Similar = (withinPairs[state.source2] || []).length;

  ChartManager.renderPieChart("chart-similar-s1", state.source1, {
    "Similar": s1Similar,
    "Distinct": Math.max(0, s1Articles.length - s1Similar)
  }, 'similar');

  ChartManager.renderPieChart("chart-similar-s2", state.source2, {
    "Similar": s2Similar,
    "Distinct": Math.max(0, s2Articles.length - s2Similar)
  }, 'similar');

  const s1DupCard = document.getElementById("dup-url-s1-container");
  const s2DupCard = document.getElementById("dup-url-s2-container");

  if (s1DupInfo.duplicates > 0) {
    if (s1DupCard) s1DupCard.classList.remove("hidden");
    ChartManager.renderPieChart("chart-dup-s1", state.source1, {
      "Duplicate": s1DupInfo.duplicates,
      "Unique": s1Articles.length
    }, 'dup');
  } else if (s1DupCard) {
    s1DupCard.classList.add("hidden");
  }

  if (s2DupInfo.duplicates > 0) {
    if (s2DupCard) s2DupCard.classList.remove("hidden");
    ChartManager.renderPieChart("chart-dup-s2", state.source2, {
      "Duplicate": s2DupInfo.duplicates,
      "Unique": s2Articles.length
    }, 'dup');
  } else if (s2DupCard) {
    s2DupCard.classList.add("hidden");
  }

  ChartManager.renderHorizontalBarChart("chart-dates-s1", state.source1, dataScores.source1DateCount || {}, '#475569');
  ChartManager.renderHorizontalBarChart("chart-dates-s2", state.source2, dataScores.source2DateCount || {}, '#64748b');
}

// Render Plagiarized Table
function renderPlagiarizedTable(pairs, articles) {
  const tbody = document.getElementById("plagiarism-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (pairs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-400">No plagiarized articles detected above ${state.threshold}% threshold.</td></tr>`;
    return;
  }

  pairs.sort((a, b) => b.score - a.score);

  pairs.forEach(pair => {
    const art1 = articles[pair.i];
    const art2 = articles[pair.j];
    const pct = (pair.score * 100).toFixed(1);

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50/80 transition-colors border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-4 py-3 whitespace-nowrap">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${pair.score >= 0.85 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-800'}">
          ${pct}%
        </span>
      </td>
      <td class="px-4 py-3">
        <div class="font-medium text-slate-900 leading-snug">${DiffViewer.escapeHtml(art1.Title || 'Untitled')}</div>
        <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
          <span>${art1.Source}</span>
          <span>&middot;</span>
          <span>${art1.Category || '-'}</span>
          <span>&middot;</span>
          <span>${art1["Date Posted"] || '-'}</span>
          <a href="${art1.URL}" target="_blank" rel="noopener noreferrer" class="text-slate-600 hover:text-slate-900 hover:underline">Link ↗</a>
        </div>
      </td>
      <td class="px-4 py-3">
        <div class="font-medium text-slate-900 leading-snug">${DiffViewer.escapeHtml(art2.Title || 'Untitled')}</div>
        <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
          <span>${art2.Source}</span>
          <span>&middot;</span>
          <span>${art2.Category || '-'}</span>
          <span>&middot;</span>
          <span>${art2["Date Posted"] || '-'}</span>
          <a href="${art2.URL}" target="_blank" rel="noopener noreferrer" class="text-slate-600 hover:text-slate-900 hover:underline">Link ↗</a>
        </div>
      </td>
      <td class="px-4 py-3 text-right whitespace-nowrap">
        <button type="button" class="compare-btn px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors">
          Inspect Diff
        </button>
      </td>
    `;

    tr.querySelector(".compare-btn").addEventListener("click", () => {
      openDiffModal(art1, art2, pair.score);
    });

    tbody.appendChild(tr);
  });
}

// Within-Source Tables
function renderWithinSourceTables(withinPairs, articles) {
  const container = document.getElementById("within-source-tables-container");
  if (!container) return;
  container.innerHTML = "";

  [state.source1, state.source2].forEach(sourceName => {
    const pairs = withinPairs[sourceName] || [];
    const sec = document.createElement("div");
    sec.className = "bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden";

    sec.innerHTML = `
      <div class="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-800">
        <span>Internal Similar Articles: ${sourceName}</span>
        <span class="text-[11px] font-normal text-slate-500">${pairs.length} detected</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-600">
          <tbody class="divide-y divide-slate-100">
            ${pairs.length === 0 ? '<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400">No internal similar content found.</td></tr>' : ''}
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
        <td class="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800">${pct}%</td>
        <td class="px-4 py-2.5 font-medium text-slate-900">${DiffViewer.escapeHtml(art1.Title || 'Untitled')}</td>
        <td class="px-4 py-2.5 font-medium text-slate-900">${DiffViewer.escapeHtml(art2.Title || 'Untitled')}</td>
        <td class="px-4 py-2.5 text-right whitespace-nowrap">
          <button type="button" class="btn-diff text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline">Inspect</button>
        </td>
      `;
      row.querySelector(".btn-diff")?.addEventListener("click", () => openDiffModal(art1, art2, p.score));
      tbody.appendChild(row);
    });

    container.appendChild(sec);
  });
}

// Side-by-Side Diff Modal
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

// Custom Dataset Upload
function initFileUpload() {
  const fileInput = document.getElementById("dataset-file-input");
  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let parsed = [];

        if (file.name.endsWith(".json")) {
          parsed = JSON.parse(text);
        } else if (file.name.endsWith(".csv")) {
          parsed = parseCSV(text);
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          state.articles = parsed;
          showToast(`Loaded ${parsed.length} articles from file.`, "success");
          document.querySelector('[data-tab="analysis"]')?.click();
          runPlagiarismCheck();
        } else {
          showToast("Invalid file format.", "warning");
        }
      } catch (err) {
        showToast("Error parsing file: " + err.message, "error");
      }
    };
    reader.readAsText(file);
  });
}

function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] || "";
    });
    records.push(obj);
  }
  return records;
}

function showToast(message, type = "info") {
  const toast = document.getElementById("app-toast");
  if (!toast) return;

  const bgColors = {
    info: "bg-slate-900 text-white",
    success: "bg-emerald-700 text-white",
    warning: "bg-amber-700 text-white",
    error: "bg-red-700 text-white"
  };

  toast.className = `fixed bottom-4 right-4 z-50 px-3.5 py-2 rounded-lg shadow-md transition-all duration-300 transform font-medium text-xs flex items-center gap-2 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `<span>${message}</span>`;
  toast.classList.remove("translate-y-16", "opacity-0");

  setTimeout(() => {
    toast.classList.add("translate-y-16", "opacity-0");
  }, 3500);
}
