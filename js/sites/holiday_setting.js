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

            $(".holiday-name").remove();
            $(".fc-daygrid-day")
                .removeClass("holiday-100 holiday-200 holiday-300");

            $(".fc-daygrid-day").each(function () {
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

        document.addEventListener("datesRender", renderHolidays);

        // 初回実行
        renderHolidays();
    }
});
