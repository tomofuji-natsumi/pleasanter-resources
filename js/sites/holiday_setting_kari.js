(function () {

  const $ = window.jQuery;

  // ★ カレンダー画面でのみ実行
  if (!location.pathname.includes("/calendar")) return;

  // -----------------------------
  // 1. 祝日データ取得
  // -----------------------------
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

      // -----------------------------
      // 2. セルに祝日を適用
      // -----------------------------
      function renderHolidays() {
        const $cells = $(".fc-daygrid-day[data-date]");
        if ($cells.length === 0) return;

        $(".holiday-name").remove();
        $cells.removeClass("holiday-100 holiday-200 holiday-300");

        $cells.each(function () {
          const date = this.getAttribute("data-date");
          const holiday = holidayMap[date];
          if (!holiday) return;

          this.classList.add(`holiday-${holiday.type}`);

          if (holiday.name) {
            const top = this.querySelector(".fc-daygrid-day-top");
            if (top && !top.querySelector(".holiday-name")) {
              const div = document.createElement("div");
              div.className = "holiday-name";
              div.textContent = holiday.name;
              top.appendChild(div);
            }
          }
        });
      }

      // -----------------------------
      // 3. Pleasanter 専用 FullCalendar フック
      // -----------------------------
      function hookCalendar() {
        const calendarEl = document.querySelector("#Calendar .fc");
        if (!calendarEl) return;

        const calendar = calendarEl._calendar || calendarEl.__calendar;
        if (!calendar) return;

        calendar.on("datesSet", renderHolidays);
        calendar.on("viewDidMount", renderHolidays);

        renderHolidays();
      }

      // -----------------------------
      // 4. pjax 後に必ずフック
      // -----------------------------
      $(document).on("pjax:end", function () {
        setTimeout(hookCalendar, 30);
      });

      // 初回ロード
      setTimeout(hookCalendar, 30);
    }
  });

})();
