// ===============================
// 他のレコードからデータを取得する
//
// レコードIDを指定して、他レコードの分類・数値・日付・説明・チェック・添付ファイルの各項目値を取得する。
// ===============================

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
    return new Promise(function(resolve,reject){
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
}

/**
 * レコードから指定した分類を取得
 * 同じレコードから複数項目を取得する場合に使用
 * @param {object} record レコード情報
 * @param {string} targetName 取得対象の名称
 * @returns {string} 指定した分類の値
 * @throws {Error} 指定した分類が存在しない場合
 */
function getClassFromRecord(record, targetName){
    let result = record.ClassHash[targetName];
    if(result == undefined){
        throw new Error(`getClassFromRecord:指定した分類が存在しません。targetName=${targetName}`);
    }
    return result;
}

/**
 * 指定レコードの指定した分類を取得
 * 簡易版。同じレコードから一つだけ項目を取得する場合に使用
 * @param {number} recordId レコードID
 * @param {string} targetName 取得対象の名称
 * @returns {string} 指定した分類の値
 * @throws {Error} 指定した分類が存在しない場合
 */
async function getClassById(recordId, targetName){
    const record = await getRecord(recordId);
    let result = record.ClassHash[targetName];
    if(result == undefined){
        throw new Error(`getClassById:指定した分類が存在しません。targetName=${targetName}`);
    }
    return result;
}

/**
 * レコードから指定した数値を取得
 * 同じレコードから複数項目を取得する場合に使用
 * @param {object} record レコード情報
 * @param {string} targetName 取得対象の名称
 * @returns {number} 指定した数値の値
 * @throws {Error} 指定した数値が存在しない場合
 */
function getNumFromRecord(record, targetName){
    let result = record.NumHash[targetName];
    if(result == undefined){
        throw new Error(`getNumFromRecord:指定した数値が存在しません。targetName=${targetName}`);
    }
    return result;
}

/**
 * 指定レコードの指定した数値を取得
 * 簡易版。同じレコードから一つだけ項目を取得する場合に使用
 * @param {number} recordId レコードID
 * @param {string} targetName 取得対象の名称
 * @returns {number} 指定した数値の値
 * @throws {Error} 指定した数値が存在しない場合
 */
async function getNumById(recordId, targetName){
    const record = await getRecord(recordId);
    let result = record.NumHash[targetName];
    if(result == undefined){
        throw new Error(`getNumById:指定した数値が存在しません。targetName=${targetName}`);
    }
    return result;
}

/**
 * レコードから指定した日付を取得
 * 同じレコードから複数項目を取得する場合に使用
 * @param {object} record レコード情報
 * @param {string} targetName 取得対象の名称
 * @returns {string} 指定した日付の値
 * @throws {Error} 指定した日付が存在しない場合
 */
function getDateFromRecord(record, targetName){
    let result = record.DateHash[targetName];
    if(result == undefined){
        throw new Error(`getDateFromRecord:指定した日付が存在しません。targetName=${targetName}`);
    }
    return result;
}

/**
 * 指定レコードの指定した日付を取得
 * 簡易版。同じレコードから一つだけ項目を取得する場合に使用
 * @param {number} recordId レコードID
 * @param {string} targetName 取得対象の名称
 * @returns {string} 指定した日付の値
 * @throws {Error} 指定した日付が存在しない場合
 */
async function getDateById(recordId, targetName){
    const record = await getRecord(recordId);
    let result = record.DateHash[targetName];
    if(result == undefined){
        throw new Error(`getDateById:指定した日付が存在しません。targetName=${targetName}`);
    }
    return result;
}

/**
 * レコードから指定した説明を取得
 * 同じレコードから複数項目を取得する場合に使用
 * @param {object} record レコード情報
 * @param {string} targetName 取得対象の名称
 * @returns {string} 指定した説明の値
 * @throws {Error} 指定した説明が存在しない場合
 */
function getDescriptionFromRecord(record, targetName){
    let result = record.DescriptionHash[targetName];
    if(result == undefined){
        throw new Error(`getDescriptionFromRecord:指定した説明が存在しません。targetName=${targetName}`);
    }
    return result;
}

/**
 * 指定レコードの指定した説明を取得
 * 簡易版。同じレコードから一つだけ項目を取得する場合に使用
 * @param {number} recordId レコードID
 * @param {string} targetName 取得対象の名称
 * @returns {string} 指定した説明の値
 * @throws {Error} 指定した説明が存在しない場合
 */
async function getDescriptionById(recordId, targetName){
    const record = await getRecord(recordId);
    let result = record.DescriptionHash[targetName];
    if(result == undefined){
        throw new Error(`getDescriptionById:指定した説明が存在しません。targetName=${targetName}`);
    }
    return result;
}

/**
 * レコードから指定したチェックを取得
 * 同じレコードから複数項目を取得する場合に使用
 * @param {object} record レコード情報
 * @param {string} targetName 取得対象の名称
 * @returns {boolean} 指定した数値の値
 * @throws {Error} 指定した数値が存在しない場合
 */
function getCheckFromRecord(record, targetName){
    let result = record.CheckHash[targetName];
    if(result == undefined){
        throw new Error(`getCheckFromRecord:指定したチェックが存在しません。targetName=${targetName}`);
    }
    return result;
}

/**
 * 指定レコードの指定したチェックを取得
 * 簡易版。同じレコードから一つだけ項目を取得する場合に使用
 * @param {number} recordId レコードID
 * @param {string} targetName 取得対象の名称
 * @returns {boolean} 指定したチェックの値
 * @throws {Error} 指定したチェックが存在しない場合
 */
async function getCheckById(recordId, targetName){
    const record = await getRecord(recordId);
    let result = record.CheckHash[targetName];
    if(result == undefined){
        throw new Error(`getCheckById:指定したチェックが存在しません。targetName=${targetName}`);
    }
    return result;
}

/**
 * レコードから指定した添付ファイルを取得
 * 同じレコードから複数項目を取得する場合に使用
 * @param {object} record レコード情報
 * @param {string} targetName 取得対象の名称
 * @returns {object} 指定した添付ファイルの一覧
 * @throws {Error} 指定した添付ファイルが存在しない場合
 */
function getAttachmentsFromRecord(record, targetName){
    let result = record.AttachmentsHash[targetName];
    if(result == undefined){
        throw new Error(`getAttachmentsFromRecord:指定した添付ファイルが存在しません。targetName=${targetName}`);
    }
    return result;
}

/**
 * 指定レコードの指定した添付ファイルを取得
 * 簡易版。同じレコードから一つだけ項目を取得する場合に使用
 * @param {number} recordId レコードID
 * @param {string} targetName 取得対象の名称
 * @returns {object} 指定した添付ファイルの一覧
 * @throws {Error} 指定した添付ファイルが存在しない場合
 */
async function getAttachmentsById(recordId, targetName){
    const record = await getRecord(recordId);
    let result = record.AttachmentsHash[targetName];
    if(result == undefined){
        throw new Error(`getAttachmentsById:指定した添付ファイルが存在しません。targetName=${targetName}`);
    }
    return result;
}
