"""
News Plagiarism Checker - Local Server & Scraping API
Serves static files and provides /api/scrape endpoint that calls scraper.py functions directly.
"""
import os
import json
import traceback
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from datetime import datetime, timedelta
import pandas as pd

# Import scrapers from existing scraper.py
from scraper import (
    ghanaweb_multi_scraper,
    new3_multi_scraper,
    joynews_multi_scraper,
    modernghana_multi_scraper,
    yenghana_multi_scraper,
    check_duplicates
)

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class PlagiarismAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS for local testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/scrape':
            self.handle_scrape()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_scrape(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            req = json.loads(post_data.decode('utf-8'))
        except Exception as e:
            self.send_json_response({'success': False, 'error': f'Invalid JSON: {e}'}, 400)
            return

        source1 = req.get('source_1')
        source2 = req.get('source_2')
        s1_data = req.get('source_1_data', {})
        s2_data = req.get('source_2_data', {})

        print(f"\n[Scraper API] Received request to scrape: {source1} and {source2}")

        def parse_date(d_str):
            if isinstance(d_str, str):
                try:
                    return datetime.strptime(d_str, '%Y-%m-%d').date()
                except:
                    return datetime.now().date()
            return datetime.now().date()

        def prepare_source_payload(s_data):
            cats = s_data.get('categories', [])
            unique_cats = list(dict.fromkeys(cats)) if isinstance(cats, list) else []
            d1 = parse_date(s_data.get('start_date'))
            d2 = parse_date(s_data.get('end_date'))
            return {
                'start_date': max(d1, d2),
                'end_date': min(d1, d2),
                'categories': unique_cats
            }

        def run_scraper_for_source(source_name, source_payload):
            print(f"Scraping {source_name} with categories {source_payload['categories']} from {source_payload['end_date']} to {source_payload['start_date']}...")
            try:
                if source_name in ('Ghanaweb', 'Ghana web'):
                    return ghanaweb_multi_scraper(source_payload)
                elif source_name == '3News':
                    return new3_multi_scraper(source_payload)
                elif source_name == 'MyJoyOnline':
                    return joynews_multi_scraper(source_payload)
                elif source_name == 'Modern Ghana':
                    return modernghana_multi_scraper(source_payload)
                elif source_name == 'Yen Ghana':
                    return yenghana_multi_scraper(source_payload)
            except Exception as e:
                print(f"Error scraping {source_name}: {e}")
                traceback.print_exc()
            return pd.DataFrame(columns=["Source", "Category", "Date Posted", "Title", "URL", "Content"])

        try:
            s1_payload = prepare_source_payload(s1_data)
            s2_payload = prepare_source_payload(s2_data)

            # Execute scrapers
            df1 = run_scraper_for_source(source1, s1_payload)
            df2 = run_scraper_for_source(source2, s2_payload)

            # Clean and serialize
            records1 = []
            records2 = []

            if df1 is not None and not df1.empty:
                # normalize dates
                df1['Date Posted'] = df1['Date Posted'].astype(str)
                records1 = df1.to_dict(orient='records')

            if df2 is not None and not df2.empty:
                df2['Date Posted'] = df2['Date Posted'].astype(str)
                records2 = df2.to_dict(orient='records')

            # Optionally merge into data/articles.json so fresh data persists
            all_new = records1 + records2
            if all_new:
                articles_path = os.path.join(BASE_DIR, 'data', 'articles.json')
                existing = []
                if os.path.exists(articles_path):
                    try:
                        with open(articles_path, 'r', encoding='utf-8') as f:
                            existing = json.load(f)
                    except:
                        pass
                seen_urls = set()
                merged = []
                for art in all_new + existing:
                    u = art.get('URL')
                    if u and u not in seen_urls:
                        seen_urls.add(u)
                        merged.append(art)
                with open(articles_path, 'w', encoding='utf-8') as f:
                    json.dump(merged, f, indent=2, ensure_ascii=False)

            self.send_json_response({
                'success': True,
                'source1_count': len(records1),
                'source2_count': len(records2),
                'articles1': records1,
                'articles2': records2
            })

        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            print("[Scraper API] Client connection was aborted or closed by client before response could be sent.")
        except Exception as e:
            traceback.print_exc()
            try:
                self.send_json_response({'success': False, 'error': str(e)}, 500)
            except Exception:
                pass

    def send_json_response(self, data, status_code=200):
        try:
            body = json.dumps(data).encode('utf-8')
            self.send_response(status_code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            print(f"[Server] Client closed or aborted connection before response could be delivered (Status {status_code}).")

def run():
    server_address = ('', PORT)
    httpd = ThreadingHTTPServer(server_address, PlagiarismAppHandler)
    print(f"\n=======================================================")
    print(f" News Plagiarism Checker Web Server running at:")
    print(f" http://localhost:{PORT}")
    print(f" Scraping API available at: http://localhost:{PORT}/api/scrape")
    print(f"=======================================================\n")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
