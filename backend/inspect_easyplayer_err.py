def main() -> int:
    path = r"e:\My Apps and Websites_E\CCTV\vendor\EasyPlayer-pro.js"
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        s = f.read()

    needles = [
        "EasyPlayerPro err container",
        "url is null and this._opt.url is null",
        "err container",
        "_opt.url is null",
    ]

    for n in needles:
        i = s.find(n)
        if i == -1:
            print(f"NOT FOUND: {n}")
            continue
        print(f"FOUND: {n} at {i}")
        print(s[max(0, i - 400) : i + 900].replace("\n", "\\n"))
        print("----")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

