#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
node未導入環境向けのJS構文チェック代替（修正項目.md C-7）。

このリポジトリにはビルド・テストが無く、`node --check` が使えない環境でも
括弧の対応漏れ（IIFEのdocument.once()ラップ忘れ等でよく起きるミス）だけは
検出できるようにする。

本物のJSパーサではない。文字列リテラル（'"`）・行コメント・ブロックコメント・
正規表現リテラルの中身を簡易的に読み飛ばした上で、残ったコードの
{ } ( ) [ ] の対応が取れているかだけを見る。構文エラー全般は検出できないが、
このリポジトリで実際に起きた「括弧の閉じ忘れ」系のミスはこれで十分拾える。

使い方:
    python tools/check_js_syntax.py                  # js/ 配下の全 .js を検査
    python tools/check_js_syntax.py js/sites/foo.js   # 個別ファイルを検査
"""

import glob
import sys

# Windowsのコンソール既定コードページ（cp932等）だと日本語print()が文字化けするため、
# 標準出力をUTF-8に固定する
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

OPEN_TO_CLOSE = {"{": "}", "(": ")", "[": "]"}
CLOSE_TO_OPEN = {v: k for k, v in OPEN_TO_CLOSE.items()}


def strip_noncode(text):
    """文字列・コメント・正規表現リテラルの中身を空白に置き換える（括弧の対応チェック用）。"""
    out = []
    i = 0
    n = len(text)
    # 直前の非空白トークンを見て、'/' が除算か正規表現の開始かを大まかに判定する
    prev_significant = ""

    while i < n:
        c = text[i]

        # 行コメント
        if c == "/" and i + 1 < n and text[i + 1] == "/":
            while i < n and text[i] != "\n":
                out.append(" " if text[i] != "\n" else "\n")
                i += 1
            continue

        # ブロックコメント
        if c == "/" and i + 1 < n and text[i + 1] == "*":
            out.append("  ")
            i += 2
            while i < n and not (text[i] == "*" and i + 1 < n and text[i + 1] == "/"):
                out.append(" " if text[i] != "\n" else "\n")
                i += 1
            if i < n:
                out.append("  ")
                i += 2
            continue

        # 文字列リテラル（' " `）。テンプレートリテラルの ${...} は式が入るため、
        # 中の括弧は残すべきだが簡易実装のため対象外とし、丸ごと読み飛ばす。
        if c in ("'", '"', "`"):
            quote = c
            out.append(" ")
            i += 1
            while i < n and text[i] != quote:
                if text[i] == "\\" and i + 1 < n:
                    out.append("  ")
                    i += 2
                    continue
                out.append(" " if text[i] != "\n" else "\n")
                i += 1
            if i < n:
                out.append(" ")
                i += 1
            prev_significant = quote
            continue

        # 正規表現リテラル（除算との区別は直前トークンからの簡易推定）
        if c == "/" and prev_significant not in (")", "]", "}") and not _is_identifier_char(prev_significant):
            j = i + 1
            in_class = False
            ok = False
            while j < n:
                if text[j] == "\\":
                    j += 2
                    continue
                if text[j] == "[":
                    in_class = True
                elif text[j] == "]":
                    in_class = False
                elif text[j] == "/" and not in_class:
                    ok = True
                    j += 1
                    break
                elif text[j] == "\n":
                    break
                j += 1
            if ok:
                out.append(" " * (j - i))
                i = j
                prev_significant = "/"
                continue
            # 正規表現として閉じられなかった場合は除算記号として扱う

        out.append(c)
        if not c.isspace():
            prev_significant = c
        i += 1

    return "".join(out)


def _is_identifier_char(c):
    return bool(c) and (c.isalnum() or c == "_" or c == "$")


def check_balance(path):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    code = strip_noncode(text)
    stack = []
    line = 1
    for ch in code:
        if ch == "\n":
            line += 1
            continue
        if ch in OPEN_TO_CLOSE:
            stack.append((ch, line))
        elif ch in CLOSE_TO_OPEN:
            if not stack:
                return "%s:%d: 対応する開き括弧が無い '%s'" % (path, line, ch)
            open_ch, open_line = stack.pop()
            if OPEN_TO_CLOSE[open_ch] != ch:
                return "%s:%d: '%s'（%d行目で開いた）に対して不正な閉じ括弧 '%s'" % (
                    path, open_line, open_ch, open_line, ch
                )

    if stack:
        open_ch, open_line = stack[-1]
        return "%s:%d: 閉じられていない '%s'" % (path, open_line, open_ch)

    return None


def main(argv):
    targets = argv[1:] if len(argv) > 1 else sorted(glob.glob("js/**/*.js", recursive=True))

    failed = []
    for path in targets:
        error = check_balance(path)
        if error:
            failed.append(error)

    for error in failed:
        print(error)

    if failed:
        print("NG: %d件のファイルで括弧の対応が取れていません" % len(failed))
        return 1

    print("OK: %d件のファイルで括弧の対応を確認しました" % len(targets))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
