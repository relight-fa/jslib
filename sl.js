/*
 * sl.js - Script Loader
 * v0.95
 * 2014-2017 Daichi Aihara
 *
 * v0.95: スラッシュ1つで始まる相対パスに対応
 * v0.94: Web Worker対応
 * v0.93: コード見直し
 * v0.92: 統合されたコードの取得に対応
 * v0.91: 名前空間宣言に対応
 * v0.90: 初版
 *
 * Webページクライアント, Web Worker両方で共通して利用できるスクリプトローダ
 * importScripts関数の場合は読み込むファイルのパスをWokerファイルからの相対パスで指定する必要があるが
 * このモジュールではimportするファイルをimport元ファイルからの相対パスで指定できるのが利点.
 *
 * usage:
 *   ・クライアントページ
 *   1) このファイルをscript要素から読み込む
 *   2) 読み込むモジュールをSL.importメソッドで指定
 *   3) モジュール読み込み後のコードをSL.readyメソッド内で記述.
 *
 *      <script src="sl.js"></script>
 *      <script>
 *      SL.import("mymodule.js");
 *      SL.ready(function() {
 *        MyModule.hello();
 *      });
 *      </script>
 *
 *   ・Web Worker
 *   1) このファイルをimportScripts関数で読み込む
 *   2) 読み込むモジュールをSL.importメソッドで指定
 *   3) Web Worker の場合は同期的に読み込まれるので
 *      importメソッドの直後からコードを書いてよい
 *
 *      importScripts("sl.js");
 *      SL.import("mymodule.js");
 *      MyModule.hello();
 *
 *   ・モジュール側
 *   1) 読み込むモジュールを、SL.importメソッドで
 *      そのモジュールファイルを基準とした"相対パス"で指定する.
 *   2) モジュール読み込み後のコードをSL.readyメソッド内で記述.
 *      SL.import("modules/mymodule.js");
 *      SL.ready(function() {
 *        MyModule.hello();
 *      });
 *   ※外部モジュールに依存しない場合は通常通りにスクリプトを記述してよい
 *
 *
 * -- main.html --
 * <script src="sl.js"></script>
 * <script>
 * SL.import("js/sub.js");
 * SL.ready(function() {
 *   var obj = new MyModule.Sub();
 *   obj.foo();
 * });
 * </script>
 *
 * -- js/sub.js --
 * SL.import("base.js");
 * SL.code(function() {
 *   MyModule.Sub = class extends MyModule.Base {
 *     foo() {
 *       super.foo();
 *       cosole.log("World!");
 *     }
 *   };
 * });
 *
 * -- js/base.js ----------
 * SL.namespace("MyModule");
 * SL.code(function() {
 *   MyModule.BaseClass = class {
 *     foo() {
 *       console.log("Hello");
 *     }
 *   }
 * });
 *
 */

