# Ghana News Plagiarism Checker

An automated plagiarism detection and media integrity analysis application for Ghanaian digital journalism. This web application compares articles across five of Ghana's leading news websites (**Ghanaweb, 3News, MyJoyOnline, Modern Ghana, and Yen Ghana**), calculates content duplication proportions using Natural Language Processing (NLP), and presents clean, interactive visual reports.

Converted from a server-dependent Streamlit app into a **streamlined web application** ready for free deployment on **GitHub Pages**, with both live scraping and fast dataset analysis modes.

---

## Key Capabilities

- **Functional Live Web Scraping**:
  - **Local Python Scrapers**: Directly invokes the Python scrapers (`scraper.py`) via `python server.py` at `/api/scrape`.
  - **Client-Side Proxy Scraper**: Fetches and parses live news pages directly in the browser when deployed statically to GitHub Pages.
  - **Live Terminal Console**: Real-time log showing article fetching, dates, and scraping progress.
- **Minimalist & Clean Interface**: Zero visual clutter, distraction-free typography, and zero emojis in headers and controls.
- **Segmented Results View**:
  - **Detected Pairs Table**: Sorted similarity scores, article titles, dates, categories, and direct links to original publications.
  - **Side-by-Side Sentence Highlighter**: Inspect matching sentences and overlapping passages in an interactive diff viewer.
  - **Visual Analytics**: Cohesive, calm Chart.js charts for duplication rates, category distribution, and publication date timelines.
  - **Internal Duplication Audit**: Detects repeated stories published under different URLs within the same news organization.
- **Direct Text Comparison**: Paste any two passages or articles for instant TF-IDF similarity calculation.
- **Redesigned Results Dashboard**:
  - **Dynamic Status Hero & KPI Stats**: Real-time summary showing scanned article counts, suspect pair counts, peak similarity score, and detection thresholds.
  - **Interactive Comparative Cards & Table Modes**: Toggle between comparative card previews with excerpts and high-density tables.
  - **Severity & Keyword Filtering**: Filter flagged articles by headline keywords and risk levels (Critical &ge;85%, Moderate 70-84%).
  - **Reassuring Zero-State with Closest Matches**: Clear editorial integrity card with one-click sensitivity threshold adjuster and top near-matches previews.
  - **CSV Report Export**: Download full detection reports for compliance and archiving.
- **Client-Side NLP Engine**:
  - Text cleaning (HTML removal, punctuation stripping, lowercasing).
  - 179-word NLTK English stopword filtering.
  - Morphological Porter Stemming.
  - TF-IDF Vectorization matching `scikit-learn`'s smoothed formulation.
  - Cosine Similarity matrix calculation.

---

## Running the Application

### Option 1: Run with Full Live Python Scraper Server
To run the web app with the native Python scrapers from `scraper.py` fully active:
```bash
python server.py
```
Open [http://localhost:8000](http://localhost:8000) in your browser. Selecting **Live Web Scraper** and clicking **Scrape & Analyze** will invoke the scrapers in `scraper.py` and stream results live!

### Option 2: Deploy to GitHub Pages (Static Webpage)
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Redesign UI and activate functional scraping"
   git push origin main
   ```
2. In GitHub, go to **Settings** ➔ **Pages** ➔ set **Source** to **GitHub Actions** (or **Deploy from a branch** ➔ `main` / `root`).
3. Your site will be live at `https://<your-username>.github.io/<your-repo-name>/`. When running on GitHub Pages, the app automatically uses the client-side proxy scraper for live feeds or the curated archive dataset!

See [DEPLOYMENT.md](DEPLOYMENT.md) for full details.

---

## 🛠️ Local Development & Testing

Run the local server with the Python scraping API:
```bash
python server.py
```
Then visit [http://localhost:8000](http://localhost:8000) in your browser. (Do not use `python -m http.server`, as it does not support `POST /api/scrape` API requests).

---

## 📁 Project Structure

```
├── index.html                       # Main web application interface
├── css/
│   └── style.css                    # Custom styles, responsive layout, diff highlighting
├── js/
│   ├── app.js                       # Controller, dataset filtering & state management
│   ├── nlp.js                       # TF-IDF, stopwords, stemmer & cosine similarity engine
│   ├── charts.js                    # Chart.js donut and bar chart visualizations
│   └── diff.js                      # Sentence-level text comparison and highlighter
├── data/
│   └── articles.json                # Pre-packaged Ghanaian news dataset (50+ articles)
├── scripts/
│   ├── generate_sample_data.py      # Dataset generation script
│   └── scrape_to_json.py            # Python scraper to export fresh news to articles.json
├── .github/
│   └── workflows/
│       ├── deploy.yml               # Automated GitHub Pages CI/CD workflow
│       └── scrape-and-update.yml    # Scheduled scraper workflow
├── DEPLOYMENT.md                    # Detailed GitHub Pages deployment guide
├── requirements.txt                 # Python dependencies (for optional scraper)
├── scraper.py                       # Original Python web scraper
├── similarity.py                    # Original Python similarity module
└── streamlit_app.py                 # Original Streamlit application (preserved for reference)
```

---

## 📜 Methodology

1. **Text Preprocessing**: Lowercasing, HTML tag stripping, non-alphabetic filtering, tokenization, stop word elimination, and morphological stemming.
2. **TF-IDF Vectorization**: Term Frequency - Inverse Document Frequency vector computation with L2 normalization across all candidate articles:
   $$\text{IDF}(t) = \ln\left(\frac{1 + N}{1 + \text{DF}(t)}\right) + 1$$
3. **Cosine Similarity**: Vector dot products determining pairwise similarity percentages between 0.0 and 1.0:
   $$\text{Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|}$$
4. **Attribution & Plagiarism Mapping**: Pairs exceeding the user-specified threshold (default 70%) are flagged, visualized, and summarized.
