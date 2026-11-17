/**
 * Client-Side NLP & Plagiarism Detection Engine
 * Matches Python NLTK + scikit-learn TfidfVectorizer & cosine_similarity
 */

// NLTK English Stopwords (179 words)
const STOP_WORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "you're", "you've",
  "you'll", "you'd", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself",
  "she", "she's", "her", "hers", "herself", "it", "it's", "its", "itself", "they", "them",
  "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "that'll",
  "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has",
  "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or",
  "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against",
  "between", "into", "through", "during", "before", "after", "above", "below", "to", "from",
  "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once",
  "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more",
  "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
  "too", "very", "s", "t", "can", "will", "just", "don", "don't", "should", "should've", "now",
  "d", "ll", "m", "o", "re", "ve", "y", "ain", "aren", "aren't", "couldn", "couldn't", "didn",
  "didn't", "doesn", "doesn't", "hadn", "hadn't", "hasn", "hasn't", "haven", "haven't", "isn",
  "isn't", "ma", "mightn", "mightn't", "mustn", "mustn't", "needn", "needn't", "shan", "shan't",
  "shouldn", "shouldn't", "wasn", "wasn't", "weren", "weren't", "won", "won't", "wouldn", "wouldn't"
]);

/**
 * Porter Stemmer implementation in pure JS
 * Reduces words to base form, matching lemmatizer behavior
 */
const stemmer = (function () {
  const step2list = {
    "ational": "ate", "tional": "tion", "enci": "ence", "anci": "ance",
    "izer": "ize", "bli": "ble", "alli": "al", "entli": "ent", "eli": "e",
    "ousli": "ous", "ization": "ize", "ation": "ate", "ator": "ate",
    "alism": "al", "iveness": "ive", "fulness": "ful", "ousness": "ous",
    "aliti": "al", "iviti": "ive", "biliti": "ble", "logi": "log"
  };

  const step3list = {
    "icate": "ic", "ative": "", "alize": "al", "iciti": "ic",
    "ical": "ic", "ful": "", "ness": ""
  };

  const c = "[^aeiou]";          // consonant
  const v = "[aeiouy]";          // vowel
  const C = c + "[^aeiouy]*";    // consonant sequence
  const V = v + "[aeiou]*";      // vowel sequence

  const mgr0 = "^(" + C + ")?" + V + C;               // m > 0
  const meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$";  // m == 1
  const mgr1 = "^(" + C + ")?" + V + C + V + C;       // m > 1
  const s_v   = "^(" + C + ")?" + v;                   // vowel in stem

  return function (w) {
    let stem;
    let suffix;
    let firstch;
    let re;
    let re2;
    let re3;
    let re4;

    if (w.length < 3) return w;

    firstch = w.substr(0, 1);
    if (firstch === "y") w = "Y" + w.substr(1);

    // Step 1a
    re = /^(.+?)(ss|i)es$/;
    re2 = /^(.+?)([^s])s$/;
    if (re.test(w)) w = w.replace(re, "$1$2");
    else if (re2.test(w)) w = w.replace(re2, "$1$2");

    // Step 1b
    re = /^(.+?)eed$/;
    re2 = /^(.+?)(ed|ing)$/;
    if (re.test(w)) {
      const fp = re.exec(w);
      re = new RegExp(mgr0);
      if (re.test(fp[1])) {
        re = /.$/;
        w = w.replace(re, "");
      }
    } else if (re2.test(w)) {
      const fp = re2.exec(w);
      stem = fp[1];
      re2 = new RegExp(s_v);
      if (re2.test(stem)) {
        w = stem;
        re2 = /(at|bl|iz)$/;
        re3 = new RegExp("([^aeiouylsz])\\1$");
        re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
        if (re2.test(w)) w = w + "e";
        else if (re3.test(w)) { re = /.$/; w = w.replace(re, ""); }
        else if (re4.test(w)) w = w + "e";
      }
    }

    // Step 1c
    re = /^(.+?)y$/;
    if (re.test(w)) {
      const fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(s_v);
      if (re.test(stem)) w = stem + "i";
    }

    // Step 2
    re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
    if (re.test(w)) {
      const fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = new RegExp(mgr0);
      if (re.test(stem)) w = stem + step2list[suffix];
    }

    // Step 3
    re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
    if (re.test(w)) {
      const fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = new RegExp(mgr0);
      if (re.test(stem)) w = stem + step3list[suffix];
    }

    // Step 4
    re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
    re2 = /^(.+?)(s|t)(ion)$/;
    if (re.test(w)) {
      const fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(mgr1);
      if (re.test(stem)) w = stem;
    } else if (re2.test(w)) {
      const fp = re2.exec(w);
      stem = fp[1] + fp[2];
      re2 = new RegExp(mgr1);
      if (re2.test(stem)) w = stem;
    }

    // Step 5
    re = /^(.+?)e$/;
    if (re.test(w)) {
      const fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(mgr1);
      re2 = new RegExp(meq1);
      re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
      if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) w = stem;
    }

    re = /ll$/;
    re2 = new RegExp(mgr1);
    if (re.test(w) && re2.test(w)) {
      re = /.$/;
      w = w.replace(re, "");
    }

    if (firstch === "y") w = "y" + w.substr(1);
    return w;
  };
})();

