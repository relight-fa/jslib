/**
 * asyncmodule_worker.js
 * モジュールの非同期処理化
 * Worker側スクリプト
 * 
 * クエリパラメータ p に対象となるモジュールのパスを入力する.
 */
importScripts("setting.js");
importScripts(RL.SCRIPT_LOADER_PATH);

/*
 * クエリパラメータから指定されたモジュールを読み込む
 */
var modulePath = (function(url) {
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
SL.import(modulePath);

(function() {

/**
 * 文字列から該当するプロパティの値を返す
 * 文字列にドットが含まれていれば、それに従いオブジェクトツリーを辿る
 */
function parseName(propertyPath) {
  var names = propertyPath.split(".");
  var target = self;
  for (var i = 0, len = names.length; i < len; i++) {
    var name = names[i];
    if (name === "") {
      throw new Error("empty name.");
    }
    target = target[name];
    if (typeof target === "undefined") {
      return undefined;
    }
  }
  return target;
}

/**
 * 配列の先頭に指定した値を追加した新たな配列を作成する
 */
function unshiftArray(value, array) {
  var result = new Array(array.length + 1);
  result[0] = value;
  for(var i = 0, len = array.length; i < len; i++) {
    result[i + 1] = array[i];
  }
  return result;
}

/**
 * Clientから関数の呼び出し
 */
function callFunction(data) {
  var func = parseName(data.name);
  if (! func) {
    self.postMessage({
      type: "return",
      error: true,
      message: data.name + " is undefined."
    });
    return;
  }
  var value = func.apply(null, data.args);
  self.postMessage({
    type: "return",
    value: value
  });
}

/**
 * Clientからのオブジェクトの作成
 */
function createObject(data) {
  var classObj = parseName(data.name);
  if (! classObj) {
    self.postMessage({
      type: "return",
      error: true,
      message: data.name + " is undefined."
    });
    return;
  }
  
  var obj
  var args = data.args;
  if (args && args.length > 0) {
    args = unshiftArray(null, args);
    obj = new (classObj.bind.apply(classObj, args))();
  }
  else {
    obj = new classObj();
  }
  
  var objectID = _nextObjectID;
  _nextObjectID++;
  _objects[objectID] = obj;
  
  self.postMessage({
    type: "return",
    value: objectID
  });
}

/**
 * オブジェクトメソッド呼び出し
 */
function callObjectMethod(data) {
  var obj = _objects[data.id];
  if (! obj) {
    self.postMessage({
      type: "return",
      error: true,
      message: "Specified object is not found."
    });
    return;
  }
  var func = obj[data.name];
  if (! func) {
    self.postMessage({
      type: "return",
      error: true,
      message: "Specified method '" + data.name + "' is undefined."
    });
    return;
  }
  var value = func.apply(obj, data.args);
  self.postMessage({
    type: "return",
    value: value
  });
}

var _nextObjectID = 0;
var _objects = [];

self.onmessage = function(e) {
  var data = e.data;
  switch (data.type) {
    // 関数呼び出し
    case "call" : {
      callFunction(data);
      break;
    }
    // プロパティ取得
    case "get" : {
      var value = parseName(data.name);
      self.postMessage({
        type: "return",
        value: value
      });
      break;
    }
    // オブジェクト作成
    case "new" : {
      createObject(data);
      break;
    }
    // オブジェクトメソッド呼び出し
    case "method" : {
      callObjectMethod(data);
      break;
    }
  }
};

}());