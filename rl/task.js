/**
 * task.js
 * Task 非同期分散処理クラス
 * 
 * // ----------------------------------------
 * // 単一Taskの実行
 * 
 * // スクリプトのパスと、スクリプトに渡す引数の配列を渡してTaskオブジェクト生成
 * var task = new RL.Task("task.js", [arg1, arg2]);
 * // Taskの実行 (別スレッドでの処理)
 * task.run();
 * // Taskの終了を待つ
 * task.await();
 * // Taskの結果を取得
 * var result = task.result;
 * 
 * // ----------------------------------------
 * // 複数Taskの同時実行
 * 
 * // Taskの配列の作成
 * var tasks = [];
 * for (var i = 0; i < 10; i++) {
 *  var task = new RL.Task("task.js", [i]);
 *  tasks.push(task);
 * }
 * 
 * // Taskの配列から全てを1つにまとめたTaskを生成
 * var taskAll = new RL.Task(tasks);
 * // Taskの集合をまとめて実行
 * taskAll.run();
 * // 全てのTaskが終了するのを待つ
 * taskAll.await();
 * // 配列で各Taskごとの結果が返される
 * var results = taskAll.result;
 */
SL.import("error.js");
SL.import("sharedinputbuffer.js");

SL.namespace("RL");
SL.code("", function($ = RL, SL_GLOBAL) {
  
var INPUT_BUFFER_SIZE = 4 * 1024;

$.Task = class self {
  /**
   * Task(String path, Array args);
   * Task(Array<Task> tasks);
   */
  constructor(arg1, arg2) {
    this._running = false;
    this._completed = false;
    this._result = null;
    this._worker = null;
    this._args = null;
    
    this._inputBuffer = null;
    this._inputBufferTA = null;
    
    // Task(String path, Array args);
    if (typeof arg1 === "string") {
      var path = arg1;
      var args = arg2;
      this._worker = new Worker(path);
      this._args = args || [];
    }
  }
  
  run() {
    if (this._running || this._completed) {
      return;
    }
    this._running = true;
    
    this._inputBuffer = new RL.SharedInputBuffer(INPUT_BUFFER_SIZE);
    
    // Workerが有効か問い合わせ (タイムアウト5秒)
    this._worker.postMessage({
      command: "available",
      buffer: this._inputBuffer.buffer
    }, [this._inputBuffer.buffer]);
    var availableResult = this._inputBuffer.wait(5 * 1000);
    
    // Worker実行
    this._worker.postMessage({
      command: "run",
      args: this._args,
      buffer: this._inputBuffer.buffer
    }, [this._inputBuffer.buffer]);
  }
  
  _checkCompleted() {
    if (this._completed) {
      return true;
    }
    if (! this._running) {
      return false;
    }
    // 実行中ならば入力バッファの先頭を見る
    if (! this._inputBuffer.hasValue) {
      return false;
    }
    // 実行中フラグがtrueで入力バッファに完了通知が来ている
    this._processAfterComplete();
    return true;
  }
  
  /**
   * タスクの実行完了を同期的に待機する.
   * タスクが実行前、完了後の場合は待機は発生しない.
   */
  await() {
    if ((! this._running) || this._completed) {
      return;
    }
    Atomics.wait(this._inputBufferTA, 0, 0);
    this._processAfterComplete();
  }
  
  /**
   * タスク完了後の処理
   * 入力バッファからオブジェクトURLを抽出し
   * タスク結果を読み込む.
   * その後完了フラグを立てる.
   */
  _processAfterComplete() {
    // オブジェクトURLがバッファの5-8バイトに文字列長
    // 9バイト以降にURL文字列がUTF-16エンコードの形式で格納されている
    var resultLength = this._inputBufferTA[1];
    var u16Array = new Uint16Array(buffer, 8, resultLength * 2);
    var url = String.fromCharCode.apply(null, u16Array);
    
    // ファイルをJSONファイルとして読み込み
    var xhr = new XMLHttpRequest();
    xhr.responseType = "json";
    xhr.open("GET" , url, false);
    xhr.send(null);
    this._result = xhr.response;
    
    // オブジェクトURLの破棄
    URL.revokeObjectURL(url);
    
    this._running = false;
    this._completed = true;
  }
  
  get result() {
    this._checkCompleted();
    return this._result;
  }
  
  get running() {
    this._checkCompleted();
    return this._running;
  }
  
  get completed() {
    this._checkCompleted();
    return this._completed;
  }
};



});
