/**
 *
 * table.js
 *
 * テーブルデータを扱うためのクラス.
 * 主にCSVを読み込み、またCSVとして書き出すことを目的とする.
 *
 * データの実装は
 * レコードを連想配列風オブジェクトで表現し
 * テーブルをレコードの配列で表現している.
 * 例えば次のようなCSV文字列
 *
 * a,b,c,d
 * 0,1,2,3
 * 4,5,6,7
 * 8,9.10,11
 *
 * をこのクラスのオブジェクトとして読み込むと内部で次のような配列が作成される
 *
 * [
 *   {"a": "0", "b": "1", "c": "2", "d": "3"},
 *   {"a": "4", "b": "5", "c": "6", "d": "7"},
 *   {"a": "8", "b": "9", "c": "10", "d": "11"}
 * ]
 *
 * また同時にカラムの値の配列も作成される
 *
 * ["a", "b", "c", "d"]
 *
 * この配列のインデックスとカラムの表示順が対応している.
 *
 *
 * usage)
 *
 * [1] CSVファイルの読み込み
 * Table.fromCSVPath メソッドを利用する.
 *
 * var table;
 * RL.Table.fromCSVPath("table.csv")
 * .then(function(result) {
 *   table = result;
 * });
 *
 * [2] ファイル選択フィールドで選択されたCSVファイルの読み込み
 * Fileオブジェクトを取り出して、fromCSVBlobクラスメソッドを呼び出す.
 *
 * var files = fileFiled.files;
 * if (files.length == 0) {
 *   return;
 * }
 *
 * var table;
 * RL.Table.fromCSVBlob(file[0])
 * .then(funciton(result) {
 *   table = result;
 * });
 *
 * [3] テーブルのレコードにアクセスする
 * recordsプロパティからレコード配列にアクセスできる.
 *
 * // 全レコードのnameを列挙する
 * for (let i = 0, record; record = table.records[i]; i++) {
 *   console.log(record.name);
 * }
 *
 * // ArrayなのでforEachを使ってもよい
 * table.records.forEach(function(record) {
 *   console.log(record.name);
 * });
 */

SL.import("sjis.js");
SL.import("file.js");

SL.namespace("RL");

