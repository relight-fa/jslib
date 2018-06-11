/*
 * sleep.js
 * 
 */

SL.namespace("RL");
SL.namespace("RL.Async");

/*
 * Worker 環境用 同期処理Sleep
 */
// Atomicによる実装
SL.code({
  environments: ["WORKER"],
}, function($ = RL) {
  var _sharedArrayForSleep = new SharedArrayBuffer(4);
  var _typedArrayForSleep = new Int32Array(_sharedArrayForSleep);
  /**
   * ミリ秒単位で実行を遅延する(ミリ秒指定)
   */
  $.sleep = function(val) {
    Atomics.wait(_typedArrayForSleep, 0, 0, val);
  }
});
// サーバープログラムとXMLHttpRequest同期処理による実装
//SL.code({
//  environments: ["WORKER"],
//  constants: ["DIRECTORY"],
//  condition: !(typeof SharedArrayBuffer !== "undefined" && typeof Atomics !== "undefined")
//}, function($ = RL) {
//  var kSleepModulePath = SL.DIRECTORY + "sleep.php?t=";
//  /**
//   * ミリ秒単位で実行を遅延する(ミリ秒指定)
//   */
//  $.sleep = function(val) {
//    var until = Date.now() + (val | 0);
//    var xhr = new XMLHttpRequest();
//    xhr.open("GET" , kSleepModulePath + until, false);
//    xhr.send();
//  }
//}); // For WORKER

// 非同期スリープ
SL.code(function($ = RL) {
$.Async.sleep = function(val) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, val);
  });
}
}); // SL.code

