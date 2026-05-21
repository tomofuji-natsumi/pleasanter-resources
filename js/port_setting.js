// ===============================
// インポート input の UI セットアップ
// ===============================
function setupImportInput(input) {

    // すでに file-wrapper が無ければ作成
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

    const fileName = input.parent().find('.file-name');

    // CSV のみ選択可
    input.attr('accept', '.csv');

    // change イベント（重複防止のため off → on）
    input.off('change.import').on('change.import', function () {
        const file = this.files[0];

        // 既存エラー削除（両方対応）
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


// ===============================
// MutationObserver（Import + Export 両対応）
// ===============================
const portObserver = new MutationObserver(() => {

    // --- Import UI ---
    const inputs = $('#Import, #ImportUserTemplate_Import');
    inputs.each(function () {
        const input = $(this);

        // 二重適用防止
        if (!input.data('customized')) {
            setupImportInput(input);
            input.data('customized', true);
        }
    });

    // --- Export Encoding ---
    const exportEncoding = document.querySelector("#ExportEncoding");
    if (exportEncoding) {
        exportEncoding.value = "UTF-8";
    }
});

portObserver.observe(document.body, {
    childList: true,
    subtree: true
});
