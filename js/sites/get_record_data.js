// ===============================
// 他のレコードからデータを取得する
//
// レコードIDを指定して、他レコードの分類・数値・日付・説明・チェック・添付ファイルの各項目値を取得する。
// ===============================
(function () {
"use strict";

// B-9: getXById系はgetRecord()を毎回呼び直すため、同じレコードから複数項目を
// 取得すると項目数だけAPI往復が発生していた。recordIdごとにPromiseを短期キャッシュし、
// 同時に呼ばれた分はin-flightの1リクエストに相乗り、少し後に呼ばれた分もキャッシュを再利用させる。
// 失敗時はキャッシュに残さず、次回呼び出しで再取得できるようにする。
var RECORD_CACHE_TTL_MS = 5000;
var recordCache = new Map();

/**
 * レコードIDを元にレコード情報を取得する
 * Class,Num,Date,Description,Check,Attachments以外のデータを取る場合も使用
 * @param {number} recordId レコードID
 * @returns {Promise<Object>} レコード情報
 * @throws {Error} recordIdが未指定の場合
 * @throws {Error} 指定したレコードが存在しない場合
 */
function getRecord(recordId){
    if(!recordId){
        //IDなしの時はエラー
        throw new Error("get Record:IDが未入力です。");
    }

    var cached = recordCache.get(recordId);
    if(cached && cached.expiresAt > Date.now()){
        return cached.promise;
    }

    var promise = new Promise(function(resolve,reject){
        var GET_RECORD_TIMEOUT_MS = 10000;
        var settled = false;

        var timeoutTimer = setTimeout(function () {
            if (settled) { return; }
            settled = true;
            reject(new Error(`get Record:タイムアウトしました。recordId=${recordId}`));
        }, GET_RECORD_TIMEOUT_MS);

        $p.apiGet({
            id:recordId,
            done:function(data){
                if(settled){ return; }
                settled = true;
                clearTimeout(timeoutTimer);

                var rows = data && data.Response && data.Response.Data;
                if(!rows || !rows.length){
                    reject(new Error(`get Record:指定されたレコードIDが存在しません。recordId=${recordId}`));
                    return
                }
                resolve(rows[0]);
            },
            fail:function(error){
                if(settled){ return; }
                settled = true;
                clearTimeout(timeoutTimer);
                console.warn("[get_record_data] レコード取得に失敗しました", recordId, error);
                reject(new Error(`get Record:レコード取得に失敗しました。recordId=${recordId}`));
            }
        });
    });

    promise.catch(function () {
        var current = recordCache.get(recordId);
        if (current && current.promise === promise) {
            recordCache.delete(recordId);
        }
    });

    recordCache.set(recordId, { promise: promise, expiresAt: Date.now() + RECORD_CACHE_TTL_MS });
    return promise;
}

// レコードの各項目種別（分類・数値・日付・説明・チェック・添付ファイル）は、
// 「Hashキー名」「エラーメッセージ用の日本語ラベル」「FromRecord/By関数名」だけが違う双子だったため、
// ファクトリで生成する。エラーメッセージの文言・関数名は生成前と同一。
var RECORD_FIELD_TYPES = [
    { hashKey: "ClassHash", label: "分類", fromRecordName: "getClassFromRecord", byIdName: "getClassById" },
    { hashKey: "NumHash", label: "数値", fromRecordName: "getNumFromRecord", byIdName: "getNumById" },
    { hashKey: "DateHash", label: "日付", fromRecordName: "getDateFromRecord", byIdName: "getDateById" },
    { hashKey: "DescriptionHash", label: "説明", fromRecordName: "getDescriptionFromRecord", byIdName: "getDescriptionById" },
    { hashKey: "CheckHash", label: "チェック", fromRecordName: "getCheckFromRecord", byIdName: "getCheckById" },
    { hashKey: "AttachmentsHash", label: "添付ファイル", fromRecordName: "getAttachmentsFromRecord", byIdName: "getAttachmentsById" }
];

// IIFE内で宣言した関数は各サイトのインラインスクリプトからグローバルに呼び出せるようwindowへ公開する
window.getRecord = getRecord;

RECORD_FIELD_TYPES.forEach(function (fieldType) {
    /**
     * レコードから指定した項目を取得
     * 同じレコードから複数項目を取得する場合に使用
     * @param {object} record レコード情報
     * @param {string} targetName 取得対象の名称
     * @returns {*} 指定した項目の値
     * @throws {Error} 指定した項目が存在しない場合
     */
    function lookup(funcName, record, targetName) {
        var result = record[fieldType.hashKey][targetName];
        if (result == undefined) {
            throw new Error(`${funcName}:指定した${fieldType.label}が存在しません。targetName=${targetName}`);
        }
        return result;
    }

    function fromRecord(record, targetName) {
        return lookup(fieldType.fromRecordName, record, targetName);
    }

    /**
     * 指定レコードの指定した項目を取得
     * 簡易版。同じレコードから一つだけ項目を取得する場合に使用
     * @param {number} recordId レコードID
     * @param {string} targetName 取得対象の名称
     * @returns {Promise<*>} 指定した項目の値
     * @throws {Error} 指定した項目が存在しない場合
     */
    async function byId(recordId, targetName) {
        var record = await getRecord(recordId);
        return lookup(fieldType.byIdName, record, targetName);
    }

    window[fieldType.fromRecordName] = fromRecord;
    window[fieldType.byIdName] = byId;
});
})();
