(function () {

  function replaceBackText() {
    const title = document.querySelector("ul.nav-sites li.to-parent .title");
    title.textContent = "戻る";
      console.log("戻るに変更しました");
    } else {
      console.log("タイトルが見つからない");
    }
  }

 $(document).on("Common.Refresh", function () {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        replaceBackText();
      });
    });
 
  document.addEventListener("DOMContentLoaded", () => {
    replaceBackText();
  });

})();
