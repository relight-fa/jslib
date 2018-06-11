SL.namespace("RL");

SL.import("debug.js");

SL.code(function($ = RL) {

$.dumpError = function(err) {
  // Firefox
  if(err.message && err.fileName && err.lineNumber && err.columnNumber) {
    var fileName = err.fileName;
    var idx = fileName.indexOf("?");
    if (idx !== -1) {
      fileName = fileName.substr(0, idx);
    }
    return err.message + "\n" + fileName + ": " + err.lineNumber + "[" + err.columnNumber + "]";
  }
  // Chrome
  else if(err.message && err.stack) {
    return err.message + "\n" + err.stack;
  }
  // Other
  return RL.dump(err);
}



}); // End SL.code;
