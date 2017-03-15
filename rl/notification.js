SL.namespace("RL");
SL.code(function($ = RL) {
"";

$.Notification = class self {
  constructor(notificationName, object, userInfo = null) {
    this._name = notificationName;
    this._object = object;
    this._userInfo = userInfo;
  }
  
  get name() {
    return this._name;
  }
  
  get object() {
    return this._object;
  }
  
  get userInfo() {
    return this._userInfo;
  }
};


});

















