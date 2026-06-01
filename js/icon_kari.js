(function(){

  // ===============================
  // 0. サイト側追加マップの受け皿
  // ===============================
    window.__pleasanterCustomIconMap = Object.assign({
        dark: {},
        light: {},
        primary: {},
        red: {},
        display: {}
    }, window.__pleasanterCustomIconMap);


    // ===============================
    // 1. アイコンマップ（共通）
    // ===============================
    const darkIconMap = {
        "[aria-describedby='ImportSitePackageDialog'] [data-icon='ui-icon-cancel']": "close",
        "#ExportSitePackageDialog [data-icon='ui-icon-cancel']:not(#ExcludeData)": "close",
        "#ImportUserTemplateDialog [data-icon='ui-icon-cancel']": "close",
        "#DropDownSearchDialogForm [data-icon='ui-icon-cancel']": "close",
        "#ImportSettingsDialog [data-icon='ui-icon-cancel']": "close",
        "#ExportSelectorDialog [data-icon='ui-icon-cancel']": "close",
        "#PermissionsDialog [data-icon='ui-icon-cancel]": "close",
        "#AnalyPartDialog [data-icon='ui-icon-cancel']": "close",
        "#MainCommands [data-action='SiteMenu']": "arrow_circle_left",
        "#GoBack": "arrow_circle_left",
        "#ExcludeData": "indeterminate_check_box",
    };

    const lightIconMap = {
        "#OpenPermissionsDialog": "settings",
        "#EditTemplateButton": "settings",
        "#FieldSetRecordAccessControlEditor [data-icon='ui-icon-search']": "search",
        "#DropDownSearchDialogForm [data-icon='ui-icon-search']": "search",
        ".template-selectable [data-icon='ui-icon-search']": "search",
        "#AddTemplateButton": "file_open",
        "#ViewFilters_Reset": "refresh",
        "#Reload": "refresh",
        "#DeleteTemplateButton": "delete",
        "#ToEnableAllDropDownSearchResults": "keyboard_double_arrow_left",
        "#ToEnableDropDownSearchResults": "keyboard_arrow_left",
        "#ToEnableExportSites": "keyboard_arrow_left",
        "#AddPermissions": "keyboard_arrow_left",
        "#Previous": "arrow_left",
        "#ToDisableAllDropDownSearchResults": "keyboard_double_arrow_right",
        "#ToDisableDropDownSearchResults": "keyboard_arrow_right",
        "#ToDisableExportSites": "keyboard_arrow_right",
        "#DeletePermissions": "keyboard_arrow_right",
        "#Next": "arrow_right",
    };

    const primaryIconMap = {
        "#OpenAnalyPartDialog": "add",
        "#AnalyPartDialog [data-icon='ui-icon-disk']": "add",
        "#OpenSiteTitleDialog": "add_ad",
        "#CreateCommand": "add_ad",
        "[aria-describedby='ExportSitePackageDialog'] #IncludeData": "add_box",
        "#PermissionsDialog [data-icon='ui-icon-disk]": "update",
        "#UpdateCommand": "update",
        "#OpenCopyDialogCommand": "content_copy",
        "#EditOutgoingMail": "mail",
        "#ImportUserTemplateDialog [data-icon='ui-icon-arrowreturnthick-1-e']": "file_open",
        "#ImportSitePackageDialog [data-icon='ui-icon-arrowreturnthick-1-e']": "file_open",
        "#EditImportSettings": "file_open",
        "#DoImport": "file_open",
        "#ReferenceCopyCommand": "file_copy",
        "#SitePackageForm [data-icon='ui-icon-arrowreturnthick-1-w']": "file_export",
        "#OpenExportSelectorDialogCommand": "file_export",
        "#ExportCrosstabCommand": "file_export",
        "#DoExport": "file_export",
        "#DropDownSearchDialogForm [data-icon='ui-icon-disk']": "check",
        ".nav-site.to-parent a": "arrow_left",
        "#FieldSetRecordAccessControlEditor [data-confirm='ConfirmRestore']": "restore_page",
        "#FieldSetHistories [data-action='RestoreFromHistory']": "restore_page",
        "#ViewModeContainer [data-confirm='ConfirmRestore']": "restore_page",
    };

    const redIconMap = {
        "#FieldSetRecordAccessControlEditor [data-confirm='ConfirmPhysicalDelete']": "delete",
        "#ViewModeContainer [data-confirm='ConfirmPhysicalDelete']": "delete",    
        "#FieldSetHistories [data-confirm='ConfirmPhysicalDelete']": "delete",
        "#ImageLibBody [data-confirm='ConfirmDelete']": "delete",
        "#BulkDeleteCommand": "delete",
        "#DeleteCommand": "delete",
        "#OpenDeleteSiteDialogCommand": "globe_2_cancel",
    };

    const displayIconMap = {
        "#ReduceGuides": "expand_more",
        "#ReduceAggregations": "expand_more",
        "#ReduceViewFilters": "expand_more",
        "#ExpandGuides": "chevron_right",
        "#ExpandAggregations": "chevron_right",
        "#ExpandViewFilters": "chevron_right",
        "#CopyDirectUrlToClipboard": "share",
    };

    // ===============================
    // 2. カスタムマップのマージ
    // ===============================
    let __customIconMapMerged = false;

    function mergeCustomMaps() {
        if (__customIconMapMerged) return;

        const custom = window.__pleasanterCustomIconMap;

        Object.assign(darkIconMap, custom.dark);
        Object.assign(lightIconMap, custom.light);
        Object.assign(primaryIconMap, custom.primary);
        Object.assign(redIconMap, custom.red);
        Object.assign(displayIconMap, custom.display);

        __customIconMapMerged = true;
    }


    // ===============================
    // 3. アイコン適用関数
    // ===============================
    function applyIcons(map, className) {
        for (const selector in map) {
            const $targets = $(selector);

            $targets.each(function () {
                const $el = $(this);

                if ($el.children("." + className).length > 0) return;

                $el.prepend(
                    `<span class="material-symbols-outlined ${className}">${map[selector]}</span>`
                );
            });
        }
    }


    // ===============================
    // 4. アイコン適用の統合関数
    // ===============================
    function runIconApply() {
        mergeCustomMaps();
        applyIcons(darkIconMap, "dark-material-icons");
        applyIcons(lightIconMap, "light-material-icons");
        applyIcons(primaryIconMap, "primary-material-icons");
        applyIcons(redIconMap, "red-material-icons");
        applyIcons(displayIconMap, "display-material-icons");
    }


    // ===============================
    // 5. 初回ロード & PJAX 完了後
    // ===============================
    $(document).on("pjax:success pjax:complete", runIconApply);
    $(document).ready(runIconApply);


    // ===============================
    // 6. DOM 変化にも追従（最適化版）
    // ===============================
    let timer = null;

    const iconObserver = new MutationObserver(function(mutations){
        const significant = mutations.some(m => m.addedNodes.length > 0);
        if(!significant) return;

        clearTimeout(timer);
        timer = setTimeout(runIconApply, 50);
    });

    iconObserver.observe(document.body, { childList: true, subtree: true });

    window.runIconApply = runIconApply;
})();
