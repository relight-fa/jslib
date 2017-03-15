/*
 * sleep.js
 * 
 */

SL.namespace("RL");
SL.code(function($ = RL, SL_DIRECTORY) {

var kSleepModulePath = SL_DIRECTORY + "sleep.php?t=";

/**
 * ミリ秒単位で実行を遅延する(ミリ秒指定)
 */
$.sleep = function(val) {
  var until = Date.now() + (val | 0);
  var xhr = new XMLHttpRequest();
  xhr.open("GET" , kSleepModulePath + until, false);
  xhr.send();
}


});