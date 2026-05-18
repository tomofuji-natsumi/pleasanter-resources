$(function () {
    const input = $('#Import');

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

    const fileName = $('.file-name');

    // CSVのみ選択可
    input.attr('accept', '.csv');

    input.on('change', function () {
        const file = this.files[0];

        // 既存エラー削除
        $('#ImportSettingsDialog > p.message-dialog').remove();

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

            fileName.text('選択されていません');
            $(this).val(null);
            return;
        }

        fileName.text(file.name);
    });
});

/* インポート */
const observer = new MutationObserver(() => {

    // エクスポートの文字コード
    const exportEncoding = document.querySelector("#ExportEncoding");
    if (exportEncoding) {
        exportEncoding.value = "UTF-8";
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});