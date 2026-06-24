// ===============================
// Pleasanter インポート/エクスポート制御スクリプト
// ===============================
(function () {
    "use strict";

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
    // ===============================
    function fixEncoding($el) {
        if (!$el.length || setupDone.has($el[0])) return;
        setupDone.add($el[0]);
        $el.val("UTF-8").prop("disabled", true);
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
    // ===============================
    function setupImportInput(input) {
        if (!input.length) return;

        const el = input[0];
        if (setupDone.has(el)) return;
        setupDone.add(el);

        // wrapper がなければ生成
        if (!input.parent().hasClass("file-wrapper")) {
            const $wrapper = $('<div class="file-wrapper">')
                .append('<div class="file-button">選択</div>')
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
        $fileButton.off("click").on("click", function () {
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
    }

    // ===============================
    // 6. 常時監視 Observer
    //    disconnect しない — ダイアログは開くたびに
    //    新しいDOMノードを生成するため、
    //    WeakSet のガードで二重処理を防ぐ
    // ===============================
    const watcher = new MutationObserver(function () {
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
    });

    watcher.observe(document.body, {
        childList: true,
        subtree:   true,
    });

})();
