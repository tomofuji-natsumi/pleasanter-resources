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

        const holidays = rows
            .filter(row => row.ClassHash?.ClassA === "200")
            .map(row => ({
                date: row.DateHash?.DateA?.substring(0, 10),
                name: row.ClassHash?.ClassE || "",
                type: row.ClassHash?.ClassD
            }));

        // ★ holiday を描画する関数
        const renderHolidays = () => {

            $(".holiday-name").remove();
            $(".fc-daygrid-day")
                .removeClass("holiday-100 holiday-200 holiday-300");

            $(".fc-daygrid-day").each(function () {
                const date = $(this).data("date");
                if (!date) return;

                const holiday = holidays.find(h => h.date === date);
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

        const waitForStable = (callback) => {
            let lastHeight = 0;
            let count = 0;

            const check = () => {
                const h = document.querySelector(".fc-daygrid-body")?.offsetHeight || 0;

                if (h === lastHeight) {
                    count++;
                } else {
                    count = 0;
                    lastHeight = h;
                }
              
                if (count >= 3) {
                  
                    $(".fc-view-harness")
                        .removeClass("fc-fade-hide")
                        .addClass("fc-fade-show");

                    callback();
                } else {
                    requestAnimationFrame(check);
                }
            };

            requestAnimationFrame(check);
        };

        $(".fc-view-harness").addClass("fc-fade-hide");
        waitForStable(renderHolidays);

        $(document).on("click", ".fc-prev-button, .fc-next-button, .fc-today-button", function () {

            $(".fc-view-harness")
                .removeClass("fc-fade-show")
                .addClass("fc-fade-hide");

            waitForStable(renderHolidays);
        });
    }
});
