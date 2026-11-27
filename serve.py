"""本機伺服器：和 python -m http.server 一樣，但叫瀏覽器不要快取，
改完檔案重新整理就看得到新版。用法：python serve.py [port]"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript'}

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8930
handler = partial(NoCacheHandler, directory=str(Path(__file__).resolve().parent))
try:
    server = ThreadingHTTPServer(('127.0.0.1', port), handler)
except OSError:
    sys.exit(1)
print(f'Serving http://127.0.0.1:{port}/ (no cache)')
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
