/*
 * utf8.js
 * UTF-8エンコード文字列を扱うためのクラス
 */

SL.import("stringencode.js");
SL.namespace("RL.StringEncode.UTF8");
SL.code(function($ = RL.StringEncode.UTF8) {

/**
 * JS StringオブジェクトからUTF-8エンコードされたByteArrayを作成して返す
 * @param {String} エンコードする文字列
 * @return {Uint8Array} SJISエンコードされた文字列のByteArray
 */
$.encode = function(str) {
};

/**
 * JS文字列をエンコードした際のバイト長を得る
 */
var getBytesLengthWhenEncode = function(str) {
}


/**
 * UTF8エンコードされたバイト列からJS文字列オブジェクトを作成
 *
 * @param {Uint8Array} sjisBytes UTF-8エンコードされたバイト列
 */
$.decode = function(bytes) {
  
}

}); // End SL.code



