(function () {

  // ===============================
  // jQuery セーフラッパー
  // ===============================
  function $(sel) {
    try { return window.jQuery ? window.jQuery(sel) : null; }
    catch (e) { return null; }
  }

  // ===============================
  // setupImportInput（冪等化強化）
  // ===============================
  function setupImportInput($input) {
    if (!$input || !$input.length) return;

    // すでに初期化済みなら即 return
    if ($input.data('file-wrapper-initialized')) return;
    $input.data('file-wrapper-initialized', true);

    // すでにラップ済みなら終了
    if ($input.parent().hasClass('file-wrapper')) return;

    const $wrapper = window.jQuery(`
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

    // change イベントを一度だけ登録
    $input.off('change.import').on('change.import', function () {
      const file = this.files && this.files[0];
      const dialogs = [
        '#ImportSettingsDialog',
        '#ImportSitePackageDialog',
        '#ImportUserTemplateDialog'
      ];

      dialogs.forEach(sel => {
        try { window.jQuery(`${sel} > p.message-dialog`).remove(); } catch (e) {}
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
          try { window.jQuery(`${sel} .command-center`).before(errorHtml); } catch (e) {}
        });
        $fileName.text('選択されていません');
        $input.val(null);
        return;
      }

      $fileName.text(file.name);
    });
  }

  // ===============================
  // fixEncoding（無限ループ防止）
  // ===============================
  function fixEncoding(selector) {
    try {
      const $enc = $(selector);
      if ($enc && $enc.length) {
        if ($enc.val() !== 'UTF-8') {
          $enc.val('UTF-8');
        }
        if (!$enc.prop('disabled')) {
          $enc.prop('disabled', true);
        }
        return true;
      }
    } catch (e) {}
    return false;
  }

  // ===============================
  // MutationObserver（暴走防止）
  // ===============================
  let importWatcher = null;
  let exportWatcher = null;

  function startWatchers() {
    stopWatchers();

    // 監視対象をダイアログ領域に限定
    const target = document.querySelector('#DialogContainer') || document.body;
    if (!target) return;

    importWatcher = new MutationObserver(() => {
      try {
        fixEncoding('#Encoding');

        const $importUser = $('#ImportUserTemplate_Import');
        const $importMain = $('#Import:not(.control-checkbox)');

        if ($importUser && $importUser.length) setupImportInput($importUser);

        if ($importMain && $importMain.length) {
          setupImportInput($importMain);
          // メインが見つかったら監視終了
          importWatcher.disconnect();
          importWatcher = null;
        }
      } catch (e) {}
    });

    importWatcher.observe(target, { childList: true, subtree: true });

    exportWatcher = new MutationObserver(() => {
      try {
        if (fixEncoding('#ExportEncoding')) {
          exportWatcher.disconnect();
          exportWatcher = null;
        }
      } catch (e) {}
    });

    exportWatcher.observe(target, { childList: true, subtree: true });
  }

  function stopWatchers() {
    try {
      if (importWatcher) { importWatcher.disconnect(); importWatcher = null; }
      if (exportWatcher) { exportWatcher.disconnect(); exportWatcher = null; }
    } catch (e) {}
  }

  // ===============================
  // initImportUI（多重実行防止）
  // ===============================
  let initialized = false;

  function initImportUI() {
    if (initialized) return;
    initialized = true;

    try {
      const $importUser = $('#ImportUserTemplate_Import');
      const $importMain = $('#Import:not(.control-checkbox)');
      if ($importUser && $importUser.length) setupImportInput($importUser);
      if ($importMain && $importMain.length) setupImportInput($importMain);

      fixEncoding('#Encoding');
      fixEncoding('#ExportEncoding');

      startWatchers();

      if (window.runIconApply) {
        try { window.runIconApply(); } catch (e) {}
      }
    } catch (err) {
      console.error('initImportUI error', err);
    }
  }

  // ===============================
  // イベント登録（1回だけ）
  // ===============================
  document.addEventListener('pjax:end', initImportUI, { once: true });
  $(document).one && $(document).one('pjax:complete pjax:success', initImportUI);
  $(document).ready(initImportUI);

  window.addEventListener('beforeunload', stopWatchers);

})();
