(function () {
  // ===============================
  // jQuery セーフラッパー
  // ===============================
  function $(sel) {
    try { return window.jQuery ? window.jQuery(sel) : null; }
    catch (e) { return null; }
  }

  // ===============================
  // setupImportInput（DOM変化を最小限に）
  // ===============================
  function setupImportInput($input) {
    if (!$input || !$input.length) return;

    if ($input.data('file-wrapper-initialized')) return;
    $input.data('file-wrapper-initialized', true);

    // すでにラップ済みなら何もしない
    if ($input.parent().hasClass('file-wrapper')) return;

    // ここでの DOM 変更は一度きり
    const $wrapper = window.jQuery(
      '<div class="file-wrapper">' +
        '<div class="file-button">選択</div>' +
        '<span class="file-name">選択されていません</span>' +
      '</div>'
    );

    // レイアウトの揺れを減らすため、先に wrapper を DOM に入れてから input を移動
    $input.after($wrapper);
    $wrapper.append($input);

    const $fileButton = $wrapper.find('.file-button');
    const $fileName = $wrapper.find('.file-name');

    $input.attr('accept', '.csv');

    $fileButton.off('click.import').on('click.import', () => {
      $input.trigger('click');
    });

    $input.off('change.import').on('change.import', function () {
      const file = this.files && this.files[0];
      const dialogs = [
        '#ImportSettingsDialog',
        '#ImportSitePackageDialog',
        '#ImportUserTemplateDialog'
      ];

      dialogs.forEach(sel => {
        try { window.jQuery(sel + ' > p.message-dialog').remove(); } catch (e) {}
      });

      if (!file) {
        $fileName.text('選択されていません');
        return;
      }

      if (!/\.csv$/i.test(file.name)) {
        const errorHtml =
          '<p class="message-dialog">' +
            '<span class="body alert-error">CSVファイルを選択してください。</span>' +
          '</p>';
        dialogs.forEach(sel => {
          try { window.jQuery(sel + ' .command-center').before(errorHtml); } catch (e) {}
        });
        $fileName.text('選択されていません');
        $input.val(null);
        return;
      }

      $fileName.text(file.name);
    });
  }

  // ===============================
  // fixEncoding（必要なときだけ変更）
  // ===============================
  function fixEncoding(selector) {
    try {
      const $enc = $(selector);
      if ($enc && $enc.length) {
        let changed = false;
        if ($enc.val() !== 'UTF-8') {
          $enc.val('UTF-8');
          changed = true;
        }
        if (!$enc.prop('disabled')) {
          $enc.prop('disabled', true);
          changed = true;
        }
        return changed;
      }
    } catch (e) {}
    return false;
  }

  // ===============================
  // 初期化（イベント単位で一度だけ）
  // ===============================
  let initializedOnce = false;

  function initImportUI() {
    // pjax / ready など複数経路から呼ばれても、一度だけ本処理
    if (initializedOnce) return;
    initializedOnce = true;

    try {
      const $importUser = $('#ImportUserTemplate_Import');
      const $importMain = $('#Import:not(.control-checkbox)');

      if ($importUser && $importUser.length) {
        setupImportInput($importUser);
      }
      if ($importMain && $importMain.length) {
        setupImportInput($importMain);
      }

      fixEncoding('#Encoding');
      fixEncoding('#ExportEncoding');

      // アイコン適用はここで一度だけ
      if (window.runIconApply) {
        try { window.runIconApply(); } catch (e) { console.error('runIconApply error', e); }
      }
    } catch (err) {
      console.error('initImportUI error', err);
    }
  }

  // ===============================
  // イベント登録
  // ===============================

  // ページロード時
  $(document).ready(initImportUI);

  // pjax 完了時（必要ならどれか一つに絞る）
  if (document.addEventListener) {
    document.addEventListener('pjax:end', initImportUI, { once: true });
  }
  if ($(document).one) {
    $(document).one('pjax:complete pjax:success', initImportUI);
  }

  // beforeunload で特にやることはないが、将来用にフックだけ残す
  if (window.addEventListener) {
    window.addEventListener('beforeunload', function () {
      // 今は何もしない（Observer も使っていない）
    });
  }

})();
