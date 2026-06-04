(function () {
  const $ = window.jQuery;
  if (!$) {
    console.warn('icon_kari.js: jQuery not found, skipping.');
    return;
  }

  // 0. カスタム
  window.__pleasanterCustomIconMap = Object.assign({
    dark: {},
    light: {},
    primary: {},
    red: {},
    display: {}
  }, window.__pleasanterCustomIconMap);

  // 1. アイコンマップ
  const darkIconMap = {
    "[aria-describedby='ImportSitePackageDialog'] [data-icon='ui-icon-cancel']": "close",
    "#ExportSitePackageDialog [data-icon='ui-icon-cancel']:not(#ExcludeData)": "close",
    "#ImportUserTemplateDialog [data-icon='ui-icon-cancel']": "close",
    "#DropDownSearchDialogForm [data-icon='ui-icon-cancel']": "close",
    "#ImportSettingsDialog [data-icon='ui-icon-cancel']": "close",
    "#ExportSelectorDialog [data-icon='ui-icon-cancel']": "close",
    "#PermissionsDialog [data-icon='ui-icon-cancel']": "close",
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
    "#PermissionsDialog [data-icon='ui-icon-disk']": "update",
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

  // 2. カスタムマップのマージ
  let __customIconMapMerged = false;
  function mergeCustomMaps() {
    if (__customIconMapMerged) return;
    const custom = window.__pleasanterCustomIconMap || {};
    Object.assign(darkIconMap, custom.dark || {});
    Object.assign(lightIconMap, custom.light || {});
    Object.assign(primaryIconMap, custom.primary || {});
    Object.assign(redIconMap, custom.red || {});
    Object.assign(displayIconMap, custom.display || {});
    __customIconMapMerged = true;
  }

  // 3. アイコン適用
  function applyIcons(map, className) {
    for (const selector in map) {
      const iconName = map[selector];
      let $targets;
      try {
        $targets = $(selector);
      } catch (err) {
        console.warn('Invalid selector skipped:', selector, err);
        continue;
      }

      $targets.each(function () {
        const $el = $(this);
        const flagKey = 'icon-' + className;

        if ($el.data(flagKey)) return;
        if ($el.children('.' + className).length > 0) {
          $el.data(flagKey, true);
          return;
        }

        try {
          $el.prepend(
            '<span class="material-symbols-outlined ' +
            className +
            '" aria-hidden="true">' +
            iconName +
            '</span>'
          );
          $el.data(flagKey, true);
        } catch (err) {
          console.error('Icon insert failed for', selector, err);
        }
      });
    }
  }

  // 4. 統合実行
  function runIconApply() {
    try {
      mergeCustomMaps();
      applyIcons(darkIconMap, 'dark-material-icons');
      applyIcons(lightIconMap, 'light-material-icons');
      applyIcons(primaryIconMap, 'primary-material-icons');
      applyIcons(redIconMap, 'red-material-icons');
      applyIcons(displayIconMap, 'display-material-icons');
    } catch (err) {
      console.error('runIconApply error', err);
    }
  }

  // 5. MutationObserver
  let iconObserver = null;
  let iconObserverTimer = null;

  function startIconObserver(target) {
    if (!window.MutationObserver) return;
    if (iconObserver) return;

    const observeTarget =
      target ||
      document.getElementById('MainContainer') ||
      document.body;

    iconObserver = new MutationObserver(function (mutations) {
      let significant = false;
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.addedNodes && m.addedNodes.length > 0) {
          significant = true;
          break;
        }
      }
      if (!significant) return;

      clearTimeout(iconObserverTimer);
      iconObserverTimer = setTimeout(runIconApply, 80);
    });

    iconObserver.observe(observeTarget, {
      childList: true,
      subtree: true
    });
  }

  function stopIconObserver() {
    if (!iconObserver) return;
    iconObserver.disconnect();
    iconObserver = null;
    clearTimeout(iconObserverTimer);
    iconObserverTimer = null;
  }

  // 6. イベント登録
  $(document).on('pjax:success pjax:complete pjax:end', function () {
    runIconApply();
  });

  if (document.addEventListener) {
    document.addEventListener('pjax:end', runIconApply);
  }

  // 初期ロード時
  $(function () {
    runIconApply();
  });

  // エクスポート
  window.runIconApply = runIconApply;
  window.startIconObserverForIcons = startIconObserver;
  window.stopIconObserverForIcons = stopIconObserver;
})();
