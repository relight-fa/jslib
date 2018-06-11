/*
 * console.js
 * コンソールアプリケーション上で利用できる関数群
 */

SL.namespace("RL");
SL.code(function($ = RL, SL_WINDOW, SL_WORKER) {

  // Worker side
if (SL_WORKER) {
  var INPUT_BUFFER_SIZE = 1024 * 8;
  
  /**
   * 画面文字列出力
   */
  $.print = function(message, className) {
    self.postMessage({
      target: "console",
      command: "print",
      message: message,
      className: className
    });
  }
  
  /**
   * ユーザーからの単一行文字列 入力受付 
   */
  $.input = function() {
    // 入力先バッファ
    // 先頭インデックスをwaitフラグ、それ以降をWindowから受け付けるデータ領域として扱う
    //    Worker側で先頭インデックスを0にしてwait
    // -> Window側でバッファに書き込み, 先頭インデックスを1にしてwake
    // -> Worker側がresumeされ、バッファ読み込み
    var inputBuffer = new SharedArrayBuffer(INPUT_BUFFER_SIZE);
    var typedArray = new Int32Array(inputBuffer);
    
    // コマンド通知
    self.postMessage({
      target: "console",
      command: "input",
      buffer: inputBuffer
    }, [inputBuffer]);
    Atomics.wait(typedArray, 0, 0);
  }
  
  /* ファイル選択 */
  $.selectFile = function() {
    // 入力先バッファ
    // 先頭インデックスをwaitフラグ、それ以降をwindowから受け付けるデータ領域として扱う
    // windowからはファイルのオブジェクトURLが渡される.
    var inputBuffer = new SharedArrayBuffer(INPUT_BUFFER_SIZE);
    var typedArray = new Int32Array(inputBuffer);
    
    self.postMessage({
      target: "console",
      command: "selectFile",
      buffer: inputBuffer
    }, [inputBuffer]);
    Atomics.wait(typedArray, 0, 0);
  }
  
  $.export = function(name, data) {
    self.postMessage({
      target: "console",
      command: "export",
      name: name,
      data: data
    });
  }
}

});
