/**
 * joinedtable.js
 * 
 * 連結表を表すクラス
 */

SL.namespace("RL");
SL.code(function($ = RL){

$.joinedTable = class self {
  constructor() {
    this._records = [];
    this._columns = [];
  }
  
  /*
   * aTableInfo {
   *   name,
   *   table,
   *   key,
   *   foreignKey,
   * }
   */
  static join_T_T(aTableInfo, bTableInfo) {
    let joinedTable = new self();
    let joinedRecords = joinedTable.records;
    
    // Table
    let aTable = aTableInfo.table;
    let bTable = bTableInfo.table;
    
    // Name
    let aName = aTableInfo.name;
    let bName = bTableInfo.name;
    
    if(typeof aName === "undefined" || aName === "") {
      throw new Error("Name of first table is empty");
    }
    if(typeof bName === "undefined" || bName === "") {
      throw new Error("Name of second table is empty");
    }
    if(aName === bName) {
      throw new Error("name of both of tables are the same.");
    }
    
    let aRecords = aTable.records;
    let bRecords = bTable.records;
    
    for(let i = 0, aRecord; aRecord = aRecords[i]; i++) {
      let foreignKeyValue = aRecord[aForeignKey];
      for(let j = 0, bRecord; bRecord = bRecords[j]; j++) {
        if(bRecord[bKey] === foreignKeyValue) {
          let record = {};
          record[aName] = aRecord;
          record[bName] = bRecord;
          joinedRecords.push(record);
          break;
        }
      }
    }

    joinedTable._columns[aName] = aTable.columns;
    joinedTable._columns[bName] = bTable.columns;
    
    return joinedTable;
  }
}


})