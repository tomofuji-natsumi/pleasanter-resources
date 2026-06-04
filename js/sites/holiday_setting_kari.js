(function () {

  const $ = window.jQuery;

  // ★ カレンダー画面だけで動かす
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

        // 既存表示をクリア
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
      // 3. DOM ベースでフック（Pleasanter向け安定版）
      // -----------------------------
      function hookCalendarDom() {
        // 初回：FullCalendar が描画されるまで少し待つ
        setTimeout(renderHolidays, 30);

        // navlink（内部遷移）
        $(document).on("click", "[data-navlink]", function () {
          setTimeout(renderHolidays, 50);
        });

        // 月移動ボタン
        $(document).on("click", ".fc-prev-button, .fc-next-button, .fc-today-button", function () {
          setTimeout(renderHolidays, 50);
        });

        // カレンダー本体の再描画を監視（最小限）
        const cal = document.querySelector("#FullCalendar");
        if (!cal) return;

        const mo = new MutationObserver(() => {
          setTimeout(renderHolidays, 30);
        });

        mo.observe(cal, {
          childList: true,
          subtree: true
        });
      }

      // pjax 後にも必ずフック
      $(document).on("pjax:end", function () {
        hookCalendarDom();
      });

      // 初回ロード
      hookCalendarDom();
    }
  });

})();
