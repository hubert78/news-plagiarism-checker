/**
 * Client-Side Web Scraper Engine for Ghanaian News Portals
 * Matches the updated cascading extraction logic in scraper.py using browser DOMParser and CORS proxies.
 */

const CORS_PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

async function fetchWithProxy(targetUrl) {
  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxied = proxyFn(targetUrl);
      const res = await fetch(proxied, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      // try next proxy
    }
  }
  throw new Error(`Failed to fetch ${targetUrl} via CORS proxies.`);
}

/**
 * Robust cascading article body extractor
 */
function extractArticleContent(doc) {
  if (!doc) return "";

  // Remove scripts, styles, ads
  doc.querySelectorAll('script, style, nav, footer, aside, noscript, svg, form, .advert, .inline-ad, .share, .comment, .widget').forEach(el => el.remove());

  const selectors = [
    'p#article-123',
    'div#article-123',
    'div#article-text',
    'div.entry-content',
    'div.article-content',
    'div.td-post-content',
    'div.post__content',
    'div.article-text',
    'div.story-content',
    'div.article-details',
    'div#medsection2',
    'article'
  ];

  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    if (el) {
      const paras = Array.from(el.querySelectorAll('p'))
        .map(p => p.textContent.trim())
        .filter(t => t.length > 20);
      const text = paras.join(" ");
      if (text.length > 80) return text;
    }
  }

  // Fallback: collect all paragraphs in doc
  const allParas = Array.from(doc.querySelectorAll('p'))
    .map(p => p.textContent.trim())
    .filter(t => t.length > 25);
  const fallback = allParas.join(" ");
  return fallback.length > 80 ? fallback : "";
}

function extractArticleDate(doc, fallbackDate) {
  if (!doc) return fallbackDate;

  // 1. Meta published time
  const meta = doc.querySelector('meta[property*="published_time"], meta[property*="pubdate"], meta[name*="date"]');
  if (meta && meta.getAttribute('content')) {
    const val = meta.getAttribute('content').split('T')[0];
    if (val && val.length === 10) return val;
  }

  // 2. Time tag
  const timeEl = doc.querySelector('time');
  if (timeEl) {
    const dt = timeEl.getAttribute('datetime') || timeEl.getAttribute('content');
    if (dt) {
      const val = dt.split('T')[0];
      if (val && val.length === 10) return val;
    }
  }

  return fallbackDate;
}

/**
 * Scrape Ghanaweb
 */
async function scrapeGhanaweb(category, startDate, endDate, onProgress) {
  const articles = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let cur = new Date(start);

  while (cur >= end && articles.length < 15) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${y}${m}${d}`;
    const isoDate = `${y}-${m}-${d}`;

    const archiveUrl = `https://www.ghanaweb.com/GhanaHomePage/${category}/browse.archive.php?date=${dateStr}`;
    onProgress(`Ghanaweb: Checking archive for ${isoDate} [${category}]...`);

    try {
      const html = await fetchWithProxy(archiveUrl);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const container = doc.querySelector('div.upper') || doc.querySelector('div.article-list') || doc;
      const links = Array.from(container.querySelectorAll('a[href*="artikel.php"], a[href*="/NewsArchive/"], a[href*="/business/"]')).slice(0, 5);

      for (const a of links) {
        const title = (a.getAttribute('title') || a.textContent || '').trim();
        let href = a.getAttribute('href');
        if (!href || !title || title.length < 10) continue;
        if (!href.startsWith('http')) {
          href = new URL(href, 'https://www.ghanaweb.com').href;
        }

        onProgress(`Ghanaweb: Fetching "${title.slice(0, 40)}..."`);
        try {
          const artHtml = await fetchWithProxy(href);
          const artDoc = new DOMParser().parseFromString(artHtml, 'text/html');
          const content = extractArticleContent(artDoc);
          const datePosted = extractArticleDate(artDoc, isoDate);

          if (content) {
            articles.push({
              Source: 'Ghanaweb',
              Category: category,
              'Date Posted': datePosted,
              Title: title,
              URL: href,
              Content: content
            });
          }
        } catch (err) {
          // continue
        }
      }
    } catch (err) {
      console.warn(`Could not scrape Ghanaweb on ${isoDate}:`, err);
    }

    cur.setDate(cur.getDate() - 1);
  }

  return articles;
}

