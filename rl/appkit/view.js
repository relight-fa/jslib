/*
 * appkit/view.js
 */

SL.namespace("RL");

SL.import("../rect.js");
SL.code(function($ = RL) {

/**
 * RL.View
 */
$.View = class {
  /**
   * コンストラクタ
   */
  constructor(frame) {
    // DOM上での要素
    this._element = document.createElement("div");
    this._initializeElement();
    
    this._subviews = [];
    
    if (frame) {
      this._frame = frame.copy();
    }
    else {
      this._frame = new RL.Rect(0, 0, 0, 0);
    }
    this._updateElement();
    
    /*
     * 操作イベント関連
     */
    // ビューへの操作が有効であるか
    this._userInteractionEnabled = true;
    // ビューへの同時複数タッチが有効であるか
    this._multipleTouchEnabled = true;
    // ビューへのタッチを排他的にするか.
    // true の場合、このViewをタッチした状態で
    // 他のViewをタッチしても反応しない。
    // また、他のViewをタッチした状態で
    // このViewをタッチしても反応しない.
    this.exclusiveTouch = true;
    
    /*
     * 再描画情報
     */
    // 再描画が必要か
    this._needsDraw = false;
    // 再描画が必要な範囲
    this._dirtyRect = new RL.Rect(0, 0, 0, 0);
    
    // 再描画が必要か
    this._needsLayout = false;
    
    this._visible = true;
    
    // Viewのサイズが変更された際にlayoutメソッドが必要となるか
    this._needsLayoutWhenResized = false;
  }
  
  _initializeElement() {
    this._element.style.position = "absolute";
    this._element.style.overflow = "hidden";
  }
  
  _updateElement() {
    this._element.style.left = this._frame.x + "px";
    this._element.style.top = this._frame.y + "px";
    this._element.style.width = this._frame.width + "px";
    this._element.style.height = this._frame.height + "px";
    
  }
  
  /**
   * 背景色設定
   */
  setBackgroundColor(r, g, b, a) {
    console.log("setBackgroundColor");
    if (typeof a === "undefined" ) {
      this._element.style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
    }
    else {
      this._element.style.backgroundColor = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }
  }
  
  /**
   * subviewの再配置が必要であることを通知
   */
  setNeedsLayout() {
    this._needsLayout = true;
  }
  
  /**
   * subviewの再配置
   */
  layout() {};
  
  /**
   * 再描画が必要であることを通知
   */
  setNeedsDraw() {
    this._needsDraw = true;
    this._dirtyRect.set(this._frame);
  }
  /**
   * 再描画が必要であることを通知
   * @param {RL.Rect} rect 再描画必要な領域. null を渡した場合は全域を再描画する.
   */
  setNeedsDrawInRect(rect) {
    this._needsDraw = true;
    if (rect == null) {
      this._dirtyRect.set(this._frame);
      return;
    }
    this._dirtyRect.union(rect);
  }
  
  /**
   * Viewの描画
   * @param {RL.Rect} rect 描画の対象となる領域
   */
  draw(rect) {}
  
  /**
   * 描画後に呼ばれる
   */
  onFinishDraw() {
    this._needsDraw = false;
    this._dirtyRect.size.x = 0;
  }
  
  /**
   * subview の追加
   * @param {RL.View} subview
   */
  addSubview(subview) {
    this._subviews.push(subview);
    this._element.appendChild(subview._element);
  }
  
  /**
   * ウィンドウが背面にある状態での、このViewへのタッチに反応するか.
   */
  acceptsFirstTouch() {
    return true;
  }
  
  /**
   * Viewの表示
   */
  show() {
    if (this._visible === true) {
      return;
    }
    this._visible = true;
    this._element.style.display = "";
  }
  
  hide() {
    if (this._visible === false) {
      return;
    }
    this._visible = false;
    this._element.style.display = "none";
  }
  
  /*
   * Position Properties
   */
  get x() {
    return this._frame.position.x;
  }
  set x(value) {
  }
  
  get y() {
    return this._frame.position.y;
  }
  set y(value) {
  }
  
  get width() {
    return this._frame.size.x;
  }
  set width(value) {
    if (this._frame.size.x == value) {
      return;
    }
    this._frame.size.x = value;
    this.setNeedsDraw();
  }
  
  get height() {
    return this._frame.size.y;
  }
  set height(value) {
    if (this._frame.size.y == value) {
      return;
    }
    this._frame.size.y = value;
    this.setNeedsDraw();
  }
  
  get visible() {
    return this._visible;
  }
  set visible(value) {
    value = value == true;
    if (value === true) {
      this.show();
    }
    else {
      this.hide();
    }
  }
  
  getFrame() {
    return this._frame.copy();
  }
  
  setFrame(rect) {
    // サイズに変更があれば再描画とsubview再配置を行う.
    var widthChanged = rect.width !== this._frame.width;
    var heightChanged = rect.height !== this._frame.height;
    
    this._frame.set(rect);
    this._updateElement();
    
    if (widthChanged || heightChanged) {
      this.setNeedsLayout();
      this.setNeedsDraw();
    }
  }
  
  getOrigin() {
    return this._frame.origin.copy();
  }
  
  getSize() {
    return this._frame.size.copy();
  }
  
  /* View内の指定座標に存在する最前面のViewを検索 */
  hitTest(x, y) {
    var currentView = this;
    viewLoop:
    while (true) {
      var views = currentView._subviews;
      var len = views.length;
      for (var i = len - 1; i >= 0; i--) {
        var view = views[i];
        if (view._visible == false) {
          continue;
        }
        if (view._frame.containsPointXY(x, y)) {
          currentView = view;
          x -= view.left;
          y -= view.top;
          continue viewLoop;
        }
      }
      return currentView;
    }
    
  }
  
};


});
