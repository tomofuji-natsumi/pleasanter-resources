// ===============================
// Pleasanter API の薄いラッパ
//
// POST /api/items/{siteId}/get が calendar_swap_on_drop.js / holiday_setting.js に
// 別々の実装で散在し、ApiVersionの付与漏れ（A-5）・ページング未考慮（B-6）・
// failハンドラ無しが個別に発生していたため、1箇所に集約する（C-3）。
// ===============================
(function () {
    "use strict";

    // 1リクエストあたりの取得件数。Pleasanter側のPageSize上限は実機未検証のため、
    // 上限に張り付く恐れがある巨大な値（旧: 100000）を1回で要求せず、
    // 小さめの値を複数ページに分けて呼ぶことで「上限に達して黙って切り捨てられる」リスクを避ける。
    var FETCH_PAGE_SIZE = 1000;

    // ⚠️ Offsetパラメータ名はPleasanter API実機で未検証。安全側として、
    // ページを重ねてもOffsetが効かず同じ先頭レコードが返り続ける場合は
    // 無限ループにせず1ページ目のみで打ち切る（下記fetchPage内のガード参照）。
    var MAX_PAGES = 100; // 100 * 1000 = 10万件までを安全上限とする（旧DEFAULT_PAGE_SIZEと同水準）

    /**
     * サイトの全レコードを取得する（Offsetを進めながら複数ページを自動で結合する）
     * @param {number|string} siteId
     * @param {Object} [options]
     * @param {number} [options.pageSize] 1ページあたりの取得件数（既定: FETCH_PAGE_SIZE）
     * @param {Object} [options.view] Viewへ追加で渡す指定（PageSize/Offsetとマージされる）
     * @returns {JQuery.Promise} extractRowsで配列を取り出せるレスポンス形式のオブジェクトを渡す
     */
    function getRecords(siteId, options) {
        options = options || {};
        var pageSize = options.pageSize || FETCH_PAGE_SIZE;
        var baseView = options.view || {};

        var deferred = $.Deferred();
        var allRows = [];
        var firstRowId = null;

        function fetchPage(offset, pageCount) {
            var view = $.extend({ PageSize: pageSize, Offset: offset }, baseView);

            $.ajax({
                url: "/api/items/" + siteId + "/get",
                type: "POST",
                contentType: "application/json",
                // Pleasanter APIはApiVersionを要求する（A-5）
                data: JSON.stringify({ ApiVersion: 1.1, View: view })
            }).done(function (res) {
                var rows = extractRows(res);

                if (rows.length === 0) {
                    deferred.resolve({ Response: { Data: allRows } });
                    return;
                }

                // Offsetがサーバーに効いていない（＝実機で未検証のパラメータ名が
                // 間違っている等）場合、毎ページ同じ内容が返り続けて無限ループになる。
                // 2ページ目以降で先頭レコードが変わっていなければそこで打ち切る。
                if (pageCount > 0 && rows[0] && firstRowId !== null && String(rows[0].Id) === firstRowId) {
                    console.warn(
                        "[api] Offsetが効いていない可能性があるため、1ページ目のみで取得を打ち切ります" +
                        "（PleasanterのOffsetパラメータ名は実機未検証）",
                        siteId
                    );
                    deferred.resolve({ Response: { Data: allRows } });
                    return;
                }
                if (pageCount === 0 && rows[0]) {
                    firstRowId = String(rows[0].Id);
                }

                allRows = allRows.concat(rows);

                if (rows.length < pageSize) {
                    // 返却件数がPageSize未満 = 最終ページ
                    deferred.resolve({ Response: { Data: allRows } });
                    return;
                }
                if (pageCount + 1 >= MAX_PAGES) {
                    console.warn(
                        "[api] 安全上限(" + (MAX_PAGES * pageSize) + "件)に達したため、それ以降のレコードは取得していません",
                        siteId
                    );
                    deferred.resolve({ Response: { Data: allRows } });
                    return;
                }

                fetchPage(offset + rows.length, pageCount + 1);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                console.warn("[api] レコード取得に失敗しました", siteId, textStatus, errorThrown);
                deferred.reject(jqXHR, textStatus, errorThrown);
            });
        }

        fetchPage(0, 0);

        return deferred.promise();
    }

    /**
     * レスポンスからレコード配列を取り出す（レスポンス形式のゆらぎを吸収する）
     * @param {Object} res
     * @returns {Array}
     */
    function extractRows(res) {
        return (res && (
            (res.Response && res.Response.Data) ||
            (res.Response && res.Response.Items) ||
            res.Data ||
            res.Items
        )) || [];
    }

    window.pleasanterApi = {
        getRecords: getRecords,
        extractRows: extractRows
    };
})();
