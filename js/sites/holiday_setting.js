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
            const $cells = $(".fc-daygrid-day");
            if ($cells.length === 0) return; // まだ描画されていない

            $(".holiday-name").remove();
            $cells.removeClass("holiday-100 holiday-200 holiday-300");

            $cells.each(function () {
                const date = $(this).data("date");
                if (!date) return;

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

        // ★ FullCalendar の描画が完了した瞬間を監視
        const container = document.querySelector(".fc-view-container");

        const observer = new MutationObserver(() => {
            // day セルが出現したら実行
            if (document.querySelector(".fc-daygrid-day")) {
                renderHolidays();
            }
        });

        observer.observe(container, {
            childList: true,
            subtree: true
        });
    }
});
