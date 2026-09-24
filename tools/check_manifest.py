#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
manifest_*.json のカテゴリ名タイポ検出（修正項目.md C-8）。

`Js`/`Css` のキーはPleasanter側のローダー（js/loader_site.js の
__pleasanterScreenType()）が返しうる画面種別（"All" は全画面共通の特別枠）に
限定される。ここから外れたキー（例: 過去に実在した "New" — A-12参照）は
JSON構文としては正しいため通常の構文チェックでは検出できず、該当画面で
スクリプトが読み込まれないまま気づかれにくい。

`jsonschema` パッケージが無い環境のため、標準ライブラリのみで
- Js/Css のキーが許可された画面種別か
- 値が文字列の配列か
- 記載されたパスが実在するファイルを指しているか
- 同一カテゴリ内でパスが重複していないか
だけを確認する簡易チェッカー。

使い方:
    python tools/check_manifest.py
    python tools/check_manifest.py js/manifest_site.json
"""

import glob
import json
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# js/loader_site.js の __pleasanterScreenType() が返しうる画面種別 + "All"（全画面共通）
ALLOWED_CATEGORIES = {"All", "Edit", "Calendar", "Index", "TimeSeries", "ImageLib"}
ALLOWED_TOP_LEVEL_KEYS = {"Js", "Css"}


def check_manifest(path):
    errors = []
    manifest_dir = os.path.dirname(os.path.abspath(path))  # js/ ディレクトリ
    repo_root = os.path.dirname(manifest_dir)
    # Jsのパスはjs/、Cssのパスはcss/を基点に解決される（js/loader_site.js参照）
    base_dir_by_section = {
        "Js": manifest_dir,
        "Css": os.path.join(repo_root, "css"),
    }

    with open(path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            return ["%s: JSONパースエラー: %s" % (path, e)]

    if not isinstance(data, dict):
        return ["%s: トップレベルはオブジェクトである必要があります" % path]

    for top_key in data:
        if top_key not in ALLOWED_TOP_LEVEL_KEYS:
            errors.append(
                "%s: 未知のトップレベルキー '%s'（%s のいずれかを想定）"
                % (path, top_key, "/".join(sorted(ALLOWED_TOP_LEVEL_KEYS)))
            )

    for section in ("Js", "Css"):
        categories = data.get(section)
        if categories is None:
            continue
        base_dir = base_dir_by_section[section]
        if not isinstance(categories, dict):
            errors.append("%s: %s はオブジェクトである必要があります" % (path, section))
            continue

        for category, files in categories.items():
            if category not in ALLOWED_CATEGORIES:
                errors.append(
                    "%s: %s.%s は未知の画面種別です（%s のいずれかを想定。"
                    "タイポの可能性 — 該当ファイルはこの画面で永久に読み込まれません）"
                    % (path, section, category, "/".join(sorted(ALLOWED_CATEGORIES)))
                )
                continue

            if not isinstance(files, list) or not all(isinstance(f, str) for f in files):
                errors.append("%s: %s.%s は文字列の配列である必要があります" % (path, section, category))
                continue

            seen = set()
            for rel_path in files:
                if rel_path in seen:
                    errors.append("%s: %s.%s 内でパスが重複しています: %s" % (path, section, category, rel_path))
                seen.add(rel_path)

                full_path = os.path.join(base_dir, rel_path)
                if not os.path.isfile(full_path):
                    errors.append("%s: %s.%s が参照するファイルが存在しません: %s" % (path, section, category, rel_path))

    return errors


def main(argv):
    targets = argv[1:] if len(argv) > 1 else sorted(glob.glob("js/manifest_*.json"))

    all_errors = []
    for path in targets:
        all_errors.extend(check_manifest(path))

    for error in all_errors:
        print(error)

    if all_errors:
        print("NG: %d件の問題が見つかりました" % len(all_errors))
        return 1

    print("OK: %d件のmanifestを確認しました" % len(targets))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
