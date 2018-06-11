/*
 * appkit/fullscreen_window.js
 */

SL.import("window.js");
SL.import("screen.js");
SL.import("../notification_center.js");

SL.namespace("RL");
SL.code(function($ = RL) {

$.FullscreenWindow = class extends $.Window {
  constructor() {
    var screen = RL.Screen.mainScreen();
    var frame = RL.makeRect(0, 0, screen.width, screen.height);
    
    super(frame);
    
    this._level = RL.WindowLevel.BACKGROUND;
    
    // 通知登録
    RL.NotificationCenter.shared().addObserver(
      "ApplicationDidChangeScreenParameters",
      null,
      this.onChangedScreenParameters,
      this
    );
  }
  
  onChangedScreenParameters(notification) {
    var screen = RL.Screen.mainScreen();
    this.setFrame(RL.makeRect(0, 0, screen.width, screen.height));
  }
};

});
