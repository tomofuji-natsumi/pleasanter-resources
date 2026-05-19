$.ajax({
    url: "/api/items/24082/get",
    type: "POST",
    contentType: "application/json",
    success: function (res) {

        const rows =
            res?.Response?.Data ??
            res?.Response?.Items ??
            res?.Data ??
            res?.Items ??
            [];

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

        const renderHolidays = () => {
            const $cells = $(".fc-daygrid-day[data-date]");
            if ($cells.length === 0) return;

            $(".holiday-name").remove();
            $cells.removeClass("holiday-100 holiday-200 holiday-300");

            $cells.each(function () {
                const date = $(this).attr("data-date");
                const holiday = holidayMap[date];
                if (!holiday) return;

                $(this).addClass(`holiday-${holiday.type}`);

                if (holiday.name) {
                    const top = $(this).find(".fc-daygrid-day-top");
                    if (top.find(".holiday-name").length === 0) {
                        top.append(`<div class="holiday-name">${holiday.name}</div>`);
                    }
                }
            });
        };

        // 初回
        renderHolidays();

        // ★ 監視対象は「絶対に消えない .fc」
        const container = document.querySelector(".fc");
        let renderScheduled = false;

        if (container) {
            const observer = new MutationObserver(() => {

                // .fc-daygrid-day が出現したら一度だけ実行
                if (document.querySelector(".fc-daygrid-day[data-date]")) {

                    if (!renderScheduled) {
                        renderScheduled = true;

                        setTimeout(() => {
                            renderHolidays();
                            renderScheduled = false;
                        }, 50);
                    }
                }
            });

            observer.observe(container, {
                childList: true,
                subtree: true
            });
        }
    }
});
