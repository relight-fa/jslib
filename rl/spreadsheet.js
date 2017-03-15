/*
 * spreadsheet.js
 *
 * スプレッドシート作成クラス
 */

SL.namespace("RL");

SL.code(function($ = RL) {

/**
 * Spreadsheet
 * Spreadsheetは複数のSheetから成る
 */
$.Spreadsheet = class self {
  
  constructor() {
    // 所有しているシート
    this._sheets = [];
    
    // 登録されているスタイル
    this._styles = [];
  }
  
  /**
   * 所有している全てのシートの配列
   */
  get sheets() {
    return this._sheets;
  }
  
  /* --------------------------------------------------
   * Style Method
   * -------------------------------------------------- */
  
  /**
   * スタイルIDの取得 (export時に呼び出される)
   * 新規スタイルの場合は新規にIDを作成して返す
   */
  getStyleID(style) {
    var styles = this._styles;
    for(let i = 0, compareStyle; compareStyle = styles[i]; i++) {
      if(this.equalStyles(style, compareStyle)) {
        return i;
      }
    }
    styles.push(style);
    return styles.length - 1;
  }
  
  /**
   * 2つのスタイルが等しいか
   */
  equalStyles(aStyle, bStyle) {
    for(var styleName in styleDefinitions) {
      if(aStyle[styleName] != bStyle[styleName]) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * スタイルをXML書式にエンコード
   */
  encodeStyleToXML(style) {
    var str = '';
    for(var styleName in style) {
      var styleDefinition = styleDefinitions[styleName];
      if(! styleDefinition) {
        continue;
      }
      
      str += styleDefinition.export(style[styleName]);
    }
    return str;
  }
  
  /* --------------------------------------------------
   * Sheet Method
   * -------------------------------------------------- */
  /**
   * 新規にシートを追加し、そのシートを返す
   */
  newSheet(sheetName) {
    var sheet = new self.Sheet(this, sheetName);
    this._sheets.push(sheet);
    
    return sheet;
  }
  
  /* --------------------------------------------------
   * Export Method
   * -------------------------------------------------- */
  /**
   * XML形式で出力
   */
  exportAsXML() {
    var str = "";
    str = '<?xml version="1.0"?>' +
          '<?mso-application progid="Excel.Sheet"?>' +
          '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"' +
          ' xmlns:o="urn:schemas-microsoft-com:office:office"' +
          ' xmlns:x="urn:schemas-microsoft-com:office:excel"' +
          ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"' +
          ' xmlns:html="http://www.w3.org/TR/REC-html40">';
    
    var sheetsStr = '';
    // Sheets
    for(let i = 0, sheet; sheet = this.sheets[i]; i++) {
      sheetsStr += sheet.exportAsXML();
    }
    
    // Styles
    if(this._styles.length > 0) {
      str += '<Styles>';
      for(let i = 0, style; style = this._styles[i]; i++) {
        str += '<Style ss:ID="s' + i + '">';
        str += this.encodeStyleToXML(style);
        str += '</Style>';
      }
      str += '</Styles>';
    }
    
    str += sheetsStr;
    
    str += '</Workbook>';
    return str;
  }
};



/* ==================================================
 * Sheet
 * ================================================== */
$.Spreadsheet.Sheet = class self {
  
  constructor(parent, sheetName) {
    this._parent = parent;
    
    if(!sheetName) {
      sheetName = "";
    }
    this._name = sheetName;
    
    this._rowStyles = [];
    this._columnStyles = [];
    
    this._rows = [];
    
    // 行・列を固定表示する際のスクロールの基点となるセルの座標
    this._fixedPosition = {row: 0, col: 0};
  }
  
  /**
   * シートの名前
   */
  get name() {
    return this._name;
  }
  set name(str) {
    this._name = String(str);
  }
  
  /**
   * 行・列の固定表示
   * 固定表示の基準となるセルの行・列を指定する.
   * row = 1, col = 2を指定すると上1行、左2列が固定表示される.
   *
   * @param {Integer} row
   * @param {Integer} col
   */
  setFixedPosition(row, col) {
    if(row < 0 || col < 0) {
      throw new Error("invalid argument");
    }
    
    this._fixedPosition.row = row;
    this._fixedPosition.col = col;
  };
  
  /* --------------------------------------------------
   * Style Method
   * -------------------------------------------------- */
  /**
   * 指定行のスタイル指定
   */
  setRowStyle(rowIndex, style) {
    if(rowIndex < 0) {
      throw new Error("invalid argument");
    }
    
    this._rowStyles[rowIndex] = style;
  }
  
  /**
   * 指定行にスタイルの追加
   */
  addRowStyle(rowIndex, style) {
    if(rowIndex < 0) {
      throw new Error("invalid argument");
    }
  }
  
  /**
   * 指定行のスタイルを削除
   */
  removeRowStyle(rowIndex) {
    if(rowIndex < 0) {
      throw new Error("invalid argument");
    }
    
    this._rowStyles[rowIndex] = null;
  }
  
  /**
   * 指定列のスタイル指定
   */
  setColumnStyle(columnIndex, style) {
    if(columnIndex < 0) {
      throw new Error("invalid argument");
    }
    
    this._columnStyles[columnIndex] = style;
  }
  
  /**
   * 指定列にスタイルの追加
   */
  addColumnStyle(columnIndex, style) {
    if(rowIndex < 0) {
      throw new Error("invalid argument");
    }
  }
  
  /**
   * 指定列のスタイルを削除
   */
  removeColumnStyle(columnIndex) {
    if(columnIndex < 0) {
      throw new Error("invalid argument");
    }
    
    this._columnStyles[columnIndex] = null;
  }
  
  /* --------------------------------------------------
   * Row, Cell Method
   * -------------------------------------------------- */
  /**
   * 行の拡張
   */
  expandRows(maxRow) {
    for(let i = this._rows.length; i <= maxRow; i++) {
      this._rows.push([]);
    }
  }
  
  /**
   * 指定セルの値を設定
   */
  setCell(row, col, value) {
    if(row < 0 || col < 0) {
      throw new Error("invalid cell is specified. row=" + row + ", col=" + col);
    }
    this.expandRows(row);
    (this._rows[row])[col] = value;
  }
  
  /**
   * 二次元配列による複数セルの値を設定
   */
  setCells(row, col, values) {
    if(row < 0 || col < 0) {
      throw new Error("invalid cell is specified. row=" + row + ", col=" + col);
    }
    
    this.expandRows(row + values.length - 1);
    
    var targetRow;
    for(let i = 0, valuesRow; valuesRow = values[i]; i++) {
      targetRow = this._rows[row + i];
      for(let j = 0; j < valuesRow.length; j++) {
        targetRow[col + j] = valuesRow[j];
      }
    }
  }
  
  /**
   * オブジェクトと、プロパティの列挙順を指定してセルの値を設定
   */
  setCellsWithObject(row, col, obj, properties) {
    if(row < 0 || col < 0) {
      throw new Error("invalid cell is specified. row=" + row + ", col=" + col);
    }
    
    this.expandRows(row);
    var targetRow = this._rows[row];
    for(let i = 0; i < properties.length; i++) {
      targetRow[col + i] = obj[properties[i]];
    }
  }
  
  /* --------------------------------------------------
   * Export Method
   * -------------------------------------------------- */
  /**
   * XML文字列へのエクスポート
   */
  exportAsXML() {
    var str = '';
    str += '<Worksheet ss:Name="' + htmlspecialchars(this.name) + '">';
    str += '<Table>';
    
    var rowSkipped = false, columnSkipped = false;
    
    // columnStyle
    for(let i = 0, columnStyle; columnStyle = this._columnStyles[i]; i++) {
      if(! columnStyle) {
        columnSkipped = true;
        continue;
      }
      
      let styleID = this._parent.getStyleID(this._columnStyles[i]);
          
      str += '<Column';
      str += ' ss:StyleID="' + styleID + '"';
      str += '/>';
    }
    
    // row
    for(let i = 0, row; row = this._rows[i]; i++) {
      if(row.length == 0) {
        rowSkipped = true;
        continue;
      }
      
      str += '<Row';
      if(rowSkipped) {
        str += ' ss:Index="' + (i + 1) + '"';
        rowSkipped = false;
      }
      // style
      if(this._rowStyles[i]) {
        let styleID = this._parent.getStyleID(this._rowStyles[i]);
        str += ' ss:StyleID="s' + styleID + '"';
      }
      str += '>';
      
      columnSkipped = false;
      // cell
      for(let j = 0; j < row.length; j++) {
        var value = row[j];
        if(typeof value === "undefined" || value === "") {
          columnSkipped = true;
          continue;
        }
        value = String(value);
        
        str += '<Cell';
        if(columnSkipped) {
          str += ' ss:Index="' + ( j + 1 ) + '"';
          columnSkipped = false;
        }
        str += '>';
            
        str += '<Data ss:Type="String">';
        str += htmlspecialchars(value);
        str += '</Data></Cell>';
      }
      str += '</Row>';
    }
    
    str += '</Table>';
    str += '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">';
    
    if(this._fixedPosition.col > 0) {
      str += '<SplitVertical>' + this._fixedPosition.col + '</SplitVertical>';
    }
    if(this._fixedPosition.row > 0) {
      str += '<SplitHorizontal>' + this._fixedPosition.row + '</SplitHorizontal>';
    }
    
    str += '</WorksheetOptions>';
    str += '</Worksheet>';
    return str;
  }
}

/**
 * スタイル定義
 */
var styleDefinitions = {
  "border": {
    export: function(value) {
      var str = '<Borders>';
        for(let i = 0, borderPosition; borderPosition = kStyleBorders[i]; i++) {
          if(value[borderPosition.key]) {
            str += '<Border ss:Position="' + borderPosition.value + '" ss:LineStyle="Continuous" ss:Weight="1"/>';
          }
        }
      str += '</Borders>';
      return str;
    }
  },
  "background": {
    export: function(value) {
      return '<Interior ss:Color="' + value.color + '" ss:Pattern="Solid"/>'
    }
  }
};

var kStyleBorders = [
  {
    key: "top", value:"Top",
  },
  {
    key: "right", value:"Right",
  },
  {
    key: "bottom", value:"Bottom",
  },
  {
    key: "left", value:"Left",
  },
];

function htmlspecialchars(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

}); // End SL.code;

