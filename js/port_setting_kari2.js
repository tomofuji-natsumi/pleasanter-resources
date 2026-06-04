(function () {

  // jQuery 安全取得
  const $ = window.jQuery;

  // ===============================
  // setupImportInput（冪等・高速）
  // ===============================
  function setupImportInput($input) {
    if (!$input || !$input.length) return;
    if ($input.data('file-wrapper-initialized')) return;

    // 既にラップ済みなら終了
    if ($input.parent().hasClass('file-wrapper')) {
      $input.data('file-wrapper-initialized', true);
      return;
    }

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

    $input.attr('accept', '.csv');
    $fileButton.on('click', () => $input.trigger('click'));

    $input.off('change.import').on('change.import', function () {
      const file = this.files && this.files[0];
      const dialogs = [
        '#ImportSettingsDialog',
        '#ImportSitePackageDialog',
        '#ImportUserTemplateDialog'
      ];

      dialogs.forEach(sel => {
        try { $(`${sel} > p.message-dialog`).remove(); } catch (e) {}
      });

      if (!file) {
        $fileName.text('選択されていません');
        return;
      }

      if (!/\.csv$/i.test(file.name)) {
        const errorHtml = `
          <p class="message-dialog">
            <span class="body alert-error">CSVファイルを選択してください。</span>
          </p>
        `;
        dialogs.forEach(sel => {
          try { $(`${sel} .command-center`).before(errorHtml); } catch (e) {}
        });
        $fileName.text('選択されていません');
        $input.val(null);
        return;
      }

      $fileName.text(file.name);
    });

    $input.data('file-wrapper-initialized', true);
  }

  // ===============================
  // fixEncoding（高速・安全）
  // ===============================
  function fixEncoding(selector) {
    const $enc = $(selector);
    if ($enc && $enc.length) {
      $enc.val('UTF-8').prop('disabled', true);
      return true;
    }
    return false;
  }

  // ===============================
  // MutationObserver（必要な時だけ）
  // ===============================
  let dialogObserver = null;

  function startDialogObserver() {
    stopDialogObserver();

    const dialogContainer =
      document.querySelector('#DialogContainer') ||
      document.body;

    dialogObserver = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (!m.addedNodes || m.addedNodes.length === 0) continue;

        // Import ダイアログが開いた瞬間だけ処理
        if (document.querySelector('#ImportUserTemplate_Import')) {
          setupImportInput($('#ImportUserTemplate_Import'));
        }
        if (document.querySelector('#Import:not(.control-checkbox)')) {
          setupImportInput($('#Import:not(.control-checkbox)'));
        }

        // エンコーディング固定
        fixEncoding('#Encoding');
        fixEncoding('#ExportEncoding');

        // Import ダイアログが完全に初期化されたら監視終了
        if (document.querySelector('#ImportSettingsDialog')) {
          stopDialogObserver();
        }
      }
    });

    dialogObserver.observe(dialogContainer, {
      childList: true,
      subtree: true
    });
  }

  function stopDialogObserver() {
    if (dialogObserver) {
      dialogObserver.disconnect();
      dialogObserver = null;
    }
  }

  // ===============================
  // 初期化（PJAX 対応）
  // ===============================
  function initImportUI() {
    // 既存要素に対して即時初期化
    setupImportInput($('#ImportUserTemplate_Import'));
    setupImportInput($('#Import:not(.control-checkbox)'));

    fixEncoding('#Encoding');
    fixEncoding('#ExportEncoding');

    // ダイアログが開く可能性があるときだけ監視 ON
    startDialogObserver();

    // アイコン適用
    if (window.runIconApply) {
      try { window.runIconApply(); } catch (e) {}
    }
  }

  // PJAX イベント
  document.addEventListener('pjax:end', initImportUI);
  $(document).on('pjax:complete pjax:success', initImportUI);
  $(document).ready(initImportUI);

  // ページ離脱時に監視停止
  window.addEventListener('beforeunload', stopDialogObserver);

})();
