// ===============================
// メッセージ表示
//
// Pleasanter標準形式の成功・警告・エラーメッセージを表示する。
// ===============================

/**
 * Pleasanter標準形式の成功メッセージを表示
 * @param {string} message 表示するメッセージ
 */
function outSuccessLog(message){
    $p.setMessage("#Message", JSON.stringify({
        Css:"alert-success",
        Text:message
    }));
}

/**
 * Pleasanter標準形式の警告メッセージを表示
 * @param {string} message 表示するメッセージ
 */
function outWarnLog(message){
    $p.setMessage("#Message", JSON.stringify({
        Css:"alert-warning",
        Text:message
    }));
}

/**
 * Pleasanter標準形式のエラーメッセージを表示
 * @param {string} message 表示するメッセージ
 */
function outErrorLog(message){
    $p.setMessage("#Message", JSON.stringify({
        Css:"alert-error",
        Text:message
    }));
}