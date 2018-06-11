/*
 * appkit/window.js
 */

SL.import("view.js");

SL.namespace("RL");
SL.code(function($ = RL) {

/**
 * ウィンドウレベル定数
 * ウィンドウレベルは符号付き数値で表され、値が高いほど前面に表示される
 */
$.WindowLevel = {
  BACKGROUND:     0,
  NORMAL:  0x000F00,
  MENUBAR: 0x00F000,
  MENU:    0x00FF00,
  MORDAL:  0x0F0000,
};

$.Window = class extends $.View {
  constructor(frame) {
    super(frame);
    
    this._releasedWhenClosed = false;
    this._title = "";
    
    this._contentView = null;
    
    // ウィンドウレベル
    // この数値が高いほど、全面に表示される.
    this._level = RL.WindowLevel.NORMAL;
    
    // アプリケーションが持つウィンドウリスト内での
    // このウィンドウのノードオブジェクト
    this._windowListNode = null;
    this._joined = false; // アプリケーションのウィンドウリストに登録済か
  }
  
  /**
   * GUI上の"閉じる"ボタンの操作を実行する
   */
  performClose() {
  }
  
  close() {
  }
  
  /**
   * コンテンツ領域のサイズを指定してウィンドウのサイズを変更する
   */
  setContentSize(size) {
  }
  
  get releasedWhenClosed() {
    return this._releasedWhenClosed;
  }
  set releasedWhenClosed(value) {
    this._releasedWhenClosed = !!value;
  }
  
  /**
   * ウィンドウを最前面に表示
   */
  orderFront() {
    RL.app.windowOrderFront(this);
  }
  
  /**
   * ウィンドウを最背面に表示
   */
  orderBack() {
  }
  
  /**
   * アプリケーションからウィンドウを取り除く
   * ウィンドウオブジェクトを解放したい場合は
   * removeWindow を呼び出した後、変数の参照を全て取り除く.
   */
  removeWindow() {
    RL.app.disposeWindow(this);
  }
  
  /**
   * ウィンドウタイトル
   */
  get title() {
    return this._title;
  }
  set title(value) {
    this._title = String(value);
  }
};


});
