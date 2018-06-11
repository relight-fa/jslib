/*
 * 複数スレッド間でのやりとりのための入力バッファ
 */

 
SL.namespace("RL");
SL.code(function($ = RL) {
  
$.SharedInputBuffer = class self {
  constructor(arg) {
    this._buffer = null;
    this._statusArea = null;
    
    // バッファサイズ指定による生成
    if (typeof arg == "number") {
      var capacity = arg | 0;
      var bufferSize = capcaity + 4 * 2
      this._buffer = new SharedArrayBuffer(bufferSize);
      this._statusChunk = new Int32Array(_buffer, 0, 2);
    }
    // 共有バッファによる生成
    else {
      var buffer = arg;
      this._buffer = buffer;
      this._statusChunk = new Int32Array(_buffer);
    }
  }
  
  /**
   * バッファへ入力されるまでスレッドをsleepする.
   */
  wait(timeOut) {
    var result = Atomics.wait(this._statusChunk, 0, 0, timeOut);
    this._statusChunk[0] = 2;
    return result;
  }
  
  /**
   * 入力待ちとなっているスレッドを起こす
   */
  wake() {
    this._statusChunk[0] = 1;
    Atomics.wake(this._statusChunk, 0);
  }
  
  /**
   * 値に文字列をセットする
   * バッファの値部分には各文字のUTF-16コードが連なる.
   */
  setValueAsString(str) {
    var strLength = str.length;
    var byteLength = strLength * 2;
    if (byteLength > this.capacity) {
      strLength = (this.capacity / 2) | 0;
      byteLength = 2 * strLength;
    }
    this._statusChunk[1] = byteLength;
    
    var u16Array = new Uint16Array(this._buffer, 4 * 2);
    for (var i = 0; i < strLength; i++) {
      u16Array[i] = str.charCodeAt(i);
    }
  }
  
  /**
   * バッファの値を文字列として取得
   */
  getValueAsString() {
    var byteLength = this._statusChunk[1];
    var strLength = (byteLength / 2) | 0;
    var u16Array = new Uint16Array(this._buffer, 4 * 2, strLength);
    var str = String.fromCharCode.apply(null, u16Array);
  }
  
  get buffer() {
    return this._buffer;
  }
  
  get length() {
    this._statusChunk[1];
  }
  
  get capacity() {
    this._buffer.length - 4 * 2;
  }
};
  
});
