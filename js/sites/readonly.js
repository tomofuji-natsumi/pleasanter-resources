// ===============================
// 0. 読取専用モード判定（最速）
// ===============================
if (document.querySelector("#Notes .readonly")) {
    document.body.classList.add("readonly-mode");
}


// ===============================
// 1. readonly のときだけ date-field の Shadow DOM に CSS を注入
// ===============================
if (document.body.classList.contains("readonly-mode")) {

    const injectDateFieldCSS = () => {
        document.querySelectorAll("date-field").forEach(df => {
            const shadow = df.shadowRoot;
            if (!shadow) return;

            if (shadow.querySelector("style[data-hide-current-date]")) return;

            const style = document.createElement("style");
            style.dataset.hideCurrentDate = "true";
            style.textContent = `
                .current-date {
                    display: none !important;
                }
            `;
            shadow.appendChild(style);
        });
    };

    // 初回
    injectDateFieldCSS();

    // date-field が追加されたときだけ監視（軽量化）
    const dateObserver = new MutationObserver(mutations => {
        for (const m of mutations) {
            if ([...m.addedNodes].some(n => n.tagName === "DATE-FIELD")) {
                injectDateFieldCSS();
            }
        }
    });
    dateObserver.observe(document.body, { childList: true, subtree: true });

    // 念のため1回だけ遅延実行
    setTimeout(injectDateFieldCSS, 200);
}



// ===============================
// 2. jQuery 処理（DOM 構築後）
// ===============================
$(function () {

    if (!$("body").hasClass("readonly-mode")) return;


    // ===============================
    // 2-1. フォーム要素を完全に無効化（安全） 
    // ===============================
    $("form input:not([type='hidden']), form textarea, form select, form input[type='checkbox'], form input[type='radio']")
        .prop("disabled", true);



    // ===============================
    // 2-2. HTMLエスケープ（軽量化版）
    // ===============================
    const escapeMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };
    const escapeHtml = (str) =>
        String(str ?? "").replace(/[&<>"']/g, s => escapeMap[s]);



    // ===============================
    // 2-3. フィールドをラベル化
    // ===============================
    $(".field-control").each(function () {
        const control = $(this);

        if (control.children(".readonly-value").length > 0) return;


        // -------------------------------
        // input date（flatpickr）
        // -------------------------------
        control.find("input.flatpickr-input").each(function () {
            const val = escapeHtml($(this).val());
            $(this).hide();
            control.append(`<div class="readonly-value">${val}</div>`);
        });


        // -------------------------------
        // select（表示テキストを正しく取得）
        // -------------------------------
        control.find("select.control-dropdown").each(function () {

            const texts = $(this)
                .find("option:selected")
                .map(function () { return $(this).text(); })
                .get()
                .join(", ");

            const safe = escapeHtml(texts);
            $(this).hide();
            control.append(`<div class="readonly-value">${safe}</div>`);
        });


        // -------------------------------
        // textarea（markdown / textarea）
        // -------------------------------
        control.find("textarea.control-markdown, textarea.control-textarea").each(function () {
            const val = escapeHtml($(this).val()).replace(/\n/g, "<br>");
            $(this).hide();
            control.append(`<div class="readonly-value">${val}</div>`);
        });


        // -------------------------------
        // SunEditor（iframe 内は触らず安全に非活性化）
        // -------------------------------
        const sun = control.find(".sun-editor");
        if (sun.length) {
            sun.addClass("readonly-sun-editor");
        }
    });



    // ===============================
    // 2-4. 添付ファイルアップロードUIは常に非表示
    // ===============================
    $(".control-attachments-upload").hide();

});