/**
 * Clean text function identical to Python clean_text() in similarity.py:
 * 1. Convert to lowercase
 * 2. Remove HTML tags
 * 3. Remove non-alphabetic chars except spaces
 * 4. Tokenization (split by whitespace)
 * 5. Remove stopwords and tokens with len <= 1
 * 6. Lemmatization / Stemming
 * 7. Rejoin into space-separated string
 */
function cleanText(text) {
  if (!text || typeof text !== 'string') return "";
  
  // 1. Lowercase
  let cleaned = text.toLowerCase();
  
  // 2. Remove HTML tags
  cleaned = cleaned.replace(/<.*?>/g, " ");
  
  // 3. Remove non-alphabetic characters (except spaces)
  cleaned = cleaned.replace(/[^a-z\s]/g, " ");
  
  // 4. Tokenize
  const tokens = cleaned.split(/\s+/).filter(t => t.length > 1);
  
  // 5. Remove stopwords and stem
  const processedTokens = [];
  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    if (!STOP_WORDS.has(word)) {
      processedTokens.push(stemmer(word));
    }
  }
  
  return processedTokens.join(" ");
}

/**
 * TfidfVectorizer matching scikit-learn's standard formula:
 * idf(t) = ln((1 + n) / (1 + df(t))) + 1  (smooth_idf=True)
 * tf-idf = tf * idf
 * L2 normalization across each document vector
 */
class TfidfVectorizer {
  constructor() {
    this.vocabulary = new Map(); // term -> index
    this.idf = [];
    this.nDocs = 0;
  }

  fitTransform(docs) {
    this.nDocs = docs.length;
    this.vocabulary.clear();
    const docTermFreqs = [];
    const docFrequencies = new Map();

    // 1. Build term counts and doc frequencies
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const tokens = doc.split(/\s+/).filter(t => t.length > 0);
      const tfMap = new Map();
      const seenInDoc = new Set();

      for (let j = 0; j < tokens.length; j++) {
        const term = tokens[j];
        tfMap.set(term, (tfMap.get(term) || 0) + 1);

        if (!seenInDoc.has(term)) {
          seenInDoc.add(term);
          docFrequencies.set(term, (docFrequencies.get(term) || 0) + 1);
        }

        if (!this.vocabulary.has(term)) {
          this.vocabulary.set(term, this.vocabulary.size);
        }
      }
      docTermFreqs.push(tfMap);
    }

    const vocabSize = this.vocabulary.size;
    this.idf = new Float64Array(vocabSize);

    // 2. Compute smooth IDF
    for (const [term, idx] of this.vocabulary.entries()) {
      const df = docFrequencies.get(term) || 0;
      // Scikit-learn formula: ln((1 + n) / (1 + df)) + 1
      this.idf[idx] = Math.log((1 + this.nDocs) / (1 + df)) + 1.0;
    }

