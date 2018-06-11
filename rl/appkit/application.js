
/**
 * appkit/application.js
 */

SL.import("../list.js");
SL.import("../linkedlist.js");
SL.import("../notification_center.js");

SL.namespace("RL");
SL.code(function($ = RL) {

// 共有インスタンスを指すグローバル変数
RL.app = null;

RL.WINDOW_MAX = 4096;
RL.WINDOW_ZINDEX_STEP = 32;
RL.WINDOW_ZINDEX_MAX = 2147483647;
RL.WINDOW_ZINDEX_MIN = 0;



RL.Application = class self {
  /**
   * AppKit アプリケーションの実行
   */
  static launch(controllerClass) {
    if (RL.app !== null) {
      console.log("RLApplication is already launched.");
      return;
    }
    
    self.sharedApplication();
    RL.app._initialize();
    
    var appController = new controllerClass();
    RL.app._delegate = appController;
    
    RL.app.run();
  }
  
  /**
   * 共有インスタンスの取得
   * 初回実行時に共有インスタンスを作成し、グローバル変数RL.appに保存する.
   * @returns {RL.Application} 共有インスタンス
   */
  static sharedApplication() {
    if (RL.app === null) {
      RL.app = new RL.Application();
    }
    self.sharedApplication = function() {
      return RL.app;
    };
    return RL.app;
  }
  
  /**
   * Constructor
   */
  constructor() {
    // ウィンドウのリスト (LinkedList)
    // 最前面のウィンドウがリストの先頭にくる
    // 各WindowにLinkedListNodeを持たせる.
    this._windows = new RL.LinkedList();
    
    this._finishLaunching = false;
    this._running = false;
    this._delegate = null;
    
    this._animationFrameId = 0;
    this._drawHandlerCallback = this.onDraw.bind(this);
    
    this._keyWindow = null;
    
    this._touches = [];
    
    this._needsDrawViews = new RL.List(0);
    this._needsLayoutViews = new RL.List(0);
    
    this._element = document.body;
  }
  
  /**
   * 初期化処理
   */
  _initialize() {
    RL.app._initDocument();
    RL.app._initDOMEvent();
  }
  
  /**
   * アプリケーションのためのDOM初期化
   */
  _initDocument() {
    /* スタイル */
    this._element.style.margin = "0";
    this._element.style.padding = "0";
    this._element.style.position = "relative";
    this._element.style.backgroundColor = "#202020";
    this._element.style.overflow = "hidden";
  }
  
  /**
   * DOMEvent　登録
   */
  _initDOMEvent() {
    /* ウィンドウリサイズ時 */
    window.addEventListener("resize", (e)=>{
      RL.NotificationCenter.shared().postNotificationName(
        "ApplicationDidChangeScreenParameters",
        this,
        null
      );
    }, false);
    /* クリック */
    window.addEventListener("mousedown", (e)=>{
      console.log("mousedown");
      RL.app.onTouchBegin("m" + e.button ,e.clientX, e.clientY);
    }, false);
    window.addEventListener("mouseup", (e)=>{
      console.log("mouseup");
    }, false);
    window.addEventListener("blur", (e)=>{
      console.log("blur");
    }, false);
  }
  
  /**
   *  タッチ開始処理
   */
  onTouchBegin(id, x, y) {
    // タッチ対象のウィンドウを取得
    var targetWindow = this._getTargetWindow(x, y);
    
    if (targetWindow === null) {
      return;
    }
    // 対象ウィンドウをKeyWindowにする.
    if (targetWindow !== this._keyWindow) {
      this.windowMakeKeyAndOrderFront(targetWindow);
    }
    
    // ウィンドウ内のタッチ対象Viewを取得
    var targetView = targetWindow.hitTest(x - targetWindow.x, y - targetWindow.y);
  }
  
  /**
   * 座標(x, y) をクリックしたときの対象Windowの検索
   * @param {Number} x 
   * @param {Number} y 
   */
  _getTargetWindow(x, y) {
    var node = this._windows.first;
    while (node !== null) { 
      var win = node.value;
      if (win._visible && win._frame.containsPointXY(x, y)) {
        return win;
      }
      node = node._next;
    }
    return null;
  }
  
  /**
   * アプリケーションのイベントループを実行する.
   */
  run() {
    this._running = true;
    if (! this._finishLaunching) {
      this._finishLaunching = true;
      RL.sendMessage(this._delegate, "applicationDidFinishLaunching");
    }
  }
  
  /**
   * アプリケーションのイベントループを停止する.
   */
  stop() {
    this._running = false;
    window.cancelAnimationFrame(this._animationFrameId);
    this._animationFrameId = 0;
  }
  
  /**
   * 描画タイミングで呼び出されるハンドラ
   */
  onDraw(timestamp) {
  }
  
  /**
   * is the Application running
   */
  get running() {
    return this._running;
  }
  /**
   * delegate of the application
   */
  get delegate() {
    return this._delegate;
  }
  
  /**
   * 再描画が必要なViewの追加
   * @param {RL.View} view
   */
  addNeedsDrawView(view) {
    // アニメーションフレームの発行
    if (this._animationFrameId !== 0) {
      this._animationFrameId = window.requestAnimationFrame(this._drawHandlerCallback);
    }
    
    this._needsDrawViews.push(view);
  }
  
  /**
   * アプリケーションへのウィンドウの追加
   * @param {RL.Window} win
   */
  joinWindow(win) {
    if (win._joined) {
      return;
    }
    
    var node = this._windows.addValueFirst(win);
    win._windowListNode = node;
    this._element.appendChild(win._element);
    
    // 同じレベルのウィンドウの位置まで下げる
    this._windows.moveNodeForwardUntil(node, function(node, cNode) {
      return node.value._level >= cNode.value._level;
    });
    
    // zIndex設定
    this.setWindowZIndex(win);
  }
  /**
   * アプリケーションからウィンドウの除去
   * @param {RL.Window} win
   */
  removeWindow(win) {
    if (! win._joined) {
      return;
    }
    
    var node = win._windowListNode;
    this._windows.removeNode(node);
    this._element.removeChild(win._element);
    
    if (this._keyWindow == win) {
      this._keyWindow = null;
    }
    
    win._windowListNode = null;
    win._joined = false;
  }
  
  
  alignWindowZIndex() {
    var z = ( RL.WINDOW_ZINDEX_STEP * this._windows.count / 2);
    var node = this._windows.first;
    while (node !== null) {
      node.value._element.style.zIndex = z;
      z -= RL.WINDOW_ZINDEX_STEP;
      node = node.next;
    }
  }
  
  setWindowZIndex(win) {
    var node = win._windowListNode;
    var elem = win._element;
    var prevElem = node._previous == null ? null : node._previous.value._element;
    this._element.insertBefore(elem, prevElem);
    /*
    if (this._windows.count == 1) {
      win._element.style.zIndex = 0;
    }
    else if (node.isFirst()) {
      win._element.style.zIndex =
            (node._next.value._element.style.zIndex | 0)
          + RL.WINDOW_ZINDEX_STEP;
    }
    else if (node.isLast()) {
      win._element.style.zIndex =
            (node._previous.value._element.style.zIndex | 0)
          - RL.WINDOW_ZINDEX_STEP;
    }
    else {
      var previousZIndex = node._previous.value._element.style.zIndex | 0;
      var nextZIndex = node._next.value._element.style.zIndex | 0;
      if (previousZIndex - nextZIndex == 1) {
        this.alignWindowZIndex();
      }
      else {
        win._element.style.zIndex = (previousZIndex + nextZIndex) | 0;
      }
    }
    */
  }
  
  windowMakeKeyAndOrderFront(win) {
    this.windowOrderFront(win);
    this._keyWindow = win;
  }
  
  /**
   * 指定したウィンドウを前面に持ってくる.
   * ただしウィンドウレベルのルールを越えない.
   */
  windowOrderFront(win) {
    if (! win._joined) {
      this.joinWindow(win);
    }
    
    var node = win._windowListNode;
    // 同じレベルのウィンドウの最前面まで持ってくる
    this._windows.moveNodeBackwardUntil(node, function(node, cNode) {
      return cNode.value._level > node.value._level;
    });
    
    // zIndex設定
    this.setWindowZIndex(win);
  }
};





});
