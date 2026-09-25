// ===============================
// Pleasanter インポート/エクスポート制御スクリプト
// ===============================
(function () {
    "use strict";

    // このファイルは画面遷移のたびに再取得・再評価されるため、ガード無しでは
    // MutationObserverが遷移のたびに積み重なってしまう。
    window.once("portSetting", function () {

    // ===============================
    // 1. ファイル種別の定義
    //    親フォームのIDで種別を判定し、
    //    accept・エラーメッセージを切り替える
    // ===============================
    const FILE_TYPE_MAP = {
        SitePackageForm: {
            accept:    ".json",
            pattern:   /\.json$/i,
            errorText: "JSONファイルを選択してください。",
        },
        _default: {
            accept:    ".csv",
            pattern:   /\.csv$/i,
            errorText: "CSVファイルを選択してください。",
        },
    };

    function getFileType(input) {
        const formId = input.closest("form").attr("id");
        return FILE_TYPE_MAP[formId] || FILE_TYPE_MAP._default;
    }

    // ===============================
    // 2. 処理済み要素の管理（WeakSet）
    //    ダイアログ再描画時は新しいDOMノードが
    //    生成されるため、自動的にガードをすり抜ける
    // ===============================
    const setupDone = new WeakSet();

    // ===============================
    // 3. エンコーディング固定ヘルパー
    //    完了後に encoding-ready を付与して表示
    //
    //    disabled にすると submit 対象から除外され、Encodingパラメータがサーバに
    //    届かなくなるため使わない。select は readonly 非対応のため、
    //    pointer-events:none + tabindex="-1" でクリック・キー操作のみ無効化する。
    // ===============================
    function fixEncoding($el) {
        if (!$el.length || setupDone.has($el[0])) return;
        setupDone.add($el[0]);
        $el.val("UTF-8").css("pointer-events", "none").attr("tabindex", "-1");
        $el.addClass("encoding-ready");
    }

    // ===============================
    // 4. エラーメッセージのクリア・表示
    //    closest() で表示中ダイアログのみを対象にする
    // ===============================
    function clearError(input) {
        input.closest("[id$='Dialog'], form")
            .find("p.message-dialog")
            .remove();
    }

    function showError(input, text) {
        clearError(input);
        const $container = input.closest("[id$='Dialog'], form");
        const $anchor    = $container.find(".command-center");
        const $error     = $("<p>", { class: "message-dialog" })
            .append($("<span>", { class: "body alert-error", text }));
        $anchor.before($error);
    }

    // ===============================
    // 5. input セットアップ
    //    完了後に import-ready を付与して表示
    // ===============================
    function setupImportInput(input) {
        if (!input.length) return;

        const el = input[0];
        if (setupDone.has(el)) return;
        setupDone.add(el);

        // wrapper がなければ生成
        if (!input.parent().hasClass("file-wrapper")) {
            const $wrapper = $('<div class="file-wrapper">')
                .append('<div class="file-button" role="button" tabindex="0">選択</div>')
                .append('<span class="file-name">選択されていません</span>');
            input.after($wrapper);
            $wrapper.append(input);
        }

        const $wrapper    = input.parent();
        const $fileButton = $wrapper.find(".file-button");
        const $fileName   = $wrapper.find(".file-name");
        const fileType    = getFileType(input);

        // accept 属性を種別に応じてセット
        input.attr("accept", fileType.accept);

        // ボタンクリックで input を起動
        $fileButton.off("click.import").on("click.import", function () {
            input.trigger("click");
        });

        // role="button"のdivはネイティブのbuttonと違いEnter/Spaceで発火しないため、
        // キーボードのみの操作でもファイル選択に到達できるよう明示的にハンドラを追加する
        $fileButton.off("keydown.import").on("keydown.import", function (e) {
            if (e.key !== "Enter" && e.key !== " ") { return; }
            e.preventDefault();
            input.trigger("click");
        });

        // ファイル選択時の処理
        input.off("change.import").on("change.import", function () {
            const file = this.files[0];
            clearError(input);

            if (!file) {
                $fileName.text("選択されていません");
                return;
            }

            if (!fileType.pattern.test(file.name)) {
                showError(input, fileType.errorText);
                $fileName.text("選択されていません");
                $(this).val(null);
                return;
            }

            $fileName.text(file.name);
        });

        // セットアップ完了 → 表示
        input.addClass("import-ready");
    }

    // ===============================
    // 6. 常時監視（js/common/dom_watcher.js に集約。manifestでこのファイルより先に読まれる）
    //    ダイアログは開くたびに新しいDOMノードを生成するため、
    //    WeakSet のガードで二重処理を防ぐ
    // ===============================
    function runChecks() {
        // --- インポート エンコーディング固定 ---
        fixEncoding($("#Encoding"));

        // --- エクスポート エンコーディング固定 ---
        fixEncoding($("#ExportEncoding"));

        // --- CSV / サイトパッケージ インポート ---
        const $csvImport  = $("#Import:not(.control-checkbox)");
        const $siteImport = $("#SitePackageForm #Import");
        if ($csvImport.length)  setupImportInput($csvImport);
        if ($siteImport.length) setupImportInput($siteImport);

        // --- ユーザーテンプレート インポート ---
        const $tmpl = $("#ImportUserTemplate_Import");
        if ($tmpl.length) setupImportInput($tmpl);
    }

    window.__pleasanterWatch(runChecks, { delay: 25, guard: "portSetting" });

    });
})();