    // 3. Compute TF-IDF matrix with L2 normalization
    const tfidfMatrix = [];
    for (let i = 0; i < this.nDocs; i++) {
      const tfMap = docTermFreqs[i];
      const vec = new Float64Array(vocabSize);
      let normSq = 0;

      for (const [term, tf] of tfMap.entries()) {
        const idx = this.vocabulary.get(term);
        const val = tf * this.idf[idx];
        vec[idx] = val;
        normSq += val * val;
      }

      // L2 Normalize
      const norm = Math.sqrt(normSq);
      if (norm > 0) {
        for (let k = 0; k < vocabSize; k++) {
          if (vec[k] !== 0) {
            vec[k] /= norm;
          }
        }
      }
      tfidfMatrix.push(vec);
    }

    return tfidfMatrix;
  }
}

/**
 * Compute cosine similarity matrix between all document vectors
 * dot product of L2 normalized vectors equals cosine similarity
 */
function computeCosineSimilarity(tfidfMatrix) {
  const n = tfidfMatrix.length;
  const simMatrix = Array.from({ length: n }, () => new Float64Array(n));

  for (let i = 0; i < n; i++) {
    simMatrix[i][i] = 1.0;
    for (let j = i + 1; j < n; j++) {
      let dot = 0;
      const v1 = tfidfMatrix[i];
      const v2 = tfidfMatrix[j];
      const len = v1.length;
      for (let k = 0; k < len; k++) {
        dot += v1[k] * v2[k];
      }
      simMatrix[i][j] = dot;
      simMatrix[j][i] = dot;
    }
  }

  return simMatrix;
}

/**
 * Match similarity.py check_similarity_scores() logic:
 * Finds plagiarism pairs above threshold, groups within-source and between-source similarities,
 * categories, and date counts.
 */
function checkSimilarityScores(threshold, simMatrix, articles) {
  const n = articles.length;
  const withinSourcePairs = {};
  const betweenSourcePairs = {};
  const categoryPairs = {};
  const source1Categories = {};
  const source2Categories = {};
  const source1DateCount = {};
  const source2DateCount = {};

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const score = simMatrix[i][j];
      if (score > threshold) {
        const art1 = articles[i];
        const art2 = articles[j];

        if (art1.Source === art2.Source) {
          // Within source similarity
          const src = art1.Source;
          if (!withinSourcePairs[src]) withinSourcePairs[src] = [];
          withinSourcePairs[src].push({ i, j, score });
        } else {
          // Between source similarity
          const pairKey = `${art1.Source}__${art2.Source}`;
          const reverseKey = `${art2.Source}__${art1.Source}`;
          const key = betweenSourcePairs[pairKey] ? pairKey : (betweenSourcePairs[reverseKey] ? reverseKey : pairKey);

          if (!betweenSourcePairs[key]) betweenSourcePairs[key] = [];
          betweenSourcePairs[key].push({ i, j, score });

          // Category counts
          const cat1 = art1.Category || "Uncategorized";
          const cat2 = art2.Category || "Uncategorized";
          source1Categories[cat1] = (source1Categories[cat1] || 0) + 1;
          source2Categories[cat2] = (source2Categories[cat2] || 0) + 1;

          const catKey = `${cat1}__${cat2}`;
          categoryPairs[catKey] = (categoryPairs[catKey] || 0) + 1;

          // Date counts
          const date1 = art1["Date Posted"] || "Unknown";
          const date2 = art2["Date Posted"] || "Unknown";
          source1DateCount[date1] = (source1DateCount[date1] || 0) + 1;
          source2DateCount[date2] = (source2DateCount[date2] || 0) + 1;
        }
      }
    }
  }

  return {
    withinSourcePairs,
    betweenSourcePairs,
    categoryPairs,
    source1Categories,
    source2Categories,
    source1DateCount,
    source2DateCount
  };
}

/**
 * Fast direct similarity comparison between two single texts
 */
function compareTwoTexts(text1, text2) {
  const clean1 = cleanText(text1);
  const clean2 = cleanText(text2);
  if (!clean1 || !clean2) return 0;

  const vectorizer = new TfidfVectorizer();
  const matrix = vectorizer.fitTransform([clean1, clean2]);
  const sim = computeCosineSimilarity(matrix);
  return sim[0][1];
}

// Export functions to window or global
const globalRoot = typeof window !== 'undefined' ? window : global;
globalRoot.NLP = {
  cleanText,
  TfidfVectorizer,
  computeCosineSimilarity,
  checkSimilarityScores,
  compareTwoTexts,
  stemmer,
  STOP_WORDS
};