/**
 * Scrape Modern Ghana
 */
async function scrapeModernGhana(startDate, endDate, onProgress) {
  const articles = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let cur = new Date(start);

  while (cur >= end && articles.length < 15) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${y}${m}${d}`;
    const isoDate = `${y}-${m}-${d}`;

    const archiveUrl = `https://www.modernghana.com/archive/${dateStr}/`;
    onProgress(`Modern Ghana: Checking archive for ${isoDate}...`);

    try {
      const html = await fetchWithProxy(archiveUrl);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const container = doc.querySelector('div.news-archive2') || doc.querySelector('div.col-left') || doc;
      const links = Array.from(container.querySelectorAll('a[href*="/news/"], a[href*="/sports/"]')).slice(0, 5);

      for (const a of links) {
        const title = a.textContent.trim();
        let href = a.getAttribute('href');
        if (!href || !title || title.length < 10) continue;
        if (!href.startsWith('http')) {
          href = new URL(href, 'https://www.modernghana.com').href;
        }

        onProgress(`Modern Ghana: Fetching "${title.slice(0, 40)}..."`);
        try {
          const artHtml = await fetchWithProxy(href);
          const artDoc = new DOMParser().parseFromString(artHtml, 'text/html');
          const content = extractArticleContent(artDoc);
          const datePosted = extractArticleDate(artDoc, isoDate);

          if (content) {
            articles.push({
              Source: 'Modern Ghana',
              Category: 'general',
              'Date Posted': datePosted,
              Title: title,
              URL: href,
              Content: content
            });
          }
        } catch (err) {
          // continue
        }
      }
    } catch (err) {
      console.warn(`Could not scrape Modern Ghana on ${isoDate}:`, err);
    }

    cur.setDate(cur.getDate() - 1);
  }

  return articles;
}

/**
 * Scrape 3News
 */
async function scrape3News(category, startDate, endDate, onProgress) {
  const articles = [];
  const url = `https://3news.com/${category}/`;
  onProgress(`3News: Fetching feed for ${category}...`);

  try {
    const html = await fetchWithProxy(url);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const links = Array.from(doc.querySelectorAll('h2.entry-title a, h3.entry-title a, article h3 a, .td-module-title a')).slice(0, 6);

    for (const a of links) {
      const title = a.textContent.trim();
      const href = a.getAttribute('href');
      if (!href || !title || title.length < 10) continue;

      onProgress(`3News: Fetching "${title.slice(0, 40)}..."`);
      try {
        const artHtml = await fetchWithProxy(href);
        const artDoc = new DOMParser().parseFromString(artHtml, 'text/html');
        const content = extractArticleContent(artDoc);
        const datePosted = extractArticleDate(artDoc, startDate);

        if (content) {
          articles.push({
            Source: '3News',
            Category: category,
            'Date Posted': datePosted,
            Title: title,
            URL: href,
            Content: content
          });
        }
      } catch (err) {
        // continue
      }
    }
  } catch (err) {
    console.warn(`Could not scrape 3News:`, err);
  }

  return articles;
}

/**
 * Scrape MyJoyOnline
 */
