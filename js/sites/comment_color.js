function applyCommentColors() {
    const map = JSON.parse($('#MyComments').val() || "{}");

    $("#CommentList > div[id^='Comment']").each(function () {
        const rawId = $(this).attr("id"); // 例: "Comment1.wrapper"
        const id = rawId.replace("Comment", "").replace(".wrapper", "");
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

// コメントリストを監視
const commentList = document.getElementById("CommentList");

if (commentList) {
    const commentObserver = new MutationObserver(mutations => {
        let needUpdate = false;

        for (const m of mutations) {
            for (const node of m.addedNodes) {
                // コメント本体が追加された
                if (node.nodeType === 1 && node.id && node.id.startsWith("Comment")) {
                    needUpdate = true;
                }
            }

            // コメント内部が描画されて class="comment" が付いた
            if (m.type === "attributes" && m.target.classList.contains("comment")) {
                needUpdate = true;
            }
        }

        if (needUpdate) {
            applyCommentColors();
        }
    });

    commentObserver.observe(commentList, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"]
    });
}
