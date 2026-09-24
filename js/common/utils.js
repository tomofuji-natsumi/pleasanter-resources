// ===============================
// 共通ユーティリティ
//
// 各ファイルで個別に手書きされていた以下3つを集約する（修正項目.md C-2）。
// - escapeHtml: holiday_setting.js / readonly.js に同一実装が重複
// - once: window.__xxxBound による多重登録防止ガードが13種類手書きされていた
// - ensureSingleton: 「#idが無ければ生成、あれば既存を返す」パターンの重複
//
// マニフェスト（Js.All）の先頭で読み込み、以降の全スクリプトから利用できるようにする。
// ===============================
(function () {
    "use strict";

    var ESCAPE_MAP = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    /**
     * HTMLエスケープ
     * @param {*} str エスケープ対象（null/undefinedは空文字扱い）
     * @returns {string}
     */
    window.escapeHtml = function (str) {
        return String(str == null ? "" : str).replace(/[&<>"']/g, function (s) { return ESCAPE_MAP[s]; });
    };

    var onceGuards = {};

    /**
     * name単位で一度だけfnを実行する（window.__xxxBoundガードの共通化）。
     * このファイル自体は画面遷移のたびに再取得・再評価されないが（CLAUDE.md参照）、
     * 呼び出し元スクリプトのIIFEが再評価されるケースに備えてガード状態はここで一元管理する。
     * @param {string} name ガード名（他の once 呼び出しと衝突しない一意な名前にする）
     * @param {Function} fn 初回のみ実行する処理
     * @returns {boolean} 今回実行したかどうか（既に実行済みならfalse）
     */
    window.once = function (name, fn) {
        if (onceGuards[name]) { return false; }
        onceGuards[name] = true;
        if (typeof fn === "function") { fn(); }
        return true;
    };

    /**
     * id指定の要素が無ければhtmlから生成してbodyに追加し、あれば既存の要素を返す。
     * 「#foo が無ければ生成」を各所で手書きしていたパターンの共通化。
     * @param {string} id 要素のid（#無し）
     * @param {string} html 生成時に使うHTML文字列
     * @returns {jQuery}
     */
    window.ensureSingleton = function (id, html) {
        var $existing = $("#" + id);
        if ($existing.length) { return $existing; }
        return $(html).appendTo("body");
    };
})();
