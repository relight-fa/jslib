/*
  asyncmodule.js
  
  モジュールの非同期処理化.
  Worker向けに書かれた同期処理モジュールを非同期的に呼び出せるようにする.
  
  usage)
  
  // AsyncModuleオブジェクトの作成
  var asyncModule = new RL.AsyncModule("module.js");
  
  // 1) モジュール内の関数呼び出し
  asyncModule.call("myFunc", arg1, arg2, ...)
  .then(function(result) {
    console.log(result);
  });
  
  // 2) モジュール内オブジェクトの作成
  var asyncObject;
  asyncModule.new("MyClass", arg1, arg2, ...)
  .then(function(result) {
    asyncObject = result;
  });
  
  // 3) モジュール内オブジェクトのメソッド呼び出し
  asyncObject.call("myMethod", arg1, arg2, ...)
  .then(function(result) {
    console.log(result);
  });
  
*/

SL.import("path.js");

SL.namespace("RL");
SL.code(function($ = RL, SL_DIRECTORY) {

var ASYNC_MODULE_WORKER_PATH = SL_DIRECTORY + "asyncmodule_worker.js";
/**
 * AsyncModule
 */
$.AsyncModule = class self {
  constructor(modulePath) {
    modulePath = RL.getPathFromRelativePath(location.href, modulePath);
    this._worker = new Worker(ASYNC_MODULE_WORKER_PATH + "?p=" + encodeURIComponent(modulePath) );
    this._callIndex = 0;
    
    this._promiseQueue = [];
    
    var that = this;
    this._worker.addEventListener("message", function(e) {
      var data = e.data;
      if (data.type !== "return") {
        return;
      }
      var promise = that._promiseQueue.shift();
      if (typeof data.error === "undefined" || (! data.error)) {
        promise.resolve(data.value);
      }
      else {
        promise.reject(data.message);
      }
    }, false);
  }
  
  /**
   * Promiseによるメッセージ送信処理
   */
  _post(obj) {
    var that = this;
    return new Promise(function(resolve, reject) {
      var promise = {
        resolve: resolve, reject: reject
      };
      that._promiseQueue.push(promise);
      that._worker.postMessage(obj);
    });
  }
  
  /**
   * オブジェクト作成
   */
  new(className /*,args...*/) {
    var that = this;
    return this._post({
        type: "new",
        name: className,
        args: subarray(arguments, 1, arguments.length - 1)
    })
    // type:"new"での呼び出しでオブジェクトIDが帰ってくる
    .then(function(id) {
      return new $.AsyncObject(that, id);
    });
  }
  
  /**
   * 関数呼び出し
   */
  call(functionName /*,args...*/) {
    return this._post({
        type: "call",
        name: functionName,
        args: subarray(arguments, 1, arguments.length - 1)
    });
  }
  
  /**
   * 変数取得
   */
  get(varName) {
    return this._post({
        type: "get",
        name: varName
    });
  }
};

/**
 * AsyncObject
 */
$.AsyncObject = class self {
  constructor(module, id) {
    // 関連モジュール
    this._module = module;
    // Worker内でのオブジェクトID
    this._id = id;
  }
  
  /**
   * メソッド呼び出し
   */
  call(methodName) {
    return this._module._post({
      type: "method",
      id: this._id,
      name: methodName,
      args: subarray(arguments, 1, arguments.length - 1)
    });
  }
  
  /**
   * 変数取得
   */
  get() {
  }
}

//
// Helper Functions
//

/**
 * 部分配列の取得
 */
function subarray(array, from, length) {
  var result = new Array(length);
  for(var i = 0; i < length; i++) {
    result[i] = array[from + i];
  }
  return result;
}

});