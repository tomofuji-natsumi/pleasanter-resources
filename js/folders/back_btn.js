(function () {

    function replaceText() {
        const title = document.querySelector("ul.nav-sites li.to-parent .title");
        if (title) {
            title.textContent = "戻る";
            return true;
        }
        return false;
    }

    let timer = null;

    const observer = new MutationObserver(() => {
        if (replaceText()) {

            if (timer) clearTimeout(timer);

            timer = setTimeout(() => {
                replaceText();
                observer.disconnect();
            }, 50);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
