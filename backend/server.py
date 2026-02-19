import http.client
import os
import pathlib
import sys
import urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

# ────────────────────────────────────────────────────────────────
# Apex CCTV — 反向代理 + 静态文件服务器
#
# 部署模式:
#   1. Railway (生产): 只做反向代理, 前端由 Vercel 托管
#   2. 本地开发: 反向代理 + 提供 ../frontend/ 静态文件
#
# 环境变量:
#   EASYCVR_UPSTREAM  — 上游 EasyCVR 地址 (默认 http://13.238.254.66:18000)
#   PORT              — 监听端口 (Railway 自动注入, 默认 8000)
#   HOST              — 监听地址 (默认 0.0.0.0)
#   STATIC_DIR        — 静态文件目录 (默认自动检测 ../frontend/)
#
# 本地开发用法:
#   cd backend
#   python server.py
#   python server.py 9000
#   浏览器打开 http://127.0.0.1:8000/admin_panel.html
# ────────────────────────────────────────────────────────────────

UPSTREAM = os.environ.get("EASYCVR_UPSTREAM", "http://13.238.254.66:18000").rstrip("/")
LISTEN_HOST = os.environ.get("HOST", "0.0.0.0")


def _pick_listen_port() -> int:
    if len(sys.argv) >= 2 and sys.argv[1].strip():
        try:
            return int(sys.argv[1].strip())
        except ValueError:
            raise ValueError(f"Invalid port: {sys.argv[1]!r}")
    return int(os.environ.get("PORT", os.environ.get("EASYCVR_PORT", "8000")))


LISTEN_PORT = _pick_listen_port()


def _resolve_static_dir() -> str:
    env = os.environ.get("STATIC_DIR", "").strip()
    if env:
        p = pathlib.Path(env)
        return str(p) if p.is_dir() else ""
    candidate = pathlib.Path(__file__).resolve().parent.parent / "frontend"
    return str(candidate) if candidate.is_dir() else ""


STATIC_DIR = _resolve_static_dir()


def _parse_upstream(upstream: str):
    u = urllib.parse.urlparse(upstream)
    if u.scheme not in ("http", "https"):
        raise ValueError(f"Unsupported upstream scheme: {u.scheme}")
    host = u.hostname or ""
    port = u.port or (443 if u.scheme == "https" else 80)
    base_path = u.path.rstrip("/")
    return u.scheme, host, port, base_path


UP_SCHEME, UP_HOST, UP_PORT, UP_BASE_PATH = _parse_upstream(UPSTREAM)


class ProxyHandler(SimpleHTTPRequestHandler):
    PROXY_PREFIXES = (
        "/api/",
        "/hls/",
        "/flv/",
        "/fmp4/",
        "/rtc/",
        "/ws_flv/",
        "/ws_fmp4/",
        "/snap/",
        "/EasyPlayerPro/",
        "/crypto/",
    )

    def __init__(self, *args, **kwargs):
        if STATIC_DIR:
            super().__init__(*args, directory=STATIC_DIR, **kwargs)
        else:
            super().__init__(*args, **kwargs)

    def _should_proxy(self, path: str) -> bool:
        return any(path.startswith(p) for p in self.PROXY_PREFIXES)

    def _add_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")

    def _proxy(self):
        parsed = urllib.parse.urlsplit(self.path)
        path = parsed.path
        query = parsed.query

        upstream_path = (UP_BASE_PATH + path) if UP_BASE_PATH else path
        if query:
            upstream_path = upstream_path + "?" + query

        conn_cls = http.client.HTTPSConnection if UP_SCHEME == "https" else http.client.HTTPConnection
        conn = conn_cls(UP_HOST, UP_PORT, timeout=30)

        hop_by_hop = {
            "connection", "keep-alive", "proxy-authenticate",
            "proxy-authorization", "te", "trailers",
            "transfer-encoding", "upgrade",
        }
        headers = {}
        for k, v in self.headers.items():
            lk = k.lower()
            if lk in hop_by_hop or lk == "host":
                continue
            headers[k] = v

        body = None
        if "Content-Length" in self.headers:
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length > 0:
                    body = self.rfile.read(length)
            except Exception:
                body = None

        try:
            conn.request(self.command, upstream_path, body=body, headers=headers)
            resp = conn.getresponse()

            self.send_response(resp.status, resp.reason)
            for hk, hv in resp.getheaders():
                lk = hk.lower()
                if lk in hop_by_hop or lk == "access-control-allow-origin":
                    continue
                self.send_header(hk, hv)

            self._add_cors_headers()
            self.end_headers()

            while True:
                chunk = resp.read(64 * 1024)
                if not chunk:
                    break
                self.wfile.write(chunk)
        finally:
            try:
                conn.close()
            except Exception:
                pass

    def _send_json(self, code: int, msg: str):
        import json
        body = json.dumps({"status": code, "message": msg}).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._add_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._add_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path.rstrip("/") == "/health":
            return self._send_json(200, "ok")
        if self._should_proxy(urllib.parse.urlsplit(self.path).path):
            return self._proxy()
        if self.path == "/":
            return self._send_json(200, "Apex CCTV Backend is running. Please use the Vercel frontend to access this API.")
        if not STATIC_DIR:
            return self._send_json(404, "API proxy only. Frontend is served by Vercel.")
        return super().do_GET()

    def do_POST(self):
        if self._should_proxy(urllib.parse.urlsplit(self.path).path):
            return self._proxy()
        return super().do_POST()

    def do_PUT(self):
        if self._should_proxy(urllib.parse.urlsplit(self.path).path):
            return self._proxy()
        return super().do_PUT()

    def do_DELETE(self):
        if self._should_proxy(urllib.parse.urlsplit(self.path).path):
            return self._proxy()
        return super().do_DELETE()


def main():
    mode = "local dev (static + proxy)" if STATIC_DIR else "production (proxy only)"
    print(f"Mode:     {mode}")
    print(f"Upstream: {UPSTREAM}")
    print(f"Listen:   http://{LISTEN_HOST}:{LISTEN_PORT}")
    if STATIC_DIR:
        print(f"Static:   {STATIC_DIR}")

    httpd = ThreadingHTTPServer((LISTEN_HOST, LISTEN_PORT), ProxyHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    sys.exit(main() or 0)
