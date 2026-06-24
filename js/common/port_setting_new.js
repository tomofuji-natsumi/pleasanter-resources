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
    // 2. wrapper 二重生成ガード（WeakSet）
    // ===============================
    const setupDone = new WeakSet();

    // ===============================
    // 3. エラーメッセージのクリア・表示
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
    // 4. input セットアップ
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
    // 5. import / export を1本の Observer で監視
    //    条件がすべて揃ったら disconnect
    // ===============================
    let csvReady      = false;
    let templateReady = false;
    let exportReady   = false;

    function checkAndDisconnect() {
        if (csvReady && templateReady && exportReady) {
            watcher.disconnect();
        }
    }

    const watcher = new MutationObserver(function () {
        // --- CSV インポート ---
        if (!csvReady) {
            const $enc = $("#Encoding");
            if ($enc.length) {
                $enc.val("UTF-8").prop("disabled", true);
            }
            // #Import:not(.control-checkbox) = CSVインポート用
            // #Import in #SitePackageForm    = サイトパッケージ用
            const $csvImport  = $("#Import:not(.control-checkbox)");
            const $siteImport = $("#SitePackageForm #Import");

            if ($csvImport.length) {
                setupImportInput($csvImport);
                csvReady = true;
                checkAndDisconnect();
            }
            if ($siteImport.length) {
                setupImportInput($siteImport);
                csvReady = true;
                checkAndDisconnect();
            }
        }

        // --- ユーザーテンプレート インポート ---
        if (!templateReady) {
            const $tmpl = $("#ImportUserTemplate_Import");
            if ($tmpl.length) {
                setupImportInput($tmpl);
                templateReady = true;
                checkAndDisconnect();
            }
        }

        // --- エクスポート エンコーディング固定 ---
        if (!exportReady) {
            const $expEnc = $("#ExportEncoding");
            if ($expEnc.length) {
                $expEnc.val("UTF-8").prop("disabled", true);
                exportReady = true;
                checkAndDisconnect();
            }
        }
    });

    watcher.observe(document.body, {
        childList: true,
        subtree:   true,
    });

})();
