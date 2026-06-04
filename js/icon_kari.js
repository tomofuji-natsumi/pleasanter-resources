(function(){

  // 0. カスタム受け皿（そのまま）
  window.__pleasanterCustomIconMap = Object.assign({
      dark: {},
      light: {},
      primary: {},
      red: {},
      display: {}
  }, window.__pleasanterCustomIconMap);

  // 1. アイコンマップ（※セレクタのクオートを必ず正しく）
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
      // 修正: クオート閉じ忘れを直す
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

  // 2. カスタムマップのマージ（そのまま）
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

  // 3. アイコン適用（例外耐性・処理済みフラグ）
  function applyIcons(map, className) {
      for (const selector in map) {
          let $targets;
          try {
              $targets = $(selector);
          } catch (err) {
              console.warn('Invalid selector skipped:', selector, err);
              continue; // 無効セレクタはスキップ
          }

          $targets.each(function () {
              const $el = $(this);
              // data 属性で処理済みフラグを付ける（重複防止）
              if ($el.data('icon-' + className)) return;

              // 既に同クラスの子があればスキップ（保険）
              if ($el.children("." + className).length > 0) {
                  $el.data('icon-' + className, true);
                  return;
              }

              try {
                  $el.prepend(
                      `<span class="material-symbols-outlined ${className}" aria-hidden="true">${map[selector]}</span>`
                  );
                  $el.data('icon-' + className, true);
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
          applyIcons(darkIconMap, "dark-material-icons");
          applyIcons(lightIconMap, "light-material-icons");
          applyIcons(primaryIconMap, "primary-material-icons");
          applyIcons(redIconMap, "red-material-icons");
          applyIcons(displayIconMap, "display-material-icons");
      } catch (err) {
          console.error('runIconApply error', err);
      }
  }

  // 5. イベント登録（pjax:end を確実に拾う）
  // jQuery の pjax イベントとネイティブの pjax:end の両方を監視
  $(document).on("pjax:success pjax:complete pjax:end", runIconApply);
  document.addEventListener && document.addEventListener("pjax:end", runIconApply);
  $(document).ready(runIconApply);

  // 6. MutationObserver（軽量化）
  let timer = null;
  const iconObserver = new MutationObserver(function(mutations){
      const significant = mutations.some(m => m.addedNodes && m.addedNodes.length > 0);
      if(!significant) return;
      clearTimeout(timer);
      timer = setTimeout(runIconApply, 80);
  });
  iconObserver.observe(document.body, { childList: true, subtree: true });

  // エクスポート
  window.runIconApply = runIconApply;

})();
