// ===============================
// チェックボックス全選択のショートカット（一覧画面）
//
// Ctrl+A（Macはcmd+A）で、一覧のヘッダーにある「全選択」チェックボックスをクリックしたものと同じ状態にする。
//
// ⚠️ 個々の行のチェックボックスを直接操作するのではなく、Pleasanter標準の「全選択」ラベル（.grid th:first-child .check-option）自体を
// クリックする方式にしている。これにより、選択件数の表示・一括操作ボタンの活性化などPleasanter内部の状態管理を壊さずに済む。
//
// ⚠️ 1画面に複数の .grid が存在するケース（ダッシュボード等）を考慮し、単純に最初の .grid ではなく、
// フォーカス中の要素が属するグリッドを優先し、無ければ画面内で見えている最初のグリッドを対象にする。
// ===============================
(function () {
    'use strict';

    function findTargetGrid() {
        var $focused = $(document.activeElement).closest('.grid');
        if ($focused.length) { return $focused; }
        return $('.grid:visible').first();
    }

    // js/common/shortcut.js（manifestでこのファイルより先に読まれる）が
    // 入力欄ガード・修飾キー判定・多重登録防止を面倒見る
    window.once('selectAllShortcut', function () {
        window.registerShortcut({
            key: 'a',
            ctrlOrMeta: true,
            handler: function (e) {
                var $grid = findTargetGrid();
                var $selectAllLabel = $grid.find('th:first-child .check-option').first();
                var $checkbox = $selectAllLabel.find('input[type="checkbox"]').first();
                if (!$selectAllLabel.length || !$checkbox.length) { return; }

                // 未チェックなら選択、チェック済みなら選択解除（ラベル自体のトグル動作に委ねる）。
                // チェック済みかの判定より前にpreventDefault()すると、2回目のCtrl+Aで
                // ブラウザ標準の全選択もトグル解除も起きない死にキーになるため、判定後に呼ぶ。
                e.preventDefault();
                $selectAllLabel.trigger('click');
            }
        });
    });
})();
