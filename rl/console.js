SL.namespace("RL");
SL.code(function($ = RL, SL_WINDOW, SL_WORKER) {

if (SL_WINDOW) {
  $.print = function(message) {
    console.log(message);
  }
  
  $.export = function() {
  }
}
else if (SL_WORKER) {
  $.print = function(message) {
    self.postMessage({
      type: "print",
      message: message
    });
  }
  
  $.export = function(name, data) {
    self.postMessage({
      type: "export",
      name: name,
      data: data
    });
  }
}

});