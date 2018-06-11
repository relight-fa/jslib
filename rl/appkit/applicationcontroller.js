/*
 * applicationcontroller.js
 */

SL.namespace("RL");
SL.code(function($ = RL) {

$.ApplicationController = class {};
$.ApplicationController.prototype.applicationDidFinishLaunching = RL.virtualFunc;
$.ApplicationController.prototype.screenSizeDidChange = RL.virtualFunc;
});
