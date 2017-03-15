
importScripts("setting.js");
importScripts(RL.SCRIPT_LOADER_PATH);
SL.import("error.js");

// get script path
var scriptPath = (function(url) {
  var hashIndex = url.lastIndexOf("#");
  if(hashIndex !== -1) {
    url = url.substr(0, hashIndex);
  }
  var queryIndex = url.lastIndexOf("?");
  queryString = url.substr(queryIndex + 1);
  var matches = queryString.match(/p=([^&]*)/);
  if(! matches) {
    return "";
  }
  else {
    return decodeURIComponent(matches[1]);
  }
} (self.location.href));

// load script
try {
  importScripts(scriptPath);
}
catch (e) {
  self.postMessage({
    type: "error",
    errorMessage: "Failed to load script: " + scriptPath + "\n" + e.toString()
  });
  self.close();
}

// function main is not defined
if (typeof main !== "function") {
  self.postMessage({
    type: "error",
    errorMessage: "main function is not defined",
  });
  self.close();
}

self.onmessage = function(e) {
  let data = e.data;
  if(data.type === "exec") {
    try {
      let result = main(data.arg);
      self.postMessage({
        "type": "result",
        "result": result
      });
      self.close();
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
  }
}