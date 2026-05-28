function applyCommentColors() {
    const map = JSON.parse($('#MyComments').val() || "{}");

    $(".comment").each(function () {
        const id = $(this).data("comment-id");
        if (!id) return;

        const info = map[id];
        if (!info) return;

        // 3 色を反映
        $(this).css({
            "color": info.color,
            "background-color": info.backgroundColor,
            "border-left": "8px solid" + `${info.borderColor}`
        });
    });
}

const commentObserver = new MutationObserver(mutations => {
    let added = false;

    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (node.nodeType === 1 && node.classList.contains("comment")) {
                added = true;
            }
        }
    }

    if (added) {
        setTimeout(() => {
            applyCommentColors();
        }, 50);
    }
});

commentObserver.observe(document.body, {
    childList: true,
    subtree: true
});
