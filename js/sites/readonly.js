$(function () {

    // ===============================
    // 1. 読取専用モード判定
    // ===============================
    if ($("#Notes .readonly").length > 0) {
        $("body").addClass("readonly-mode");
    }

    if (!$("body").hasClass("readonly-mode")) return;


    // ===============================
    // 2. 添付ファイルの表示制御（非同期対応）
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
    // 3. date-field の「今日」ボタンを非表示（Shadow DOM）
    // ===============================
    const hideDateButtons = () => {
        document.querySelectorAll("date-field").forEach(df => {
            const shadow = df.shadowRoot;
            if (!shadow) return;

            const btn = shadow.querySelector(".current-date");
            if (btn) btn.style.display = "none";
        });
    };

    // ShadowRoot が遅れて生成されるため遅延実行
    setTimeout(hideDateButtons, 300);


    // ===============================
    // 4. フォーム要素を正しく読取専用化
    // ===============================
    // input / textarea → readonly
    $("form input:not([type='hidden']), form textarea").attr("readonly", true);

    // select / checkbox / radio → disabled
    $("form select, form input[type='checkbox'], form input[type='radio']").attr("disabled", true);


    // ===============================
    // 5. フィールドをラベル化（SunEditor対応）
    // ===============================

    // HTMLエスケープ（記号が消えないように）
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

        // すでにラベル化済みならスキップ
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
        // select（ドロップダウン）
        // -------------------------------
        control.find("select.control-dropdown").each(function () {
            const text = escapeHtml($(this).find("option:selected").text());
            $(this).hide();
            control.append(`<div class="readonly-value">${text}</div>`);
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
        // SunEditor（iframe）
        // -------------------------------
        const sun = control.find(".sun-editor");
        if (sun.length) {
            sun.addClass("readonly-sun-editor");
        }
    });


    // ===============================
    // 6. 添付ファイルアップロードUIは常に非表示
    // ===============================
    $(".control-attachments-upload").hide();

});
