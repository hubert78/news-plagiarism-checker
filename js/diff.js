/**
 * Interactive Side-by-Side Article Comparison & Diff Highlighter
 */

function highlightPlagiarizedSentences(textA, textB, threshold = 0.65) {
  // Split into sentences (by period, exclamation, question mark)
  const sentencesA = textA.match(/[^.!?]+[.!?]+/g) || [textA];
  const sentencesB = textB.match(/[^.!?]+[.!?]+/g) || [textB];

  const cleanSentencesA = sentencesA.map(s => NLP.cleanText(s));
  const cleanSentencesB = sentencesB.map(s => NLP.cleanText(s));

  const matchedIndicesA = new Set();
  const matchedIndicesB = new Set();

  for (let i = 0; i < cleanSentencesA.length; i++) {
    const sA = cleanSentencesA[i];
    if (sA.split(/\s+/).length < 3) continue; // ignore very short sentences

    for (let j = 0; j < cleanSentencesB.length; j++) {
      const sB = cleanSentencesB[j];
      if (sB.split(/\s+/).length < 3) continue;

      const sim = NLP.compareTwoTexts(sA, sB);
      if (sim >= threshold) {
        matchedIndicesA.add(i);
        matchedIndicesB.add(j);
      }
    }
  }

  // Generate HTML with highlights
  const htmlA = sentencesA.map((s, idx) => {
    if (matchedIndicesA.has(idx)) {
      return `<mark class="diff-highlight bg-amber-100 text-amber-900 border-l-2 border-amber-500 pl-1 rounded">${escapeHtml(s)}</mark>`;
    }
    return `<span>${escapeHtml(s)}</span>`;
  }).join(" ");

  const htmlB = sentencesB.map((s, idx) => {
    if (matchedIndicesB.has(idx)) {
      return `<mark class="diff-highlight bg-amber-100 text-amber-900 border-l-2 border-amber-500 pl-1 rounded">${escapeHtml(s)}</mark>`;
    }
    return `<span>${escapeHtml(s)}</span>`;
  }).join(" ");

  return {
    htmlA,
    htmlB,
    matchedSentencesA: matchedIndicesA.size,
    totalSentencesA: sentencesA.length,
    matchedSentencesB: matchedIndicesB.size,
    totalSentencesB: sentencesB.length
  };
}

function escapeHtml(string) {
  const entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  return String(string).replace(/[&<>"']/g, s => entityMap[s]);
}

const globalRootDiff = typeof window !== 'undefined' ? window : global;
globalRootDiff.DiffViewer = {
  highlightPlagiarizedSentences,
  escapeHtml
};
