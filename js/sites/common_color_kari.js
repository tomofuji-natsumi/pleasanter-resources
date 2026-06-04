(function () {

  const $ = window.jQuery;

  // コメント色マップをキャッシュ
  let commentColorMap = null;

  function loadCommentColorMap() {
    if (!commentColorMap) {
      try {
        commentColorMap = JSON.parse($('#MyComments').val() || "{}");
      } catch (e) {
        commentColorMap = {};
      }
    }
  }

  // 追加されたコメントだけ色を適用
  function applyColorToComment(el) {
    const id = el.id.replace("Comment", "").replace(".wrapper", "");
    if (!id) return;

    const info = commentColorMap[id];
    if (!info) return;

    $(el).css({
      color: info.color,
      "background-color": info.backgroundColor,
      "border-left": `8px solid ${info.borderColor}`
    });
  }

  // MutationObserver（CommentList のみ監視）
  function startCommentObserver() {
    const list = document.querySelector("#CommentList");
    if (!list) return;

    loadCommentColorMap();

    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        // 追加されたコメントだけ処理
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && node.id && node.id.startsWith("Comment")) {
            applyColorToComment(node);
          }
        }

        // CommentList が丸ごと更新された場合
        if (m.type === "childList" && m.target.id === "CommentList") {
          $("#CommentList > div[id^='Comment']").each(function () {
            applyColorToComment(this);
          });
        }
      }
    });

    observer.observe(list, {
      childList: true,
      subtree: true
    });
  }

  // 初期化
  $(document).on("pjax:end pjax:success", startCommentObserver);
  $(document).ready(startCommentObserver);

})();
