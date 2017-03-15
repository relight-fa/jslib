/**
 * stringencode.js
 * 文字列エンコードに関す名前空間
 */

SL.namespace("RL.StringEncode");
SL.code(function($ = RL.StringEncode) {

/**
 * 各文字列エンコードの仮想クラス
 */
$.Base = class self {
  /**
   * JS文字列をエンコードしたUint8Arrayを返す
   */
  encode(str) { return null; }
  
  /**
   * バイト列をでコードし、JS文字列として返す
   */
  decode(bytes) { return ""; }
  
  /**
   * 何バイト目までエンコード仕様に沿っているか計算する
   *
   * 不確定なエンコードのバイナリに対して呼び出し
   * このメソッドの値によってどのエンコードが一番妥当であるか判断する.
   */
  calcValidLength() { return 0; }
};

}); // End SL.code



