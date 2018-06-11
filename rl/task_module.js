/**
 * Task モジュール側セットアップ
 */

SL.namespace("RL");
SL.code(function($ = RL, SL_GLOBAL) {
  self.onmessage = function(e) {
    let data = e.data;
    switch(data.command) {
      case "available": {
        if (typeof main !== "function") {
        }
        break;
      }
      case "run": {
        try {
          let result = main.apply(null, data.args);
        }
        catch (err) {
          console.log(err);
          let errorMessage = RL.dumpError(err);
          self.postMessage({
            "type": "error",
            "errorMessage": errorMessage,
          });
          self.close();
        }
        break;
      }
    }
  };
});