// ===============================
// エクスポート中の進捗フィードバック（CSV・JSON共通）
//
// #DoExport クリック時、ファイル生成中であることを示すオーバーレイを表示する。
// #DoExportはCSVエクスポート・サイトパッケージ（JSON）エクスポートの両方で
// 使われる共通ボタンのため、形式を問わず動作する。
//
// ⚠️ エクスポートはブラウザの通常のダウンロード機構（フォーム送信等）に
// 委ねられており、「生成完了」を示すJS側のイベントが存在しない（未検証）。
// そのため、#ExportSelectorDialog が閉じたタイミング、または
// SAFETY_TIMEOUT_MS経過のどちらか早い方でオーバーレイを消す方式にしている。
// ===============================
(function () {
    'use strict';

    var SAFETY_TIMEOUT_MS = 10000;

    window.once("exportProgress", function () {

    // js/common/overlay.js（manifestでこのファイルより先に読まれる）が生成を面倒見る。
    // Escape・外側クリックでの非表示は用途に合わないため無効にする
    var overlay = window.createOverlay('export-progress-overlay',
        '<div id="export-progress-overlay">' +
            '<div class="export-progress-box">' +
                '<span class="export-progress-spinner"></span>' +
                '<span>エクスポート中です。しばらくお待ちください。</span>' +
            '</div>' +
        '</div>',
        { closeOnBackdrop: false, closeOnEscape: false }
    );

    $(document).on('click', '#DoExport', function () {
        overlay.show();

        var hideTimer = setTimeout(overlay.close, SAFETY_TIMEOUT_MS);

        // ダイアログが閉じた時点でエクスポート操作自体は終わっているとみなす。
        // jQuery UIのダイアログは中身自体ではなく親のラッパー（.ui-dialog）側の
        // 表示状態を変更して閉じる実装が多いため、#ExportSelectorDialog自身の
        // 属性だけでなく document.body 全体のDOM変化を監視し、is(':visible') で
        // 実際の表示状態（祖先要素の非表示も含む）を判定する。
        var $dialog = $('#ExportSelectorDialog');
        if ($dialog.length) {
            var dialogObserver = new MutationObserver(function () {
                if (!$dialog.is(':visible')) {
                    clearTimeout(hideTimer);
                    overlay.close();
                    dialogObserver.disconnect();
                }
            });
            dialogObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    });

    });
})();
