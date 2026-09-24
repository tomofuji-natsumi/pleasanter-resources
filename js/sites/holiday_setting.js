// ===============================
// カレンダー画面：祝日表示・月移動ショートカット
//
// 休日カレンダーマスタ（別サイト）から祝日データを取得し、カレンダー画面に祝日名を表示する。
// あわせて、左右矢印キーでの月移動・Tキーでの今日へのジャンプもここで扱う。
//
// 休日カレンダーマスタのSiteIdはJSONの再エクスポートのたびに変わる上、
// 環境（DEV/本番）ごとに異なるため、git管理のsite_ids.jsonから取得する。
// 環境の判定はwindow.__pleasanterEnv（サイト個別設定側で"dev"等をセット、未設定時は"prod"扱い）による。
// ===============================
(function () {
    "use strict";

const PLEASANTER_ENV = window.__pleasanterEnv || "prod";

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
        // 休日区分(ClassD)の値がハードコードリストと食い違うと除去漏れが起きるため、
        // "holiday-"接頭のクラスを総なめして除去する（以前 holiday-300 を含み holiday-150 が抜けていたバグの再発防止）。
        $cells.removeClass(function (i, classNames) {
            return (classNames.match(/(^|\s)holiday-\S+/g) || []).join(" ");
        });

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

    // 常に存在し続ける document.bodyを監視することで、参照切れを避ける。
    const observeOptions = { childList: true, subtree: true };
    let debounceTimer = null;

    // renderHolidays() 自体が .holiday-name の削除・追加等のDOM変更を行うため、
    // そのままでは自分自身の変更を検知して再度発火し、無限ループになってしまう。
    // 再描画中だけobserverを一時停止することでこれを防ぐ。
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

// 環境（DEV/本番）ごとの休日カレンダーマスタSiteIdはgit管理のsite_ids.jsonから取得する。
// SiteIdがJSONの再エクスポート等で変わった場合はsite_ids.jsonの編集のみで反映される。
//
// ⚠️ このスクリプトは全画面共通で読み込まれるため、カレンダー画面以外では以降のAPI呼び出し・MutationObserver起動を一切行わないようガードする。
// カレンダー画面はURL（/items/{SiteId}/calendar）で判定する（FullCalendarの描画タイミングに依存させないため）。
// 一覧画面のダッシュボードにカレンダーウィジェットを置く場合もあるため、.dashboard-calendar-container の存在でも読み込む
if (/\/calendar(?:[/?#]|$)/.test(location.pathname) || $(".dashboard-calendar-container").length > 0) {
$.getJSON("https://cdn.jsdelivr.net/gh/tomofuji-natsumi/pleasanter-resources@js_fix/js/site_ids.json")
    .done(function (siteIds) {
        const HOLIDAY_CALENDAR_SITE_ID = siteIds?.[PLEASANTER_ENV]?.holidayCalendarSiteId;
        if (!HOLIDAY_CALENDAR_SITE_ID) {
            console.warn(`[holiday_setting.js] 環境"${PLEASANTER_ENV}"の休日カレンダーマスタSiteIdが未設定です`);
            return;
        }

        // 表示のたびに毎回APIを待たせないよう、取得結果をsessionStorageにキャッシュしておき、
        // 次回以降はキャッシュを即座に描画してから裏で最新データを取得・差分があれば再描画する（stale-while-revalidate）。
        const HOLIDAY_CACHE_KEY = `holidayMapCache_${HOLIDAY_CALENDAR_SITE_ID}`;

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
    })
    .fail(function (e) {
        console.warn("[holiday_setting.js] site_ids.json の読み込みに失敗", e);
    });
}

})();
