import os
import re
import random
from urllib.parse import urljoin
from datetime import datetime, timedelta
import pandas as pd
import requests
from bs4 import BeautifulSoup

def get_user_agent():
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    ]
    return {
        'User-Agent': random.choice(user_agents),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    }

def check_duplicates(df):
    if df is None or df.empty:
        return df, 0
    initial_df_total = df.shape[0]
    duplicates = df.duplicated(subset=['URL']).sum()
    df = df.drop_duplicates(subset=['URL']).reset_index(drop=True)
    cleaned_df_total = df.shape[0]
    print(f"{initial_df_total} articles retrieved. {duplicates} duplicate(s) removed. {cleaned_df_total} remaining.")
    return df, duplicates

def extract_article_content(soup):
    """
    Robust cascading content extractor. Handles modern HTML across Ghanaian portals.
    """
    if not soup:
        return ""

    # Clean out scripts, styles, forms, ads, and widgets
    for tag in soup(["script", "style", "nav", "footer", "aside", "noscript", "svg", "form"]):
        tag.decompose()

    for ad in soup.find_all(class_=re.compile(r'(advert|inline-ad|share|comment|social|widget|tags|author-box)', re.I)):
        ad.decompose()

    # Prioritized content selectors
    content_selectors = [
        ('p', {'id': 'article-123'}),
        ('div', {'id': 'article-123'}),
        ('div', {'id': 'article-text'}),
        ('div', {'class': 'entry-content'}),
        ('div', {'class': 'article-content'}),
        ('div', {'class': 'td-post-content'}),
        ('div', {'class': 'post__content'}),
        ('div', {'class': 'article-text'}),
        ('div', {'class': 'story-content'}),
        ('div', {'class': 'article-details'}),
        ('div', {'id': 'medsection2'}),
        ('article', {})
    ]

    for tag_name, attrs in content_selectors:
        container = soup.find(tag_name, attrs)
        if container:
            paras = container.find_all('p')
            body_parts = [p.get_text(strip=True) for p in paras if len(p.get_text(strip=True)) > 20]
            body_text = " ".join(body_parts)
            if len(body_text) > 80:
                return body_text

    # Heuristic fallback: join all meaningful paragraphs in the document
    all_paras = soup.find_all('p')
    fallback_text = " ".join([p.get_text(strip=True) for p in all_paras if len(p.get_text(strip=True)) > 25])
    return fallback_text if len(fallback_text) > 80 else ""

def extract_article_date(soup, fallback_date):
    """
    Extracts published date from meta tags or time elements with fallback.
    """
    if not soup:
        return fallback_date

    # 1. Meta tag
    meta = soup.find('meta', property=re.compile(r'(published_time|pubdate)', re.I)) or soup.find('meta', attrs={'name': re.compile(r'date', re.I)})
    if meta and meta.get('content'):
        val = meta['content'].strip()
        try:
            return datetime.fromisoformat(val.replace('Z', '+00:00')).date()
        except:
            pass

    # 2. Time tag
    time_tag = soup.find('time')
    if time_tag:
        dt_val = time_tag.get('datetime') or time_tag.get('content')
        if dt_val:
            try:
                return datetime.fromisoformat(dt_val.replace('Z', '+00:00')).date()
            except:
                pass
        text_val = time_tag.get_text(strip=True)
        for fmt in ('%d %B %Y', '%B %d, %Y', '%Y-%m-%d', '%d/%m/%Y'):
            try:
                return datetime.strptime(text_val[:20].strip(), fmt).date()
            except:
                pass

    return fallback_date

# =========================================================================
# 1. Ghanaweb Scraper
# =========================================================================
def ghanaweb_scraper(category, end_date_str, start_date_str=None):
    data = []
    base_url = 'https://www.ghanaweb.com'
    end_date = datetime.strptime(end_date_str, '%Y%m%d').date()

    if start_date_str:
        start_date = datetime.strptime(start_date_str, '%Y%m%d').date()
    else:
        start_date = datetime.today().date()

    cur_date = start_date
    session = requests.Session()
    session.headers.update(get_user_agent())

    while cur_date >= end_date:
        date_posted = cur_date.strftime('%Y%m%d')
        archive_url = f'https://www.ghanaweb.com/GhanaHomePage/{category}/browse.archive.php?date={date_posted}'

        print(f"[Ghanaweb] Scraping {category} on {date_posted} ({archive_url})")

        try:
            res = session.get(archive_url, timeout=10)
        except Exception as e:
            print(f"[Ghanaweb] Connection error on {archive_url}: {e}")
            cur_date -= timedelta(days=1)
            continue

        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            # Look in div.upper or any archive link container
            archive_container = soup.find('div', class_='upper') or soup.find('div', class_='article-list') or soup
            links = archive_container.find_all('a', href=re.compile(r'artikel\.php|\/NewsArchive\/|\/business\/|\/entertainment\/'))

            seen_urls = set()
            for a in links:
                title = a.get('title') or a.get_text(strip=True)
                rel_url = a.get('href')

                if not rel_url or not title or len(title) < 10:
                    continue

                abs_url = urljoin(base_url, rel_url)
                if abs_url in seen_urls:
                    continue
                seen_urls.add(abs_url)

                try:
                    art_res = session.get(abs_url, timeout=8)
                    if art_res.status_code == 200:
                        art_soup = BeautifulSoup(art_res.text, 'html.parser')
                        content = extract_article_content(art_soup)
                        pub_date = extract_article_date(art_soup, cur_date)

                        if content:
                            data.append({
                                "Source": "Ghanaweb",
                                "Category": category,
                                "Date Posted": pub_date,
                                "Title": title,
                                "URL": abs_url,
                                "Content": content
                            })
                except Exception as err:
                    print(f"[Ghanaweb] Error fetching {abs_url}: {err}")

        cur_date -= timedelta(days=1)

    return pd.DataFrame(data) if data else pd.DataFrame(columns=["Source", "Category", "Date Posted", "Title", "URL", "Content"])

