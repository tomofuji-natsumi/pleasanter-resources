$(function () {
    // 読取専用メッセージが存在するか？
    if ($("#Notes .readonly").length > 0) {
        $("body").addClass("readonly-mode");
    }
});

$(function () {
    if (!$("body").hasClass("readonly-mode")) return;

    // ▼ 添付ファイル：ある時だけ表示、ない時は非表示
    const $attachments = $("[id^='Attachments'][id$='\\.items']");
    let hasFiles = false;
    
    $attachments.each(function () {
        if ($(this).children().length > 0) {
            hasFiles = true;
        }
    });
    
    if (hasFiles) {
        $("[id^='Results_Attachments'][id$='Field']").show();
    } else {
        $("[id^='Results_Attachments'][id$='Field']").hide();
    }


    document.querySelectorAll("date-field").forEach(df => {
        const shadow = df.shadowRoot;
        if (!shadow) return;

        const btn = shadow.querySelector(".current-date");
        if (btn) {
            btn.style.display = "none";
        }
    });

    $("form input, form textarea, form select").attr("readonly", true);

    // 全フィールドを対象（SunEditor を確実に拾うために textarea を持つフィールドすべて）
    $(".field-normal, .field-wide, .field-markdown, .field-control").each(function () {
        const field = $(this);
        const control = field.find(".field-control");

        if (control.length === 0) return;

        // すでにラベル化済みならスキップ
        if (control.find(".readonly-value").length > 0) return;

        // input date
        const input = control.find("input.flatpickr-input");
        if (input.length) {
            const val = input.val();
            input.hide();
            control.append(`<div class="readonly-value">${val}</div>`);
        }

        // select
        const select = control.find("select.control-dropdown");
        if (select.length) {
            const text = select.find("option:selected").text();
            select.hide();
            control.append(`<div class="readonly-value">${text}</div>`);
        }

        // textarea（markdown）
        const textarea = control.find("textarea.control-markdown, textarea.control-textarea");
        if (textarea.length) {
            const val = textarea.val().replace(/\n/g, "<br>");
            textarea.hide();
            control.append(`<div class="readonly-value">${val}</div>`);
        }
    });

    // アップロードUIは常に非表示
    $(".control-attachments-upload").hide();
});
