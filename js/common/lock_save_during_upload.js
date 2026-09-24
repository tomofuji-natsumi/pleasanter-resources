// ===============================
// 添付ファイルアップロード中の保存ボタン制御
//
// 添付欄のアップロード中は `<div id="{列名}.status">`（進捗バー+キャンセルリンク）
// が表示される（例: #AttachmentsA.status）。列名は列ごとに異なるため、
// 属性セレクタ [id$=".status"] で列名に依存せず汎用的に検知する。
//
// アップロード中の進捗バー（内側divのstyle="width:...px"）は継続的に更新される
// ため、MutationObserverが高頻度で再評価され、他のスクリプト
// （prevent_double_submit.js の再有効化タイマー等）が保存ボタンを
// 先に有効化してしまっても、直後の再評価で確実に無効化し直される。
//
// マニフェスト未登録の個別貼り付け用ファイル。js/common/dom_watcher.js（manifestのAllに
// 登録済みで全画面で先に読まれる）が定義するwindow.__pleasanterWatchに依存する。
//
// ⚠️ B-4対応：属性変更（style/class）の監視は document.body 全体ではなく、
// 添付欄コンテナ（.control-attachments）だけに絞る。進捗バーの style="width:…" 更新が
// 添付欄と無関係な箇所の変更まで拾ってしまうのを避けるため。
// ===============================
(function () {
    'use strict';

    var LOCK_MESSAGE = 'ファイルのアップロード完了までお待ちください';
    var CONTAINER_SELECTOR = '.control-attachments';

    function isUploading() {
        // 「アップロード中の要素が1つでも見えているか」だけが分かればよいため、
        // 全件フィルタせず最初の可視要素が見つかった時点で打ち切る
        var uploading = false;
        $('[id$=".status"]').each(function () {
            if ($(this).is(':visible')) {
                uploading = true;
                return false;
            }
        });
        return uploading;
    }

    function updateButtons() {
        var uploading = isUploading();
        var $buttons = $('#CreateCommand, #UpdateCommand');

        $buttons.toggleClass('is-upload-locked', uploading);
        $buttons.attr('title', uploading ? LOCK_MESSAGE : '');

        // prevent_double_submit.js が付与する is-submitting クラス（多重送信防止）を
        // ここで無条件に解除してしまうと二重送信防止が50ms程度しか効かなくなる。
        // アップロード中は無条件で無効化するが、アップロード終了時は
        // 他スクリプトによるロックが無い場合のみ有効化し直す。
        $buttons.each(function () {
            var $btn = $(this);
            if (uploading) {
                $btn.prop('disabled', true);
            } else if (!$btn.hasClass('is-submitting')) {
                $btn.prop('disabled', false);
            }
        });
    }

    // .control-attachments コンテナだけを対象にした専用Observer（attributes:trueをbody全体にかけない）
    var attachmentObserver = null;
    var observedContainers = new WeakSet();
    var debounceTimer = null;

    function scheduleUpdate() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateButtons, 50);
    }

    function syncObservedContainers() {
        var containers = document.querySelectorAll(CONTAINER_SELECTOR);
        if (!containers.length) { return; }

        if (!attachmentObserver) {
            attachmentObserver = new MutationObserver(scheduleUpdate);
        }
        containers.forEach(function (el) {
            if (observedContainers.has(el)) { return; }
            observedContainers.add(el);
            attachmentObserver.observe(el, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        });
    }

    window.once('lockSaveDuringUpload', function () {
        syncObservedContainers();

        // 添付欄コンテナ自体が後から追加されるケース（繰り返しテーブル項目の追加等）に備え、
        // 軽量なchildListのみのdom_watcher（attributes:falseなので低コスト）で
        // 新規コンテナの出現を検知し、専用Observerの監視対象に追加する
        window.__pleasanterWatch(syncObservedContainers, { delay: 200, guard: 'lockSaveDuringUploadContainers' });
    });

    updateButtons();
})();
