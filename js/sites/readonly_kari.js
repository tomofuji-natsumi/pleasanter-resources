(function () {

  const $ = window.jQuery;

  // ===============================
  // 0. 読取専用モード判定（最速）
  // ===============================
  const isReadonly = !!document.querySelector("#Notes .readonly");
  if (isReadonly) {
    document.body.classList.add("readonly-mode");
  }

  if (!isReadonly) return;

  // ===============================
  // 1. date-field の Shadow DOM に CSS 注入（最速）
  // ===============================

  function injectDateFieldCSS(shadow) {
    if (!shadow) return;
    if (shadow.querySelector("style[data-hide-current-date]")) return;

    const style = document.createElement("style");
    style.dataset.hideCurrentDate = "true";
    style.textContent = `
      .current-date {
        display: none !important;
      }
    `;
    shadow.appendChild(style);
  }

  // date-field の Shadow DOM を監視（1回だけ）
  function watchDateField(df) {
    if (!df) return;

    if (df.shadowRoot) {
      injectDateFieldCSS(df.shadowRoot);
      return;
    }

    const obs = new MutationObserver(() => {
      if (df.shadowRoot) {
        injectDateFieldCSS(df.shadowRoot);
        obs.disconnect();
      }
    });

    obs.observe(df, { childList: true });
  }

  // 既存の date-field
  document.querySelectorAll("date-field").forEach(watchDateField);

  // 後から追加される date-field（date-field のみ監視）
  const dateFieldObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && node.tagName.toLowerCase() === "date-field") {
          watchDateField(node);
        }
      }
    }
  });

  dateFieldObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // ===============================
  // 2. jQuery 処理（最速化）
  // ===============================
  $(function () {

    // 2-1. フォーム要素を完全に無効化
    $("form input:not([type='hidden']), form textarea, form select")
      .prop("disabled", true);

    // 2-2. HTML エスケープ
    const escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    const escapeHtml = (str) =>
      String(str ?? "").replace(/[&<>"']/g, s => escapeMap[s]);

    // 2-3. フィールドをラベル化（冪等）
    $(".field-control").each(function () {
      const control = $(this);

      if (control.children(".readonly-value").length > 0) return;

      // input date（flatpickr）
      control.find("input.flatpickr-input").each(function () {
        const val = escapeHtml($(this).val());
        $(this).hide();
        control.append(`<div class="readonly-value" data-source="#${this.id}">${val}</div>`);
      });

      // select
      control.find("select.control-dropdown").each(function () {
        $(this).hide();
        control.append(`<div class="readonly-value" data-source="#${this.id}"></div>`);
      });

      // textarea
      control.find("textarea.control-markdown, textarea.control-textarea").each(function () {
        $(this).hide();
        control.append(`<div class="readonly-value" data-source="#${this.id}"></div>`);
      });

      // SunEditor
      const sun = control.find(".sun-editor");
      if (sun.length) {
        sun.addClass("readonly-sun-editor");
      }
    });

    // 2-3.5 readonly-value に元の値を反映
    $(".readonly-value").each(function () {
      const selector = $(this).data("source");
      if (!selector) return;

      const $src = $(selector);
      let text = "";

      if ($src.is("select")) {
        text = $src.find("option:selected").map(function () {
          return $(this).text();
        }).get().join(", ");
      }
      else if ($src.is(":radio")) {
        text = $src.filter(":checked").closest("label").text().trim();
      }
      else if ($src.is(":checkbox")) {
        text = $src.filter(":checked").map(function () {
          return $(this).closest("label").text().trim();
        }).get().join(", ");
      }
      else {
        text = $src.val();
      }

      $(this).html(escapeHtml(text).replace(/\n/g, "<br>"));
    });

    // 2-4. 添付ファイルアップロードUIは常に非表示
    $(".control-attachments-upload").hide();

  });

})();
