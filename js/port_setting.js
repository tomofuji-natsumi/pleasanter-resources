function setupImportInput(input) {

    let wrapper = input.closest('.file-wrapper');

    // file-wrapper がなければ作成
    if (wrapper.length === 0) {

        wrapper = $(`
            <div class="file-wrapper">
                <div class="file-button">選択</div>
                <span class="file-name">選択されていません</span>
            </div>
        `);

        input.after(wrapper);
        wrapper.append(input);
    }

    const fileButton = wrapper.find('.file-button');
    const fileName = input.parent().find('.file-name');

    // CSV のみ選択可
    input.attr('accept', '.csv');

    // file-button を input のクリックトリガーにする
    fileButton.off('click').on('click', () => input.click());

    input.off('change.import').on('change.import', function () {
        const file = this.files[0];

        $('#ImportSettingsDialog > p.message-dialog, #ImportUserTemplateDialog > p.message-dialog').remove();

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
            $('#ImportSettingsDialog .command-center, #ImportUserTemplateDialog .command-center').before(errorHtml);

            fileName.text('選択されていません');
            $(this).val(null);
            return;
        }

        fileName.text(file.name);
    });
}
