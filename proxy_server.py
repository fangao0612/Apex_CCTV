import http.client
import os
import sys
import urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


# 用途：
# - 解决你用 file:// 打开 admin_panel.html 时的 CORS 跨域问题
# - 在本地启动一个静态文件服务器，同时把 /api /hls /flv /rtc 等路径反向代理到 EasyCVR 平台
#
# 用法：
#   python proxy_server.py
#   python proxy_server.py 9000
# 然后浏览器打开：
#   http://127.0.0.1:<port>/admin_panel.html
#
# 默认上游：
#   http://13.238.254.66:18000
#
# 可通过环境变量覆盖：
#   set EASYCVR_UPSTREAM=http://13.238.254.66:18000
#   set EASYCVR_PORT=8000

UPSTREAM = os.environ.get("EASYCVR_UPSTREAM", "http://13.238.254.66:18000").rstrip("/")
def _pick_listen_port() -> int:
    # 优先：命令行参数；其次：环境变量；最后：默认 8000
    if len(sys.argv) >= 2 and sys.argv[1].strip():
        try:
            return int(sys.argv[1].strip())
        except ValueError:
            raise ValueError(f"Invalid port: {sys.argv[1]!r}")
    return int(os.environ.get("EASYCVR_PORT", "8000"))


LISTEN_PORT = _pick_listen_port()


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
    # 代理这些前缀（EasyCVR 常用）
    PROXY_PREFIXES = (
        "/api/",
        "/hls/",
        "/flv/",
        "/fmp4/",
        "/rtc/",
        "/ws_flv/",
        "/ws_fmp4/",
        "/snap/",
        # 官方播放器 SDK 及解码器/资源（很多环境需要带 cookie/token 才能访问）
        "/EasyPlayerPro/",
        "/crypto/",
    )

    def _should_proxy(self, path: str) -> bool:
        return any(path.startswith(p) for p in self.PROXY_PREFIXES)

    def _proxy(self):
        # 将当前请求转发到上游
        parsed = urllib.parse.urlsplit(self.path)
        path = parsed.path
        query = parsed.query

        upstream_path = (UP_BASE_PATH + path) if UP_BASE_PATH else path
        if query:
            upstream_path = upstream_path + "?" + query

        conn_cls = http.client.HTTPSConnection if UP_SCHEME == "https" else http.client.HTTPConnection
        conn = conn_cls(UP_HOST, UP_PORT, timeout=30)

        # 透传常用头；特别是 Range（FLV 探测/播放需要）
        hop_by_hop = {
            "connection",
            "keep-alive",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailers",
            "transfer-encoding",
            "upgrade",
        }
        headers = {}
        for k, v in self.headers.items():
            lk = k.lower()
            if lk in hop_by_hop:
                continue
            # Host 由 http.client 自动处理
            if lk == "host":
                continue
            headers[k] = v

        # 读取请求体（本项目主要 GET；这里兼容 POST/PUT）
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
            # 复制响应头，并补上同源下的宽松缓存/类型
            for hk, hv in resp.getheaders():
                lk = hk.lower()
                if lk in hop_by_hop:
                    continue
                # 让浏览器更容易播放/调试
                if lk == "access-control-allow-origin":
                    continue
                self.send_header(hk, hv)

            # 同源访问时无需 CORS，但为了方便 debug 也允许
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "*")
            self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
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

    def do_OPTIONS(self):
        # 预检直接放行（同源下通常不会走到这里，但无害）
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        self.end_headers()

    def do_GET(self):
        if self._should_proxy(urllib.parse.urlsplit(self.path).path):
            return self._proxy()
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
    print(f"Upstream: {UPSTREAM}")
    print(f"Listening: http://127.0.0.1:{LISTEN_PORT}")
    httpd = ThreadingHTTPServer(("127.0.0.1", LISTEN_PORT), ProxyHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    sys.exit(main() or 0)

