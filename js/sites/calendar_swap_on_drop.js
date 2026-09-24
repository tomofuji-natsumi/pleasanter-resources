// ===============================
// カレンダー予定のドラッグ移動：移動先に既存レコードがある場合の日付入れ替え
//
// FullCalendarのインスタンスに外部からアクセスする手段が無いため、ドラッグ移動時にPleasanterが送信するAjaxリクエスト
// （POST /items/{SiteId}/updatebycalendar、実機確認済み）を$.ajaxPrefilterで横取りする方式にしている。
//
// 汎用化のため、SiteId・レコードID・日付列名（Results_XXX）は
// すべてリクエスト自体から動的に取り出しており、特定サイト・特定列名には依存しない。
//
// 処理の流れ:
// 1. updatebycalendar宛のリクエストを検知したら、元のリクエストはいったん中止する（beforeSendでfalseを返す＝jQuery標準のキャンセル方法）
// 2. 対象サイトの全レコードを取得し、移動先の日付に別レコードが既に存在するか確認する（ColumnFilterHashの日付絞り込みは他サイトの
//    実機検証でも不安定だったため、全件取得してクライアント側で比較するholiday_setting.js等と同じ方式を採用）
// 3a. 衝突が無ければ、元のリクエストと同内容で送り直すだけ（通常の移動）
// 3b. 衝突があれば、確認ダイアログを出し、OKの場合のみ
//     「ドラッグしたレコード→移動先の日付」「衝突したレコード→ドラッグしたレコードの元の日付」の2件を送信する（入れ替え）。キャンセルした場合は何も送信しない。
// 4. どの分岐でも、最終的に画面をリロードしてカレンダー表示を正しい状態に同期する（FullCalendar側に再取得を指示する手段が無いための代替策）
//
// ⚠️ 自分自身が送り直すリクエストを再度横取りしてしまわないよう、
// __calendarSwapRetry フラグを付けて識別している。
// ===============================
(function () {
    'use strict';

    if (window.__calendarSwapOnDropBound) { return; }
    window.__calendarSwapOnDropBound = true;

    var UPDATE_URL_PATTERN = /\/items\/(\d+)\/updatebycalendar(?:$|\?)/;

    function parseFormData(data) {
        var result = {};
        if (typeof data === 'string') {
            data.split('&').forEach(function (pair) {
                if (!pair) { return; }
                var idx = pair.indexOf('=');
                var key = decodeURIComponent(idx === -1 ? pair : pair.slice(0, idx));
                var value = idx === -1 ? '' : decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '));
                result[key] = value;
            });
        } else if (data && typeof data === 'object') {
            $.extend(result, data);
        }
        return result;
    }

    function toDateKey(value) {
        var d = new Date(value);
        if (isNaN(d.getTime())) { return null; }
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    }

    function findDateFieldKey(fields) {
        return Object.keys(fields).filter(function (key) {
            return key.indexOf('Results_') === 0 && key !== 'Results_undefined';
        })[0];
    }

    function sendCalendarUpdate(url, baseFields, overrides) {
        var data = $.extend({}, baseFields, overrides);
        return $.ajax({
            url: url,
            type: 'POST',
            data: data,
            __calendarSwapRetry: true
        });
    }

    $.ajaxPrefilter(function (options, originalOptions) {
        if (options.__calendarSwapRetry) { return; }

        var match = UPDATE_URL_PATTERN.exec(options.url || '');
        if (!match || (options.type || '').toUpperCase() !== 'POST') { return; }

        var siteId = match[1];
        var fields = parseFormData(originalOptions.data);
        var recordId = fields['Id'];
        var dateFieldKey = findDateFieldKey(fields);
        if (!recordId || !dateFieldKey) { return; }

        var columnName = dateFieldKey.replace('Results_', '');
        var newDateValue = fields[dateFieldKey];

        // 元のリクエストはここで中止し、衝突確認後に自分たちで送り直す
        options.beforeSend = function () { return false; };

        // js/common/api.js（manifestでこのファイルより先に読まれる）が
        // ApiVersionの付与（A-5）・ページング対策（B-6）・失敗時のwarnを面倒見る
        window.pleasanterApi.getRecords(siteId).done(function (res) {
            var rows = window.pleasanterApi.extractRows(res);
            var targetKey = toDateKey(newDateValue);

            var draggedRow = rows.find(function (row) {
                return String(row.Id) === String(recordId);
            });
            var originalDateValue = draggedRow && draggedRow.DateHash && draggedRow.DateHash[columnName];
            if (!draggedRow || originalDateValue === undefined) {
                console.warn('[calendar_swap_on_drop] ドラッグ元レコードの元の日付が取得できないため入れ替えを中止します', recordId);
                sendCalendarUpdate(options.url, fields, {}).always(function () {
                    location.reload();
                });
                return;
            }

            var collisionRow = rows.find(function (row) {
                if (String(row.Id) === String(recordId)) { return false; }
                var rowValue = row.DateHash && row.DateHash[columnName];
                return rowValue && toDateKey(rowValue) === targetKey;
            });

            if (!collisionRow) {
                sendCalendarUpdate(options.url, fields, {}).always(function () {
                    location.reload();
                });
                return;
            }

            var collisionTitle = collisionRow.Title || ('レコード#' + collisionRow.Id);
            var confirmed = window.confirm(
                '移動先の日付には既に「' + collisionTitle + '」が登録されています。\n' +
                '日付を入れ替えますか？\n\n' +
                'いいえ を選ぶと、この移動は取り消されます。'
            );

            if (!confirmed) {
                location.reload();
                return;
            }

            // 衝突相手には Id と日付列だけを送る（ドラッグしたレコードのタイトル等を巻き込まないため baseFields は空にする）
            var collisionFields = {};
            collisionFields['Id'] = collisionRow.Id;
            collisionFields[dateFieldKey] = originalDateValue;

            // 同一サイト・同一日付列への更新が競合しないよう直列に送信する
            sendCalendarUpdate(options.url, fields, {}).then(function () {
                return sendCalendarUpdate(options.url, {}, collisionFields);
            }).always(function () {
                location.reload();
            });
        }).fail(function () {
            // 衝突確認ができない場合は、通常の移動として元のリクエストを送り直す
            sendCalendarUpdate(options.url, fields, {}).always(function () {
                location.reload();
            });
        });
    });
})();
