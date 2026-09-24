// ===============================
// Pleasanter API の薄いラッパ
//
// POST /api/items/{siteId}/get が calendar_swap_on_drop.js / holiday_setting.js に
// 別々の実装で散在し、ApiVersionの付与漏れ（A-5）・ページング未考慮（B-6）・
// failハンドラ無しが個別に発生していたため、1箇所に集約する（C-3）。
// ===============================
(function () {
    "use strict";

    // Viewを指定しない場合の既定件数（200件）を超えるサイトでも全件取得できるようにする（B-6）。
    // ⚠️ 上限はPleasanter側設定に依存するため実機確認が必要。
    var DEFAULT_PAGE_SIZE = 100000;

    /**
     * サイトの全レコードを取得する
     * @param {number|string} siteId
     * @param {Object} [options]
     * @param {number} [options.pageSize] Viewに渡すPageSize（既定: DEFAULT_PAGE_SIZE）
     * @param {Object} [options.view] Viewへ追加で渡す指定（pageSizeとマージされる）
     * @returns {JQuery.jqXHR}
     */
    function getRecords(siteId, options) {
        options = options || {};
        var view = $.extend({ PageSize: options.pageSize || DEFAULT_PAGE_SIZE }, options.view || {});

        return $.ajax({
            url: "/api/items/" + siteId + "/get",
            type: "POST",
            contentType: "application/json",
            // Pleasanter APIはApiVersionを要求する（A-5）
            data: JSON.stringify({ ApiVersion: 1.1, View: view })
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.warn("[api] レコード取得に失敗しました", siteId, textStatus, errorThrown);
        });
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