def ghanaweb_multi_scraper(source_data):
    scraped_df = pd.DataFrame(columns=["Source", "Category", "Date Posted", "Title", "URL", "Content"])
    start_date = source_data['start_date'].strftime('%Y%m%d')
    end_date = source_data['end_date'].strftime('%Y%m%d')

    for cat in source_data.get('categories', ['NewsArchive']):
        df = ghanaweb_scraper(cat, end_date, start_date)
        if df is not None and not df.empty:
            scraped_df = pd.concat([scraped_df, df], axis=0, ignore_index=True)

    return scraped_df

# =========================================================================
# 2. Modern Ghana Scraper
# =========================================================================
def modernghana_scraper(end_date_str, start_date_str=None):
    data = []
    base_url = 'https://www.modernghana.com'
    end_date = datetime.strptime(end_date_str, '%Y%m%d').date()

    if start_date_str:
        start_date = datetime.strptime(start_date_str, '%Y%m%d').date()
    else:
        start_date = datetime.today().date()

    cur_date = start_date
    session = requests.Session()
    session.headers.update(get_user_agent())

    while cur_date >= end_date:
        date_posted = cur_date.strftime('%Y%m%d')
        archive_url = f'https://www.modernghana.com/archive/{date_posted}/'

        print(f"[Modern Ghana] Scraping archive on {date_posted} ({archive_url})")

        try:
            res = session.get(archive_url, timeout=10)
        except Exception as e:
            print(f"[Modern Ghana] Connection error on {archive_url}: {e}")
            cur_date -= timedelta(days=1)
            continue

        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            # Look in archive container or news list
            container = soup.find('div', class_=re.compile(r'news-archive|archive', re.I)) or soup.find('div', class_='col-left') or soup
            links = container.find_all('a', href=re.compile(r'/news/|/sports/|/entertainment/'))

            seen_urls = set()
            for a in links:
                title = a.get_text(strip=True)
                rel_url = a.get('href')

                if not rel_url or not title or len(title) < 10:
                    continue

                abs_url = urljoin(base_url, rel_url)
                if abs_url in seen_urls:
                    continue
                seen_urls.add(abs_url)

                try:
                    art_res = session.get(abs_url, timeout=8)
                    if art_res.status_code == 200:
                        art_soup = BeautifulSoup(art_res.text, 'html.parser')
                        content = extract_article_content(art_soup)
                        pub_date = extract_article_date(art_soup, cur_date)

                        if content:
                            data.append({
                                "Source": "Modern Ghana",
                                "Category": "general",
                                "Date Posted": pub_date,
                                "Title": title,
                                "URL": abs_url,
                                "Content": content
                            })
                except Exception as err:
                    print(f"[Modern Ghana] Error fetching {abs_url}: {err}")

        cur_date -= timedelta(days=1)

    return pd.DataFrame(data) if data else pd.DataFrame(columns=["Source", "Category", "Date Posted", "Title", "URL", "Content"])

def modernghana_multi_scraper(source_data):
    start_date = source_data['start_date'].strftime('%Y%m%d')
    end_date = source_data['end_date'].strftime('%Y%m%d')
    return modernghana_scraper(end_date, start_date)

