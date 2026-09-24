// ===============================
// メッセージ表示
//
// Pleasanter標準形式の成功・警告・エラーメッセージを表示する。
// ===============================
(function () {
"use strict";

/**
 * Pleasanter標準形式のメッセージを表示
 * @param {string} css 適用するCssクラス（alert-success/alert-warning/alert-error）
 * @param {string} message 表示するメッセージ
 */
function outLog(css, message){
    $p.setMessage("#Message", JSON.stringify({
        Css:css,
        Text:message
    }));
}

/**
 * Pleasanter標準形式の成功メッセージを表示
 * @param {string} message 表示するメッセージ
 */
function outSuccessLog(message){
    outLog("alert-success", message);
}

/**
 * Pleasanter標準形式の警告メッセージを表示
 * @param {string} message 表示するメッセージ
 */
function outWarnLog(message){
    outLog("alert-warning", message);
}

/**
 * Pleasanter標準形式のエラーメッセージを表示
 * @param {string} message 表示するメッセージ
 */
function outErrorLog(message){
    outLog("alert-error", message);
}

window.outSuccessLog = outSuccessLog;
window.outWarnLog = outWarnLog;
window.outErrorLog = outErrorLog;
})();
