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
    "#AnalyPartDialog [data-icon='ui-icon-cancel']": "close",
    "#GoBack": "arrow_circle_left",
    "#MainCommands:has(.ui-icon-circle-arrow-w)": "arrow_circle_left",
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
    "#ToDisableExportSites": "keyboard_arrow_left",
    "#AddPermissions": "keyboard_arrow_left",
    "#Previous": "arrow_left",
    "#ToDisableAllDropDownSearchResults": "keyboard_double_arrow_right",
    "#ToDisableDropDownSearchResults": "keyboard_arrow_right",
    "#ToEnableExportSites": "keyboard_arrow_right",
    "#DeletePermissions": "keyboard_arrow_right",
    "#Next": "arrow_right",
};

const primaryIconMap = {
    "#OpenAnalyPartDialog": "add",
    "#AnalyPartDialog [data-icon='ui-icon-disk']": "add",
    "#OpenSiteTitleDialog": "add_ad",
    "#CreateCommand": "add_ad",
    "[aria-describedby='ExportSitePackageDialog'] #IncludeData": "add_box",
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
};

const redIconMap = {
    "#FieldSetRecordAccessControlEditor [data-confirm='ConfirmPhysicalDelete']": "delete",
    "#FieldSetHistories [data-confirm='ConfirmPhysicalDelete']": "delete",
    "#ImageLibBody [data-confirm='ConfirmDelete']": "delete",
    "#BulkDeleteCommand": "delete",
    "#DeleteCommand": "delete",
    "#OpenDeleteSiteDialogCommand": "globe_2_cancel",
};

const displayIconMap = {
    "#ReduceAggregations": "expand_more",
    "#ReduceViewFilters": "expand_more",
    "#ExpandAggregations": "chevron_right",
    "#ExpandViewFilters": "chevron_right",
    "#CopyDirectUrlToClipboard": "share",
};


// ===============================
// 1.5 サイト側追加マップをマージ
// ===============================
let __customIconMapMerged = false;

function mergeCustomMaps() {
    if (__customIconMapMerged) return;

    const custom = window.__pleasanterCustomIconMap;

    if (custom.dark) Object.assign(darkIconMap, custom.dark);
    if (custom.light) Object.assign(lightIconMap, custom.light);
    if (custom.primary) Object.assign(primaryIconMap, custom.primary);
    if (custom.red) Object.assign(redIconMap, custom.red);
    if (custom.display) Object.assign(displayIconMap, custom.display);

    __customIconMapMerged = true;
}


// ===============================
// 2. アイコン適用関数
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
// 3. MutationObserver
// ===============================
const iconObserver = new MutationObserver(() => {
    mergeCustomMaps();

    applyIcons(darkIconMap, "dark-material-icons");
    applyIcons(lightIconMap, "light-material-icons");
    applyIcons(primaryIconMap, "primary-material-icons");
    applyIcons(redIconMap, "red-material-icons");
    applyIcons(displayIconMap, "display-material-icons");
});

iconObserver.observe(document.body, {
    childList: true,
    subtree: true
});


// ===============================
// 4. 初回適用
// ===============================
document.addEventListener("pjax:end", function () {
    mergeCustomMaps();

    applyIcons(darkIconMap, "dark-material-icons");
    applyIcons(lightIconMap, "light-material-icons");
    applyIcons(primaryIconMap, "primary-material-icons");
    applyIcons(redIconMap, "red-material-icons");
    applyIcons(displayIconMap, "display-material-icons");
});
