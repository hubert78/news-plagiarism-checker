/**
 * Client-Side Web Scraper Engine for Ghanaian News Portals
 * Replicates the BeautifulSoup logic in scraper.py using browser DOMParser and CORS proxies.
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
      const upperDiv = doc.querySelector('div.upper');
      
      if (upperDiv) {
        const links = Array.from(upperDiv.querySelectorAll('a')).slice(0, 5);
        for (const a of links) {
          const title = (a.getAttribute('title') || a.textContent || '').trim();
          let href = a.getAttribute('href');
          if (!href || !title) continue;
          if (!href.startsWith('http')) {
            href = new URL(href, 'https://www.ghanaweb.com').href;
          }

          onProgress(`Ghanaweb: Fetching article "${title.slice(0, 40)}..."`);
          try {
            const artHtml = await fetchWithProxy(href);
            const artDoc = new DOMParser().parseFromString(artHtml, 'text/html');
            const contentEl = artDoc.querySelector('p#article-123') || artDoc.querySelector('div#medsection2');
            const content = contentEl ? contentEl.textContent.trim() : '';

            if (content.length > 80) {
              articles.push({
                Source: 'Ghanaweb',
                Category: category,
                'Date Posted': isoDate,
                Title: title,
                URL: href,
                Content: content
              });
            }
          } catch (err) {
            // continue
          }
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
      const archiveDiv = doc.querySelector('div.news-archive2') || doc.querySelector('div.row.news-archive2');
      
      if (archiveDiv) {
        const links = Array.from(archiveDiv.querySelectorAll('a')).slice(0, 5);
        for (const a of links) {
          const title = a.textContent.trim();
          let href = a.getAttribute('href');
          if (!href || !title) continue;
          if (!href.startsWith('http')) {
            href = new URL(href, 'https://www.modernghana.com').href;
          }

          onProgress(`Modern Ghana: Fetching article "${title.slice(0, 40)}..."`);
          try {
            const artHtml = await fetchWithProxy(href);
            const artDoc = new DOMParser().parseFromString(artHtml, 'text/html');
            const contentEl = artDoc.querySelector('div#article-123') || artDoc.querySelector('div.article-content');
            const content = contentEl ? contentEl.textContent.trim() : '';

            if (content.length > 80) {
              articles.push({
                Source: 'Modern Ghana',
                Category: 'general',
                'Date Posted': isoDate,
                Title: title,
                URL: href,
                Content: content
              });
            }
          } catch (err) {
            // continue
          }
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
    const h3s = Array.from(doc.querySelectorAll('h3.entry-title a, article h3 a')).slice(0, 6);

    for (const a of h3s) {
      const title = a.textContent.trim();
      const href = a.getAttribute('href');
      if (!href || !title) continue;

      onProgress(`3News: Fetching article "${title.slice(0, 40)}..."`);
      try {
        const artHtml = await fetchWithProxy(href);
        const artDoc = new DOMParser().parseFromString(artHtml, 'text/html');
        const contentEl = artDoc.querySelector('div.td-post-content') || artDoc.querySelector('div.entry-content');
        const content = contentEl ? contentEl.textContent.trim() : '';

        const timeEl = artDoc.querySelector('time.entry-date');
        const datePosted = timeEl ? timeEl.getAttribute('datetime')?.split('T')[0] : startDate;

        if (content.length > 80) {
          articles.push({
            Source: '3News',
            Category: category,
            'Date Posted': datePosted || startDate,
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
    const links = Array.from(doc.querySelectorAll('div.home-section-story-list a, div.story-list a')).slice(0, 6);

    for (const a of links) {
      const h4 = a.querySelector('h4') || a.querySelector('h3');
      const title = h4 ? h4.textContent.trim() : a.textContent.trim();
      const href = a.getAttribute('href');
      if (!href || !title || title.length < 10) continue;

      onProgress(`MyJoyOnline: Fetching article "${title.slice(0, 40)}..."`);
      try {
        const artHtml = await fetchWithProxy(href);
        const artDoc = new DOMParser().parseFromString(artHtml, 'text/html');
        const contentEl = artDoc.querySelector('div#article-text') || artDoc.querySelector('div.article-content');
        const content = contentEl ? contentEl.textContent.trim() : '';

        if (content.length > 80) {
          articles.push({
            Source: 'MyJoyOnline',
            Category: category,
            'Date Posted': startDate,
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
