// ===============================
// コメント色分け表示
//
// ユーザーごとに設定された色をコメント欄に適用する。
// 該当設定がない表示名には、その他（デフォルト）の色設定を適用する。
// ===============================
(function () {
    "use strict";

    // その他（デフォルト）の色設定
    // サーバー側の特定グループ設定に該当しない表示名に適用する
    const DEFAULT_COMMENT_COLOR = {
        color: '#1A2A3A',
        backgroundColor: '#E7F1FF',
        borderColor: '#AFCBFF'
    };

    function applyCommentColors() {
        let map;
        try {
            map = JSON.parse($('#UserColorMap').val() || "{}");
        } catch (e) {
            console.error('[コメント色] UserColorMapのJSON解析に失敗', e);
            return;
        }

        $("#CommentList > div[id^='Comment']").each(function () {
            const name = $(this).find(".comment-header .user span").last().text().trim();
            if (!name) return;

            // map[name] は Object.prototype のメンバ（constructor 等）を拾う可能性があるため hasOwnProperty で確認する
            const info = Object.prototype.hasOwnProperty.call(map, name) ? map[name] : DEFAULT_COMMENT_COLOR;

            $(this).css({
                "color": info.color,
                "background-color": info.backgroundColor,
                "border-left": `8px solid ${info.borderColor}`
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
