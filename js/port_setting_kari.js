(function () {
  // ===============================
  // 1. ファイル入力のセットアップ
  // ===============================
  function setupImportInput($input) {
    if (!$input.length) return;

    // 既にラップ済みならスキップ
    if ($input.parent().hasClass('file-wrapper')) return;

    const $wrapper = $(`
      <div class="file-wrapper">
        <div class="file-button">選択</div>
        <span class="file-name">選択されていません</span>
      </div>
    `);

    $input.after($wrapper);
    $wrapper.append($input);

    const $fileButton = $wrapper.find('.file-button');
    const $fileName = $wrapper.find('.file-name');

    // CSV のみ選択可
    $input.attr('accept', '.csv');

    // ボタンで input.click()
    $fileButton.on('click', () => $input.trigger('click'));

    // ファイル選択時の処理
    $input.on('change.import', function () {
      const file = this.files[0];
      const dialogs = [
        '#ImportSettingsDialog',
        '#ImportSitePackageDialog',
        '#ImportUserTemplateDialog'
      ];

      // 既存エラー削除
      dialogs.forEach(sel => $(`${sel} > p.message-dialog`).remove());

      if (!file) {
        $fileName.text('選択されていません');
        return;
      }

      // 拡張子チェック
      if (!/\.csv$/i.test(file.name)) {
        const errorHtml = `
          <p class="message-dialog">
            <span class="body alert-error">CSVファイルを選択してください。</span>
          </p>
        `;
        dialogs.forEach(sel => $(`${sel} .command-center`).before(errorHtml));
        $fileName.text('選択されていません');
        $(this).val(null);
        return;
      }

      $fileName.text(file.name);
    });
  }

  // ===============================
  // 2. 文字コード固定処理
  // ===============================
  function fixEncoding(selector) {
    const $enc = $(selector);
    if ($enc.length) {
      $enc.val('UTF-8').prop('disabled', true);
      return true;
    }
    return false;
  }

  // ===============================
  // 3. DOM監視
  // ===============================
  const importWatcher = new MutationObserver(() => {
    // エンコーディング固定
    fixEncoding('#Encoding');

    // インポート欄が出現したらセットアップ
    const $importUser = $('#ImportUserTemplate_Import');
    const $importMain = $('#Import:not(.control-checkbox)');

    if ($importUser.length) setupImportInput($importUser);
    if ($importMain.length) {
      setupImportInput($importMain);
      importWatcher.disconnect();
    }
  });

  importWatcher.observe(document.body, { childList: true, subtree: true });

  // ===============================
  // 4. エクスポート欄監視
  // ===============================
  const exportWatcher = new MutationObserver(() => {
    if (fixEncoding('#ExportEncoding')) exportWatcher.disconnect();
  });

  exportWatcher.observe(document.body, { childList: true, subtree: true });
})();
