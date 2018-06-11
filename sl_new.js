var SL = SL || (function() {
"use strict";
var $ = {};

/*
 * Web Page Client, Web Worker共通ヘルパー関数
 */
/**--------------------------------------------------
 * URL解析用モジュール
 * -------------------------------------------------- */
var URL = (function() {
  var $ = {};
  /**
   * origin 上での relativeURL の参照先を求める.
   * @param {String} origin 基準となるURL
   * @param {String} relativeURL origin を基準とした相対URL.
   * @return {String}
   *     origin 上でのrelativeURLの参照先.
   *     relativeURL が絶対パスならばその値をそのまま返す.
   */
  $.getURLFromRelativeURL = function(origin, relativeURL) {
    var relativeInfo = $.parseURL(relativeURL);
    // 相対URLにスキームが存在する => 絶対パスなのでそのまま返す
    if (relativeInfo.scheme) {
      return relativeURL;
    }
    
    var originInfo = $.parseURL(origin);
    
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
      var path = originInfo.path;
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
    var i, len;
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
      pairStr = pairStrs[i];
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
   * URLからクエリとハッシュの削除
   */
  $.removeQueryAndHash = function(url) {
    var hashIndex = url.lastIndexOf("#");
    if (hashIndex !== -1) {
      url = url.substr(0, hashIndex);
    }
    var queryIndex = url.lastIndexOf("?");
    if (queryIndex !== -1) {
      url = url.substr(0, queryIndex);
    }
    return url;
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
      var schemeEndIndex = url.indexOf("://");
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
   *   path: {String} パス部分(e.g. /abc/def ) パス中の"./", "../"は正規化される
   *   query: {String} クエリ文字列(デコードされない) (e.g. p=0&q=1 )
   *   hash: {String} ハッシュ値 (e.g. bar )
   * }
   * 例は http://foo.com/abc/def?p=0&q=1#bar が組み立てられるときの値
   * @returns {String} elements によって組み立てられたURL
   */
  $.buildURL = function(elements) {
    var url = "";
    elements.path = $.normalizePath(elements.path);
    if (elements.scheme) {
      url = elements.scheme + "://" + elements.domain + elements.path;
    }
    else  if (elements.domain) {
      url = "//" + elements.domain + elements.path;
    }
    else {
      url = elements.path;
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
   * 指定したパスのファイルが存在するディレクトリのパスを返す.
   *
   * @param {String} path ファイルのパス
   * @return {String} 
   *     引数 path で指定したファイルが存在するディレクトリのパス.
   *     末尾にスラッシュはつかない.
   *     ※pathにカレントディレクトリ上の相対パスが指定された場合 (e.g. path = "abc.js")
   *     ドット"." を返す
   */
  $.getDirectory = function(path) {
    path = $.removeQueryAndHash(path);
    var slashLastIndex = path.lastIndexOf("/");
    if (slashLastIndex == -1) {
      return ".";
    }
    else {
      return path.substr(0, slashLastIndex);
    }
  };
    
  /**
   * origin から target を参照するための相対パスを作成
   * @param {String} origin 参照の基点となるパス
   * @param {String} target 相対パスを得る対象のパス
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
      (originInfo.scheme === "" && originInfo.domain === "" && origin.charAt(0) != "/") ||
      (targetInfo.scheme === "" && targetInfo.domain === "" && target.charAt(0) != "/")
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
  
  return $;
}());
// End of URL module

/**
 * 実行環境名がリスト内に存在するか
 * @param {String} target 検索する実行環境名
 * @param {Array,String} list 実行環境名の配列, 又はカンマ区切りで列挙された文字列
 */
var isEnvironmentContained = function(target, list) {
  if (typeof list === "string") {
    return ("," + list + ",").indexOf("," + target + ",") >= 0;
  }
  else {
    return list.indexOf(target) >= 0;
  }
};

/**
 * エラーオブジェクトの文字列化
 */
var dumpError = function(err) {
  return err.message + "\n" + err.fileName + ": " + err.lineNumber + "[" + err.columnNumber + "]";
};
/**
 *  実行環境名からグローバルオブジェクト名を得る
 */
var getGlobalObjectName = function(env) {
  switch (env) {
    case "WINDOW":
      return "window";
    case "WORKER":
      return "self";
    case "NODEJS":
      return "global";
  };
  return "undefined";
};

/* --------------------------------------------------
 * 共通処理定義
 * --------------------------------------------------*/
// グローバルオブジェクトの取得
$.global = Function("return this;")();
// 実行環境名の取得
$.ENVIRONMENT = $.environment = (function(globalObject) {
  if (typeof window !== "undefined" && globalObject === window) {
    return "WINDOW";
  }
  if (typeof self !== "undefined" && globalObject === self) {
    return "WORKER";
  }
  if (typeof global !== "undefined" && globalObject === global &&
      typeof root !== "undefined" && globalObject === root) {
    return "NODEJS";
  }
  return "UNDEFINED";
}($.global));
// 実行ページURL
$.ROOT_PATH = $.rootPath = (function() {
  if ($.environment === "WINDOW") {
    return window.location.href;
  }
  else {
    return ".";
  }
}());

/* ==================================================
 * Resource Loader
 * ================================================== */
var ResourceLoader = function() {
  this._queue = [];
  this._callback = null;
};

ResourceLoader.Resource = function(namespace, name, type, path) {
  if (typeof namespace === "string") {
    namespace = $.namespace(namespace);
  }
  this.namespace = namespace;
  this.name = name;
  this.type = type;
  this.path = path;
  this.value = null;
  this.success = false;
};

ResourceLoader.prototype.load = function() {
};

ResourceLoader.prototype.loadText = function(resource) {
  this.loadWithXMLHttpRequest(resource, "text", "");
};
ResourceLoader.prototype.loadJSON = function(resource) {
  this.loadWithXMLHttpRequest(resource, "json", "");
};
ResourceLoader.prototype.loadBinary = function(resource) {
  this.loadWithXMLHttpRequest(resource, "arraybuffer", null);
};
ResourceLoader.prototype.loadImage = function(resource) {
  var image = new Image();
  xhr.onload = (function() {
    resource.value = image;
    this.success = true;
    this.onLoadResource(resource);
  }).bind(this);
  xhr.onerror = (function() {
    resource.value = null;
    this.onLoadResource(resource);
  });
  image.src = resource.path;
};
ResourceLoader.prototype.loadImageData = function(resource) {
  var image = new Image();
  xhr.onload = (function() {
    resource.value = image;
    this.success = true;
    this.onLoadResource(resource);
  }).bind(this);
  xhr.onerror = (function() {
    resource.value = null;
    this.onLoadResource(resource);
  });
  image.src = resource.path;
};
ResourceLoader.prototype.loadWithXMLHttpRequest = function(resource, type, failedValue) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = type;
  xhr.onload = (function() {
    resource.value = xhr.responce;
    this.success = true;
    this.onLoadResource(resource);
  }).bind(this);
  xhr.onerror = (function() {
    resource.value = failedValue;
    this.onLoadResource(resource);
  });
  xhr.open("GET", resource.path);
  xhr.send();
};

/* ======================================================================
 * Script Loader
 * for Web Page Client
 * ====================================================================== */
if ($.environment === "WINDOW") {
  // DOM Content Loaded Flag
  var hasDidContentLoaded = false;
  window.addEventListener("DOMContentLoaded", function() {
    hasDidContentLoaded = true;
  }, false);
  
  /**
   * class ScriptLoader
   * @param {String} path 読み込むスクリプトのパス
   * @param {String} mode 実行モード.
   *     "load": スクリプトを読み込み、実行
   *     "export": スクリプトを1つのファイルにまとめて出力
   * @param {String} environment スクリプト実行環境名
   */
  var ScriptLoader = function(path, mode, environment) {
    
    // ファイルの絶対パス から ノード へのマップ
    this.pathToNodeMap = {};
    
    // スクリプトで定義される名前空間ツリー
    this.namespaceTree = {};
    
    // スクリプト読み込み完了後に実行するコード群.
    this.readyCodes = [];
    
    // mode
    this.mode = typeof mode !== "undefined" ? mode : "load";
    // 実行環境名
    this.environment = typeof environment !== "undefined" ? environment : $.environment;
    
    // パス指定がない場合は、実行ページを対象
    if (typeof path === "undefined") {
      this.rootPath = $.rootPath;
      this.rootNode = new ScriptLoader.Node(this, this.rootPath);
      this.rootNode.baseURI = window.document.baseURI;
      this.currentNode = this.rootNode;
      
      window.addEventListener("DOMContentLoaded", function() {
        this.onLoadScript(this.currentNode);
      }.bind(this));
    }
    else {
      this.rootPath = URL.getURLFromRelativeURL($.rootPath, path);
      this.rootNode = new ScriptLoader.Node(this, this.rootPath);
      this.currentNode = this.rootNode;
      this.rootNode.load();
    }
  }
  
  /**
   * スクリプト読み込み完了後に実行するコードの登録
   * @param {Function} code 
   */
  ScriptLoader.prototype.ready = function(code) {
    this.readyCodes.push(code);
  };
  
  /**
   * 現在の読み込み対象スクリプトファイルの読み込みが
   * 完了したタイミングで呼ばれる.
   */
  ScriptLoader.prototype.onLoadScript = function(node) {
    
    // 対象ノードのインポート対象をチェックして
    // インポートツリーの更新
    var imports = node.imports;
    var currentImported ={};
    for (var i = 0; i < imports.length; i++) {
      var path = imports[i];
      path = URL.getURLFromRelativeURL(node.baseURI, path);
      
      // このノード内ですでにimportされていたらスキップ
      if (currentImported[path]) {
        continue;
      }
      currentImported[path] = true;
      
      // 既にノードがツリーに存在する場合
      if (this.pathToNodeMap[path]) {
        var child = this.pathToNodeMap[path];
        if (child.loaded) {
          continue;
        }
        else {
          child.removeFromParent();
          node.addChild(child);
        }
      }
      // 新規ノード
      else {
        var child = new ScriptLoader.Node(this, path);
        this.pathToNodeMap[path] = child;
        node.addChild(child);
      }
    }
    
    // 次のノードの読み込みを行う.
    if (! this.loadNext()) {
      this.onLoadAllScripts();
    };
  }
  
  /**
   * スクリプトの読み込み完了時のハンドラ
   */
  ScriptLoader.prototype.onLoadAllScripts = function() {
    console.log(this.createExportCode());
    // 実行
    if (this.mode === "load") {
      // 名前空間定義
      ScriptLoader.defineNamespace(this.namespaceTree);
      // コードの実行
      this.execCodes();
      // readyコールバックの実行
      this.execReadyCallbacks();
    }
    // エクスポート
    else if (this.mode === "export"){
      
    }
  };
  
  /**
   * リソース読み込み完了時のハンドラ
   */
  ScriptLoader.prototype.onLoadResources = function() {
    this.execCodes();
  };
  /**
   * import 完了後のコールバック呼び出し
   */
  ScriptLoader.prototype.execReadyCallbacks = function() {
    for (var i = 0; i < this.readyCodes.length; i++) {
      this.readyCodes[i]();
    }
  };
  /**
   * import ツリー内のすべてのコードの実行
   */
  ScriptLoader.prototype.execCodes = function() {
    this.rootNode.execCodes();
  };

  /**
   * 読み込まれていないノードの中で最も優先度の高いものを読み込む
   * @return {Boolean}  読み込むノードが存在したらtrue.
   *     全てのノードが読み込み完了していたらfalse.
   */
  ScriptLoader.prototype.loadNext = function() {
    var node;
    while (this.currentNode != null) {
      // 現在のノードの子ノードに読み込み対象がいればそれを読み込む
      // ローダーのcurrentNodeはノード側の処理によって更新される.
      if (this.currentNode.loadNext()) {
        return true;
      }
      else {
        this.currentNode = this.currentNode.parent;
      }
    }
    return false;
  };
  
  /**
   * エクスポート用コードの作成
   */
  ScriptLoader.prototype.createExportCode = function() {
    var exportCode = "";
    exportCode += this.exportLibraryCode();
    exportCode += this.exportNamespaces();
    exportCode += this.exportResources();
    exportCode += this.exportImportedCodes();
    return exportCode;
  };
  
  ScriptLoader.prototype.exportNamespaces = function() {
    return ScriptLoader.exportNamespaces(this.namespaceTree);
  };
  
  /**
   * エクスポート: ライブラリコード
   */
  ScriptLoader.prototype.exportLibraryCode = function() {
    var code = "";
    code += 'SL={};';
    code += 'SL.ENVIRONMENT="' + this. environment + '";';
    code += 'SL.GLOBAL=' + getGlobalObjectName(this.environment) + ';';
    return code;
  };
  /**
   * エクスポート: リソース
   */
  ScriptLoader.prototype.exportResources = function() {
    return "";
  };
  /**
   * エクスポート: 読み込んだコード
   */
  ScriptLoader.prototype.exportImportedCodes = function() {
    return this.rootNode.exportCodes();
  };
  
  
  /**
   * リソース宣言
   */
  ScriptLoader.prototype.resource = function(namespace, name, type, path) {
  }
  /**
   * 外部スクリプトファイルの読み込み宣言
   */
  ScriptLoader.prototype.import = function(arg1, arg2) {
    var path = "";
    var environments = null;
    var condition = null;
    // #import(String path);
    if (typeof arg1 === "string" &&
        typeof arg2 === "undefined" ) {
      path = arg1;
    }
    // #import(String environments, String path);
    else if (
        typeof arg1 === "string" &&
        typeof arg2 === "string" ) {
      environments = arg1;
      path = arg2;
    }
    // #import(Function condition, String path);
    else if (
        typeof arg1 === "function" &&
        typeof arg2 === "string" ) {
      condition = arg1;
      path = arg2;
    }
    // #import(Object params, String path);
    else if (
        typeof arg1 === "object" &&
        typeof arg2 === "string" ) {
      if (typeof arg1.environments !== "undefined") {
        environments = arg1.environments;
      }
      if (typeof arg1.condition === "function") {
        condition = arg1.condition;
      }
      path = arg2;
    }
    else {
      throw new Error("Invalid argument types.");
    }
    // check environments
    if (environments !== null &&
        ! isEnvironmentContained(this.environment, environments)) {
      return;
    }
    // check condition
    if (condition !== null && condition() !== true) {
      return;
    }
    
    // currentNode が空 <=> 最初の読み込み
    var shouldBeginLoad = (this.currentNode == null);
    if (shouldBeginLoad) {
      this.currentNode = this.rootNode;
    }
    
    this.currentNode.imports.push(path);
    
    if (shouldBeginLoad) {
      window.setTimeout((function() {
        this.onLoadScript(this.currentNode);
      }).bind(this), 0);
    }
  }
  
  /**
   * 外部スクリプトコードの定義
   * #import(String path);
   * #import(String environments, String path);
   * #import(Function condition, String path);
   * #import(Object params, String path);
   */
  ScriptLoader.prototype.code = function(arg1, arg2) {
    var code = null;
    var environments = null;
    var condition = null;
    var constants = null;
    // #import(String path);
    if (typeof arg1 === "function" &&
        typeof arg2 === "undefined" ) {
      code = arg1;
    }
    // #import(String environments, String path);
    else if (
        typeof arg1 === "string" &&
        typeof arg2 === "function" ) {
      code = arg2;
      envrionments = arg1
    }
    // #import(Function condition, String path);
    else if (
        typeof arg1 === "function" &&
        typeof arg2 === "function" ) {
      code = arg2;
      condition = arg1;
    }
    // #import(Object params, String path);
    else if (
        typeof arg1 === "object" &&
        typeof arg2 === "function" ) {
      code = arg2;
      if (typeof arg1.environments !== "undefined") {
        environments = arg1.environments;
      }
      if (typeof arg1.condition === "function") {
        condition = arg1.condition;
      }
      if (typeof arg1.constants !== "undefined") {
        constants = arg1.constants;
      }
    }
    else {
      throw new Error("Invalid argument types.");
    }
    // check environments
    if (environments !== null &&
        ! isEnvironmentContained(this.environment, environments)) {
      return;
    }
    
    this.currentNode.codes.push({code: code, condition: condition, constants: constants});
  }
  
  /**
   * 指定された文字列の名前空間の宣言.
   * ドットで繋げることでサブ名前空間の宣言も可能であり, 
   * 親名前空間が宣言されていない場合は自動的に宣言される.
   * @param {String} namespace 宣言する名前空間名. 
   * @returns {String} 引数 namespace の実体となるオブジェクト
   */
  ScriptLoader.prototype.namespace = function(namespace) {
    var names = namespace.split(".");
    var currentNamespaceNode = this.namespaceTree;
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      if (name === "") {
        throw new Error("empty namespace cannot be declared.");
      }
      if (! currentNamespaceNode[name]) {
        currentNamespaceNode[name] = {};
      }
      currentNamespaceNode = currentNamespaceNode[name];
    }
  }
  /**
   * 現在のコンテキストへの名前空間の定義
   * @param {*} namespace 定義する名前空間
   */
  ScriptLoader.defineNamespace = function(namespaceTree) {
    ScriptLoader._defineNamespace($.global, namespaceTree);
  }
  ScriptLoader._defineNamespace = function(scope, namespaceTree) {
    for (var key in namespaceTree) {
      if (typeof scope[key] === "undefined") {
        scope[key] = {};
      }
      ScriptLoader._defineNamespace(scope[key], namespaceTree[key]);
    }
  }
  /**
   * エクスポート: 名前空間定義用コードの出力
   * @param {Object} namespaceTree 出力する名前空間ツリーオブジェクト
   */
  ScriptLoader.exportNamespaces = function(namespaceTree) {
    var code = "";
    for (var key in namespaceTree) {
      if (code == "") {
        code = "var ";
      }
      else {
        code = ",";
      }
      code += key + "=" + JSON.stringify(namespaceTree[key]);
    }
    if (code != "") {
      code += ";";
    }
    return code;
  }
  
  /**
   * class ScriptLoader.Node
   */
  ScriptLoader.Node = function(loader, path) {
    this.loader = loader;
    this.path = path;
    this.baseURI = path;
    this.directory = URL.getDirectory(path) + "/";
    
    // このノード内でインポートするスクリプトのリスト
    this.imports = [];
    // このノード内で実行するコードのリスト
    // 次の形式のオブジェクトの配列
    // {
    //   code: Function 実行するコード
    //   condition: Function | Null 実行条件
    //   constants: Array<String> | Null コード内で利用する定数
    // }
    this.codes = [];
    // このノード内で読み込むリソースのリスト
    // 次の形式のオブジェクトの配列
    // { 
    //   namespace: String,
    //   name: String,
    //   type: String,
    //   path: String,
    //   loaded: Boolean,
    //   data: String | Object | Image | ImageData | ArrayBuffer | Blob | Null
    // }
    this.resources = [];
    
    // 子ノード読み込み位置
    this.loadChildPtr = 0;
    // 読み込みが完了しているかのフラグ
    this.loaded = false;
    // 子ノード群
    this.children = [];
    // 親ノード
    this.parent = null;
  };
  /**
   * このノード及び子ノードのコードを1つにまとめて出力する.
   */
  ScriptLoader.Node.prototype.exportCodes = function() {
    var result = "";
    // 子ノードのコードを出力
    for (var i = 0; i < this.children.length; i++) {
      result += this.children[i].exportCodes();
    }
    
    for (var i = 0; i < this.codes.length; i++) {
      var code = this.codes[i];
      result += "(" + code.code.toString() + "());";
    }
    
    return result;
  };
  /**
   * ノード内のリソースの追加
   * @param {Resource}
   */
  ScriptLoader.Node.prototype.addResource = function(namespace, name, type, path) {
    var namespaceObj = $.namespace(namespace);
    var newResoure = {
      namespace: namespaceObj,
      name: name,
      type: type,
      path: path,
      loaded: false,
      data: null
    };
    this.resources.push(newResoure);
  };
  /**
   * このノード及び子ノードのリソースの読み込み
   * @param {Function} callback 読み込み完了後のコールバック関数
   */
  ScriptLoader.Node.prototype.loadResources = function(callback) {
    var allResources = [];
    this.gatherResources(allResources);
    var resourceLoader = new ResourceLoader();
    resourceLoader.load(allResources, callback);
  };
  /**
   * このノード及び子ノードのリソースを1つの配列にまとめる
   * @param {Array} dst まとめる先の配列
   */
  ScriptLoader.Node.prototype.gatherResources = function(dst) {
    for (var i = 0; i < this.resources.length; i++) {
      dst.push(this.resources[i]);
    }
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].gatherResources(dst);
    }
  };
  /**
   * このノード及び、子ノードのコードの実行
   * @param {Resource}
   */
  ScriptLoader.Node.prototype.execCodes = function() {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].execCodes();
    }
    for (var i = 0; i < this.codes.length; i++) {
      var code = this.codes[i];
      // コード実行条件が指定されている場合
      if (code.condition !== null) {
        var result;
        try {
          result = code.condition();
        }
        catch(e) {
          console.warn("Error occured in evaluating code's condition. : " + $.dumpError(e));
          result = false;
        }
        if (result !== true) {
          continue;
        }
      }
      // コード内定数の設定
      if (code.constants !== null) {
        this.defineConstants(code.constants);
      }
      code.code();
    }
  }
  /**
   * コード内定数の定義
   */
  ScriptLoader.Node.prototype.defineConstants = function(constants) {
    for (var constantsIndex = 0;
         constantsIndex < constants.length;
        constantsIndex++) {
      var constName = constants[constantsIndex];
      var constValue = this.getConstant(constName);
      if (constValue.exists === true) {
        $[constName] = constValue.value;
      }
    }
  }
  /**
   * コード内定数の取得
   * @param {String} constName 取得する定数名
   * @returns {Object} 以下の形式のオブジェクト
   *   {
   *     exists: Boolean, 定数constNameが存在する場合 true,
   *     value: Any optional, 定数constNameが存在する場合、その定数の値
   *   }
   */
  ScriptLoader.Node.prototype.getConstant = function(constName) {
    switch (constName) {
      // ノードのスクリプトファイルが存在するディレクトリのパス (スラッシュを含まない)
      case "DIRECTORY": {
        return {exists: true, value: this.directory};
      }
    }
    return {exists: false};
  }
  /**
   * 子ノードの追加
   * @param {ScriptLoader.Node} 追加する子ノード
   */
  ScriptLoader.Node.prototype.addChild = function(node) {
    if (node.parent != null) {
      return;
    }
    this.children.push(node);
    node.parent = this;
  };
  /**
   * 子ノードの削除
   * @param {ScriptLoader.Node} 削除する子ノード
   */
  ScriptLoader.Node.prototype.removeChild = function(node) {
    if (node.parent != this) {
      return;
    }
    var idx = this.children.indexOf(node);
    this.children.splice(idx, 1);
    node.parent = null;
  };
  /**
   * 親ノードから自身を削除する
   */
  ScriptLoader.Node.prototype.removeFromParent = function() {
    if (this.parent == null) {
      return;
    }
    this.parent.removeChild(this);
  };
  /**
   * 次の子ノードを読み込む
   * @return {Boolean} 既に全ての子ノードの読み込みが完了していたらfalse
   */
  ScriptLoader.Node.prototype.loadNext = function() {
    if (this.loadChildPtr >= this.children.length) {
      return false;
    }
    
    var child = this.children[this.loadChildPtr];
    child.load();
    
    this.loadChildPtr++;
    return true;
  };
  /**
   * 自身に指定されているスクリプトを読み込む
   */
  ScriptLoader.Node.prototype.load = function() {
    // ローダーにキャッシュ無効フラグが立っている場合は
    // スクリプトのパスの末尾にタイムスタンプを付与
    var path = this.path;
    if(this.loader.cacheDisabled) {
      if(path.indexOf("?") > 0) {
        path += "&_sl_t" + Date.now();
      }
      else {
        path += "?_sl_t" + Date.now();
      }
    }
    
    this.loader.currentNode = this;
    // ページに script 要素を追加し、読み込み完了後にローダーのハンドラを呼び出す
    var js = document.createElement("script");
    var fjs = document.getElementsByTagName("script")[0];
    var node = this;
    js.onload = function() {
      node.loaded = true;
      node.loader.onLoadScript(node);
    };
    js.onerror = function() {
      node.loader.onErrorInLoadScript(node);
    };
    js.src = path;
    fjs.parentNode.insertBefore(js, fjs);
  };
}

/* ======================================================================
 * Script Loader
 * for Web Worker
 * ====================================================================== */
if ($.environment === "WORKER") {
  
  /**
   * class ScriptLoader
   * @param {String} path 読み込むスクリプトのパス
   * @param {String} mode 実行モード.
   *     "load": スクリプトを読み込み、実行
   *     "export": スクリプトを1つのファイルにまとめて出力
   * @param {String} environment スクリプト実行環境名
   */
  var ScriptLoader = function(path, mode, environment) {
    // mode
    this.mode = "load";
    // 実行環境名
    this.environment = typeof environment !== "undefined" ? environment : $.environment;
    
    this.rootPath = $.rootPath;
  }
  
  ScriptLoader.prototype.setRootPath = function(path) {
    this.rootPath = path;
  };
}

/* ==================================================
 * Module Function
 * ================================================== */
var rootScriptLoader = new ScriptLoader();
var currentLoader = rootScriptLoader;
/**
 * importするスクリプトの宣言
 */
$.import = function(arg1, arg2) {
  currentLoader.import(arg1, arg2);
};
/**
 * 名前空間の宣言
 */
$.namespace = function(namespaceName) {
  currentLoader.namespace(namespaceName);
};
/**
 * リソースの宣言
 */
$.resource = function(namespace, name, type, path) {
  currentLoader.resource(namespace, name, type. path);
};
/**
 * 実行コードの定義
 */
$.code = function(arg1, arg2) {
  currentLoader.code(arg1, arg2);
};
if ($.environment === "WINDOW") {
  /**
   * importするスクリプトを1つのファイルにまとめてエクスポートする.
   * pathを省略した場合は、現在のページでimportされたスクリプトを対象とする.
   * @param {String} path エクスポート対象のスクリプトのパス.
   * @param {String} environment スクリプトの実行環境名.
   */
  $.export = function(path, environment) {
    if (typeof path === "undefined") {
      rootScriptLoader.export();
    }
    else {
      currentLoader = new ScriptLoader(path, "export", environment);
    }
  };
  /**
   * 全てのスクリプトとページの読み込みが完了した後に
   * 実行されるコードの定義
   */
  $.ready = function(code) {
    currentLoader.ready(code);
  }
}


// End of Module.
return $;
}());
