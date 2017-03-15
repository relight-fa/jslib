/**
 * async_script.js
 * 
 * 外部Workerファイルを実行する.
 * Workerファイルに記述されたmain関数を実行し、その結果を取得する
 * シンプルな呼び出しのためのモジュール.
 * 
 * Workerファイル側 (main.js)
 * --------------------------------------------------
 * importScripts("/js/exec.js");
 * SL.import("/js/rl/async_script.js");
 * 
 * function main(arg) {
 *   return arg + " World!";
 * }
 * --------------------------------------------------
 * 
 * クライアント側
 * --------------------------------------------------
 * SL.import("/js/rl/exec.js");
 * SL.ready(function() {
 *   RL.Async.execute("main.js", "Hello")
 *   .then(function(result) {
 *     console.log(result); // Hello World!
 *   });
 * });
 * --------------------------------------------------
 */
SL.import("error.js");

SL.namespace("RL.Async");
SL.code(function($ = RL, SL_GLOBAL) {

/**
 * 指定した外部Workerファイルの実行.
 * main関数を呼びだし、その結果を取得する.
 * @param {String} path Workerファイルのパス
 * @param {Array} main関数に渡す引数リスト
 * @param {Function} delegate (optional) 処理状況に応じて呼び出されるコールバック関数
 */
$.Async.exec = function(path, arg, delegate) {
  return new Promise(function(resolve, reject) {
    var originalPath = path;
    // disable cache
    if(path.indexOf("?") > 0) {
      path += "&_sl_t_" + Date.now();
    }
    else {
      path += "?_sl_t_" + Date.now();
    }
    
    // create worker
    var worker;
    worker = new Worker(path);
    
    worker.addEventListener("error", function(e) {
      console.log(e);
      reject(new Error(
        "failed to create a Worker from: " + originalPath + "\n" +
        e.message + "\n" +
        e.filename + ":" + e.lineno + "[" + e.colno + "]"));
      worker.terminate();
    }, false);
    
    // メッセージ受信定義
    worker.onmessage = function(e) {
      var data = e.data;
      switch(data.type) {
        case "result": {
          resolve(data.result);
          break;
        }
        case "error": {
          reject(new Error(data.errorMessage));
          break;
        }
        case "progress": {
          if (progressionCallback) {
            progressionCallback(data);
          }
          break;
        }
        default: {
          if (delegate) {
            delegate(e);
          }
          break;
        }
      }
    };
    
    worker.postMessage({
      type: "execute",
      arg: arg,
    });
  });
};

/* ==================================================
 * Worker
 * ================================================== */
if(SL_GLOBAL === self) {
  self.onmessage = function(e) {
    let data = e.data;
    if(data.type === "execute") {
      try {
        let result = main.apply(null, data.arg);
        self.postMessage({
          "type": "result",
          "result": result
        });
        self.close();
      }
      catch (err) {
        console.log(err);
        let errorMessage = RL.dumpError(err);
        self.postMessage({
          "type": "error",
          "errorMessage": errorMessage,
        });
        self.close();
      }
    }
  };
  
  self.progress = function() {
  };
  
}

}); // End SL.code;














