// ===============================
// 読取専用モード時のUI調整
//
// #Notes内に.readonly要素があることを目印に読取専用モードと判定し、body要素にreadonly-modeクラスを付与する。
// 以降の処理はこのクラスを起点に、date-fieldのShadow DOMへのCSS注入など読取専用時のみ必要なUI調整を行う。
//
// ⚠️ ローダー側がB-1対応（<script>要素の重複読み込み防止）により、このファイル自体は
// 画面遷移のたびに再取得・再評価されなくなった。読取専用判定はレコードごとに変わりうるため、
// 判定・UI調整の一式を pjax:complete のたびに再実行する（D-5）。
// ===============================
(function () {
    "use strict";

    function injectDateFieldCSS(shadow) {
        if (!shadow) return;
        if (shadow.querySelector("style[data-hide-current-date]")) return;

        var style = document.createElement("style");
        style.dataset.hideCurrentDate = "true";
        style.textContent = "\n            .current-date {\n                display: none !important;\n            }\n        ";
        shadow.appendChild(style);
    }

    // date-field の Shadow DOM が生成されるまで監視
    //
    // B-5対応：date-fieldのカスタム要素は多くの場合、この関数が呼ばれた時点で
    // 既にshadowRootを持っている（Pleasanter本体のスクリプトが先に読み込まれているため）。
    // その場合は50msポーリングを一切発生させず即座に処理する。
    // shadowRoot生成自体はDOM変更として観測できない（attachShadow()はMutationObserverの
    // 対象にならない）ため、間に合わなかった場合のみポーリングにフォールバックする。
    function watchDateField(df) {
        if (df.shadowRoot) {
            injectDateFieldCSS(df.shadowRoot);
            return;
        }

        var giveUpTimer;
        var timer = setInterval(function () {
            if (df.shadowRoot) {
                injectDateFieldCSS(df.shadowRoot);
                clearInterval(timer);
                clearTimeout(giveUpTimer);
            }
        }, 50);

        // 1秒経っても shadowRoot が無ければ諦める（安全）
        giveUpTimer = setTimeout(function () { clearInterval(timer); }, 1000);
    }

    // 後から追加される date-field の監視は常駐で問題ないため、多重登録を避けて一度だけ登録する
    // 後から追加されるdate-fieldの検知はMutationRecordそのものが必要なため、
    // js/common/dom_watcher.js（デバウンス後にコールバックを呼ぶだけで変更内容は渡さない）には集約できない。
    // 単独のMutationObserverのまま、once（js/common/utils.js）で多重登録だけガードする。
    window.once("readonlyDateFieldObserver", function () {
        var observer = new MutationObserver(function (mutations) {
            if (!document.body.classList.contains("readonly-mode")) return;
            mutations.forEach(function (m) {
                Array.prototype.slice.call(m.addedNodes).forEach(function (node) {
                    if (node.nodeType === 1 && node.tagName && node.tagName.toLowerCase() === "date-field") {
                        watchDateField(node);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    });

    // escapeHtmlはjs/common/utils.js（manifestでこのファイルより先に読まれる）が提供する

    function applyReadonlyUI() {
        // ===============================
        // 2-1. フォーム要素を完全に無効化
        //
        // disabled にすると submit 対象から除外され、読取専用画面から何らかの経路で
        // submit された場合に値が空で保存されてしまうため使わない。
        // text系（readonly対応）は readonly属性、select/checkbox/radio（readonly非対応）は
        // pointer-events:none + tabindex="-1" でクリック・キー操作のみ無効化し、値は送信可能なままにする。
        // ===============================
        $("form input:not([type='hidden']), form textarea, form select, form input[type='checkbox'], form input[type='radio']")
            .each(function () {
                var tag = this.tagName.toLowerCase();
                var type = (this.type || "").toLowerCase();
                if (tag === "select" || type === "checkbox" || type === "radio") {
                    $(this).css("pointer-events", "none").attr("tabindex", "-1");
                } else {
                    $(this).prop("readOnly", true);
                }
            });

        // ===============================
        // 2-2. フィールドをラベル化
        // ===============================
        $(".field-control").each(function () {
            var control = $(this);

            if (control.children(".readonly-value").length > 0) return;

            // input date（flatpickr）
            control.find("input.flatpickr-input").each(function () {
                var val = escapeHtml($(this).val());
                $(this).hide();
                control.append('<div class="readonly-value" data-source-id="' + escapeHtml(this.id) + '">' + val + '</div>');
            });

            // select
            control.find("select.control-dropdown").each(function () {
                $(this).hide();
                control.append('<div class="readonly-value" data-source-id="' + escapeHtml(this.id) + '"></div>');
            });

            // textarea
            control.find("textarea.control-markdown, textarea.control-textarea").each(function () {
                $(this).hide();
                control.append('<div class="readonly-value" data-source-id="' + escapeHtml(this.id) + '"></div>');
            });

            // SunEditor
            var sun = control.find(".sun-editor");
            if (sun.length) {
                sun.addClass("readonly-sun-editor");
            }
        });

        // ===============================
        // 2-2.5 readonly-value に元の値を反映
        // ===============================
        $(".readonly-value").each(function () {
            var sourceId = $(this).attr("data-source-id");
            if (!sourceId) return;

            // data-*属性値をそのまま $() に渡すと、idにドットが含まれる場合に
            // "#Id.Class" と誤解釈されたり、空文字で $("#") が例外を投げたりするため getElementById を使う
            var el = document.getElementById(sourceId);
            if (!el) return;

            var $src = $(el);
            var text = "";

            if ($src.is("select")) {
                text = $src.find("option:selected").map(function () {
                    return $(this).text();
                }).get().join(", ");
            }
            else if ($src.is(":radio")) {
                text = $src.filter(":checked").closest("label").text().trim();
            }
            else if ($src.is(":checkbox")) {
                text = $src.filter(":checked").map(function () {
                    return $(this).closest("label").text().trim();
                }).get().join(", ");
            }
            else {
                text = $src.val();
            }

            $(this).html(escapeHtml(text).replace(/\n/g, "<br>"));
        });

        // ===============================
        // 2-3. 添付ファイルアップロードUIは常に非表示
        // ===============================
        $(".control-attachments-upload").hide();
    }

    function run() {
        var isReadonly = !!document.querySelector("#Notes .readonly");
        document.body.classList.toggle("readonly-mode", isReadonly);
        if (!isReadonly) return;

        // 既存の date-field
        document.querySelectorAll("date-field").forEach(watchDateField);

        applyReadonlyUI();
    }

    $(document).on("pjax:complete", run);
    $(run);
})();
