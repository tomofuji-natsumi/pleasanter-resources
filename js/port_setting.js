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

// #Import が出てきた瞬間に 1 回だけ実行
const importWatcher = new MutationObserver(() => {

    $("#Encoding").val("UTF-8").prop("readonly", true);
    $("#ExportEncoding").val("UTF-8").prop("readonly", true);

    if ($('#ImportUserTemplate_Import').length) {
        setupImportInput($('#ImportUserTemplate_Import'));
    }

    if ($('#Import').length) {
        setupImportInput($('#Import'));
        
        importWatcher.disconnect();
    }
});

importWatcher.observe(document.body, {
    childList: true,
    subtree: true
});
