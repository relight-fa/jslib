SL.namespace("RL");
SL.code(function($ = RL) {

/**
 * 値を整列されたJSON文字列として出力する
 * @param {any} value 出力する値
 * @return {String} 整列されたJSON形式の文字列
 */
$.vardump = function(value) {
  return _vardump(value, "");
};

/**
 * vardumpで呼び出される再帰関数
 * @param {any} value 出力する値
 * @param {String} indentStr インデントに使う文字列
 * @return {String} 出力された文字列
 */
var _vardump = function(value, indentStr) {
  switch (typeof value) {
    case "undefined": {
      return "undefined";
    }
    case "boolean": {
      return value ? "true" : "false";
    }
    case "string": {
      return '"' + escape(value) + '"';
    }
    case "number": {
      return String(value);
    }
    case "object": {
      // coz. typeof null === "object"
      if (value === null) {
        return "null";
      }
      // Array
      if (value instanceof Array) {
        var newIndentStr = indentStr + "  ";
        var str = "[";
        for(var i = 0; i < value.length; i++) {
          if (str.length != 1) {
            str += ",";
          }
          str += "\n" + newIndentStr + _vardump(value[i], newIndentStr);
        }
        if (str.length == 1) {
          str += "]";
        }
        else {
          str += "\n" + indentStr + "]";
        }
        return str;
      }
      // Object
      var newIndentStr = indentStr + "  ";
      var str = "{";
      for(var key in value) {
        if (str.length != 1) {
          str += ",";
        }
        str += "\n" + newIndentStr + "\"" + escape(key) + "\": " + _vardump(value[key], newIndentStr);
      }
      if (str.length == 1) {
        str += "}";
      }
      else {
        str += "\n" + indentStr + "}";
      }
      return str;
    }
    default: {
      return "null";
    }
  }
};

/**
 * 文字列のエスケープ
 * ダブルクオテーション, \r, \n を\でエスケープ
 */
function escape(str) {
  var out = "";
  var from = 0, to = 0, len = str.length;
  var replaceChar = "";
  while (to < len) {
    var c = str.charCodeAt(to);
    switch (c) {
      case 0x08: // \b
        replaceChar = "\\b";
        break;
      case 0x09: // \t
        replaceChar = "\\t";
        break;
      case 0x0A: // \n
        replaceChar = "\\n";
        break;
      case 0x0C: // \f
        replaceChar = "\\f";
        break;
      case 0x0D: // \r
        replaceChar = "\\r";
        break;
      case 0x22: // "
        replaceChar = "\\\"";
        break;
      case 0x5c: // \
        replaceChar = "\\\\";
        break;
    }
    
    if (replaceChar !== "") {
      out += str.substr(from, to - from);
      out += replaceChar;
      from = to + 1;
      replaceChar = "";
    }
    
    ++to;
  }
  out += str.substr(from, to - from);
  return out;
}
});