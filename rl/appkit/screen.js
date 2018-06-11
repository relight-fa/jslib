/**
 * スクリーン情報取得
 */

SL.namespace("RL");
SL.import("../vector.js");

SL.code(function($ = RL) {

_mainScreen = null;
$.Screen = class self {
  static mainScreen() {
    if (_mainScreen == null) {
      _mainScreen = new self();
    }
    return _mainScreen;
  }
  
  /**
   * サイズ取得
   */
  get width() {
    return window.innerWidth;
  }
  get height() {
    return window.innerHeight;
  }
  get size() {
    return new RL.Vector2(this.width, this.height);
  }
  get frame() {
    return new RL.Rect(0, 0, this.width, this.height);
  }
};

});
