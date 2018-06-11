/*
 * message.js
 */

SL.namespace("RL");

SL.code(function($ = RL) {

/**
 * オブジェクトのメソッド呼び出し
 * 指定オブジェクトが null であったり
 * 指定メソッドが存在しない場合は
 * undefined を返す.
 */
$.sendMessage = function(obj, message /* , ...args */) {
  if (typeof obj === "undefined" || obj === null) {
    return void(0);
  }
  
  var func = obj[message];
  
  if (typeof func !== "function") {
    return void(0);
  }
  
  var len = arguments.length;
  var args = new Array(len && len - 1);
  for (var i = 2; i < len; i++) {
    args[i - 2] = arguments[i];
  }
  
  return func.apply(obj, args);
};



});