# =========================================================================
# 3. 3News Scraper
# =========================================================================
def news3_scraper(category, sub_category, end_date_str):
    data = []
    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    page_num = 1
    max_pages = 5
    stop_scraping = False
    session = requests.Session()
    session.headers.update(get_user_agent())

    while page_num <= max_pages and not stop_scraping:
        sub_path = f"/{sub_category}" if sub_category else ""
        if page_num == 1:
            url = f'https://3news.com/{category}{sub_path}/'
        else:
            url = f'https://3news.com/{category}{sub_path}/page/{page_num}/'
        print(f"[3News] Scraping {url}")

        try:
            res = session.get(url, timeout=10)
        except Exception as e:
            print(f"[3News] Error getting {url}: {e}")
            break

        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            # Robust: search for article tags or entry-title containers
            articles = soup.find_all('article')
            if not articles:
                articles = soup.find_all(['h2', 'h3'], class_=re.compile(r'entry-title|td-module-title', re.I))

            if not articles:
                print(f"[3News] No modules found on page {page_num}.")
                break

            for mod in articles:
                # Pre-check time tag on module card if available to avoid unnecessary fetch
                card_time = mod.find('time')
                if card_time:
                    dt_val = card_time.get('datetime') or card_time.get('content')
                    if dt_val:
                        try:
                            card_date = datetime.fromisoformat(dt_val.replace('Z', '+00:00')).date()
                            if card_date < end_date:
                                print(f"[3News] Article date {card_date} is older than end date {end_date}. Stopping.")
                                stop_scraping = True
                                break
                        except Exception:
                            pass

                h_tag = mod.find(['h1', 'h2', 'h3', 'h4'])
                a_tag = h_tag.find('a') if h_tag and h_tag.find('a') else None
                if not a_tag:
                    if mod.name == 'a':
                        a_tag = mod
                    else:
                        for cand in mod.find_all('a', href=True):
                            href = cand.get('href')
                            if href and href not in ('/news', '/news/', '#') and len(href) > 6:
                                a_tag = cand
                                break
                if not a_tag:
                    continue

                title = h_tag.get_text(strip=True) if h_tag else a_tag.get_text(strip=True)
                rel_url = a_tag.get('href')

                if not rel_url or not title or len(title) < 10:
                    continue

                art_url = urljoin('https://3news.com', rel_url)
                if art_url.rstrip('/').endswith(f'/{category}'):
                    continue

                try:
                    art_res = session.get(art_url, timeout=8)
                    if art_res.status_code == 200:
                        art_soup = BeautifulSoup(art_res.text, 'html.parser')
                        pub_date = extract_article_date(art_soup, datetime.today().date())

                        if pub_date < end_date:
                            print(f"[3News] Article date {pub_date} is older than end date {end_date}. Stopping.")
                            stop_scraping = True
                            break

                        content = extract_article_content(art_soup)
                        if content:
                            data.append({
                                "Source": "3News",
                                "Category": category,
                                "Date Posted": pub_date,
                                "Title": title,
                                "URL": art_url,
                                "Content": content
                            })
                except Exception as err:
                    print(f"[3News] Error fetching {art_url}: {err}")

            page_num += 1
        else:
            break

    return pd.DataFrame(data) if data else pd.DataFrame(columns=["Source", "Category", "Date Posted", "Title", "URL", "Content"])

def new3_multi_scraper(source_data):
    scraped_df = pd.DataFrame(columns=["Source", "Category", "Date Posted", "Title", "URL", "Content"])
    start_date = source_data['start_date']
    end_date = source_data['end_date'].strftime('%Y-%m-%d')

    categories = {
        'news': [''],
        'business': [''],
        'showbiz': [''],
        'sports': [''],
        'health': [''],
        'opinion': ['']
    }

    for cat in source_data.get('categories', ['news']):
        if cat in categories:
            for sub in categories[cat]:
                df = news3_scraper(cat, sub, end_date)
                if df is not None and not df.empty:
                    df['Date Posted'] = pd.to_datetime(df['Date Posted']).dt.date
                    scraped_df = pd.concat([scraped_df, df], axis=0, ignore_index=True)

    if not scraped_df.empty:
        scraped_df = scraped_df[scraped_df['Date Posted'] <= start_date]

    return scraped_df

# Alias for compatibility
new3_scraper = news3_scraper

