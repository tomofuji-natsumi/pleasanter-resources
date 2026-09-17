// ===============================
// チェックボックス全選択のショートカット（一覧画面）
//
// Ctrl+A（Macはcmd+A）で、一覧のヘッダーにある「全選択」チェックボックスを
// クリックしたのと同じ状態にする。
//
// ⚠️ 個々の行のチェックボックスを直接操作するのではなく、Pleasanter標準の
// 「全選択」ラベル（.grid th:first-child .check-option）自体をクリックする
// 方式にしている。これにより、選択件数の表示・一括操作ボタンの活性化など
// Pleasanter内部の状態管理を壊さずに済む。
//
// ⚠️ 1画面に複数の .grid が存在するケース（ダッシュボード等）を考慮し、
// 単純に最初の .grid ではなく、フォーカス中の要素が属するグリッドを優先し、
// 無ければ画面内で見えている最初のグリッドを対象にする。
// ===============================
(function () {
    'use strict';

    if (window.__selectAllShortcutBound) { return; }
    window.__selectAllShortcutBound = true;

    function findTargetGrid() {
        var $focused = $(document.activeElement).closest('.grid');
        if ($focused.length) { return $focused; }
        return $('.grid:visible').first();
    }

    $(document).on('keydown', function (e) {
        if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'a') { return; }

        // 入力欄でのテキスト全選択（ブラウザ標準動作）は妨げない
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
            return;
        }

        var $grid = findTargetGrid();
        var $selectAllLabel = $grid.find('th:first-child .check-option').first();
        var $checkbox = $selectAllLabel.find('input[type="checkbox"]').first();
        if (!$selectAllLabel.length || !$checkbox.length) { return; }

        e.preventDefault();

        if (!$checkbox.prop('checked')) {
            $selectAllLabel.trigger('click');
        }
    });
})();
