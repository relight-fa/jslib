/*
  path.js
  
  URI, パス関連操作.
  以下の表記のパスに対応する.
  (1) 絶対パス
    http://www.abc.def/gh/ij/kl
  (2) 現在のスキームのままドメイン以降を指定
    //www.abc.def/
  (3) 現在のドメインルートからの相対パス
    /gh/ij/kl
  (4) 現在のファイルからの相対パス
    ij/kl
    ./ij/kl
    ../ij/kl
 */

SL.namespace("RL");
SL.code(function($ = RL) {

/**
 * origin上でのrelativePathの参照先を求める.
 * @param {String} origin 基準となるパス
 * @param {String} relativePath
 * @param {String} origin上でのrelativePathの参照先
 */
$.getPathFromRelativePath = function(origin, relativePath) {
  relativeInfo = $.parseURI(relativePath);
  if (relativeInfo.scheme) {
    return relativePath;
  }
  
  originInfo = $.parseURI(origin);
  
  if (relativePath.charAt(0) === "/") {
    // re = "//..."
    if (relativePath.charAt(1) === "/") {
      originInfo.domain = relativeInfo.domain;
      originInfo.path = relativeInfo.path;
    }
    // re = "/..."
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
  
  return $.buildURI(originInfo);
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
 * URIのクエリ文字列を解析してオブジェクトを作成する
 * @param {String} uri 解析対象のURI
 * @param {Object} クエリ文字列を解析され作成された
 *                 クエリパラメータ名をキーとするオブジェクト.
 */
$.parseQuery = function(uri) {
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
 * URIの分解
 * @param {String} url 対象URL
 * @returns {Object} 以下の形式のオブジェクト.
 * {
 *   scheme: {String} スキーム名(e.g. http )
 *   domain: {String} ドメイン名(e.g. foo.com )
 *   path: {String} パス部分(e.g. /abc/def )
 *   query: {String} クエリ文字列(デコードされない) (e.g. p=0&q=1 )
 *   hash: {String} ハッシュ値 (e.g. bar )
 * }
 * 例は url = http://foo.com/abc/def?p=0&q=1#bar とした時の値.
 */
$.parseURI = function(url) {
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
  var isRelativePath = false;
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
      isRelativePath = true;
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
    isRelativePath: isRelativePath,
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
 * @returns {String} elements によって組み立てられたURL
 */
$.buildURI = function(elements) {
  var uri = "";
  elements.path = $.normalizePath(elements.path);
  if (elements.scheme) {
    uri = elements.scheme + "://" + elements.domain + elements.path;
  }
  else {
    if (elements.domain) {
      uri = "//" + elements.domain + elements.path;
    }
    else {
      uri = elements.path;
    }
  }
  if (elements.query) {
    uri += "?" + elements.query;
  }
  if (elements.hash) {
    uri += "#" + elements.hash;
  }
  return uri;
}


});