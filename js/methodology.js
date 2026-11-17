/**
 * Interactive Methodology Lab & NLP Pipeline Visualizer
 * Provides an interactive 5-stage walkthrough of text cleaning,
 * stopword filtering, morphological stemming, TF-IDF calculation,
 * and high-dimensional cosine similarity.
 */

(function () {
  const PRESETS = {
    politics: {
      name: "Ghana Politics (Paraphrase)",
      badge: "Paraphrased Wire",
      desc: "Typical rewording between two portals covering an Electoral Commission press briefing.",
      textA: "The Electoral Commission (EC) of Ghana has announced that the exhibition of the provisional voters register will officially commence on Tuesday across all thirty-three thousand polling stations nationwide.",
      textB: "Ghana's Electoral Commission announced on Tuesday the nationwide exhibition of its provisional voters register, covering more than 33,000 designated polling centres across the country."
    },
    sports: {
      name: "Black Stars (Direct Wire Copy)",
      badge: "Near-Duplicate",
      desc: "Nearly verbatim syndicated reporting from a press statement regarding squad selection.",
      textA: "Ghana Black Stars head coach Otto Addo has released a 25-man squad for the upcoming 2025 Africa Cup of Nations qualifiers against Angola and Niger, recalling captain Thomas Partey to midfield duties.",
      textB: "Black Stars head coach Otto Addo has officially released a 25-man squad for the 2025 Africa Cup of Nations qualifying matches against Angola and Niger, recalling captain Thomas Partey to the midfield."
    },
    unrelated: {
      name: "Economy vs Entertainment (Independent)",
      badge: "Zero Plagiarism",
      desc: "Completely distinct news stories with no overlap in reporting topic or vocabulary.",
      textA: "The Bank of Ghana Monetary Policy Committee maintained its benchmark policy rate at 29 percent to anchor inflation expectations and stabilize the cedi currency against foreign currencies.",
      textB: "Ghanaian music sensation Stonebwoy electrified thousands of fans during his sold-out concert in London with energetic performances, live cultural drumming, and surprise guest appearances."
    }
  };

  let labState = {
    currentStep: 1,
    threshold: 15,
    textA: PRESETS.politics.textA,
    textB: PRESETS.politics.textB,
    searchTerm: "",
    computed: null
  };

  // Main Pipeline Engine
  function runPipeline(rawA, rawB) {
    const stopWords = (window.NLP && window.NLP.STOP_WORDS) || new Set();
    const stem = (window.NLP && window.NLP.stemmer) || (w => w);

    // --- Step 1: Sanitization ---
    function sanitize(text) {
      if (!text) return { lower: "", noHtml: "", cleaned: "", rawLength: 0 };
      const rawLength = text.length;
      const noHtml = text.replace(/<.*?>/g, " ");
      const lower = noHtml.toLowerCase();
      const cleaned = lower.replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
      return { rawLength, noHtml, lower, cleaned, cleanedLength: cleaned.length };
    }

    const sA = sanitize(rawA);
    const sB = sanitize(rawB);

    // --- Step 2: Tokenization & Stopwords ---
    function processTokens(cleanedStr) {
      if (!cleanedStr) return { allTokens: [], retained: [], removed: [] };
      const rawTokens = cleanedStr.split(/\s+/).filter(t => t.length > 0);
      const allTokens = [];
      const retained = [];
      const removed = [];

      rawTokens.forEach(t => {
        const isStop = stopWords.has(t) || t.length <= 1;
        const info = { word: t, isStop };
        allTokens.push(info);
        if (isStop) {
          removed.push(t);
        } else {
          retained.push(t);
        }
      });

      return { allTokens, retained, removed };
    }

    const tokA = processTokens(sA.cleaned);
    const tokB = processTokens(sB.cleaned);

    // --- Step 3: Morphological Stemming ---
    function stemList(tokens) {
      return tokens.map(t => {
        const stemmed = stem(t);
        return { original: t, stem: stemmed };
      });
    }

    const stemMapA = stemList(tokA.retained);
    const stemMapB = stemList(tokB.retained);
    const stemsA = stemMapA.map(m => m.stem);
    const stemsB = stemMapB.map(m => m.stem);

    // --- Step 4: TF-IDF Matrix Calculation ---
    const allStems = [...new Set([...stemsA, ...stemsB])].sort();
    const nDocs = 2;

    const tfA = new Map();
    stemsA.forEach(s => tfA.set(s, (tfA.get(s) || 0) + 1));

    const tfB = new Map();
    stemsB.forEach(s => tfB.set(s, (tfB.get(s) || 0) + 1));

    const vocabDetails = allStems.map(term => {
      const countA = tfA.get(term) || 0;
      const countB = tfB.get(term) || 0;
      let df = 0;
      if (countA > 0) df++;
      if (countB > 0) df++;

      // Smooth IDF matching scikit-learn: ln((1 + nDocs) / (1 + df)) + 1
      const idf = Math.log((1 + nDocs) / (1 + df)) + 1.0;
      const rawWeightA = countA * idf;
      const rawWeightB = countB * idf;

      return {
        term,
        countA,
        countB,
        df,
        idf,
        rawWeightA,
        rawWeightB
      };
    });

    // L2 Normalization
    let normSqA = 0;
    let normSqB = 0;
    vocabDetails.forEach(v => {
      normSqA += v.rawWeightA * v.rawWeightA;
      normSqB += v.rawWeightB * v.rawWeightB;
    });

    const normA = Math.sqrt(normSqA) || 1;
    const normB = Math.sqrt(normSqB) || 1;

    vocabDetails.forEach(v => {
      v.weightA = v.rawWeightA / normA;
      v.weightB = v.rawWeightB / normB;
      v.contribution = v.weightA * v.weightB;
    });

    // --- Step 5: Cosine Similarity ---
    let dotProduct = 0;
    vocabDetails.forEach(v => {
      dotProduct += v.contribution;
    });

    // Constrain to [0, 1]
    const similarity = Math.max(0, Math.min(1, dotProduct));
    const similarityPct = (similarity * 100).toFixed(1);

    // Angle in degrees: theta = arccos(similarity)
    const angleRad = Math.acos(Math.min(1, Math.max(0, similarity)));
    const angleDeg = (angleRad * (180 / Math.PI)).toFixed(1);

    // Top overlapping terms contributing to score
    const matchingTerms = vocabDetails
      .filter(v => v.contribution > 0)
      .sort((a, b) => b.contribution - a.contribution);

    return {
      sA, sB,
      tokA, tokB,
      stemMapA, stemMapB,
      stemsA, stemsB,
      vocabDetails,
      normA, normB,
      dotProduct,
      similarity,
      similarityPct,
      angleDeg,
      matchingTerms
    };
  }

  // DOM Renderers
  function updatePipeline() {
    labState.computed = runPipeline(labState.textA, labState.textB);
    renderActiveStep();
    renderScoreSummary();
  }

  function renderScoreSummary() {
    const c = labState.computed;
    if (!c) return;

    const scoreEl = document.getElementById("lab-score-display");
    const angleEl = document.getElementById("lab-angle-display");
    const barEl = document.getElementById("lab-score-bar");
    const verdictEl = document.getElementById("lab-verdict-badge");

    if (scoreEl) scoreEl.textContent = `${c.similarityPct}%`;
    if (angleEl) angleEl.textContent = `${c.angleDeg}°`;
    if (barEl) barEl.style.width = `${Math.min(100, Math.max(0, parseFloat(c.similarityPct)))}%`;

    if (verdictEl) {
      const score = parseFloat(c.similarityPct);
      if (score >= 70) {
        verdictEl.className = "px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200";
        verdictEl.textContent = "High Plagiarism / Direct Copy";
      } else if (score >= labState.threshold) {
        verdictEl.className = "px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200";
        verdictEl.textContent = "Significant Paraphrase Detected";
      } else {
        verdictEl.className = "px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200";
        verdictEl.textContent = "Independent Reporting (Below Cutoff)";
      }
    }
  }

  function renderActiveStep() {
    const c = labState.computed;
    if (!c) return;

    // Update Step Pills
    document.querySelectorAll(".pipeline-step-pill").forEach(pill => {
      const step = parseInt(pill.dataset.step, 10);
      if (step === labState.currentStep) {
        pill.classList.add("bg-[#2e7d32]", "text-white", "shadow-sm");
        pill.classList.remove("bg-white", "text-slate-600", "border-slate-200");
      } else {
        pill.classList.remove("bg-[#2e7d32]", "text-white", "shadow-sm");
        pill.classList.add("bg-white", "text-slate-600", "border", "border-slate-200");
      }
    });

    // Hide all step containers
    for (let i = 1; i <= 5; i++) {
      const container = document.getElementById(`lab-step-${i}`);
      if (container) {
        if (i === labState.currentStep) {
          container.classList.remove("hidden");
        } else {
          container.classList.add("hidden");
        }
      }
    }

    // Call individual step renderers
    switch (labState.currentStep) {
      case 1: renderStep1(c); break;
      case 2: renderStep2(c); break;
      case 3: renderStep3(c); break;
      case 4: renderStep4(c); break;
      case 5: renderStep5(c); break;
    }
  }

  // --- Step 1: Text Sanitization ---
  function renderStep1(c) {
    const container = document.getElementById("lab-step-1");
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-sm">1</div>
          <div>
            <h4 class="font-bold text-slate-800 text-xs">Stage 1: Text Normalization & Sanitization</h4>
            <p class="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Standardizes case, strips unhelpful formatting, removes HTML tags, and eliminates punctuation or non-alphabetic characters. This ensures formatting differences between websites (e.g. bold tags, quotes, capitalization) do not skew similarity.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Document A -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <span class="text-xs font-bold text-emerald-700">Document A</span>
              <span class="text-[10px] text-slate-400 font-mono">${c.sA.rawLength} chars → ${c.sA.cleanedLength} chars</span>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Raw Input</span>
              <div class="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 border border-slate-100 font-mono leading-relaxed max-h-28 overflow-y-auto">
                ${escapeHtml(labState.textA)}
              </div>
            </div>
            <div>
              <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">Sanitized Cleaned Text</span>
              <div class="bg-emerald-50/50 p-2.5 rounded-xl text-xs text-emerald-900 border border-emerald-100 font-mono leading-relaxed max-h-28 overflow-y-auto">
                ${escapeHtml(c.sA.cleaned)}
              </div>
            </div>
          </div>

          <!-- Document B -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <span class="text-xs font-bold text-sky-700">Document B</span>
              <span class="text-[10px] text-slate-400 font-mono">${c.sB.rawLength} chars → ${c.sB.cleanedLength} chars</span>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Raw Input</span>
              <div class="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 border border-slate-100 font-mono leading-relaxed max-h-28 overflow-y-auto">
                ${escapeHtml(labState.textB)}
              </div>
            </div>
            <div>
              <span class="text-[10px] font-bold text-sky-700 uppercase tracking-wider block mb-1">Sanitized Cleaned Text</span>
              <div class="bg-sky-50/50 p-2.5 rounded-xl text-xs text-sky-900 border border-sky-100 font-mono leading-relaxed max-h-28 overflow-y-auto">
                ${escapeHtml(c.sB.cleaned)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Step 2: Stopwords ---
  function renderStep2(c) {
    const container = document.getElementById("lab-step-2");
    if (!container) return;

    function renderTokensBadges(allTokens) {
      if (!allTokens.length) return `<span class="text-xs text-slate-400">No tokens found.</span>`;
      return allTokens.map(tok => {
        if (tok.isStop) {
          return `<span class="inline-block px-2 py-0.5 m-0.5 rounded-md text-[11px] bg-slate-100 text-slate-400 line-through border border-slate-200 font-mono" title="Stopword removed">${escapeHtml(tok.word)}</span>`;
        } else {
          return `<span class="inline-block px-2 py-0.5 m-0.5 rounded-md text-[11px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 font-mono" title="Retained keyword">${escapeHtml(tok.word)}</span>`;
        }
      }).join(" ");
    }

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-sm">2</div>
          <div>
            <h4 class="font-bold text-slate-800 text-xs">Stage 2: Stopword Elimination (NLTK 179-Word Corpus)</h4>
            <p class="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Syntactic glue words like <em>the, in, of, at, was, and</em> occur with near 100% frequency across all journalistic articles without adding topical distinction. Removing them isolates unique reporting keywords.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-4 text-xs bg-white p-3 rounded-xl border border-slate-200">
          <span class="font-bold text-slate-700">Legend:</span>
          <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span> Retained Keyword</span>
          <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-slate-100 border border-slate-300 line-through"></span> Filtered Stopword</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Doc A Tokens -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <span class="text-xs font-bold text-emerald-700">Document A Tokens</span>
              <span class="text-[10px] text-slate-500 font-bold">
                <span class="text-emerald-700">${c.tokA.retained.length} retained</span> / 
                <span class="text-slate-400">${c.tokA.removed.length} removed</span>
              </span>
            </div>
            <div class="leading-loose max-h-52 overflow-y-auto p-1">
              ${renderTokensBadges(c.tokA.allTokens)}
            </div>
          </div>

          <!-- Doc B Tokens -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <span class="text-xs font-bold text-sky-700">Document B Tokens</span>
              <span class="text-[10px] text-slate-500 font-bold">
                <span class="text-sky-700">${c.tokB.retained.length} retained</span> / 
                <span class="text-slate-400">${c.tokB.removed.length} removed</span>
              </span>
            </div>
            <div class="leading-loose max-h-52 overflow-y-auto p-1">
              ${renderTokensBadges(c.tokB.allTokens)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Step 3: Stemming ---
  function renderStep3(c) {
    const container = document.getElementById("lab-step-3");
    if (!container) return;

    function renderStemGrid(stemMap) {
      if (!stemMap.length) return `<span class="text-xs text-slate-400">No tokens to stem.</span>`;
      return stemMap.map(item => {
        const changed = item.original !== item.stem;
        return `
          <div class="flex items-center justify-between p-2 rounded-xl text-xs font-mono border ${changed ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}">
            <span class="${changed ? 'font-semibold' : ''}">${escapeHtml(item.original)}</span>
            <span class="text-slate-400 mx-1.5">➔</span>
            <span class="font-bold text-[#2e7d32] bg-white px-1.5 py-0.5 rounded-md border border-slate-100">${escapeHtml(item.stem)}</span>
          </div>
        `;
      }).join("");
    }

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-sm">3</div>
          <div>
            <h4 class="font-bold text-slate-800 text-xs">Stage 3: Morphological Porter Stemming</h4>
            <p class="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Writers often disguise copied passages by swapping tenses (e.g. <em>announces ➔ announced</em>) or pluralities (<em>voters ➔ voter</em>). The Porter Stemmer strips suffixes to reduce inflected words to their canonical root, enabling semantic pairing.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Doc A Stems -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <span class="text-xs font-bold text-emerald-700">Document A Roots</span>
              <span class="text-[10px] text-slate-400 font-mono">${c.stemMapA.length} terms</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
              ${renderStemGrid(c.stemMapA)}
            </div>
          </div>

          <!-- Doc B Stems -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <span class="text-xs font-bold text-sky-700">Document B Roots</span>
              <span class="text-[10px] text-slate-400 font-mono">${c.stemMapB.length} terms</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
              ${renderStemGrid(c.stemMapB)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Step 4: TF-IDF Matrix ---
  function renderStep4(c) {
    const container = document.getElementById("lab-step-4");
    if (!container) return;

    const filteredVocab = c.vocabDetails.filter(v => {
      if (!labState.searchTerm) return true;
      return v.term.toLowerCase().includes(labState.searchTerm.toLowerCase());
    });

    const rows = filteredVocab.map(v => {
      const isShared = v.countA > 0 && v.countB > 0;
      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${isShared ? 'bg-emerald-50/40 font-semibold' : ''}">
          <td class="p-2.5 font-mono text-slate-900 flex items-center gap-1.5">
            ${isShared ? '<span class="w-2 h-2 rounded-full bg-emerald-500" title="Shared Term"></span>' : ''}
            <span>${escapeHtml(v.term)}</span>
          </td>
          <td class="p-2.5 text-center text-slate-700">${v.countA}</td>
          <td class="p-2.5 text-center text-slate-700">${v.countB}</td>
          <td class="p-2.5 text-center text-slate-500">${v.df}/2</td>
          <td class="p-2.5 text-center font-mono text-slate-700">${v.idf.toFixed(3)}</td>
          <td class="p-2.5 text-right font-mono ${v.weightA > 0 ? 'text-emerald-700 font-bold' : 'text-slate-300'}">${v.weightA > 0 ? v.weightA.toFixed(3) : '-'}</td>
          <td class="p-2.5 text-right font-mono ${v.weightB > 0 ? 'text-sky-700 font-bold' : 'text-slate-300'}">${v.weightB > 0 ? v.weightB.toFixed(3) : '-'}</td>
          <td class="p-2.5 text-right font-mono ${v.contribution > 0 ? 'text-emerald-700 font-black bg-emerald-100/60 rounded px-1' : 'text-slate-300'}">${v.contribution > 0 ? v.contribution.toFixed(4) : '0'}</td>
        </tr>
      `;
    }).join("");

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-sm">4</div>
          <div>
            <h4 class="font-bold text-slate-800 text-xs">Stage 4: TF-IDF Vector Space & L2 Normalization</h4>
            <p class="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Transforms vocabulary into numerical vector weights matching <code>scikit-learn</code>'s formula: <code>idf(t) = ln((1 + n)/(1 + df)) + 1</code>. Rare terms receive higher scores, and L2 normalization prevents longer articles from having an unfair advantage over concise bulletins.
            </p>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-800">Vocabulary Matrix</span>
              <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-bold">${c.vocabDetails.length} unique terms</span>
            </div>
            <div class="relative">
              <input id="lab-vocab-search" type="text" placeholder="Filter terms..." value="${escapeHtml(labState.searchTerm)}"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
            </div>
          </div>

          <div class="overflow-x-auto max-h-64 overflow-y-auto">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-slate-50 sticky top-0 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th class="p-2.5">Term (Stem)</th>
                  <th class="p-2.5 text-center">tf (A)</th>
                  <th class="p-2.5 text-center">tf (B)</th>
                  <th class="p-2.5 text-center">df</th>
                  <th class="p-2.5 text-center">Smooth IDF</th>
                  <th class="p-2.5 text-right text-emerald-700">Vector A</th>
                  <th class="p-2.5 text-right text-sky-700">Vector B</th>
                  <th class="p-2.5 text-right text-emerald-800">Overlap Product</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `<tr><td colspan="8" class="p-4 text-center text-slate-400">No matching terms.</td></tr>`}
              </tbody>
            </table>
          </div>
          <div class="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span>Rows with <span class="w-2 h-2 rounded-full inline-block bg-emerald-500"></span> highlight shared vocabulary directly driving the plagiarism score.</span>
            <span class="font-mono text-[10px]">‖A‖ = ${c.normA.toFixed(2)}, ‖B‖ = ${c.normB.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;

    // Hook search event
    const searchInput = document.getElementById("lab-vocab-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        labState.searchTerm = e.target.value;
        renderStep4(labState.computed);
      });
    }
  }

  // --- Step 5: Cosine Similarity ---
  function renderStep5(c) {
    const container = document.getElementById("lab-step-5");
    if (!container) return;

    const matchesList = c.matchingTerms.map(m => {
      return `
        <div class="flex items-center justify-between p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs font-mono">
          <span class="font-bold text-emerald-950">${escapeHtml(m.term)}</span>
          <div class="flex items-center gap-3">
            <span class="text-[10px] text-slate-500">(${m.weightA.toFixed(2)} × ${m.weightB.toFixed(2)})</span>
            <span class="font-black text-emerald-700">+${m.contribution.toFixed(4)}</span>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-sm">5</div>
          <div>
            <h4 class="font-bold text-slate-800 text-xs">Stage 5: Cosine Similarity Matrix Dot Product</h4>
            <p class="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Measures the cosine of the angle between Document A and Document B in high-dimensional vector space. Identical directional vectors have cosine 1.0 (0° angle), whereas completely unrelated stories with no common stems have cosine 0.0 (90° orthogonal angle).
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Geometric Gauge & Angle Card -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Vector Separation Angle</span>
            <div class="text-4xl font-extrabold text-[#2e7d32] mb-1 font-mono">${c.angleDeg}°</div>
            <span class="text-xs font-bold text-slate-700">Cosine = ${c.similarity.toFixed(4)}</span>
            <div class="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div class="h-full bg-emerald-600 rounded-full" style="width: ${c.similarityPct}%"></div>
            </div>
            <p class="text-[10px] text-slate-400 mt-2">
              0° = 100% exact match | 90° = 0% unrelated
            </p>
          </div>

          <!-- Top Contributing Terms -->
          <div class="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <span class="text-xs font-bold text-slate-800">Highest Overlapping Keywords</span>
              <span class="text-[10px] font-mono text-emerald-700 font-bold">${c.matchingTerms.length} active overlap stems</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              ${matchesList || `<div class="col-span-2 text-center text-xs text-slate-400 py-4">No overlapping stems detected.</div>`}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Helper utility
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initialize interactive controls
  function initMethodologyLab() {
    // 1. Text inputs
    const textInputA = document.getElementById("lab-input-a");
    const textInputB = document.getElementById("lab-input-b");
    const runBtn = document.getElementById("lab-run-btn");

    if (textInputA) textInputA.value = labState.textA;
    if (textInputB) textInputB.value = labState.textB;

    if (runBtn) {
      runBtn.addEventListener("click", () => {
        if (textInputA) labState.textA = textInputA.value;
        if (textInputB) labState.textB = textInputB.value;
        updatePipeline();
      });
    }

    // 2. Preset Buttons
    document.querySelectorAll(".lab-preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.preset;
        if (PRESETS[key]) {
          labState.textA = PRESETS[key].textA;
          labState.textB = PRESETS[key].textB;
          if (textInputA) textInputA.value = labState.textA;
          if (textInputB) textInputB.value = labState.textB;

          document.querySelectorAll(".lab-preset-btn").forEach(b => {
            b.classList.remove("border-[#2e7d32]", "bg-emerald-50", "text-[#2e7d32]", "font-bold");
            b.classList.add("border-slate-200", "bg-white", "text-slate-600");
          });
          btn.classList.add("border-[#2e7d32]", "bg-emerald-50", "text-[#2e7d32]", "font-bold");
          btn.classList.remove("border-slate-200", "bg-white", "text-slate-600");

          updatePipeline();
        }
      });
    });

    // 3. Step Pill Navigation
    document.querySelectorAll(".pipeline-step-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const step = parseInt(pill.dataset.step, 10);
        if (step >= 1 && step <= 5) {
          labState.currentStep = step;
          renderActiveStep();
        }
      });
    });

    // 4. Stepper Prev / Next Buttons
    const prevBtn = document.getElementById("lab-prev-step");
    const nextBtn = document.getElementById("lab-next-step");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (labState.currentStep > 1) {
          labState.currentStep--;
          renderActiveStep();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (labState.currentStep < 5) {
          labState.currentStep++;
          renderActiveStep();
        }
      });
    }

    // 5. Threshold Explorer Slider
    const threshSlider = document.getElementById("lab-thresh-slider");
    const threshVal = document.getElementById("lab-thresh-val");

    if (threshSlider) {
      threshSlider.value = labState.threshold;
      threshSlider.addEventListener("input", (e) => {
        labState.threshold = parseInt(e.target.value, 10);
        if (threshVal) threshVal.textContent = `${labState.threshold}%`;
        renderScoreSummary();
      });
    }

    // Run first calculation
    updatePipeline();
  }

  // Ensure initialization when DOM is loaded or when Methodology tab is opened
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMethodologyLab);
  } else {
    initMethodologyLab();
  }

  // Re-run pipeline when methodology tab is clicked to guarantee correct dimensions
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      if (tab.dataset.tab === "about") {
        setTimeout(updatePipeline, 50);
      }
    });
  });

  window.MethodologyLab = {
    runPipeline,
    updatePipeline,
    PRESETS
  };
})();
