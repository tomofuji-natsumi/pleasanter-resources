# ===========================================================================
# css/common/ 配下は編集用に分割したソース。
# 配信時にリクエスト数(=@importの段数)を増やさないため、
# custom_common.css / custom_cherry.css はこのスクリプトで単一ファイルへ束ねる。
# common/*.css を編集したら、このスクリプトを再実行してビルドし直すこと。
# ===========================================================================
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent / "css"

# custom_common.css / custom_cherry.css の @import 順と対応させる（既存の非対称構成を維持）。
# custom_common.css: definition.css はテンプレート側の <link> で別途読むためここには含めない。
# custom_cherry.css: definition_cherry.css は自身の先頭にインラインで含める。port_setting.css は含めない。
COMMON_ORDER_FULL = [
    "layout.css", "buttons.css", "header.css", "tabs.css",
    "editor_layout.css", "dialogs.css", "attachments.css", "comments.css",
    "submit_lock.css", "status.css", "conditions.css", "grid.css",
    "site_menu.css", "port_setting.css",
]
COMMON_ORDER_CHERRY = [f for f in COMMON_ORDER_FULL if f != "port_setting.css"]

HEADER = (
    "/* このファイルは tools/build_css_common.py の自動生成物。\n"
    "   直接編集せず、css/common/ 配下のソースを編集してから再ビルドすること。\n"
    "   （配信時のHTTPリクエスト数を増やさないよう、@import ではなく単一ファイルに束ねている） */\n"
)


def bundle(files, prelude=""):
    parts = [HEADER]
    if prelude:
        parts.append(prelude)
    for name in files:
        path = ROOT / "common" / name
        parts.append(f"\n/* ----- common/{name} ----- */\n")
        parts.append(path.read_text(encoding="utf-8"))
    return "".join(parts)


def main():
    (ROOT / "custom_common.css").write_text(
        bundle(COMMON_ORDER_FULL), encoding="utf-8", newline="\n"
    )

    definition_cherry = (ROOT / "definition_cherry.css").read_text(encoding="utf-8")
    prelude = f"\n/* ----- definition_cherry.css ----- */\n{definition_cherry}\n"
    (ROOT / "custom_cherry.css").write_text(
        bundle(COMMON_ORDER_CHERRY, prelude=prelude), encoding="utf-8", newline="\n"
    )

    print("built: custom_common.css, custom_cherry.css")


if __name__ == "__main__":
    main()
