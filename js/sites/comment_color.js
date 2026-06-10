function applyCommentColors() {
    const map = JSON.parse($('#MyComments').val() || "{}");

    $("#CommentList > div[id^='Comment']").each(function () {
        const id = $(this).attr("id").replace("Comment", "").replace(".wrapper", "");
        if (!id) return;

        const info = map[id];
        if (!info) return;

        $(this).css({
            "color": info.color,
            "background-color": info.backgroundColor,
            "border-left": `8px solid ${info.borderColor}`
        });
    });
}

// コメント追加を監視（最速で反応）
const commentObserver = new MutationObserver(mutations => {
    let needUpdate = false;

    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (node.nodeType === 1 && node.id && node.id.startsWith("Comment")) {
                needUpdate = true;
            }
        }
    }

    if (needUpdate) {
        applyCommentColors(); // ← 遅延なしで即実行
    }
});

// CommentList のみ監視すれば十分
const commentList = document.getElementById("CommentList");
if (commentList) {
    commentObserver.observe(commentList, {
        childList: true,
        subtree: true
    });
}
