function replaceBackText() {
    const title = document.querySelector("ul.nav-sites li.to-parent .title");
    console.log("replaceBackText 実行", title);
    if (title) {
        title.textContent = "戻る";
        console.log("→ 戻るに変更した");
    } else {
        console.log("→ title が見つからない");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded 発火");
    replaceBackText();
});

$(document).on("pjax:end", () => {
    console.log("pjax:end 発火");
    replaceBackText();
});

$(document).on("pjax:success", () => {
    console.log("pjax:success 発火");
    replaceBackText();
});

$(document).on("Common.Refresh", () => {
    console.log("Common.Refresh 発火");
    replaceBackText();
});
