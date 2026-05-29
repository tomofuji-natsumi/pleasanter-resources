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

const commentObserver = new MutationObserver(mutations => {
    let added = false;

    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (node.nodeType === 1 && node.id && node.id.startsWith("Comment")) {
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
