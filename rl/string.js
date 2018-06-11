SL.namespace("RL");
SL.code(function($ = RL) {

/**
 * 各種オブジェクトの文字列可
 * undefined を空文字列として返す
 */
$.toString = function(value) {
  switch(typeof value) {
    case "string": {
      return value;
    }
    case "undefined": {
      return "";
    }
    default: {
      return String(value);
    }
  }
}

/**
 * 前後の空白を取る
 * @param {String} str 対象となる文字列
 * @param {String} mask オプション.ここに文字列を指定することで、取り除く文字をmask内の文字に変更することができる
 * @return {String} strの両端からmask内の文字を取り除いた結果を返す
 */
$.trim = function(str, mask) {
  var i, from, to;
  var len = str.length;
  if(typeof mask === "undefined") {
    mask = " \f\n\r\t\v​\u00a0\u1680​\u180e\u2000​\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a​\u2028\u2029\u202f\u205f​\u3000\ufeff";
  }
  for(from = 0; from < len; from++) {
    if(mask.indexOf(str.charAt(from)) === -1) {
      break;
    }
  }
  if (from === len) {
    return "";
  }
  for(to = len - 1; to > 0; to--) {
    if(mask.indexOf(str.charAt(to)) === -1) {
      break;
    }
  }
  return str.substr(from, to - from + 1);
}
/**
 * 前の空白を取る
 * @param {String} str 対象となる文字列
 * @param {String} mask オプション.ここに文字列を指定することで、取り除く文字をmask内の文字に変更することができる
 * @return {String} strの前からmask内の文字を取り除いた結果を返す
 */
$.ltrim = function(str, mask) {
  var i, from;
  var len = str.length;
  if(typeof mask === "undefined") {
    mask = " \f\n\r\t\v​\u00a0\u1680​\u180e\u2000​\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a​\u2028\u2029\u202f\u205f​\u3000\ufeff";
  }
  for(from = 0; from < len; from++) {
    if(mask.indexOf(str.charAt(from)) === -1) {
      break;
    }
  }
  return str.substr(from);
}
/**
 * 後ろの空白を取る
 * @param {String} str 対象となる文字列
 * @param {String} mask オプション.ここに文字列を指定することで、取り除く文字をmask内の文字に変更することができる
 * @return {String} strの後ろからmask内の文字を取り除いた結果を返す
 */
$.rtrim = function(str, mask) {
  var i, from;
  var len = str.length;
  if(typeof mask === "undefined") {
    mask = " \f\n\r\t\v​\u00a0\u1680​\u180e\u2000​\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a​\u2028\u2029\u202f\u205f​\u3000\ufeff";
  }
  for(to = len - 1; to > 0; to--) {
    if(mask.indexOf(str.charAt(to)) === -1) {
      break;
    }
  }
  return str.substr(0, to + 1);
};

/**
 * 文字列が指定した文字列で始まるか
 */
$.startsWith = function(src, search) {
  return src.substr(0, search.length) === search;
};

/**
 * 文字列が指定した文字列で終わるか
 */
$.endsWith = function(src, search) {
  var len = search.length;
  return src.substr(src.length - len) === search;
};

/**
 * キャプチャグループに対応した正規表現グローバルマッチ
 */
$.matchAll = function(str, regexp) {
  var results = [];
  
  // regexp にグローバルフラグが立っていなければ作り直す
  if (regexp.global === false) {
    var flags = regexp.flags + "g";
    regexp = new RegExp(regexp, flags);
  }
  else {
    regexp.lastIndex = 0;
  }
  
  var match;
  while ((match = regexp.exec(str)) !== null) {
    results.push(match);
  }
  
  if (results.length === 0) {
    return null;
  }
  
  return results;
};

/**
 * 正規表現のマッチごとに処理を行う
 */
$.forMatches = function(str, regexp, func) {
  // regexp にグローバルフラグが立っていなければ作り直す
  if (regexp.global === false) {
    var flags = regexp.flags + "g";
    regexp = new RegExp(regexp, flags);
  }
  else {
    regexp.lastIndex = 0;
  }
  
  var match;
  while ((match = regexp.exec(str)) !== null) {
    func(match);
  };
};

});
