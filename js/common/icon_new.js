// ===============================
// Pleasanter アイコン適用スクリプト
// ===============================
(function () {
    "use strict";

    // ===============================
    // 1. アイコンマップ定義
    //    各エントリは { selector, color, icon } の形式
    //    color: "dark" | "light" | "primary" | "red" | "display"
    // ===============================
    const ICON_DEFS = [
        // --- dark ---
        { s: "[aria-describedby='ImportSitePackageDialog'] [data-icon='ui-icon-cancel']", c: "dark", i: "close" },
        { s: "#ExportSitePackageDialog [data-icon='ui-icon-cancel']:not(#ExcludeData)", c: "dark", i: "close" },
        { s: "#ImportUserTemplateDialog [data-icon='ui-icon-cancel']",                  c: "dark", i: "close" },
        { s: "#DropDownSearchDialogForm [data-icon='ui-icon-cancel']",                  c: "dark", i: "close" },
        { s: "#ImportSettingsDialog [data-icon='ui-icon-cancel']",                      c: "dark", i: "close" },
        { s: "#ExportSelectorDialog [data-icon='ui-icon-cancel']",                      c: "dark", i: "close" },
        { s: "#PermissionsDialog [data-icon='ui-icon-cancel']",                         c: "dark", i: "close" },
        { s: "#SiteTitleDialog [data-icon='ui-icon-cancel']",                           c: "dark", i: "close" },
        { s: "#AnalyPartDialog [data-icon='ui-icon-cancel']",                           c: "dark", i: "close" },
        { s: "#OutgoingMails_Cancel",                                                   c: "dark", i: "close" },
        { s: "#MainCommands [data-action='SiteMenu']",                                  c: "dark", i: "arrow_circle_left" },
        { s: "#GoBack",                                                                 c: "dark", i: "arrow_circle_left" },
        { s: "#ExcludeData",                                                            c: "dark", i: "indeterminate_check_box" },

        // --- light ---
        { s: "#OpenPermissionsDialog",                                                  c: "light", i: "settings" },
        { s: "#EditTemplateButton",                                                     c: "light", i: "settings" },
        { s: "#FieldSetRecordAccessControlEditor [data-icon='ui-icon-search']",         c: "light", i: "search" },
        { s: "#DropDownSearchDialogForm [data-icon='ui-icon-search']",                  c: "light", i: "search" },
        { s: ".template-selectable [data-icon='ui-icon-search']",                       c: "light", i: "search" },
        { s: "#AddTemplateButton",                                                      c: "light", i: "file_open" },
        { s: "#ViewFilters_Reset",                                                      c: "light", i: "refresh" },
        { s: "#Reload",                                                                 c: "light", i: "refresh" },
        { s: "#DeleteTemplateButton",                                                   c: "light", i: "delete" },
        { s: "#ToEnableAllDropDownSearchResults",                                       c: "light", i: "keyboard_double_arrow_left" },
        { s: "#ToEnableDropDownSearchResults",                                          c: "light", i: "keyboard_arrow_left" },
        { s: "#ToEnableExportSites",                                                    c: "light", i: "keyboard_arrow_left" },
        { s: "#AddPermissions",                                                         c: "light", i: "keyboard_arrow_left" },
        { s: "#Previous",                                                               c: "light", i: "arrow_left" },
        { s: "#ToDisableAllDropDownSearchResults",                                      c: "light", i: "keyboard_double_arrow_right" },
        { s: "#ToDisableDropDownSearchResults",                                         c: "light", i: "keyboard_arrow_right" },
        { s: "#ToDisableExportSites",                                                   c: "light", i: "keyboard_arrow_right" },
        { s: "#DeletePermissions",                                                      c: "light", i: "keyboard_arrow_right" },
        { s: "#Next",                                                                   c: "light", i: "arrow_right" },
        { s: "#OutgoingMails_AddTo",                                                    c: "light", i: "user" },
        { s: "#OutgoingMails_AddCc",                                                    c: "light", i: "user" },
        { s: "#OutgoingMails_AddBcc",                                                   c: "light", i: "user" },

        // --- primary ---
        { s: "#OpenAnalyPartDialog",                                                    c: "primary", i: "add" },
        { s: "#AnalyPartDialog [data-icon='ui-icon-disk']",                             c: "primary", i: "add" },
        { s: "#OpenSiteTitleDialog",                                                    c: "primary", i: "add_ad" },
        { s: "#CreateByTemplate",                                                       c: "primary", i: "add_ad" },
        { s: "#CreateCommand",                                                          c: "primary", i: "add_ad" },
        { s: "[aria-describedby='ExportSitePackageDialog'] #IncludeData",               c: "primary", i: "add_box" },
        { s: "#PermissionsDialog [data-icon='ui-icon-disk']",                           c: "primary", i: "update" },
        { s: "#UpdateDashboardPartLayouts",                                             c: "primary", i: "update" },
        { s: "#UpdateCommand",                                                          c: "primary", i: "update" },
        { s: "#OpenCopyDialogCommand",                                                  c: "primary", i: "content_copy" },
        { s: "#OutgoingMails_Send",                                                     c: "primary", i: "mail" },
        { s: "#EditOutgoingMail",                                                       c: "primary", i: "mail" },
        { s: "#ImportUserTemplateDialog [data-icon='ui-icon-arrowreturnthick-1-e']",    c: "primary", i: "file_open" },
        { s: "#ImportSitePackageDialog [data-icon='ui-icon-arrowreturnthick-1-e']",     c: "primary", i: "file_open" },
        { s: "#EditImportSettings",                                                     c: "primary", i: "file_open" },
        { s: "#DoImport",                                                               c: "primary", i: "file_open" },
        { s: "#ReferenceCopyCommand",                                                   c: "primary", i: "file_copy" },
        { s: "#SitePackageForm [data-icon='ui-icon-arrowreturnthick-1-w']",             c: "primary", i: "file_export" },
        { s: "#OpenExportSelectorDialogCommand",                                        c: "primary", i: "file_export" },
        { s: "#ExportCrosstabCommand",                                                  c: "primary", i: "file_export" },
        { s: "#DoExport",                                                               c: "primary", i: "file_export" },
        { s: "#DropDownSearchDialogForm [data-icon='ui-icon-disk']",                    c: "primary", i: "check" },
        { s: ".nav-site.to-parent a",                                                   c: "primary", i: "arrow_left" },
        { s: "#FieldSetRecordAccessControlEditor [data-confirm='ConfirmRestore']",      c: "primary", i: "restore_page" },
        { s: "#FieldSetHistories [data-action='RestoreFromHistory']",                   c: "primary", i: "restore_page" },
        { s: "#ViewModeContainer [data-confirm='ConfirmRestore']",                      c: "primary", i: "restore_page" },

        // --- red ---
        { s: "#FieldSetRecordAccessControlEditor [data-confirm='ConfirmPhysicalDelete']", c: "red", i: "delete" },
        { s: "#ViewModeContainer [data-confirm='ConfirmPhysicalDelete']",               c: "red", i: "delete" },
        { s: "#FieldSetHistories [data-confirm='ConfirmPhysicalDelete']",               c: "red", i: "delete" },
        { s: "#ImageLibBody [data-confirm='ConfirmDelete']",                            c: "red", i: "delete" },
        { s: "#BulkDeleteCommand",                                                      c: "red", i: "delete" },
        { s: "#DeleteCommand",                                                          c: "red", i: "delete" },
        { s: "#OpenDeleteSiteDialogCommand",                                            c: "red", i: "globe_2_cancel" },

        // --- display ---
        { s: "#ReduceGuides",                                                           c: "display", i: "expand_more" },
        { s: "#ReduceAggregations",                                                     c: "display", i: "expand_more" },
        { s: "#ReduceViewFilters",                                                      c: "display", i: "expand_more" },
        { s: "#ExpandGuides",                                                           c: "display", i: "chevron_right" },
        { s: "#ExpandAggregations",                                                     c: "display", i: "chevron_right" },
        { s: "#ExpandViewFilters",                                                      c: "display", i: "chevron_right" },
        { s: "#CopyDirectUrlToClipboard",                                               c: "display", i: "share" },
    ];

    // color → CSSクラス名の対応
    const CLASS_MAP = {
        dark:    "dark-material-icons",
        light:   "light-material-icons",
        primary: "primary-material-icons",
        red:     "red-material-icons",
        display: "display-material-icons",
    };

    // ===============================
    // 2. 適用済み要素の管理（WeakSet）
    // ===============================
    const applied = new WeakSet();

    // ===============================
    // 3. span 生成ヘルパー
    // ===============================
    function createIconSpan(cssClass, iconName) {
        const span = document.createElement("span");
        span.className = "material-symbols-outlined " + cssClass;
        span.textContent = iconName;
        return span;
    }

    // ===============================
    // 4. セレクタ種別判定 & 要素取得
    //    #ID 形式は getElementById で高速化
    // ===============================
    const ID_SELECTOR = /^#([\w-]+)$/;

    function queryElements(selector) {
        const m = selector.match(ID_SELECTOR);
        if (m) {
            const el = document.getElementById(m[1]);
            return el ? [el] : [];
        }
        return Array.from(document.querySelectorAll(selector));
    }

    // ===============================
    // 5. アイコン適用（全マップを1ループ）
    // ===============================
    function applyIcons(defs) {
        for (const { s, c, i } of defs) {
            const cssClass = CLASS_MAP[c];
            for (const el of queryElements(s)) {
                if (applied.has(el)) continue;
                applied.add(el);
                el.insertBefore(createIconSpan(cssClass, i), el.firstChild);
            }
        }
    }

    // ===============================
    // 6. カスタムマップのマージ（初回のみ）
    //    サイト側が先に定義していなくてもクラッシュしない
    // ===============================
    let merged = false;
    let allDefs = ICON_DEFS;

    function mergeCustomDefs() {
        if (merged) return;
        merged = true;

        const custom = window.__pleasanterCustomIconMap;
        if (!custom) return;

        const extra = [];
        for (const [color, map] of Object.entries(custom)) {
            if (!CLASS_MAP[color]) continue;
            for (const [selector, icon] of Object.entries(map)) {
                extra.push({ s: selector, c: color, i: icon });
            }
        }
        if (extra.length) allDefs = [...ICON_DEFS, ...extra];
    }

    // ===============================
    // 7. メイン実行
    // ===============================
    function runIconApply() {
        mergeCustomDefs();
        applyIcons(allDefs);
    }

    // ===============================
    // 8. イベント登録
    //    pjax:complete のみ（success との重複を排除）
    // ===============================
    $(document).on("pjax:complete", runIconApply);
    $(document).ready(runIconApply);

    // ===============================
    // 9. MutationObserver（debounce付き）
    // ===============================
    let debounceTimer = null;

    const observer = new MutationObserver(function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runIconApply, 50);
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
