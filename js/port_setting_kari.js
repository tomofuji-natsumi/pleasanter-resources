(function () {
  // ユーティリティ：安全に jQuery 要素を取得
  function $(safeSelector) {
    try { return window.jQuery ? window.jQuery(safeSelector) : null; } catch (e) { return null; }
  }

  // ===============================
  // setupImportInput（冪等化・例外耐性）
  // ===============================
  function setupImportInput($input) {
    if (!$input || !$input.length) return;

    try {
      // 冪等フラグ（data属性）で二重処理を防ぐ
      if ($input.data('file-wrapper-initialized')) return;

      // 既にラップ済みならフラグだけ付けて終了
      if ($input.parent().hasClass('file-wrapper')) {
        $input.data('file-wrapper-initialized', true);
        return;
      }

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

      // change イベントは名前空間付きで登録（後で off しやすい）
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

      $input.data('file-wrapper-initialized', true);
    } catch (err) {
      console.error('setupImportInput error', err);
    }
  }

  // ===============================
  // fixEncoding（安全に）
  // ===============================
  function fixEncoding(selector) {
    try {
      const $enc = $(selector);
      if ($enc && $enc.length) {
        $enc.val('UTF-8').prop('disabled', true);
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  // ===============================
  // Observer 管理（start / stop）
  // ===============================
  let importWatcher = null;
  let exportWatcher = null;

  function startWatchers() {
    stopWatchers(); // 既存があれば止める（冪等）

    // 監視対象を可能ならダイアログコンテナに限定する
    const target = document.body; // 代替: document.querySelector('#DialogContainer') など
    if (!target) return;

    importWatcher = new MutationObserver(() => {
      try {
        fixEncoding('#Encoding');

        const $importUser = $('#ImportUserTemplate_Import');
        const $importMain = $('#Import:not(.control-checkbox)');

        if ($importUser && $importUser.length) setupImportInput($importUser);
        if ($importMain && $importMain.length) {
          setupImportInput($importMain);
          // メインが見つかったら importWatcher は不要
          if (importWatcher) { importWatcher.disconnect(); importWatcher = null; }
        }
      } catch (e) { console.error('importWatcher callback error', e); }
    });

    importWatcher.observe(target, { childList: true, subtree: true });

    exportWatcher = new MutationObserver(() => {
      try {
        if (fixEncoding('#ExportEncoding')) {
          if (exportWatcher) { exportWatcher.disconnect(); exportWatcher = null; }
        }
      } catch (e) { console.error('exportWatcher callback error', e); }
    });

    exportWatcher.observe(target, { childList: true, subtree: true });
  }

  function stopWatchers() {
    try {
      if (importWatcher) { importWatcher.disconnect(); importWatcher = null; }
      if (exportWatcher) { exportWatcher.disconnect(); exportWatcher = null; }
    } catch (e) { /* ignore */ }
  }

  // ===============================
  // 初期化処理（pjax対応）
  // ===============================
  function initImportUI() {
    try {
      // 既に存在する要素に対しても初期化を試みる
      const $importUser = $('#ImportUserTemplate_Import');
      const $importMain = $('#Import:not(.control-checkbox)');
      if ($importUser && $importUser.length) setupImportInput($importUser);
      if ($importMain && $importMain.length) setupImportInput($importMain);

      // エンコーディング固定
      fixEncoding('#Encoding');
      fixEncoding('#ExportEncoding');

      // 監視開始（必要なら）
      startWatchers();

      // アイコン処理があれば呼ぶ（安全に）
      if (window.runIconApply) {
        try { window.runIconApply(); } catch (e) { console.error('runIconApply error', e); }
      }
    } catch (err) {
      console.error('initImportUI error', err);
    }
  }

  // PJAX イベントで確実に初期化（トップロードと遷移後の両方）
  document.addEventListener && document.addEventListener('pjax:end', initImportUI);
  $(document).on && $(document).on('pjax:complete pjax:success', initImportUI);
  $(document).ready(initImportUI);

  // ページアンロード時に監視を止める（メモリ対策）
  window.addEventListener && window.addEventListener('beforeunload', stopWatchers);

})();
