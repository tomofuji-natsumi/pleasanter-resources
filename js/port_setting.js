function setupImportInput(input) {
    if (!input.length) return;

    if (!input.parent().hasClass('file-wrapper')) {
        const wrapper = $(`
            <div class="file-wrapper">
                <div class="file-button">選択</div>
                <span class="file-name">選択されていません</span>
            </div>
        `);
        input.after(wrapper);
        wrapper.append(input);
    }

    const wrapper = input.parent();
    const fileButton = wrapper.find('.file-button');
    const fileName = wrapper.find('.file-name');

    fileButton.off('click').on('click', () => input.click());

    input.attr('accept', '.csv');

    input.off('change.import').on('change.import', function () {
        const file = this.files[0];

        $('#ImportSettingsDialog > p.message-dialog').remove();
        $('#ImportSitePackageDialog > p.message-dialog').remove();
        $('#ImportUserTemplateDialog > p.message-dialog').remove();

        if (!file) {
            fileName.text('選択されていません');
            return;
        }

        const isCsv = /\.csv$/i.test(file.name);

        if (!isCsv) {
            const errorHtml = `
                <p class="message-dialog">
                    <span class="body alert-error">CSVファイルを選択してください。</span>
                </p>
            `;
            $('#ImportSettingsDialog .command-center').before(errorHtml);
            $('#ImportSitePackageDialog > p.message-dialog').before(errorHtml);
            $('#ImportUserTemplateDialog > p.message-dialog').before(errorHtml);

            fileName.text('選択されていません');
            $(this).val(null);
            return;
        }

        fileName.text(file.name);
    });
}

// インポート
const importWatcher = new MutationObserver(() => {

    const enc = $("#Encoding");
    if (enc.length) {
        enc.val("UTF-8");
        enc.prop("disabled", true);
    }

    if ($('#ImportUserTemplate_Import').length) {
        setupImportInput($('#ImportUserTemplate_Import'));
    }

    if ($('#Import:not(.control-checkbox)').length) {
        setupImportInput($('#Import'));
        importWatcher.disconnect();
    }
});

importWatcher.observe(document.body, {
    childList: true,
    subtree: true
});

// エクスポート
const exportWatcher = new MutationObserver(() => {

    const enc = $("#ExportEncoding");
    if (enc.length) {
        enc.val("UTF-8");
        enc.prop("disabled", true);
        exportWatcher.disconnect();
    }
});

exportWatcher.observe(document.body, {
    childList: true,
    subtree: true
});
