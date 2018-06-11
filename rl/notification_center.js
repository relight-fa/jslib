SL.import("notification.js");
SL.namespace("RL");
SL.code(function($ = RL) {

/**
 * 通知監視オブジェクト
 */
$.Observer = class self {
  constructor(notificationName, object, callback, boundObject) {
    this._notificationName = notificationName;
    this._object = object;
    this._callback = callback;
    this._boundObject = boundObject;
    this._removed = false;
  }
  
  get notificationName() {
    return this._notificationName;
  }
};
  
/**
 * 通知センター
 */
$.NotificationCenter = class self {
  constructor() {
    // 通知名ごとの Observer リスト
    // 通知名をキーとして Observer の配列を含む
    this._observerListForNotificationName = {};
  }
  
  static shared() {
    self._shared  = new self();
    
    self.shared = function() {
      return self._shared;
    };
    return self._shared;
  }
  
  /**
   * Observerの登録
   * @param notificationName 監視対象とする通知名
   * @param object
   *     監視対象とするオブジェクト
   *     ここで指定したオブジェクトが出した通知を observer に配送する.
   *     null が指定された場合、任意のオブジェクトの通知を配送する.
   * @param callback 通知時に呼び出すコールバック関数
   * @param boundObject
   *     callback関数のthisにバインドするオブジェクト,
   *     省略時またはnullを渡した場合は何もバインドは行わない.
   * @returns RL.Observer オブザーバーオブジェクト、登録の解除する際に必要になる.
   */
  addObserver(notificationName, object, callback, boundObject = null) {
    var observer = new $.Observer(notificationName, object, callback, boundObject);
    
    var observerList = this._observerListForNotificationName[notificationName];
    if (! observerList) {
      observerList = this._observerListForNotificationName[notificationName] = [];
    }
    observerList.push(observer);
    
    return observer;
  }
  
  /**
   * Observer の登録解除
   * @param {RL.Observer} observer 
   */
  removeObserver(observer) {
    if (observer._removed == true) {
      return;
    }
    
    var observerList = this._observerListForNotificationName[observer._notificationName];
    if (! observerList) {
      return;
    }
    
    for (var i = 0, len = observerList.length; i < len; i++) {
      if (observer == observerList[i]) {
        observerList.splice(i, 1);
      }
      observer._removed = true;
    }
    
    return null;
  }
  
  /**
   * Notificationオブジェクトによる通知の送信
   * @param {Object} notification
   *  次の構造のオブジェクト
   *  {
   *    name: (String) 通知名
   *    object: (Object) 通知の送信元となるオブジェクト
   *    userinfo: (Object) 通知の追加情報
   *  }
   */
  postNotification(notification) {
    var observerList = this._observerListForNotificationName[notification.name];
    if (! observerList) {
      return;
    }
    for (var i = 0, len = observerList.length; i < len; i++) {
      var observer = observerList[i];
      if (observer._object === null || observer._object === notification.object) {
        observer._callback.call(observer._boundObject, notification);
        if (observer._removed == true) {
          i--;
          len--;
        }
      }
    }
  }
  
  /**
   * 引数から Notification オブジェクトを作成し通知を送信する
   * @param {String} notificationName 通知名
   * @param {Object} object 通知の送信元となるオブジェクト. 省略時 null
   * @param {Object} userinfo 通知の追加情報. 省略時 null
   */
  postNotificationName(notificationName, object = null, userInfo = null) {
    this.postNotification({
      name: notificationName,
      object: object,
      userInfo: userInfo
    });
  }
};

$.NotificationCenter._shared = null;

});