# =========================================================================
# 4. MyJoyOnline Scraper
# =========================================================================
def joynews_scraper(category, sub_category, end_date_str):
    data = []
    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    page_num = 1
    max_pages = 5
    stop_scraping = False
    session = requests.Session()
    session.headers.update(get_user_agent())

    while page_num <= max_pages and not stop_scraping:
        sub_path = f"/{sub_category}" if sub_category else ""
        if page_num == 1:
            url = f'https://www.myjoyonline.com/{category}{sub_path}/'
        else:
            url = f'https://www.myjoyonline.com/{category}{sub_path}/page/{page_num}/'
        print(f"[MyJoyOnline] Scraping {url}")

        try:
            res = session.get(url, timeout=10)
        except Exception as e:
            print(f"[MyJoyOnline] Error getting {url}: {e}")
            break

        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            seen_urls = set()

            candidates = []
            for a in soup.find_all('a', href=True):
                href = a.get('href')
                title = a.get_text(strip=True)
                if not href.startswith('http'):
                    href = urljoin('https://www.myjoyonline.com', href)
                if href in seen_urls:
                    continue
                if not href.startswith('https://www.myjoyonline.com/'):
                    continue
                path = href.replace('https://www.myjoyonline.com', '').strip('/')
                if '/' in path or not path or len(title) < 15:
                    continue
                seen_urls.add(href)
                candidates.append((href, title))

            if not candidates:
                break

            for art_url, title in candidates:
                try:
                    art_res = session.get(art_url, timeout=8)
                    if art_res.status_code == 200:
                        art_soup = BeautifulSoup(art_res.text, 'html.parser')
                        pub_date = extract_article_date(art_soup, datetime.today().date())

                        if pub_date < end_date:
                            stop_scraping = True
                            break

                        content = extract_article_content(art_soup)
                        if content:
                            data.append({
                                "Source": "MyJoyOnline",
                                "Category": category,
                                "Date Posted": pub_date,
                                "Title": title,
                                "URL": art_url,
                                "Content": content
                            })
                except Exception as err:
                    print(f"[MyJoyOnline] Error fetching {art_url}: {err}")

            page_num += 1
        else:
            break

    return pd.DataFrame(data) if data else pd.DataFrame(columns=["Source", "Category", "Date Posted", "Title", "URL", "Content"])

def joynews_multi_scraper(source_data):
    scraped_df = pd.DataFrame(columns=["Source", "Category", "Date Posted", "Title", "URL", "Content"])
    start_date = source_data['start_date']
    end_date = source_data['end_date'].strftime('%Y-%m-%d')

    for cat in source_data.get('categories', ['news']):
        df = joynews_scraper(cat, "", end_date)
        if df is not None and not df.empty:
            df['Date Posted'] = pd.to_datetime(df['Date Posted']).dt.date
            scraped_df = pd.concat([scraped_df, df], axis=0, ignore_index=True)

    if not scraped_df.empty:
        scraped_df = scraped_df[scraped_df['Date Posted'] <= start_date]

    return scraped_df

# =========================================================================
# 5. Yen Ghana Scraper
# =========================================================================
def yenghana_scraper(category, end_date_str):
    data = []
    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    session = requests.Session()
    session.headers.update(get_user_agent())

    # Try standard category page first: https://yen.com.gh/{category}/
    cat_url = f"https://yen.com.gh/{category.lower()}/"
    print(f"[Yen Ghana] Scraping category URL: {cat_url}")

    try:
        res = session.get(cat_url, timeout=10)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            articles = soup.find_all('article') or soup.find_all('div', class_=re.compile(r'article-card|post', re.I))

            for art in articles:
                a_tag = art.find('a')
                if not a_tag:
                    continue

                title = a_tag.get('title') or (art.find(['h2', 'h3']) and art.find(['h2', 'h3']).get_text(strip=True)) or a_tag.get_text(strip=True)
                art_url = a_tag.get('href')

                if not art_url or not title or len(title) < 10:
                    continue

                if not art_url.startswith('http'):
                    art_url = urljoin('https://yen.com.gh', art_url)

                try:
                    art_res = session.get(art_url, timeout=8)
                    if art_res.status_code == 200:
                        art_soup = BeautifulSoup(art_res.text, 'html.parser')
                        pub_date = extract_article_date(art_soup, datetime.today().date())

                        if pub_date < end_date:
                            break

                        content = extract_article_content(art_soup)
                        if content:
                            data.append({
                                "Source": "Yen Ghana",
                                "Category": category,
                                "Date Posted": pub_date,
                                "Title": title,
                                "URL": art_url,
                                "Content": content
                            })
                except Exception as err:
                    print(f"[Yen Ghana] Error fetching {art_url}: {err}")
    except Exception as e:
        print(f"[Yen Ghana] Error requesting {cat_url}: {e}")

    return pd.DataFrame(data) if data else pd.DataFrame(columns=["Source", "Category", "Date Posted", "Title", "URL", "Content"])

def yenghana_multi_scraper(source_data):
    scraped_df = pd.DataFrame(columns=["Source", "Category", "Date Posted", "Title", "URL", "Content"])
    start_date = source_data['start_date']
    end_date = source_data['end_date'].strftime('%Y-%m-%d')

    for cat in source_data.get('categories', ['Ghana']):
        df = yenghana_scraper(cat, end_date)
        if df is not None and not df.empty:
            df['Date Posted'] = pd.to_datetime(df['Date Posted']).dt.date
            scraped_df = pd.concat([scraped_df, df], axis=0, ignore_index=True)

    if not scraped_df.empty:
        scraped_df = scraped_df[scraped_df['Date Posted'] <= start_date]

    return scraped_df
