/**
 * exec.js
 * 
 * 外部Workerファイルを実行する.
 * Workerファイルに記述されたmain関数を実行し、その結果を取得する
 * シンプルな呼び出しのためのモジュール.
 * 
 * Workerファイル側 (main.js)
 * --------------------------------------------------
 * importScripts("/js/sl.js");
 * SL.import("/js/rl/exec.js");
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
 *   RL.Async.exec("main.js", "Hello")
 *   .then(function(result) {
 *     console.log(result); // Hello World!
 *   });
 * });
 * --------------------------------------------------
 */
SL.import("error.js");

SL.namespace("RL.Async");
SL.code(function($ = RL) {

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
    
    console.log(path);
    
    // create worker
    var worker;
    worker = new Worker(path);
    console.log(worker);
    
    worker.addEventListener("error", function(e) {
      console.log(e);
      var errorObj;
      // スクリプトエラー
      if (typeof e.message !== "undefined") {
        errorObj = {
          type: "script error",
          message: "A script error occurred in: " + originalPath + "\n" +
              e.message + "\n" +
              e.filename + ":" + e.lineno + "[" + e.colno + "]"
        }
      }
      // ファイル読み込みエラー
      else {
        errorObj = {
          type: "load error",
          message: "Failed to load a Worker from: " + originalPath
        }
      }
      reject(errorObj);
      worker.terminate();
    }, false);
    
    // メッセージ受信定義
    worker.onmessage = function(e) {
      var data = e.data;
      switch(data.type) {
        case "beginExec": {
          clearTimeout(beginExecTimeout);
          break;
        }
        case "result": {
          resolve(data.result);
          break;
        }
        case "error": {
          console.log(e);
          reject({
            type: "exec error",
            message: data.errorMessage
          });
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
    
    // Execコマンド受信待機のタイムアウト処理
    var beginExecTimeout = setTimeout(function() {
      console.log("exec timeout");
      reject({
        type: "exec timeout",
        message: "Worker won't begin"
      });
      worker.terminate();
    }, 5000);
    
    worker.postMessage({
      type: "exec",
      arg: arg,
    });
  });
};

});

// ==================================================
// Worker
// ==================================================
SL.code("WORKER", function($ = RL){
  self.onmessage = function(e) {
    let data = e.data;
    switch (data.type) {
      case "exec": {
        // execコマンドの受信完了をドキュメント側に通知
        self.postMessage({
          "type": "beginExec"
        });
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
        break;
      }
    }
  };
  self.progress = function() {
  };

}); // End SL.code;














