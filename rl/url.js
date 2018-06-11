/*
  url.js
  
  URL操作.
  URLの分解や、相対URLから絶対URLへの補完処理等.
  
  以下の表記のURLに対応する.
  (1) 絶対URL
    http://www.abc.def/gh/ij/kl
  (2) 現在のスキームからの相対URL
    //www.abc.def/
  (3) 現在のドメインルートからの相対URL
    /gh/ij/kl
  (4) 現在のファイルからの相対URL
    ij/kl
    ./ij/kl
    ../ij/kl
 */

SL.namespace("RL");
SL.code(function($ = RL) {

/**
 * origin 上での relativeURL の参照先を求める.
 * @param {String} origin 基準となるURL
 * @param {String} relativeURL origin を基準とした相対URL.
 * @return {String}
 *     origin 上でのrelativeURLの参照先.
 *     relativeURL が絶対パスならばその値をそのまま返す.
 */
$.getURLFromRelativeURL = function(origin, relativeURL) {
  relativeInfo = $.parseURL(relativeURL);
  // 相対URLにスキームが存在する => 絶対パスなのでそのまま返す
  if (relativeInfo.scheme) {
    return relativeURL;
  }
  
  originInfo = $.parseURL(origin);
  
  if (relativeURL.charAt(0) === "/") {
    // relativeURL == "//..."
    if (relativeURL.charAt(1) === "/") {
      originInfo.domain = relativeInfo.domain;
      originInfo.path = relativeInfo.path;
    }
    // relativeURL = "/..."
    else {
      originInfo.path = relativeInfo.path;
    }
  }
  else {
    path = originInfo.path;
    path = path.substr(0, path.lastIndexOf("/")) + "/";
    path += relativeInfo.path;
    originInfo.path = path;
  }
  originInfo.query = relativeInfo.query;
  originInfo.hash = relativeInfo.hash;
  
  return $.buildURL(originInfo);
};

/**
 * パスの正規化
 * パス中の"./", "../"を解釈する
 */
$.normalizePath = function(path) {
  var itemsBefore = path.split("/");
  var itemsAfter = new Array(itemsBefore.length);
  var itemsAfterLength = 0;
  var i;
  // 階層を遡る相対URLとなる場合の接頭文字列 ("../"が連なる文字列)
  var overDeep = "";
  for (i = 0, len = itemsBefore.length; i < len; i++) {
    var item = itemsBefore[i];
    switch(item) {
      case ".": {
        break;
      }
      // 階層を一つ戻る
      case "..": {
        // 下に突き抜けた場合はその分だけ出力時に先頭に"../"を付加する.
        if (itemsAfterLength == 0) {
          overDeep += "../";
        }
        else if (itemsAfterLength > 0) {
          itemsAfterLength--;
        }
        break;
      }
      default: {
        itemsAfter[itemsAfterLength] = item;
        itemsAfterLength++;
        break;
      }
    }
  }
  // パス要素の結合
  var afterPath = "";
  if (itemsAfterLength > 0) {
    var afterPath = itemsAfter[0];
    for (i = 1; i < itemsAfterLength; i++) {
      afterPath += "/" + itemsAfter[i];
    }
  }
  afterPath = overDeep + afterPath;
  return afterPath;
}

/**
 * URLのクエリ文字列を解析してオブジェクトを作成する
 * @param {String} url 解析対象のURL
 * @return {Object} クエリ文字列を解析され作成された
 *                 クエリパラメータ名をキーとするオブジェクト.
 */
$.parseQuery = function(url) {
  var query = {};
  
  // ハッシュ文字列を取り除く
  var hashIndex = url.lastIndexOf("#");
  if (hashIndex != -1) {
    url = url.substr(0, hashIndex);
  }
  
  // クエリ文字列の抽出
  var queryIndex = url.lastIndexOf("?");
  if (queryIndex == -1) {
    return query;
  }
  var queryStr = url.substr(queryIndex + 1);
  
  pairStrs = queryStr.split("&");
  for(var i = 0, len = pairStrs.length; i < len; i++) {
    pairStr = pairStr[i];
    var equalIndex = pairStr.indexOf("=");
    if(equalIndex == -1) {
      query[pairStr] = undefined;
      continue;
    }
    else {
      var key = pairStr.substr(0, equalIndex);
      var value = pairStr.substr(equalIndex + 1);
      query[key] = value;
    }
  }
  
  return query;
}

/**
 * URLの分解
 * @param {String} url 対象URL
 * @returns {Object} 以下の形式のオブジェクト.
 * {
 *   scheme: {String} スキーム名 (e.g. http )
 *   domain: {String} ドメイン名 (e.g. foo.com )
 *   path: {String} パス部分 (e.g. /abc/def )
 *   query: {String} クエリ文字列(デコードされない) (e.g. p=0&q=1 )
 *   hash: {String} ハッシュ値 (e.g. bar )
 * }
 * 例は url = http://foo.com/abc/def?p=0&q=1#bar とした時の値.
 */
$.parseURL = function(url) {
  var result = {};
  // Hash
  var hash = "";
  var hashIndex = url.lastIndexOf("#");
  if (hashIndex !== -1) {
    hash = url.substr(hashIndex + 1);
    url = url.substr(0, hashIndex);
  }
  
  // Query
  var query = "";
  var queryIndex = url.lastIndexOf("?");
  if (queryIndex !== -1) {
    query = url.substr(queryIndex + 1);
    url = url.substr(0, queryIndex);
  }
  
  var scheme = "";
  var domain = "";
  var path = "/";
  var isRelative = false;
  if (url.charAt(0) === "/") {
    // url = "//aaa..."
    if (url.charAt(1) === "/") {
      var thirdSlashIndex = url.indexOf("/", 2);
      // url = "//aaa";
      if(thirdSlashIndex === -1) {
        domain = url.substr(2);
      }
      // url = "//aaa/...."
      else {
        domain = url.substr(2, thirdSlashIndex - 2);
        path = url.substr(thirdSlashIndex);
      }
    }
    // url = "/aaa...
    else {
      path = url;
    }
  }
  else {
    schemeEndIndex = url.indexOf("://");
    // url = "./aaa..." or "../aaa" or ... "aaa..."
    if (schemeEndIndex === -1) {
      path = url;
      isRelative = true;
    }
    // url = "scheme://domain..."
    else {
      scheme = url.substr(0, schemeEndIndex);
      var domainIndex = schemeEndIndex + 3;
      var thirdSlashIndex = url.indexOf("/", domainIndex);
      // url = "scheme://aaa";
      if(thirdSlashIndex === -1) {
        domain = url.substr(domainIndex);
      }
      // url = "scheme://aaa/...."
      else {
        domain = url.substr(domainIndex, thirdSlashIndex - domainIndex);
        path = url.substr(thirdSlashIndex);
      }
    }
  }
  
  return {
    isRelative: isRelative,
    scheme: scheme,
    domain: domain,
    path: path,
    query: query,
    hash: hash
  }
}

/**
 * 構成要素を指定してURLを組み立てる
 * @param {Object} elements 以下の形式のオブジェクト
 * {
 *   scheme: {String} スキーム名(e.g. http )
 *   domain: {String} ドメイン名(e.g. foo.com )
 *   path: {String} パス部分(e.g. /abc/def )
 *   query: {String} クエリ文字列(デコードされない) (e.g. p=0&q=1 )
 *   hash: {String} ハッシュ値 (e.g. bar )
 * }
 * 例は http://foo.com/abc/def?p=0&q=1#bar が組み立てられるときの値
 * @returns {String}
 *     elements によって組み立てられたURL
 *     パス部分は正規化される
 */
$.buildURL = function(elements) {
  var url = "";
  elements.path = $.normalizePath(elements.path);
  if (elements.scheme) {
    url = elements.scheme + "://" + elements.domain + elements.path;
  }
  else {
    if (elements.domain) {
      url = "//" + elements.domain + elements.path;
    }
    else {
      url = elements.path;
    }
  }
  if (elements.query) {
    url += "?" + elements.query;
  }
  if (elements.hash) {
    url += "#" + elements.hash;
  }
  return url;
}

/**
 * 指定したURLのファイルが存在するディレクトリのパスを返す.
 *
 * @param {String} path 特定のファイルのパス
 * @return {String}
 *     引数で指定したファイルが存在するディレクトリのパス.
 *     ※pathにカレントディレクトリ上の相対パスが指定された場合 (path = "abc.js")
 *     ドット"." を返す
 */
$.getDirectory = function(path) {
  // クエリを取り除く
  var queryIndex = path.indexOf("?");
  if (queryIndex >= 0) {
    path = path.substr(0, queryIndex);
  }
  // 末尾のスラッシュを検索
  var slashLastIndex = path.lastIndexOf("/");
  // スラッシュが見つからなければカレントディレクトリ上のファイル
  if (slashLastIndex == -1) {
    return ".";
  }
  else {
    return path.substr(0, slashLastIndex);
  }
};

/**
 * origin から target を参照するための相対パスを作成
 */
$.getRelativePath = function(origin, target) {
  originInfo = $.parseURL(origin);
  targetInfo = $.parseURL(target);
  
  // target の scheme(domain) が空でなく、origin と異なるならば target をそのまま返す
  if (
    (targetInfo.scheme !== "" && originInfo.scheme != targetInfo.scheme) ||
    (targetInfo.domain !== "" && originInfo.domain != targetInfo.domain)
  ) {
    return target;
  }
  
  // origin か targetが通常の相対パスならばそのまま返す
  if (
    (originInfo.scheme === "" && originInfo.domain === "" && origin.charAt(0) !== "/") ||
    (targetInfo.scheme === "" && targetInfo.domain === "" && target.charAt(0) !== "/")
  ) {
    return target;
  }
  
  // 作成される相対パス
  var relativePath = "";
  
  // targetを絶対パス化
  target = $.getURLFromRelativeURL(origin, target);
  if (target == origin) {
    return "";
  }
  // originのディレクトリを参照
  origin = $.getDirectory(origin);
  
  var originItems = origin.split("/");
  var targetItems = target.split("/");
  
  // どの階層まで同じか
  var len = Math.min(originItems.length, targetItems.length);
  for(var i = 0; i < len; i++) {
    if(originItems[i] !== targetItems[i]) {
      break;
    }
  }
  var sameCount = i;
  // originから何階層戻ればよいか
  var backCount = originItems.length - sameCount;
  for(var i = 0; i < backCount; i++) {
    relativePath += "../";
  }
  // 共通ディレクトリから先のパスを連結
  for(var i = sameCount; i < targetItems.length; i++) {
    relativePath += targetItems[i] + "/";
  }
  // 末尾スラッシュを取り除く
  if(relativePath.length > 0) {
    relativePath = relativePath.substr(0, relativePath.length - 1);
  }
  // カレントディレクトリを指していたらドットを返す
  if(relativePath === "") {
    relativePath = ".";
  }
  
  return relativePath;
};

/**
 * URLからハッシュとクエリを取り除く
 */
$.trimQueryAndHash = function(url) {
  // ハッシュ文字列を取り除く
  var hashIndex = url.lastIndexOf("#");
  if (hashIndex != -1) {
    url = url.substr(0, hashIndex);
  }
  
  // クエリ文字列を取り除く
  var queryIndex = url.lastIndexOf("?");
  if (queryIndex != -1) {
    url = url.substr(0, queryIndex);
  }
  
  return url;
}

});
