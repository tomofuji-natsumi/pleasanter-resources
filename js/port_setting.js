function setupImportInput(input) {

    const field = input.closest('.field-control');

    let wrapper = field.children('.file-wrapper');

    if (wrapper.length === 0) {
        wrapper = $(`
            <div class="file-wrapper">
                <div class="file-button">選択</div>
                <span class="file-name">選択されていません</span>
            </div>
        `);

        field.append(wrapper);
    }

    wrapper.append(input);

    const fileButton = wrapper.find('.file-button');
    const fileName = wrapper.find('.file-name');

    input.attr('accept', '.csv');

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


// ===============================
// Pleasanter が DOM を作り終わった後に実行
// ===============================
// Import input を監視して file-wrapper を作る
const importObserver = new MutationObserver(mutations => {
    mutations.forEach(m => {
        m.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.matches("input[type='file']")) {
                setupImportInput($(node));
            }
        });
    });
});

// body 全体を監視
importObserver.observe(document.body, {
    childList: true,
    subtree: true
});
