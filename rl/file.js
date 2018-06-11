/**
 * file.js
 * 
 * 主に同一サイト上のファイル、またはユーザーローカルファイルを読み込むためのモジュール.
 * 外部サイトとのHTTP通信が目的ならばhttp.jsの方を用いる.
 */
SL.namespace("RL.File");
SL.namespace("RL.File.Async");

SL.code(function($ = RL.File) {

/**
 * ブラウザ機能によるダウンロードダイアログを表示する. (window only)
 * @param {String} url ダウンロードするファイルのURL
 * @param {String} fileName 保存時のファイル名
 */
var _downloadElem;
$.download = function(url, fileName) {
  if(! _downloadElem) {
    _downloadElem = document.createElement("a");
    _downloadElem.style.display = "none";
    document.body.appendChild(_downloadElem);
  }
  _downloadElem.href = url;
  _downloadElem.target = "_blank";
  _downloadElem.download = fileName;
  
  _downloadElem.click();
}

/**
 * Blobオブジェクトのダウンロードダイアログを表示する. (window only)
 */
$.downloadBlob = function(blob, fileName) {
  var objURL = window.URL.createObjectURL(blob);
  $.download(objURL, fileName);
}


/**
 * オブジェクトをJSONとしてダウンロード. (window only)
 */
$.downloadAsJSON = function(obj, fileName) {
  var jsonStr = JSON.stringify(obj);
  var blob = new Blob([jsonStr], {type: "application/json"});
  $.downloadBlob(blob, fileName);
}

/**
 * ブラウザ機能によるファイル選択ダイアログを表示する (window only)
 */
var _selectElem;
$.Async.select = function() {
  if(! _selectElem) {
    _selectElem = document.createElement("input");
    _selectElem.type = "file"
      _selectElem.style.display = "none";
    document.body.appendChild(_selectElem);
  }
  
  return new Promise(function(resolve, reject){
    _selectElem.onchange = function() {
      resolve(_selectElem.files);
    }
    _selectElem.click();
  });
}

/* ==================================================
 * 同期
 * ================================================== */
/**
 * Blobオブジェクトを読み込み、指定された形式で返す (Worker only)
 * @param {Blob} url 読み込むBlobオブジェクト
 * @param {String} type ファイルを読み込む形式
 *                      "text": 文字列
 *                      "json": JSON文字列としてパースしたオブジェクト
 *                      "arraybuffer", "binary": ArrayBuffer
 * @return {String | ArrayBuffer | Object | null} 読み込んだデータ, 読み込みに失敗した場合はnull
 */
$.readFromBlob = function(blob, type) {
  switch (type) {
    case "arraybuffer":
    case "binary":
      return $._readFromBlobAsBinary(blob);
    case "json":
      return $._readFromBlobAsJSON(blob);
    default:
      return $._readFromBlobAsText(blob);
  }
};

/*
 * ページクライアント: createObjectURLを利用
 */
if(typeof window !== "undefined" && SL.global == window) {
}
/*
 * WebWorker: FileReaderSyncを利用
 */
else if(typeof self !== "undefined" && SL.global == self) {
  // テキストとしてBlob読み込み
  $._readFromBlobAsText = function(blob, encoding) {
    var reader = new FileReaderSync();
    try {
      var result = reader.readAsText(blob, encoding);
      return result
    }
    catch (e) {
      throw new Error(e);
    }
  }
  // JSONとしてBlob読み込み
  $._readFromBlobAsJSON = function(blob) {
    var reader = new FileReaderSync();
    try {
      var result = reader.readAsText(blob);
      result = JSON.parse(result);
      return result
    }
    catch (e) {
      throw new Error(e);
    }
  }
  // ArrayBufferとしてBlob読み込み
  $._readFromBlobAsBinary = function(blob) {
    var reader = new FileReaderSync();
    try {
      var result = reader.readAsArrayBuffer(blob);
      return result
    }
    catch (e) {
      throw new Error(e);
    }
  }
}

/**
 * 指定したパスのファイルを読み込み、指定された形式で返す.
 * @param {String} path 読み込むファイルのパス
 * @param {String} type ファイルを読み込む形式
 *                      "text": 文字列
 *                      "json": JSON文字列としてパースしたオブジェクト
 *                      "arraybuffer", "binary": ArrayBuffer
 * @return {String | ArrayBuffer | Object | null} 読み込んだデータ, 読み込みに失敗した場合はnull
 */
$.readFromPath = function(path, type) {
  var responseType;
  switch(type) {
    case "arraybuffer":
    case "binary":
      responseType = "arraybuffer";
      break;
    case "json":
      responseType = "json";
      break;
    default:
      responseType = "text"
  }
  
  var result = {};
  var xhr = new XMLHttpRequest();
  xhr.responseType = responseType;
  
  xhr.open("GET" , path, false);
  xhr.send(null);
  
  if (xhr.status !== 200) {
    return null;
  }
  
  return xhr.response;
};

/* ==================================================
 * 非同期
 * ================================================== */
/**
 * Blobオブジェクトを読み込み、指定された形式で返す
 * (Promise)
 * @param {Blob} url 読み込むBlobオブジェクト
 * @param {String} type ファイルを読み込む形式
 *                      "text": 文字列
 *                      "json": JSON文字列としてパースしたオブジェクト
 *                      "arraybuffer", "binary": ArrayBuffer
 * @return {String | ArrayBuffer | Object | null} 読み込んだデータ, 読み込みに失敗した場合はnull
 */
$.Async.readFromBlob = function(blob, type) {
  switch (type) {
    case "arraybuffer":
    case "binary":
      return $.Async._readFromBlobAsBinary(blob);
    case "json":
      return $.Async._readFromBlobAsJSON(blob);
    default :
      return $.Async._readFromBlobAsText(blob);
  }
};
// テキストとしてBlob読み込み
$.Async._readFromBlobAsText = function(blob) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      resolve(reader.result);
    };
    reader.onerror = function(e) {
      resolve(null);
    };
    reader.readAsText(blob);
  });
}
//JSONとしてBlob読み込み
$.Async._readFromBlobAsJSON = function(blob) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var result = JSON.parse(reader.result);
        resolve(result);
        return;
      }
      catch (e) {
        resolve(null);
        return;
      }
    };
    reader.onerror = function(e) {
      resolve(null);
    };
    reader.readAsText(blob);
  });
}
//ArrayBufferとしてBlob読み込み
$.Async._readFromBlobAsBinary = function(blob) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      resolve(reader.result);
    };
    reader.onerror = function(e) {
      resolve(null);
    };
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * 指定したパスのファイルを読み込み、指定された形式で返す.
 * (Promise)
 * @param {String} path 読み込むファイルのパス
 * @param {String} type ファイルを読み込む形式. デフォルトは"text"
 *                      "text": 文字列
 *                      "json": JSON文字列としてパースされたオブジェクト
 *                      "arraybuffer", "binary": ArrayBuffer
 * @return {String | ArrayBuffer | Object | null} 読み込んだデータ, 読み込みに失敗した場合はnull
 */
$.Async.readFromPath = function(path, type) {
  var responseType;
  switch(type) {
    case "arraybuffer":
    case "binary":
      responseType = "arraybuffer";
      break;
    case "json":
      responseType = "json";
      break;
    default:
      responseType = "text"
  }
  
  
  return new Promise(function(resolve, reject) {
    var result = {};
    var xhr = new XMLHttpRequest();
    xhr.responseType = responseType;
    xhr.onload = function(e) {
      console.log(xhr.status);
    };
    
    xhr.onerror = function(e) {
      resolve(null);
    };
    
    xhr.open("GET" , path);
    xhr.send(null);
  });
};


}); // End SL.code;
