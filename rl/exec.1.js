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
SL.import("path.js");
SL.import("error.js");

SL.namespace("RL.Async");
SL.code(function($ = RL, SL_DIRECTORY, SL_GLOBAL) {

var EXEC_WORKER_PATH = SL_DIRECTORY + "exec_worker.js";

/**
 * 指定した外部Workerファイルの実行.
 * main関数を呼びだし、その結果を取得する.
 * @param {String} path Workerファイルのパス
 * @param {Array} main関数に渡す引数リスト
 * @param {Function} delegate (optional) 処理状況に応じて呼び出されるコールバック関数
 */
$.Async.exec = function(path, arg, delegate) {
  return new Promise(function(resolve, reject) {
    var scriptPath = RL.getPathFromRelativePath(location.href, path);
    var worker = new Worker(EXEC_WORKER_PATH + "?p=" + encodeURIComponent(scriptPath) );
    
    worker.addEventListener("error", function(e) {
      console.log(e);
      reject(new Error("failed to load exec_worker.js\n" + e.message));
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
      type: "exec",
      arg: arg,
    });
  });
};

}); // End SL.code;














