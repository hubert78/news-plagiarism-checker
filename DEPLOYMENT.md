# Deployment Guide: GitHub Pages

This project has been converted from a server-based Streamlit application into a modern, static web application that can be deployed for free on **GitHub Pages** with zero backend infrastructure required.

---

## 🚀 How to Deploy to GitHub Pages (2 Minutes)

### Step 1: Initialize Git and Push to GitHub
If you haven't already committed and pushed your repository to GitHub:

```bash
# 1. Initialize git (if not already initialized)
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Convert Streamlit app to GitHub Pages static web app"

# 4. Set your main branch
git branch -M main

# 5. Link to your GitHub repository
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 6. Push to GitHub
git push -u origin main
```

---

### Step 2: Enable GitHub Pages

You can enable GitHub Pages in either of two ways:

#### Option A: GitHub Actions (Recommended)
1. Go to your repository on GitHub.
2. Click **Settings** (top tab) ➔ **Pages** (in the left sidebar).
3. Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.
4. That's it! The included `.github/workflows/deploy.yml` workflow will automatically build and publish your site at:
   `https://<your-username>.github.io/<your-repo-name>/`

#### Option B: Deploy Directly from Branch
1. Go to your repository on GitHub.
2. Click **Settings** ➔ **Pages**.
3. Under **Build and deployment** ➔ **Source**, select **Deploy from a branch**.
4. Under **Branch**, select `main` (or `master`) and folder `/(root)`.
5. Click **Save**.
6. Within 1-2 minutes, your website will be live!

---

## 💻 Local Testing & Scraping Server

### Option A: Run with Full Live Python Scraper Server (Recommended)
This runs the lightweight server that bridges the web frontend directly to your Python scrapers in `scraper.py`:
```bash
python server.py
```
Open [http://localhost:8000](http://localhost:8000) in your browser.
- In **Live Web Scraper** mode, clicking **Scrape & Analyze** triggers `scraper.py` directly, streams live progress in the terminal console, and merges newly scraped articles.
- In **Archived Dataset** mode, it runs instant calculations against the cached dataset.

### Option B: Quick Static Server
```bash
python -m http.server 8000
```
or
```bash
npx serve .
```

---

## ⚙️ Architecture: How It Works Without a Python Server

1. **Client-Side NLP Pipeline (`js/nlp.js`)**:
   - Implements text cleaning (HTML tag removal, non-alphabetic filtering, lowercasing).
   - NLTK 179 English stopwords removal.
   - Porter Stemming algorithm for morphological root normalization.
   - Term Frequency - Inverse Document Frequency (TF-IDF) vectorizer with L2 normalization matching `scikit-learn`.
   - Cosine Similarity matrix calculation computed directly in the user's browser in milliseconds.

2. **Interactive Visualizations (`js/charts.js`)**:
   - Donut charts for proportion of plagiarized articles per source.
   - Bar charts for most plagiarized editorial categories.
   - Horizontal bar charts for date trends.
   - Within-source duplicate URL & similar content charts.

3. **Side-by-Side Diff Inspector (`js/diff.js`)**:
   - Highlights matching and plagiarized sentences side-by-side in real-time.

4. **Automated News Scraper (`.github/workflows/scrape-and-update.yml`)**:
   - GitHub Actions runs `scripts/scrape_to_json.py` on a schedule (or on demand) with full server internet access to scrape Ghanaian news portals and keep `data/articles.json` up-to-date without needing an AWS EC2 instance.
