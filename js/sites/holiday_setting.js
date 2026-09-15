// ⚠️ 要設定: 開発環境ごとに実際のSiteIdへ差し替えること。
// 休日カレンダーマスタのSiteIdはJSONの再エクスポートのたびに変わる（休日カレンダーマスタ_検討メモ.md参照）。
const HOLIDAY_CALENDAR_SITE_ID = 24082;

// 月移動・今日へジャンプのキーボードショートカット（左右矢印キー・Tキー）
// 祝日データの取得成否とは無関係に効かせたいため、$.ajaxの外側で一度だけ登録する。
if (!window.__calendarArrowShortcutBound) {
    window.__calendarArrowShortcutBound = true;

    $(document).on("keydown", function (e) {
        // 入力欄でのカーソル移動・タイピングを妨げないようにする
        var tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) {
            return;
        }
        // 他の修飾キーとの組み合わせ（ブラウザ標準操作等）には反応しない
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
            return;
        }

        if (e.key === "ArrowLeft") {
            var $prev = $(".fc-prev-button");
            if ($prev.length) { $prev.trigger("click"); }
        } else if (e.key === "ArrowRight") {
            var $next = $(".fc-next-button");
            if ($next.length) { $next.trigger("click"); }
        } else if (e.key === "t" || e.key === "T") {
            var $today = $(".fc-today-button:not([disabled])");
            if ($today.length) { $today.trigger("click"); }
        }
    });
}

// 表示のたびに毎回APIを待たせないよう、取得結果をsessionStorageに
// キャッシュしておき、次回以降はキャッシュを即座に描画してから
// 裏で最新データを取得・差分があれば再描画する（stale-while-revalidate）。
const HOLIDAY_CACHE_KEY = `holidayMapCache_${HOLIDAY_CALENDAR_SITE_ID}`;

const escapeHtml = (str) =>
    String(str ?? "").replace(/[&<>"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[s]);

const buildHolidayMap = (rows) => {
    const holidayMap = {};
    rows
        .filter(row => row.ClassHash?.ClassA === "200")
        .forEach(row => {
            const date = row.DateHash?.DateA?.substring(0, 10);
            holidayMap[date] = {
                name: row.ClassHash?.ClassE || "",
                type: row.ClassHash?.ClassD
            };
        });
    return holidayMap;
};

const setupHolidayRendering = (getHolidayMap) => {
    const renderHolidays = () => {
        const $cells = $(".fc-daygrid-day[data-date]");
        if ($cells.length === 0) return;

        const holidayMap = getHolidayMap();

        $cells.find(".holiday-name").remove();
        // ⚠️ 休日区分(ClassD)は 100/150/200 の3種類（休日カレンダーマスタのChoicesText参照）。
        // 以前は holiday-300 という存在しない値を含み、実在する holiday-150 が
        // 抜けていたため、月移動時にクラスが正しく除去されないバグがあった。
        $cells.removeClass("holiday-100 holiday-150 holiday-200");

        $cells.each(function () {
            const date = $(this).attr("data-date");
            const holiday = holidayMap[date];
            if (!holiday) return;

            $(this).addClass(`holiday-${holiday.type}`);

            if (holiday.name) {
                const top = $(this).find(".fc-daygrid-day-top");
                if (top.find(".holiday-name").length === 0) {
                    top.append(`<div class="holiday-name">${escapeHtml(holiday.name)}</div>`);
                }
            }
        });
    };

    // 初回
    renderHolidays();

    // ⚠️ 以前は月移動ボタン・navlinkのクリックだけをフックしていたが、
    // FullCalendarの表示切り替え（月/週/日表示等）ボタンは拾えておらず、
    // 切り替えるとFullCalendarがDOMを再構築して祝日表示が消えたまま
    // 再描画されないバグがあった。
    //
    // ⚠️ 一度 #FullCalendar/.fc の要素参照を取得してそれだけを監視する
    // 方式も試したが、月移動・表示切替時にFullCalendarがその要素自体を
    // 作り直す（古い要素が丸ごと入れ替わる）ケースがあり、監視対象が
    // 存在しなくなった古い要素のままになって以降の変化を検知できなくなる
    // バグがあった（初回は表示されるが切替後は消えたままになる症状と一致）。
    // 他のスクリプト（tooltip.js等）と同様、常に存在し続ける document.body
    // を監視することで、この参照切れを避ける。
    const observeOptions = { childList: true, subtree: true };
    let debounceTimer = null;

    // renderHolidays() 自体が .holiday-name の削除・追加等のDOM変更を
    // 行うため、そのままでは自分自身の変更を検知して再度発火し、
    // 無限ループになってしまう。再描画中だけobserverを一時停止することで
    // これを防ぐ。
    const rerender = () => {
        calendarObserver.disconnect();
        renderHolidays();
        calendarObserver.observe(document.body, observeOptions);
    };

    const calendarObserver = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(rerender, 10);
    });

    calendarObserver.observe(document.body, observeOptions);

    return rerender;
};

let holidayMap = {};
let rerenderHolidays = null;

// キャッシュがあれば通信を待たずに即描画する
try {
    const cached = sessionStorage.getItem(HOLIDAY_CACHE_KEY);
    if (cached) {
        holidayMap = JSON.parse(cached);
        rerenderHolidays = setupHolidayRendering(() => holidayMap);
    }
} catch (e) {
    console.warn("[holiday_setting.js] キャッシュの読み込みに失敗", e);
}

$.ajax({
    url: `/api/items/${HOLIDAY_CALENDAR_SITE_ID}/get`,
    type: "POST",
    contentType: "application/json",
    success: function (res) {

        const rows =
            res?.Response?.Data ??
            res?.Response?.Items ??
            res?.Data ??
            res?.Items ??
            [];

        holidayMap = buildHolidayMap(rows);

        try {
            sessionStorage.setItem(HOLIDAY_CACHE_KEY, JSON.stringify(holidayMap));
        } catch (e) {
            console.warn("[holiday_setting.js] キャッシュの保存に失敗", e);
        }

        if (rerenderHolidays) {
            // キャッシュから既に描画済み：最新データで再描画するのみ
            rerenderHolidays();
        } else {
            // キャッシュが無かった：ここで初めて描画・監視を開始する
            rerenderHolidays = setupHolidayRendering(() => holidayMap);
        }
    }
});
