// ===============================
// コメント色分け表示
//
// ユーザーごとに設定された色をコメント欄に適用する。
// 該当設定がない表示名には、その他（デフォルト）の色設定を適用する。
// ===============================
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
        const id = $(this).attr("id").replace("Comment", "").replace(".wrapper", "");
        if (!id) return;

        const name = $(this).find(".comment-header .user span").last().text().trim();
        if (!name) return;

        const info = map[name] || DEFAULT_COMMENT_COLOR;

        $(this).css({
            "color": info.color,
            "background-color": info.backgroundColor,
            "border-left": `8px solid ${info.borderColor}`
        });
    });
}

// 編集画面（#UpdateCommandが存在する）以外では、コメント色データ自体がサーバー側で計算されないため、Observerを起動しても意味がない
if (document.getElementById('UpdateCommand')) {
    // 初回表示時点で既にDOMにある既存コメントには、以降のMutationObserverは
    // 反応しない（新規追加されたノードにしか反応しないため）ため、ここで一度実行する
    applyCommentColors();

    const commentObserver = new MutationObserver(mutations => {
        let needUpdate = false;

        for (const m of mutations) {

            for (const node of m.addedNodes) {
                if (node.nodeType === 1 && node.id && node.id.startsWith("Comment")) {
                    needUpdate = true;
                }
            }

            if (m.type === "childList" && m.target.id === "CommentList") {
                needUpdate = true;
            }

            if (m.type === "attributes" && m.target.id === "CommentList") {
                needUpdate = true;
            }
        }

        if (needUpdate) {
            setTimeout(() => {
                applyCommentColors();
            }, 50);
        }
    });

    commentObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"]
    });
}
