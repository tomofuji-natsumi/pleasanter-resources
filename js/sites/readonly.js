// ===============================
// 0. 読取専用モード判定（最速で実行）
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

            // すでに注入済みならスキップ
            if (shadow.querySelector("style[data-hide-current-date]")) return;

            const style = document.createElement("style");
            style.setAttribute("data-hide-current-date", "true");
            style.textContent = `
                .current-date {
                    display: none !important;
                }
            `;
            shadow.appendChild(style);
        });
    };

    // すぐ実行（早すぎる場合は何も起きない）
    injectDateFieldCSS();

    // date-field が後から生成されても対応
    const dateObserver = new MutationObserver(injectDateFieldCSS);
    dateObserver.observe(document.body, { childList: true, subtree: true });

    // 初回ロード時に必ず実行（遅延生成対策）
    $(function () {
        setTimeout(injectDateFieldCSS, 0);
        setTimeout(injectDateFieldCSS, 200);
        setTimeout(injectDateFieldCSS, 500);
    });
}



// ===============================
// 2. jQuery 処理（DOM 構築後）
// ===============================
$(function () {

    if (!$("body").hasClass("readonly-mode")) return;


    // ===============================
    // 添付ファイルの表示制御（非同期対応）
    // ===============================
    const checkAttachments = () => {
        const hasFiles = $("[id^='Attachments'][id$='\\.items']")
            .toArray()
            .some(el => $(el).children().length > 0);

        $("[id^='Results_Attachments'][id$='Field']").toggle(hasFiles);
    };

    checkAttachments();

    const attachObserver = new MutationObserver(checkAttachments);
    attachObserver.observe(document.body, { childList: true, subtree: true });



    // ===============================
    // フォーム要素を正しく読取専用化
    // ===============================
    $("form input:not([type='hidden']), form textarea").attr("readonly", true);
    $("form select, form input[type='checkbox'], form input[type='radio']").attr("disabled", true);



    // ===============================
    // フィールドをラベル化（SunEditor対応）
    // ===============================
    const escapeHtml = (str) =>
        str.replace(/[&<>"']/g, s => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[s]));


    $(".field-normal, .field-wide, .field-markdown, .field-control").each(function () {
        const field = $(this);
        const control = field.find(".field-control");

        if (control.length === 0) return;
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
        // select（カンマが消えない安全版）
        // -------------------------------
        control.find("select.control-dropdown").each(function () {
            const val = $(this).val(); // ← カンマが絶対に消えない
            const safe = escapeHtml(val);
            $(this).hide();
            control.append(`<div class="readonly-value">${safe}</div>`);
        });

        // -------------------------------
        // textarea（markdown / textarea）
        // -------------------------------
        control.find("textarea.control-markdown, textarea.control-textarea").each(function () {
            const textarea = $(this); // ← 必須
            const val = escapeHtml(textarea.val()).replace(/\n/g, "<br>");
            textarea.hide();
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
    // 添付ファイルアップロードUIは常に非表示
    // ===============================
    $(".control-attachments-upload").hide();

});