var SL = SL || (function() {
"use strict";
var $ = {};

$.global = (function() {
  var geval = eval;
  var global = geval("this");
  return global;
}());

$._rootNamespaceNode = {};

/**
 * 名前空間の宣言
 *
 * @param {String} namespace 宣言する名前空間名. ドットで繋げることでサブ名前空間の宣言も可
 *                           (親名前空間が宣言されていない場合は自動的に宣言される。)
 */
$.namespace = function(namespace) {
  var names = namespace.split(".");
  var currentScope = $.global;
  var currentNamespaceNode = $._rootNamespaceNode;
  for(var i = 0; i < names.length; i++) {
    var name = names[i];
    if(name === "") {
      throw new Error("empty namespace cannot be declared.");
    }
    if(! currentScope[name]) {
     currentScope[name] = {};
    }
    if(! currentNamespaceNode[name]) {
     currentNamespaceNode[name] = {};
    }
    currentScope = currentScope[name];
    currentNamespaceNode = currentNamespaceNode[name];
  }
}

/*
 * Web Page Client, Web Worker共通ヘルパー関数
 */
/**
 * 指定したパスのファイルが存在するディレクトリのパスを返す.
 *
 * @param {String} path 特定のファイルのパス
 * @return {String} 引数で指定したファイルが存在するディレクトリのパス.
 *                  ※pathにカレントディレクトリ上の相対パスが指定された場合 (path = "abc.js")
 *                    ドット"." を返す
 */
var getDirectory = function(path) {
  var queryIndex = path.indexOf("?");
  if (queryIndex >= 0) {
    path = path.substr(0, queIndex);
  }
  var slashLastIndex = path.lastIndexOf("/");
  if (slashLastIndex == -1) {
    return ".";
  }
  else {
    return path.substr(0, slashLastIndex);
  }
};

/**
 * 基準となるパスと相対パスから絶対パスを作成して返す.
 *
 * @param {String} origin パスの基準
 * @param {String} relativePath 相対パス. ここに絶対パスが指定された場合, この関数はその値をそのまま返す.
 * @return {String} 作成された絶対パス
 */
var getAbsolutePathFromRelativePath = function(origin, relativePath) {
  var path;
  // relativePath が絶対パスを指す: originは無視する.
  if (relativePath.indexOf(":") != -1) {
    origin = "";
    path = relativePath;
  }
  // relativePathがスラッシュで始まる相対パス
  else if (relativePath.charAt(0) === "/") {
    // スラッシュ2つで始まる場合: 同一プロトコルでの絶対パス
    if(relativePath.charAt(1) === "/") {
      var protocolMatch = origin.match(/^[^\/]+:/);
      path = (protocolMatch ? protocolMatch[0] : "") + relativePath;
    }
    // スラッシュ1つで始まる場合: ドメイン直下からの相対パス
    else {
      var domainMatch = origin.match(/^[^\/]+:\/*[^\/]+/);
      path = (domainMatch ? domainMatch[0] : "") + relativePath;
    }
  }
  // 通常の相対パス
  else {
    // 必要ならばoriginの末尾にスラッシュを追加
    if (origin != "" && origin.charAt(origin.length - 1) != "/") {
      origin += "/";
    }
    path = origin + relativePath;
  }
  // パスを正規化して返す
  return normalizePath(path);
};

/**
 * originを基準とした相対パスを返す
 * originとtargetが同一の場合はドット"."を返す
 * 
 * @param {String} origin 基準となるパス
 * @param {String} target 相対パスに変換したいパス
 * @return {String} originを基準としたtargetの相対パス
 * 
 */
var getRelativePath = function(origin, target) {
  var originInfo = getProtocolAndDomainFromURL(origin);
  var targetInfo = getProtocolAndDomainFromURL(target);
  
  // プロトコル, ドメインが違うならばtargetをそのまま返す
  if(originInfo.protocol !== targetInfo.protocol ||
     originInfo.domain !== targetInfo.domain) {
    return target;
  }
  
  // 共に相対パスで指定されている場合
  // targetがスラッシュ始まりのパスで, originがスラッシュ始まりでない時
  // 相対パスは導けないのでtagetをそのまま返す
  if( originInfo.protocol === "" && targetInfo.protocol === "" &&
      target.charAt(0) === "/" && origin.charAt(0) !== "/") {
    return target;
  }
  
  var originItems = originInfo.path.split("/");
  var targetItems = targetInfo.path.split("/");
  
  var len = Math.min(originItems.length, targetItems.length);
  for(var i = 0; i < len; i++) {
    if(originItems[i] !== targetItems[i]) {
      break;
    }
  }
  
  // どのディレクトリまで同一であるか
  var sameCount = i;
  // 何階層戻ればよいか
  var backCount = originItems.length - sameCount;
  
  var relativePath = "";
  for(var i = 0; i < backCount; i++) {
    relativePath += "../";
  }
  for(var i = sameCount; i < targetItems.length; i++) {
    relativePath += targetItems[i] + "/";
  }
  
  if(relativePath.length > 0) {
    relativePath = relativePath.substr(0, relativePath.length - 1);
  }
  
  if(relativePath === "") {
    relativePath = ".";
  }
  
  return relativePath;
}

/**
 * URLからプロトコルとドメインを抽出
 * file:///～ にも対応するためドメインはコロン直後のスラッシュも含む。
 */
var getProtocolAndDomainFromURL = function(url) {
  var protocol, domain, path;
  var protocolEnd = url.indexOf(":");
  
  if(protocolEnd >= 0) {
    protocol = url.substr(0, protocolEnd);
  }
  else {
    return {protocol: "", domain: "", path: url};
  }
  
  url = url.substr(protocolEnd + 1);
  var domainMatch = url.match(/(\/+[^\/]*)/);
  if(domainMatch) {
    domain = domainMatch[0];
  }
  else {
    domain = "";
  }
  
  path = url.substr(domain.length + 1);
  
  return {protocol: protocol, domain: domain, path: path};
  
}

/**
 * パスの正規化
 * パス中の".", ".."を解釈し、末尾のスラッシュを取り除く
 * @param {String} path 正規化するパス
 * @return {String} 正規化されたパス
 */
var normalizePath = function(path) {
  // パスを"/"で分解
  var itemsBefore = path.split("/");
  var itemsAfter = new Array(itemsBefore.length);
  var itemsAfterLength = 0;
  var i;
  var overDeep = "";
  for (i = 0; i < itemsBefore.length; i++) {
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
  // 末尾のスラッシュを取り除く
  while(afterPath.charAt(afterPath.length - 1) === "/") {
    afterPath = afterPath.substr(0, afterPath.length - 1);
  }
  return afterPath;
}
/**
 * 関数定義から引数のリストを取得する
 * 仮運用. 文字列リテラルや引数内コメントには対応できていない.
 */
function getArgumentList(func) {
  var funcStr = func.toString();
  var result = [];

  // 引数部の抽出
  var argumentsMatch = funcStr.match(/function\s*\(([^)]*)\)/);
  if(argumentsMatch === null) {
    throw new Error("invalid function code.");
  }
  
  var argumentStrs = argumentsMatch[1].split(",");

  // 引数部をカンマごとに分割
  for(var i = 0; i < argumentStrs.length; i++) {
    var argStr = argumentStrs[i];
    var equalIndex = argStr.indexOf("=");
    if(equalIndex == -1) {
      var argMatch = argStr.match(/[^\s]+/);
      if(argMatch === null) {
        continue;
      }
      result.push({name: argMatch[0]});
    }
    else {
      var argMatch = argStr.match(/([^\s]+)\s*=\s*([^\s]+)/);
      if(argMatch === null) {
        continue;
      }
      result.push({name: argMatch[1], default: argMatch[2]});
    }
  }
  return result;
}

/**
 * エラーオブジェクトの文字列化
 */
var dumpError = function(err) {
  return err.message + "\n" + err.fileName + ": " + err.lineNumber + "[" + err.columnNumber + "]";
}

/* ==================================================
 * Script Loader
 * Web Page Client
 * ================================================== */
if (typeof window !== "undefined") { (function() {

/**
 * ScriptLoader
 */
var ScriptLoader = function() {
  /*
   * import アルゴリズム
   *    a.js を読み込む (<script src="a.js"></script>をドキュメントに追加)
   * -> a.js が実行され import, codeメソッドが呼ばれる
   * -> a.js からimportされるファイルをpreparedImportItemsに
   *    a.js で実行するコードを preparedCodesに格納
   * -> a.js の読み込み完了
   * -> ScriptLoader#notify が呼び出される
   * -> ScriptLoaderのimportツリーを更新
   * -> importツリーから読み込まれていないファイルの中で最優位のものを読み込む
   */
  
  /*
   * 現在読み込み中のファイルがimportするファイルおよび、実行コードを格納しておく
   */
  this.preparedImportItems = [];
  this.preparedCodes = [];
  
  /*
   * importツリー内に含まれる全ノード
   * ファイルの絶対パスをキーとする
   */
  this.importItems = {};
  
  /*
   * 現在処理対象のノード
   */
  this.currentNode = null;

  this.rootNode = null;
  
  /*
   * コード出力モード
   * trueならば、exportedCodeにimportされた全ファイルのコードが格納される
   * importするファイルを１つにまとめる際に利用する
   */
  this.debugMode = false;
  this.exportedCode = "";
  // 読み込み完了までにかかった時間
  this.spendedTime = 0;
  
  this.phase = ScriptLoader.PHASE_BEFORE_LOAD;
  this.callback = null;
  this.errorCalback = null;
  
  this.cacheDisabled = true;
  
  var self = this;
  window.addEventListener("load", function(e) {
    if (self.phase == ScriptLoader.PHASE_AFTER_LOAD && self.callback != null) {
      self.callback();
      self.phase = ScriptLoader.PHASE_AFTER_CALLBACK;
    }
  });
};

/**
 * Phase Enumeration
 */
ScriptLoader.PHASE_BEFORE_LOAD = 0;
ScriptLoader.PHASE_LOADING = 1;
ScriptLoader.PHASE_AFTER_LOAD = 2;
ScriptLoader.PHASE_AFTER_CALLBACK = 3;
ScriptLoader.PHASE_ERROR = 4;

/**
 * importキューに新しい項目を追加
 */
ScriptLoader.prototype.import = function(path) {
  if (this.phase > ScriptLoader.PHASE_LOADING) {
    return;
  }
  if (typeof path != "string" || path == "") {
    throw new Error("Invalid argument error");
  }
  
  this.preparedImportItems.push(path);
};

/**
 * モジュールの実装コードの登録
 */
ScriptLoader.prototype.code = function(code) {
  if (this.phase > ScriptLoader.PHASE_LOADING) {
    return;
  }
  if (typeof code != "function") {
    throw new Error("Invalid argument error");
  }
  this.preparedCodes.push(code);
};

/**
 * import終了時のコールバック関数の登録
 */
ScriptLoader.prototype.ready = function(callback) {
  if (typeof callback !== "function") {
    throw new Error("Invalid argument error");
  }
  if(this.phase == ScriptLoader.PHASE_AFTER_CALLBACK) {
    setTimout(callback, 0);
    return;
  }
  this.callback = callback;
};

/**
 * importエラー時のコールバック関数の登録
 */
ScriptLoader.prototype.error = function(callback) {
  if (typeof callback != "function" && callback !== null) {
    throw new Error("Invalid argument error");
  }
  this.errorCallback = callback;
};

/**
 * load (public)
 *
 * import開始
 */
ScriptLoader.prototype.load = function() {
  if (this.phase != ScriptLoader.PHASE_BEFORE_LOAD) {
    return;
  }
  if(this.debugMode) {
    this.spendedTime = Date.now();
  }
  
  this.phase = ScriptLoader.PHASE_LOADING;
  this.rootNode = new ScriptLoader.Node(this);
  this.rootNode.path = window.location.href;
  this.rootNode.directory = getDirectory(this.rootNode.path);
  this.notify(this.rootNode);
};

/**
 * export
 */
ScriptLoader.prototype.export = function() {
  return this.rootNode.export();
};

/**
 * clean
 */
ScriptLoader.prototype.clean = function() {
  this.rootNode = null;
  this.preparedImportItems = null;
  this.preparedCodes = null;
  this.importItems = null;
  this.importStack = null;
};

/**
 * notify
 * ファイル読み込みが完了したノードを通知する.
 */
ScriptLoader.prototype.notify = function(node) {
  var i;
  var child;
  var path;
  var dir = getDirectory(node.path);
  
  // このファイル内でのimportされたファイルリスト
  var currentImported = {};
  
  for (i = 0; i < this.preparedImportItems.length; i++) {
    path = this.preparedImportItems[i];
    path = getAbsolutePathFromRelativePath(dir, path);
    // このファイル内ですでにimportされていたらそちらが優先
    if (currentImported[path]) {
      return;
    }
    currentImported[path] = true;
    
    /*
     * import ツリーの更新
     */
    if (this.importItems[path]) {
      child = this.importItems[path];
      if (child.loaded) {
        continue;
      }
      else {
        child.removeFromParent();
        node.addChild(child);
      }
    }
    else {
      child = new ScriptLoader.Node(this);
      child.path = path;
      child.directory = getDirectory(child.path);
      
      this.importItems[path] = child;
      node.addChild(child);
    }
  }
  this.preparedImportItems.length = 0;
  
  var tmp = node.codes;
  node.codes = this.preparedCodes;
  this.preparedCodes = tmp;
  
  this.currentNode = node;
  
  if (! this.loadNext()) {
    this.phase = ScriptLoader.PHASE_AFTER_LOAD;
    this.execute();
  };
};

/**
 * loadNext
 * 読み込まれていないノードの中で最も優先度の高いものを読み込む
 * @return {Boolean}  読み込むノードが存在したらtrue. 全てのノードが読み込み完了していたらfalse.
 */
ScriptLoader.prototype.loadNext = function() {
  var node;
  while (this.currentNode != null) {
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
 * execute
 * 各ノードのcodeの実行と後処理
 */
ScriptLoader.prototype.execute = function() {
  if (this.rootNode == null) {
    return;
  }
  this.rootNode.execute();
  
  if (this.debugMode) {
    this.exportedCode = this.export();
    this.spendedTime = Date.now() - this.spendedTime;
  }
  
  this.clean();
  
  if (_windowLoaded && this.callback != null) {
    this.callback();
    this.phase = ScriptLoader.PHASE_AFTER_CALLBACK;
  }
};

/**
 * 外部ファイルの読み込みに失敗したときのハンドラ
 */
ScriptLoader.prototype.onErrorInLoadScript = function(path) {
  console.error("failed to load external script: " + path);
  
  if (typeof this.errorCallback == "function") {
    this.errorCallback(path);
  }
  this.phase = ScriptLoader.PHASE_ERROR;
  this.clean();
};


/**
 * キャッシュからのスクリプトの取得を禁止する.
 * (末尾にクエリを付加することで最新のファイルを取得するようにする)
 */
ScriptLoader.prototype.disableCache = function(flag) {
  if(typeof flag === "undefined") {
    flag = true;
  }
  this.cacheDisabled = flag;
}
// ==================================================

/**
 * ScriptLoader.Node Class
 * importツリーのノード
 */
ScriptLoader.Node = function(loader) {
  this.loader = loader;
  
  // 対応するファイルのパス
  this.path = "";
  this.directory = "";
  this.loaded = false;
  
  // このファイルからインポートされるファイルのノード群
  this.children = [];
  // 親ノード
  this.parent = null;
  
  // 実行コード
  this.codes = [];
  this.loadPtr = 0;
};

// ツリー処理

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
  if (this.loadPtr >= this.children.length) {
    return false;
  }
  
  var child = this.children[this.loadPtr];
  this.loadChild(child);
  
  this.loadPtr++;
  return true;
};

/**
 * 指定した子ノードを読み込む
 * @param {ScriptLoader.Node} child 読み込む子ノード
 */
ScriptLoader.Node.prototype.loadChild = function(child) {
  var js = document.createElement("script");
  var fjs = document.getElementsByTagName("script")[0];
  js.onload = function() {
    child.loaded = true;
    child.loader.notify(child);
  };
  js.onerror = function() {
    child.loader.onErrorInLoadScript(child.path);
  };
  var path = child.path;
  if(child.loader.cacheDisabled) {
    if(path.indexOf("?") > 0) {
      path += "&_sl_t" + Date.now();
    }
    else {
      path += "?_sl_t" + Date.now();
    }
  }
  js.src = path;
  fjs.parentNode.insertBefore(js, fjs);
};

/**
 * このノードと子ノードのコードの実行
 */
ScriptLoader.Node.prototype.execute = function() {
  var i;
  for (i = 0; i < this.children.length; i++) {
    this.children[i].execute();
  }
  
  var dir = getRelativePath(this.loader.rootNode.directory, this.directory) + "/";
  for (i = 0; i < this.codes.length; i++) {
    // 引数を解析して, 定数を渡す.
    var argDefinitions = getArgumentList(this.codes[i]);
    var argList = [];
    for(var j = 0; j < argDefinitions.length; j++) {
      switch(argDefinitions[j].name) {
        case "SL_DIRECTORY":
          argList.push(dir);
          break;
        case "SL_GLOBAL":
          argList.push($.global);
          break;
        case "SL_WINDOW":
          argList.push( typeof window !== "undefined" && $.global === window );
          break;
        case "SL_WORKER":
          argList.push( typeof self !== "undefined" && $.global === self );
          break;
        default :
          argList.push(undefined);
          break;
      }
    }　// for j
    this.codes[i].apply(null, argList);
  }
};

/**
 * ノード内のコードのエクスポート
 */
ScriptLoader.Node.prototype.export = function() {
  var str = "";
  var i;
  for (i = 0; i < this.children.length; i++) {
    str += this.children[i].export();
  }
  for (i = 0; i < this.codes.length; i++) {
    var code = this.codes[i].toString();
    str += code.substr(left, right - left);
  }
  return str;
}
// ==================================================

/*
 * Private Variables
 */
var _scriptLoader = new ScriptLoader();
var _windowLoaded = false;

// Automatically begin importing when a page loaded.
window.addEventListener("load", function(e) {
  _windowLoaded = true;
  if (_scriptLoader.phase == ScriptLoader.PHASE_BEFORE_LOAD) {
    $.load();
  }
});

/*
 * Library Exporting
 */
/**
 * import
 * 外部スクリプトファイルの読み込み
 */
$.import = function(url) {
  _scriptLoader.import(url);
};
/**
 * code
 * モジュールの実装部分を記述
 */
$.code = function(code) {
  _scriptLoader.code(code);
};
/**
 * ready
 * 外部スクリプトファイルをすべて読み込み完了したときのコールバック関数の登録
 */
$.ready = function(callback) {
  _scriptLoader.ready(callback);
};
/**
 * error
 * 外部スクリプトファイル読み込みエラー時のコールバック関数の登録
 */
$.error = function(callback) {
  _scriptLoader.ready(callback);
};
/**
 * load
 * 外部スクリプトファイルのimportの開始.
 * ページロード完了時に呼び出されるので明示的に呼ぶ必要はない.
 */
$.load = function() {
  _scriptLoader.load();
};
/**
 * setDebugMode
 */
$.setDebugMode = function(flag) {
  _scriptLoader.debugMode = flag;
};
/**
 * getExportedCode
 */
$.getExportedCode = function() {
  return _scriptLoader.exportedCode;
};
/**
 * getSpendedTime
 */
$.getSpendedTime = function() {
  return _scriptLoader.spendedTime;
};
}());} // End Web Page Client Code

/* ==================================================
 * Script Loader
 * Web Worker
 * ================================================== */
else { (function() {

/*
 * Private Variables
 */
var _importDirectoryStack = [];
// 多重import防止のためのimportされたファイルの一覧
// ファイルURLをキー として値はすべてtrue
var _importedScripts = {};

var _rootDirectory = ".";
// 現在のimport対象となっているディレクトリ
var _currentImportDirectory = _rootDirectory;
// キャッシュからの読み込みを無効にするか
var _cacheDisabled = true;
/*
 * Library Exporting
 */
/**
 * import
 */
$.import = function(url) {
  url = getAbsolutePathFromRelativePath(_currentImportDirectory, url);
  if (_importedScripts[url]) {
    return;
  }
  var tmp = _currentImportDirectory;
  _currentImportDirectory = getDirectory(url);
  
  //　読み込み済のフラグを立てる
  _importedScripts[url] = true;
  
  // キャッシュから読み込まないように末尾にクエリを追加する
  if(_cacheDisabled) {
    if(url.indexOf("?") > 0) {
      url += "&_sl_t" + Date.now();
    }
    else {
      url += "?_sl_t" + Date.now();
    }
  }
  
  importScripts(url);
  
  _currentImportDirectory = tmp;
};

/**
 * code
 */
$.code = function(code) {
  var dir = getRelativePath(_rootDirectory, _currentImportDirectory) + "/";
  //引数を解析して, 定数を渡す.
  var argDefinitions = getArgumentList(code);
  var argList = [];
  for(var j = 0; j < argDefinitions.length; j++) {
    switch(argDefinitions[j].name) {
      case "SL_DIRECTORY":
        argList.push(dir);
        break;
      case "SL_GLOBAL":
        argList.push($.global);
        break;
      case "SL_WINDOW":
        argList.push( typeof window !== "undefined" && $.global === window );
        break;
      case "SL_WORKER":
        argList.push( typeof self !== "undefined" && $.global === self );
        break;
      default :
        argList.push(undefined);
        break;
    }
  }　// for j
  code.apply(null, argList);
};

}());} // End Web Worker Code

return $;
}());
