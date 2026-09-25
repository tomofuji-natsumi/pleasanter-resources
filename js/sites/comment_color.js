// ===============================
// コメント色分け表示
//
// ユーザーごとに設定された色をコメント欄に適用する。
// 該当設定がない表示名には、その他（デフォルト）の色設定を適用する。
//
// その他（デフォルト）の色は固定値を持たず、css/definition.css の
// --text-comment / --bg-comment / --comment-border-color（いずれも --primary から導出）を
// 実行時に読み取って使う。テーマ切替（definition_cherry.css 等でprimaryが変わる）に
// あわせてデフォルト色も追従させるための対応。
// ===============================
(function () {
    "use strict";

    // サーバー由来のUserColorMapは想定外の値（不正なCSS文字列等）を含みうるため、
    // .css() に渡す前に簡易な形式チェックを行う（hex / rgb() / rgba() / oklch() / 既知のキーワードのみ許可）
    var VALID_COLOR_PATTERN = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|[a-zA-Z]+)$/;

    function isValidColor(value) {
        return typeof value === 'string' && VALID_COLOR_PATTERN.test(value.trim());
    }

    function getDefaultCommentColor() {
        var style = getComputedStyle(document.documentElement);
        return {
            color: style.getPropertyValue('--text-comment').trim(),
            backgroundColor: style.getPropertyValue('--bg-comment').trim(),
            borderColor: style.getPropertyValue('--comment-border-color').trim()
        };
    }

    function applyCommentColors() {
        let map;
        try {
            map = JSON.parse($('#UserColorMap').val() || "{}");
        } catch (e) {
            console.error('[コメント色] UserColorMapのJSON解析に失敗', e);
            return;
        }

        var defaultColor = getDefaultCommentColor();

        $("#CommentList > div[id^='Comment']").each(function () {
            const name = $(this).find(".comment-header .user span").last().text().trim();
            if (!name) return;

            // map[name] は Object.prototype のメンバ（constructor 等）を拾う可能性があるため hasOwnProperty で確認する
            const hasEntry = Object.prototype.hasOwnProperty.call(map, name);
            const info = hasEntry ? map[name] : defaultColor;

            const color = isValidColor(info.color) ? info.color : defaultColor.color;
            const backgroundColor = isValidColor(info.backgroundColor) ? info.backgroundColor : defaultColor.backgroundColor;
            const borderColor = isValidColor(info.borderColor) ? info.borderColor : defaultColor.borderColor;

            if (hasEntry && (color !== info.color || backgroundColor !== info.backgroundColor || borderColor !== info.borderColor)) {
                console.warn('[コメント色] UserColorMapに不正な色指定があったためデフォルト色にフォールバックしました', name, info);
            }

            $(this).css({
                "color": color,
                "background-color": backgroundColor,
                "border-left": `8px solid ${borderColor}`
            });
        });
    }

    // 編集画面（#UpdateCommandが存在する）以外では、コメント色データ自体がサーバー側で計算されないため、Observerを起動しても意味がない
    if (document.getElementById('UpdateCommand')) {
        window.once("commentColor", function () {
            // 初回表示時点で既にDOMにある既存コメントには、以降のMutationObserverは
            // 反応しない（新規追加されたノードにしか反応しないため）ため、ここで一度実行する
            applyCommentColors();

            // js/common/dom_watcher.js に集約（manifestでこのファイルより先に読まれる）。
            // 元々はCommentList配下の変更かどうかをmutations側で判定していたが、
            // applyCommentColors自体が軽量（該当DOMのCSS書き換えのみ）なため、
            // 対象を絞らず毎回呼び出して問題ない
            window.__pleasanterWatch(applyCommentColors, {
                delay: 50,
                guard: "commentColor",
                attributes: true,
                attributeFilter: ["class"]
            });
        });
    }
})();
