/**
 * notification.js
 */

SL.namespace("RL");
SL.code(function($ = RL) {

$.Notification = class self {
  constructor(notificationName, object = null, userInfo = null) {
    this.name = notificationName;
    this.object = object;
    this.userInfo = userInfo;
  }
};


});

















