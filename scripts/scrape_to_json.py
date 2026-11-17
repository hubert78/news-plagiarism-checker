"""
News Scraper to JSON Exporter
This script runs the scrapers from scraper.py and exports/updates data/articles.json.
Can be executed locally or via GitHub Actions.
"""
import os
import json
import argparse
from datetime import datetime, timedelta
import pandas as pd

from scraper import (
    ghanaweb_multi_scraper,
    joynews_multi_scraper,
    modernghana_scraper,
    yenghana_scraper,
    new3_scraper,
    check_duplicates
)

def scrape_all(days=3):
    today = datetime.now().date()
    start_date = today
    end_date = today - timedelta(days=days)
    
    start_date_str = start_date.strftime('%Y%m%d')
    end_date_str = end_date.strftime('%Y%m%d')
    end_date_dash = end_date.strftime('%Y-%m-%d')
    
    print(f"Scraping articles from {end_date_dash} to {start_date.strftime('%Y-%m-%d')}...")
    
    all_articles = []
    
    # 1. Ghanaweb
    try:
        print("Scraping Ghanaweb...")
        gw_data = {
            'start_date': start_date,
            'end_date': end_date,
            'categories': ["NewsArchive", "business", "entertainment", "SportsArchive"]
        }
        df_gw = ghanaweb_multi_scraper(gw_data)
        if df_gw is not None and not df_gw.empty:
            all_articles.extend(df_gw.to_dict(orient='records'))
    except Exception as e:
        print(f"Error scraping Ghanaweb: {e}")

    # 2. 3News
    try:
        print("Scraping 3News...")
        for cat in ["news", "business", "sports", "showbiz"]:
            df_3n = new3_scraper(cat, "", end_date_dash)
            if df_3n is not None and not df_3n.empty:
                all_articles.extend(df_3n.to_dict(orient='records'))
    except Exception as e:
        print(f"Error scraping 3News: {e}")

    # 3. MyJoyOnline
    try:
        print("Scraping MyJoyOnline...")
        jn_data = {
            'start_date': start_date,
            'end_date': end_date,
            'categories': ["news", "business", "sports", "entertainment"]
        }
        df_jn = joynews_multi_scraper(jn_data)
        if df_jn is not None and not df_jn.empty:
            all_articles.extend(df_jn.to_dict(orient='records'))
    except Exception as e:
        print(f"Error scraping MyJoyOnline: {e}")

    # 4. Modern Ghana
    try:
        print("Scraping Modern Ghana...")
        df_mg = modernghana_scraper(end_date_str, start_date_str)
        if df_mg is not None and not df_mg.empty:
            all_articles.extend(df_mg.to_dict(orient='records'))
    except Exception as e:
        print(f"Error scraping Modern Ghana: {e}")

    # 5. Yen Ghana
    try:
        print("Scraping Yen Ghana...")
        for cat in ["Ghana", "Politics", "Business", "Entertanment", "Sports"]:
            df_yg = yenghana_scraper(cat, end_date_dash)
            if df_yg is not None and not df_yg.empty:
                all_articles.extend(df_yg.to_dict(orient='records'))
    except Exception as e:
        print(f"Error scraping Yen Ghana: {e}")

    # Process and save
    if all_articles:
        output_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'articles.json')
        # Load existing articles if present to merge
        existing = []
        if os.path.exists(output_file):
            try:
                with open(output_file, 'r', encoding='utf-8') as f:
                    existing = json.load(f)
            except:
                pass
        
        # Merge by URL
        seen_urls = set()
        merged = []
        for art in all_articles + existing:
            url = art.get('URL')
            # normalize date
            if isinstance(art.get('Date Posted'), datetime) or hasattr(art.get('Date Posted'), 'isoformat'):
                art['Date Posted'] = art['Date Posted'].strftime('%Y-%m-%d')
            if url and url not in seen_urls:
                seen_urls.add(url)
                merged.append(art)
                
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(merged, f, indent=2, ensure_ascii=False)
        print(f"Successfully saved {len(merged)} total articles to {output_file}")
    else:
        print("No new articles scraped.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--days', type=int, default=3, help='Number of days back to scrape')
    args = parser.parse_args()
    scrape_all(days=args.days)
