import sys


def main() -> int:
    path = r"e:\My Apps and Websites_E\CCTV\vendor\EasyPlayer-pro.js"
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            s = f.read()
    except Exception as e:
        print(f"read failed: {e}")
        return 2

    keys = [
        # 重点找“对外 API”线索
        "createPlayer",
        "create",
        "initPlayer",
        "setUrl",
        "setSource",
        "playUrl",
        "playerid",
        "playerId",
        "container",
        "element",
        "videoElement",
        "new ",
        "destroy",
        "EasyPlayer",
        "EasyPlayerPro",
        "wasm",
        "hevc",
        "avc",
    ]

    def dump_around(idx: int, label: str):
        print(f"FOUND {label} at {idx}")
        print(s[max(0, idx - 240) : idx + 520].replace("\n", "\\n"))
        print("---")

    for k in keys:
        # 打印最多 3 次出现位置，避免刷屏
        start = 0
        hits = 0
        while hits < 3:
            i = s.find(k, start)
            if i == -1:
                break
            dump_around(i, k)
            hits += 1
            start = i + len(k)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

