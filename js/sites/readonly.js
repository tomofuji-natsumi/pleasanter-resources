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

    const injectDateFieldCSS = (shadow) => {
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
    };

    // date-field の Shadow DOM が生成されるまで監視
    const watchDateField = (df) => {
        const timer = setInterval(() => {
            if (df.shadowRoot) {
                injectDateFieldCSS(df.shadowRoot);
                clearInterval(timer);
            }
        }, 50);

        // 1秒経っても shadowRoot が無ければ諦める（安全）
        setTimeout(() => clearInterval(timer), 1000);
    };

    // 既存の date-field
    document.querySelectorAll("date-field").forEach(watchDateField);

    // 後から追加される date-field
    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            [...m.addedNodes].forEach(node => {
                if (node.tagName === "DATE-FIELD") {
                    watchDateField(node);
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// ===============================
// 2. jQuery 処理
// ===============================
$(function () {

    if (!$("body").hasClass("readonly-mode")) return;

    // ===============================
    // 2-1. フォーム要素を完全に無効化
    // ===============================
    $("form input:not([type='hidden']), form textarea, form select, form input[type='checkbox'], form input[type='radio']")
        .prop("disabled", true);

    // ===============================
    // 2-2. HTMLエスケープ
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
        // select
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
        // SunEditor
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
