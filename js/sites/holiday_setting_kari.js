(function () {

  const $ = window.jQuery;

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
      // 2. セルに祝日を適用（最小限）
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
      // 3. FullCalendar の正しいイベントをフック
      // -----------------------------
      function hookFullCalendar() {
        const fc = document.querySelector(".fc");
        if (!fc) return;

        // FullCalendar インスタンス取得
        const calendar = fc.__fullCalendar;
        if (!calendar) return;

        // 月が変わったとき
        calendar.on("datesSet", renderHolidays);

        // 初回描画
        calendar.on("viewDidMount", renderHolidays);

        // 初回即時
        renderHolidays();
      }

      // FullCalendar が読み込まれるまで待つ
      const wait = setInterval(() => {
        const fc = document.querySelector(".fc");
        if (fc && fc.__fullCalendar) {
          clearInterval(wait);
          hookFullCalendar();
        }
      }, 50);
    }
  });

})();