async function scrapeMyJoyOnline(category, startDate, endDate, onProgress) {
  const articles = [];
  const url = `https://www.myjoyonline.com/${category}/`;
  onProgress(`MyJoyOnline: Fetching feed for ${category}...`);

  try {
    const html = await fetchWithProxy(url);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const links = Array.from(doc.querySelectorAll('div.home-section-story-list a, div.story-list a, article.post a, h4 a, h3 a')).slice(0, 6);

    for (const a of links) {
      const title = (a.querySelector('h4, h3') || a).textContent.trim();
      const href = a.getAttribute('href');
      if (!href || !title || title.length < 10) continue;

      onProgress(`MyJoyOnline: Fetching "${title.slice(0, 40)}..."`);
      try {
        const artHtml = await fetchWithProxy(href);
        const artDoc = new DOMParser().parseFromString(artHtml, 'text/html');
        const content = extractArticleContent(artDoc);
        const datePosted = extractArticleDate(artDoc, startDate);

        if (content) {
          articles.push({
            Source: 'MyJoyOnline',
            Category: category,
            'Date Posted': datePosted,
            Title: title,
            URL: href,
            Content: content
          });
        }
      } catch (err) {
        // continue
      }
    }
  } catch (err) {
    console.warn(`Could not scrape MyJoyOnline:`, err);
  }

  return articles;
}

/**
 * Scrape Yen Ghana
 */
async function scrapeYenGhana(category, startDate, endDate, onProgress) {
  const articles = [];
  const url = `https://yen.com.gh/${category.toLowerCase()}/`;
  onProgress(`Yen Ghana: Fetching feed for ${category}...`);

  try {
    const html = await fetchWithProxy(url);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const cards = Array.from(doc.querySelectorAll('article a, div.article-card a')).slice(0, 6);

    for (const a of cards) {
      const title = (a.getAttribute('title') || a.textContent || '').trim();
      let href = a.getAttribute('href');
      if (!href || !title || title.length < 10) continue;
      if (!href.startsWith('http')) {
        href = new URL(href, 'https://yen.com.gh').href;
      }

      onProgress(`Yen Ghana: Fetching "${title.slice(0, 40)}..."`);
      try {
        const artHtml = await fetchWithProxy(href);
        const artDoc = new DOMParser().parseFromString(artHtml, 'text/html');
        const content = extractArticleContent(artDoc);
        const datePosted = extractArticleDate(artDoc, startDate);

        if (content) {
          articles.push({
            Source: 'Yen Ghana',
            Category: category,
            'Date Posted': datePosted,
            Title: title,
            URL: href,
            Content: content
          });
        }
      } catch (err) {
        // continue
      }
    }
  } catch (err) {
    console.warn(`Could not scrape Yen Ghana:`, err);
  }

  return articles;
}

/**
 * Unified Scraper Dispatcher
 */
async function scrapeSourceClientSide(source, categories, startDate, endDate, onProgress) {
  onProgress(`Starting live scrape for ${source}...`);
  let results = [];

  try {
    if (source === 'Ghanaweb') {
      const cats = categories.length ? categories : ['NewsArchive', 'business'];
      for (const cat of cats) {
        const arts = await scrapeGhanaweb(cat, startDate, endDate, onProgress);
        results = results.concat(arts);
      }
    } else if (source === 'Modern Ghana') {
      results = await scrapeModernGhana(startDate, endDate, onProgress);
    } else if (source === '3News') {
      const cats = categories.length ? categories : ['news', 'business'];
      for (const cat of cats) {
        const arts = await scrape3News(cat, startDate, endDate, onProgress);
        results = results.concat(arts);
      }
    } else if (source === 'MyJoyOnline') {
      const cats = categories.length ? categories : ['news', 'business'];
      for (const cat of cats) {
        const arts = await scrapeMyJoyOnline(cat, startDate, endDate, onProgress);
        results = results.concat(arts);
      }
    } else if (source === 'Yen Ghana') {
      const cats = categories.length ? categories : ['Ghana'];
      for (const cat of cats) {
        const arts = await scrapeYenGhana(cat, startDate, endDate, onProgress);
        results = results.concat(arts);
      }
    }
  } catch (err) {
    console.warn(`Scraper error for ${source}:`, err);
  }

  onProgress(`Completed scrape for ${source}. Retrieved ${results.length} articles.`);
  return results;
}

const globalRootScraper = typeof window !== 'undefined' ? window : global;
globalRootScraper.NewsScraper = {
  scrapeSourceClientSide
};
