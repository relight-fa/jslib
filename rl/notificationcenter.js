SL.import("notification.js");
SL.namespace("RL");
SL.code(function($ = RL) {

$.NotificationCenter = class self {
  constructor() {
    this._observerListForNotificationName = {};
  }
  
  /**
   * add observer to center
   */
  addObserver(observer, callback, notificationName, object) {
    var observerList = this._observerListForNotificationName[notificationName];
    if (! observerList) {
      observerList = this._observerListForNotificationName[notificationName] = [];
    }
    
    observerList.push({
      observer: observer,
      callback: callback,
      object: object
    });
  }
  
  /**
   * remove observer from center
   */
  removeObserver(observer, notificationName, object) {
    var observerList = this._observerListForNotificationName[notification.name];
    if (! observerList) {
      return;
    }
    for (var i = 0; i < observerList.length; i++) {
      var observer = observerList[i];
      if (observer.object = notification.object) {
        observerList.splice(i, 1);
        return;
      }
    }
  }
  
  /**
   * Post Notification
   * @param {Object} notification
   */
  postNotification(notification) {
    var observerList = this._observerListForNotificationName[notification.name];
    if (! observerList) {
      return;
    }
    for (var i = 0; i < observerList.length; i++) {
      var observer = observerList[i];
      if (observer.object = notification.object) {
        observer.callback.call(observer, notification);
      }
    }
  }
};

/**
 * default
 */
(function() {
var _default;
Object.defineProperty($.NotificationCenter, "default", {
  configurable: true,
  get: function() {
    _default = new $.NotificationCenter();
    Object.defineProperty($.NotificationCenter, "default", {
      value: _default
    });
    return _default;
  }
});
}());

});