SL.code(function($ = RL) {
$.Table = class self {
  /**
   * Constructor
   */
  constructor() {
    // レコードを格納する配列
    this._records = [];

    // カラムを格納する配列(カラム表示順徐はこのインデクスに従う)
    this._columns = [];
  }

  /* ------------------------------------------------------------
   * Properties
   * ------------------------------------------------------------ */
  /**
   * テーブル内のレコード数
   */
  get length() {
    return this._records.length;
  }

  /**
   * レコード配列へのアクセス
   */
  get records() {
    return this._records;
  }

  /**
   * カラム配列
   */
  get columns() {
    return this._columns;
  }

  /* ------------------------------------------------------------
   * Record Methods
   * ------------------------------------------------------------ */
  /**
   * レコードの複製
   * テーブルのカラムに対応するプロパティをシャローコピーしたオブジェクトを返す.
   *
   * @param {Object} record 複製するレコードオブジェクト
   * @return {Object} 複製されたレコードオブジェクト
   */
  copyRecord(record) {
    var copy = {};
    for (var i = 0, len = this._columns.length; i < len; i++) {
      var column = this._columns[i];
      copy[column] = record[column];
    }
    return copy;
  }
  
  /**
   * レコードの追加
   * @param {Object} record 追加するレコードオブジェクト
   * @param {Boolean} copy falseならば引数recordそのものを内部に追加
   *                       trueならば引数recordのコピーを作成し内部に追加する
   *                       (デフォルトでfalse)
   */
  addRecord(record, copy = false) {
    if (copy === true) {
      this._records.push(this.copyRecord(record));
    }
    else {
      this._records.push(record);
    }
  }
  
  /**
   * 複数のレコードの追加
   *
   * @param {Array<Object>} records 追加するレコードオブジェクトの配列
   * @param {Boolean} copy falseならば引数recordそのものを内部に追加
   *                       trueならば引数recordのコピーを作成し内部に追加する(デフォルトでfalse)
   */
  addRecords(records, copy = false) {
    if (copy === true) {
      for (var i = 0, record; record = records[i++];) {
        this._records.push(this.copyRecord(record));
      }
    }
    else {
      for (var i = 0, record; record = records[i++];) {
        this._records.push(record);
      }
    }
  }
  
  /**
   * レコードの逐次処理
   */
  forEach(func, thisObj) {
    this._records.forEach(func, thisObj);
  }
  
  /* ------------------------------------------------------------
   * Column Methods
   * ------------------------------------------------------------ */
  /**
   * 指定した名前のカラムが存在するか
   */
  columnExists(columnName) {
    return this._columns.indexOf(columnName) !== -1;
  }
  
  /**
   * カラムの追加
   *
   * @param newColumn 追加するカラムの名前
   * @param shouldInit この値が undefined でない場合、この値で既存レコードの新規カラムの値を初期化する.
   * @return 追加に成功したらfalse, 失敗したらtrue
   *          すでに指定した名前のカラムが存在していた場合、追加に失敗する.
   */
  addColumn(newColumn, initialValue = undefined) {
    if (this._columns.indexOf(newColumn) !== -1) {
      return true;
    }
    
    // Check Arguments
    if (! newColumn) {
       throw(new Error("column name is empty"));
    }
    
    this._columns.push(newColumn);

    // initialize values of new column;
    if (typeof initialValue !== "undefined") {
      for (let i = 0, len = this._records.length; i < len; i++) {
        this._records[i][newColumn] = initialValue;
      }
    }
  }
  
  /**
   * カラムの追加(複数)
   *
   * @param {Array<String>} 追加するカラム名の配列
   */
  addColumns(newColumns) {
    for (let i = 0, newColumn; newColumn = newColumns[i++];) {
      if (! newColumn) {
        continue;
      }
      if (this._columns.indexOf(newColumn) !== -1) {
        continue;
      }
      
      this._columns.push(newColumn);
    }
  }
  
  /**
   * 指定したインデックスにカラムを挿入する.
   */
  addColumnTo(newColumn, dstIndex, initialValue = undefined) {
    // Check arguments
    if (dstIndex < 0) {
      dstIndex = 0;
    }
    else if (dstIndex > this._columns.length) {
      dstIndex = this._columns.length;
    }
    
    if (typeof newColumn === "undefined") {
       throw(new Error("column name is empty"));
    }
    if (this._columns.indexOf(newColumn) !== -1) {
       throw(new Error("a column of specified name already exists."));
    }
    
    this._columns.splice(dstIndex, 0, newColumn);

    // initialize values of new column;
    if (typeof initialValue !== "undefined") {
      for (let i = 0, len = this._records.length; i < len; i++) {
        this._records[i][newColumn] = initialValue;
      }
    }
  }
  
  /**
   * 指定したカラムの後ろに新規にカラムを追加する
   */
  addColumnAfter(newColumn, dstColumn, initialValue) {
    if (typeof newColumn === "undefined" || newColumn === "") {
       throw(new Error("column name is empty"));
    }
    if (this._columns.indexOf(newColumn) !== -1) {
       throw(new Error("a column of specified name already exists."));
    }
    
    var dstIndex = this._columns.indexOf(dstColumn) + 1;
    this._columns.splice(dstIndex, 0, newColumn);
    
    // initialize values of new column;
    if (typeof initialValue !== "undefined") {
      for (let i = 0, len = this._records.length; i < len; i++) {
        this._records[i][newColumn] = initialValue;
      }
    }
  }
  
  
  /**
   * 指定したインデックスにカラムを移動する
   */
  moveColumnTo(column, index) {
    var currentIndex = this._columns.indexOf(column);
    if (currentIndex == -1 || currentIndex == index) {
      return;
    }
    
    if (currentIndex < index) {
      for (var i = currentIndex + 1; i <= index; i++) {
        this._columns[i - 1] = this._columns[i];
      }
      this._columns[index] = column;
    }
    else {
      for (var i = currentIndex - 1; i >= index; i--) {
        this._columns[i + 1] = this._columns[i];
      }
      this._columns[index] = column;
    }
  }
  
  /**
   * カラムの移動
   * カラムtargetColumn を カラムdstColumn の後ろに移動する.
   */
  moveColumnAfter(targetColumn, dstColumn) {
    let targetColumnIndex = this._columns.indexOf(targetColumn);
    let dstColumnIndex = this._columns.indexOf(dstColumn);
    if (targetColumnIndex === -1 || dstColumnIndex === -1) {
      return;
    }

    let columns = this._columns;

    if (targetColumnIndex < dstColumnIndex) {
      let tempColumn = columns[targetColumnIndex];
      for (let i = targetColumnIndex + 1; i <= dstColumnIndex; i++) {
        columns[i - 1] = columns[i];
      }
      columns[dstColumnIndex] = tempColumn;
    }
    else {
      let tempColumn = columns[targetColumnIndex];
      for (let i = targetColumnIndex - 1; i >= dstColumnIndex + 1; i--) {
        columns[i + 1] = columns[i];
      }
      columns[dstColumnIndex + 1] = tempColumn;
    }
  }
  
  /**
   * カラムの削除
   *
   * @param {String} columnName 削除するカラムの名前
   * @param {Boolean} deleteProperty
   *     レコードオブジェクトから該当プロパティを削除するか.
   *     デフォルトでfalse
   */
  deleteColumn(columnName, deleteProperty = false) {
    var idx = this._columns.indexOf(columnName);
    if (idx == -1) {
      return;
    }
    
    this._columns.splice(idx, 1);
    
    if (deleteProperty) {
      for (let i = 0, record; record = this._records[i++];) {
        delete record[columnName];
      }
    }
  };
  
  /* ------------------------------------------------------------
   * Filter Methods
   * ------------------------------------------------------------ */
  /**
   * テーブルにフィルターをかけ、合致したレコードを抽出したテーブルを作成する
   * @param {Function} filterFunc
   *     条件式となる関数.
   *     第1引数にレコードオブジェクトを受け取り、true or falseを返す.
   * @return {RL.Table} フィルターに合致したレコードによるテーブル
   */
  filter(filterFunc) {
    var newTable = self.fromColumns(this.columns);
    var dstRecords = newTable._records;
    var i, len, record;
    for (i = 0, len = this._records.length; i < len; i++) {
      record = this._records[i];
      if (filterFunc(record)) {
        dstRecords.push(record);
      }
    }
    
    return newTable;
  }
  
  /**
   * テーブルを条件によって2つに分ける
   * @param {Function} separateFunc
   *     条件式となる関数.
   *     第1引数にレコードオブジェクトを受け取り、true or falseを返す.
   * @return {Object} trueとfalseの2つのプロパティにテーブルを持ち
   *                  separateFuncの返り値に応じて各レコードがどちらかのテーブルに分けられる
   */
  separate(separateFunc) {
    var trueTable = self.fromColumns(this.columns);
    var falseTable = self.fromColumns(this.columns);
    var trueRecrods = trueTable._records;
    var falseRecrods = falseTable._records;
    var i, len, record;
    for (i = 0, len = this._records.length; i < len; i++) {
      record = this._records[i];
      var result = separateFunc(record);
      if (result) {
        trueRecrods.push(record);
      }
      else {
        falseTable.push(record);
      }
    }
    
    return {
      "true": trueTable,
      "false": falseTable
    };
  }
  
  /**
   * 条件に合致したレコードを削除する
   * @param {Function} func 条件式となる関数.
   *                        第1引数にレコードオブジェクトを受け取り、true or falseを返す.
   */
  exclude(func) {
    var i, j, len = this._records.length;
    var records = this._table.records;
    // 削除されるインデックスの昇順リスト
    var deleteList = [];
    for (i = 0; i < len; i++) {
      record = this._records[i];
      if (! func(record)) {
        continue;
      }
      deleteList.push(i);
    }
    deleteList.push(len); // 番兵データ
    
    for (i = 0, len = deletedList.length - 1; i < len; i++) {
      for (j = deletedList[i] + 1, dst = deletedList[i+1]; j < dst; j++) {
        records[j - i - 1] = records[j];
      }
    }
    
    records.length = records.length - (deleteList.length - 1);
  }
  
  /**
   * 条件に合致するレコードが存在するか
   * @param {Function} func 条件式となる関数.
   *                        第1引数にレコードオブジェクトを受け取り、true or falseを返す.
   * @return {Boolean} 条件式に合致するレコードが存在すればtrue
   */
  any(func) {
    var i, len;
    for (i = 0, len = this._records.length; i < len; i++) {
      if (func(this._records[i])) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * 条件に合致する最初のレコードの検索
   * @param {Function} func 条件式となる関数.
   *                        第1引数にレコードオブジェクトを受け取り、true or falseを返す.
   * @return {Object} 条件式に最初に合致するレコード. ヒットしなかった場合は null.
   */
  first(func) {
    var i, len;
    var records = this._records;
    for (i = 0, len = records.length; i < len; i++) {
      var record = records[i];
      if (func(record)) {
        return record;
      }
    }
    return null;
  }
  
  /**
   * 条件に合致する最後のレコードの検索
   * @param {Function} func 条件式となる関数.
   *                        第1引数にレコードオブジェクトを受け取り、true or falseを返す.
   * @return {Object} 条件式に最初に合致するレコード. ヒットしなかった場合は null.
   */
  last(func) {
    var i;
    var records = this._records;
    for (i = records.length - 1; i > 0; i--) {
      var record = records[i];
      if (func(record)) {
        return record;
      }
    }
    return null;
  }
  
  /* ------------------------------------------------------------
   * Export Methods
   * ------------------------------------------------------------ */
  /**
   * CSV文字列として出力する
   */
  exportAsCSVString() {
    var i, j;
    var headerLength = this.columns.length;
    var str = "";
    var record;
    var newLineCode = String.fromCharCode(13, 10);
    //header
    for (j = 0; j < headerLength; j++) {
      if (j > 0) {
        str += ",";
      }
      str += stringToCSVCellFormat(this.columns[j]);
    }
    
    //records
    for (i = 0; i < this.records.length; i++) {
      str += newLineCode;
      record = this.records[i];
      for (j = 0; j < headerLength; j++) {
        if (j > 0) {
          str += ",";
        }
        str += stringToCSVCellFormat(record[this.columns[j]]);
      }
    }
    
    return str;
  }
  
  /**
   * CSVファイルのBlobオブジェクトとして出力する
   *
   * @param {String} encode テキストエンコーディングの指定
   *                         無指定だとUTF-8
   */
  exportAsCSVBlob(encode) {
    if (encode) {
      encode = encode.toLowerCase();
    }
    
    // CSVテキストを出力してBlob化
    var str = this.exportAsCSVString();
    var blob;
    
    if (encode == "sjis") {
      var sjisBytes = RL.StringEncode.SJIS.encode(str);
      blob = new Blob([sjisBytes], {type: "text/csv"});
    }
    else {
      blob = new Blob([str], {type: "text/csv"});
    }
    return blob;
  }
  
  /**
   * ヘッダ部分をCSV形式で出力
   */
  exportHeaderAsCSV() {
    var i;
    var str = "";
    for (i = 0; i < this.columns.length; i++) {
      if (i > 0) {
        str += ",";
      }
      str += stringToCSVCellFormat(this.columns[j]);
    }
    return str;
  };
  
  /**
   * 単一レコードをCSV形式で出力
   */
  exportRecordAsCSV(record) {
    var i;
    var str = "";
    for (i = 0; i < this.columns.length; i++) {
      if (i > 0) {
        str += ",";
      }
      str += stringToCSVCellFormat(record[this.columns[j]]);
    }
    return str;
  };
  
  /* ------------------------------------------------------------
   * Other Instanee Methods
   * ------------------------------------------------------------ */
  /**
   * インデックス(索引)の作成
   * @param {String} key キーとなるカラム名
   */
  createIndex(key) {
    var index = {};
    var records = this._records;
    for (var i = 0, len = records.length; i < len; i++) {
      var record = records[i];
      index[record[key]] = record;
    }
    return index;
  }
  
  /* ------------------------------------------------------------
   * Creation Methods
   * ------------------------------------------------------------ */
  /**
   * カラム構造を指定して空のテーブルを作成する.
   * @param {Array} columns カラム名の配列
   */
  static fromColumns(columns) {
    var table = new self();
      
    for (var i = 0; i < columns.length; i++) {
      table._columns.push(columns[i]);
    }
    
    return table;
  }
  
  /**
   * CSV文字列からテーブルを作成する.
   * 1行目はヘッダ行として解釈する.
   *
   * @param {String} str パースするCSV文字列
   */
  static fromCSVString(csvStr) {
    var i;
    var table = new self();
    var record;
    
    var iterator = new CSVReadIterator(csvStr);
    
    // ヘッダ行の読み込み
    while(true) {
      iterator.next();
      if (iterator.end) {
        break;
      }
      if (iterator.newLine) {
        break;
      }
      var value = iterator.value;
      
      // empty column name
      if (value === "") {
        throw Error("Header Index of " + table._columns.length + " is empty.");
      }
      // already defined
      else if (table._columns.indexOf(value) !== -1) {
        throw Error("Header Name '"+value+"' is already defined.");
      }
      
      table.columns.push(value);
    }
    
    if (iterator.end) {
      return table;
    }
    
    // 各行の読み込み
    record = {};
    var columnIndex = 0;
    
    while(iterator.next()) {
      if (iterator.newLine) {
        for (i = columnIndex; i < table.columns.length; i++) {
          record[table.columns[i]] = "";
        }
        table.addRecord(record);
        
        record = {};
        columnIndex = 0;
        
      }
      else {
        if (columnIndex >= table.columns.length) {
          var pos = iterator.getCurrentPosition();
          throw Error("too many columns " + pos.line + "[" + pos.char + "]");
        }
        record[table.columns[columnIndex]] = iterator.value;
        columnIndex++;
      }
    }
    if (columnIndex > 0) {
      table.addRecord(record);
    }
    
    return table;
  }

  /**
   * CSVファイルからテーブルを作成する. (同期処理)
   * @param {String} path CSVファイルのパス
   */
  static fromCSVPath(path) {
    try {
      var text = RL.File.readFromPath(path, "text");
      var table = self.fromCSVString(text);
      return table;
    }
    catch(e) {
      throw(e);
    }
  }

  /**
   * CSVファイルからテーブルを作成する. (Promiseによる非同期処理)
   * @param {String} path CSVファイルのパス
   */
  static fromCSVPathAsync(path) {
    return new Promise(function(resolve, reject) {
      RL.File.Async.readFromPath(path, "text")
      .then(function(result) {
        try {
          var table = self.fromCSVString(result);
          resolve(table);
        }
        catch(e) {
          console.error(e);
          reject(e);
        }
      });
    });
  }
  
  /**
   * CSV形式のBlobオブジェクトからテーブルを作成する.　(Promiseによる非同期処理)
   * 1行目はヘッダ行として解釈する.
   */
  static fromCSVBlobAsync(blob) {
    return new Promise(function(resolve, reject) {
      RL.File.Async.readFromBlob(blob, "text")
      .then(function(result) {
        try {
          var table = self.fromCSVString(result);
          resolve(table);
        }
        catch(e) {
          console.log("cannot create table from csv");
          reject(e);
        }
      });
    });
  }
  
  /* ------------------------------------------------------------
   * Other
   * ------------------------------------------------------------ */
  combine(table) {
    var i, len;
    for (i = 0, len = table._columns.length; i < len; i++) {
      var column = table._columns[i];
      if (this._columns.indexOf(column) == -1) {
        this._columns.push(column);
      }
    }
    
    var record;
    for (var i = 0, len = table._records.length; i < len; i++) {
      this._records.push(table._records[i]);
    }
  }
  
  /**
   * 2つのテーブルを結合して新規のテーブルを作成する.
   */
  static combine(table0, table1) {
    var i, len;
    var table = new self();
    
    // set columns
    for (i = 0, len = table0._columns.length; i < len; i++) {
      table._columns.push(table0._columns[i]);
    }
    for (i = 0, len = table1._columns.length; i < len; i++) {
      var column = table1._columns[i];
      if (table._columns.indexOf(column) == -1) {
        table._columns.push(column);
      }
    }
    
    // set records
    var record;
    for (var i = 0, len = table0._records.length; i < len; i++) {
      record = table0._records[i];
      table._records.push(record);
    }
    for (var i = 0, len = table1._records.length; i < len; i++) {
      record = table1._records[i];
      table._records.push(record);
    }
    
    return table;
  }
};

/**
 * CSVReadIterator Class
 * CSV構文解析用クラス
 */
var CSVReadIterator = class {
  /**
   * Constructor
   */
  constructor(csvData) {
    this.data = csvData + "";
    this.position = 0;
    this.value = "";
    this.newLine = false;
    this.end = false;
  }
  
  /**
   * 現在の読み取り位置を返す
   */
  getCurrentPosition() {
    var i;
    var row = 1, col = 1;
    for (i = 0; i < this.position; i++) {
      var c = this.data.charAt(i);
      if (c === "\n") {
        row++;
        col = 1;
      }
    }
    
    return {line: row, char: col};
  }
  
  
  /**
   * 次の構文要素を読み取る
   *
   * ・次の要素がテーブル要素の場合はvalueプロパティにその値が代入される.
   * ・次の要素が改行の場合はnewLineプロパティにtrueが代入される.
   * ・文字列末尾に達した場合はendプロパティにtrueが代入される.
   */
  next() {
    this.newLine = false;
    this.value = "";
    var data = this.data;
    // endsd
    if (this.position >= data.length) {
      this.end = true;
      return false;
    }

    var c = data.charCodeAt(this.position);

    // new line
    if (c == 13) { // \r
      this.position++;
      c = data.charCodeAt(this.position);
      if (c == 10) { // \r
        this.position++;
      }
      this.newLine = true;
      return true;
    }
    else if (c == 10) { // \n
      this.position++;
      this.newLine = true;
      return true;
    }

    // double quoted string
    if (c == 34) { // "
      var cell = "";
      while(true) {
        this.position++;
        if (this.position >= data.length) {
          break;
        }

        c = data.charCodeAt(this.position);
        if (c == 34) { // "
          this.position++;
          c = data.charCodeAt(this.position);
          if (c == 34) { // escaped double quote
            cell += '"';
          }
          else if (c == 44) { // ,
            this.position++;
            break;
          }
          else if (c == 10 || c == 13) { // new Line
            break;
          }
        }
        else {
          cell += String.fromCharCode(c);
        }
      }
      this.value = cell;
      return true;
    }
    // not double quoted string
    else {
      var from = this.position;
      var to;
      while(true) {
        if (this.position >= data.length) {
          to = this.position;
          break;
        }
        else if (c == 44) {
          to = this.position;
          this.position++;
          break;
        }
        else if (c == 10 || c == 13) {
          to = this.position;
          break;
        }
        this.position++;
        c = data.charCodeAt(this.position);
      }
      this.value = data.substr(from, to - from);
      return true;
    }
  }
};

/**
 * 文字列をCSVセル用のフォーマットに変換する.
 * カンマ, 改行, ダブルクオテーションを含まない文字列はそのまま返す.
 * 含む場合はダブルクオテーションに2重にし、両端をダブルクオテーションで括る
 * @param str フォーマットしたい文字列
 * @returns CSVセル用にフォーマットされた文字列
 */
function stringToCSVCellFormat(str) {
  if (typeof str === "undefined" || str === "") {
    return "";
  }
  
  str = str + "";
  
  // カンマ, 改行, ダブルクオテーションを含むか
  var len = str.length;
  for (var i = 0; i < len; i++) {
    var c = str.charCodeAt(i);
    if (c === 44 || c === 34 || c === 10 || c === 13) {
      break;
    }
  }
  // 含まない場合は文字列をそのまま返せばよい
  if (i === len) {
    return str;
  }
  // 含む場合は文字列中のダブルクオテーションを2重にし
  // 文字列の前後をダブルクオテーションで括る
  var from = i;
  var to;
  var outStr = '"' + str.substring(0, from);
  while(true) {
    to = str.indexOf('"', from);
    if (to == -1) {
      break;
    }
    to++;
    outStr += str.substring(from, to) + '"';
    from = to;
  }
  outStr += str.substring(from, str.length) + '"';
  return outStr;
}

}); // End SL.code







