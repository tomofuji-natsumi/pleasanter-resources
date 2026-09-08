"""
PDF出力用フォント (font/NotoSansJP-Regular_LightVer.ttf) のビルドスクリプト。

このディレクトリ (font/NotoSansJP-Regular_Original/) にある
- NotoSansJP-Regular.ttf : Google Fonts配布のNoto Sans JP フルセット原本
- joyo_jinmeiyo.txt      : 常用漢字+人名用漢字リスト(vaiorabbit/everyday_use_kanji)
- old_forms.txt          : 常用漢字表 公式旧字体364字(ikawaha/kanjiより抽出)
を元に、業務で使う文字種のみを抜き出したサブセットフォントを
一つ上の階層 (font/NotoSansJP-Regular_LightVer.ttf) に生成する。

出力はTTF形式（woff2は使わない）。pdfme/fontkitでPDFに埋め込む際、
woff2コンテナのままだと埋め込みフォントとして不正になり、Acrobatで
「埋め込みフォントを抽出できません」という警告が出ることが確認されているため。

要 fonttools:
    pip install fonttools

実行:
    python build_font.py
"""
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_FONT = os.path.join(BASE_DIR, "NotoSansJP-Regular.ttf")
OUTPUT_FONT = os.path.join(BASE_DIR, "..", "NotoSansJP-Regular_LightVer.ttf")

# 個別に追加した文字（人名・地名等でよく使われる旧字体・異体字）
# ※ NotoSansJP-Regular.ttf自体にグリフが存在しない文字は含めても無視される。
#    (例: 巖 U+5DA9, 樋 U+6A2F は元フォントに存在しないため対応不可)
EXTRA_CHARS = {
    "takashi_hashigo": 0x9AD9,   # 髙
    "yoshi_tsuchiyoshi": 0x20B9F, # 𠮷
    "be1": 0x9089,                # 邉
    "hama1": 0x6FF5,              # 濵
    "en_old": 0x5713,             # 圓
    "wi_hiragana": 0x3090,        # ゐ
    "we_hiragana": 0x3091,        # ゑ
    "wi_katakana": 0x30F0,        # ヰ
    "we_katakana": 0x30F1,        # ヱ
    "kunojiten": 0x3006,          # 〆
    "iteration_hira": 0x309D,     # ゝ
    "kabushiki": 0x3231,          # ㈱
    "kan_hiroi": 0x5BEC,          # 寬
    "hinoki": 0x6A9C,             # 檜
    "mine1": 0x5CF0,              # 峰
    "mine2": 0x5CEF,              # 峯
    "saki_tatsu": 0xFA11,         # 﨑
    "tsuka": 0x585A,              # 塚
    "hiroshi_old": 0x5EE3,        # 廣
    "man_old": 0x842C,            # 萬
    "shin_old": 0x771E,           # 眞
    "sakae_old": 0x69AE,          # 榮
    "fuchi1": 0x6E15,             # 渕
    "uguisu": 0x9DAF,             # 鶯
    "yakata": 0x8218,             # 舘
    "kakuran": 0x6538,            # 攪
    "ashi": 0x8606,               # 蘆
}

# 記号・かな類のUnicodeブロック（罫線 U+2500-257F は意図的に除外）
SYMBOL_RANGES = [
    (0x0000, 0x007F),  # 半角英数字・記号
    (0x00A0, 0x00FF),  # Latin-1補助（Å, ±, ° 等）
    (0x2000, 0x206F),  # 各種記号・句読点
    (0x2100, 0x218F),  # №, ℡, ローマ数字
    (0x2190, 0x21FF),  # 矢印
    (0x2200, 0x22FF),  # 数学記号
    (0x2460, 0x24FF),  # 丸数字・丸付きアルファベット
    (0x25A0, 0x25FF),  # 図形記号
    (0x2600, 0x26FF),  # 記号・マーク
    (0x3000, 0x303F),  # 全角記号・句読点
    (0x3040, 0x309F),  # ひらがな
    (0x30A0, 0x30FF),  # カタカナ
    (0x3200, 0x33FF),  # 単位記号・丸囲み漢字等
    (0xFF00, 0xFFEF),  # 全角英数字等
]


def load_codepoints(filename):
    path = os.path.join(BASE_DIR, filename)
    with open(path, encoding="utf-8") as f:
        content = f.read().strip()
    if not content:
        return set()
    return set(int(tok[2:], 16) for tok in content.split(","))


def main():
    joyo_jinmeiyo_path = os.path.join(BASE_DIR, "joyo_jinmeiyo.txt")
    with open(joyo_jinmeiyo_path, encoding="utf-8") as f:
        joyo_jinmeiyo_cps = set(ord(c) for c in f.read() if c.strip())

    old_forms_cps = load_codepoints("old_forms.txt")

    kanji_cps = joyo_jinmeiyo_cps | old_forms_cps | set(EXTRA_CHARS.values())

    cps = set(kanji_cps)
    for lo, hi in SYMBOL_RANGES:
        cps.update(range(lo, hi + 1))

    unicodes_file = os.path.join(BASE_DIR, "_unicodes_build.txt")
    with open(unicodes_file, "w", encoding="utf-8") as f:
        f.write(",".join(f"U+{cp:04X}" for cp in sorted(cps)))

    print(f"kanji codepoints: {len(kanji_cps)}")
    print(f"total codepoints: {len(cps)}")

    subprocess.run(
        [
            sys.executable, "-m", "fontTools.subset",
            SRC_FONT,
            f"--output-file={OUTPUT_FONT}",
            f"--unicodes-file={unicodes_file}",
            "--layout-features=*",
            "--no-hinting",
        ],
        check=True,
    )

    os.remove(unicodes_file)
    print(f"generated: {OUTPUT_FONT}")


if __name__ == "__main__":
    main()
