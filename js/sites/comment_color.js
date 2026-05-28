/* コード元作成者：植盛さん */
function applyCommentColors() {

    if (!$("#MyComments")[0]) return;

    let myData = JSON.parse($('#MyComments').val());    
    let myKeys = Object.keys(myData);
    myKeys.forEach(function (myKey) {
        let $comment = $('[id="Comment' + myKey + '.wrapper"]');
        if ($comment.length && myData[myKey]) {
            $comment.css({
                'color': myData[myKey].color,
                'background-color': myData[myKey].backgroundColor,
                'border-left': '8px solid ' + myData[myKey].borderColor
            });
        }
    });
}

// コメント DOM の変化を監視
const commentObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
        for (const node of m.addedNodes) {

            // コメントが追加された瞬間に色付け
            if (node.nodeType === 1 && node.classList.contains("comment")) {
                applyCommentColors();
            }
        }
    }
});

// コメント一覧を監視
commentObserver.observe(document.body, {
    childList: true,
    subtree: true
});
