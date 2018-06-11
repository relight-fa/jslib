/*
 * http.js
 * 
 * HTTP通信関連メソッド
 * HTTP通信にはXMLHttpRequestによる方法と
 * サーバーサイドスクリプトによる方法が選択できる.
 * 
 * サーバーサイドスクリプトは以下の仕様を満たす.
 * [Query Parameters]
 *   m: HTTP通信メソッド(GET, POST, PUT, DELETE). 大文字小文字を問わない
 *   u: 
 *   h: リクエストヘッダ通信先URL
 *      ヘッダパラメータ名をキーとするオブジェクトをJSON形式で渡す.
 *   t: レスポンスの受信形式.
 *      テキストとして受け取る場合はUTF-8にエンコードして返す。
 * [Request Body]
 *   通信対象URLへ渡すリクエストボディ
 * [Response Header]
 *   Content-type: application/json
 * [Response Body]
 *   以下の形式のJSON文字列
 *   {
 *     success: 通信に成功したか.true or false
 *     errorMessage: 通信に失敗した際のエラーメッセージ
 *     header: レスポンスヘッダ
 *     body: レスポンスボディ
 *     request: リクエストヘッダ
 *   }
 */

SL.namespace("RL");
SL.namespace("RL.HTTP");
SL.namespace("RL.HTTP.Async");

SL.import("cookie.js");

SL.code({environments: ["WORKER"], constants: ["DIRECTORY"]},function($ = RL.HTTP) {
  
$._serverHTTPModuleEnabled = true;
$._serverHTTPModulePath = SL.DIRECTORY + "httpmodule.php";

/**
 * HTTP通信にサーバーサイドスクリプトを利用するか
 * 標準でtrue
 * @params {Boolean} trueならばサーバーサイドスクリプトを利用する.
 */
$.enableServerHTTPModule = function(flag) {
  $._serverHTTPModuleEnabled = flag;
};

/**
 * HTTP通信に用いるサーバーサイドスクリプトのパス
 * 標準ではこのJSファイル同ディレクトリの"httpmodule.php"
 */
$.setServerHTTPModulePath = function(path) {
  $._serverHTTPModulePath = path;
}

/* ==================================================
 * 同期処理
 * ================================================== */

/**
 * HTTP通信を行う
 * @param {Object} params 以下の形式のオブジェクト
 * {
 *   url (String): リクエスト先URL
 *   method (String, optional): HTTPメソッド. get or post or put or delete.
 *                              省略した場合は get
 *   query (Object, optional): クエリ文字列にわたすパラメータオブジェクト.
 *                             オブジェクトのキーをパラメータ名とする.
 *   header (Object, optional): リクエストヘッダを表すオブジェクト.
 *                              オブジェクトのキーをパラメータ名とする.
 *   cookieContext (RL.CookieContext, optional): HTTP通信に用いるCookie Context.
 *   body (String, optional): POST時のリクエストボディ
 *   type {String, optional}: データの取得形式. 省略時は text
 *                            text: 文字列
 *                            arraybuffer: ArrayBufferオブジェクト
 *                            json: JSONエンコードされた文字列を解析して作成されたオブジェクト
 *                            blob: Blob オブジェクト
 * }
 * 
 * @returns {Object} 以下の形式のオブジェクト
 * {
 *   success (Boolean): 通信に成功したか.
 *   errorMessage (String): エラーメッセージ
 *   status (Number): HTTP ステータス
 *   header (String): レスポンスヘッダ
 *   body (String): レスポンスボディ
 * }
 */
$.request = function(params) {
  var func;
  if ($._serverHTTPModuleEnabled) {
    func = $._requestWithServerModule;
  }
  else {
    func = $._requestWithXMLHttpRequest;
  }
  return func(params);
};

/**
 * GETメソッドによるHTTP通信
 */
$.get = function(url, query, header, cookieContext) {
  return $.request({
    method: "GET",
    url: url,
    query: query,
    header: header,
    cookieContext: cookieContext
  });
};

/**
 * POSTメソッドによるHTTP通信
 */
$.post = function(url, query, header, body, cookieContext) {
  return $.request({
    method: "POST",
    url: url,
    query: query,
    header: header,
    cookieContext: cookieContext,
    body: body
  });
};

/**
 * PUTメソッドによるHTTP通信
 */
$.put = function(url, query, header, body, cookieContext) {
  return $.request({
    method: "PUT",
    url: url,
    query: query,
    header: header,
    cookieContext: cookieContext,
    body: body
  });
};

/**
 * DELETEメソッドによるHTTP通信
 */
$.delete = function(url, query, header, body, cookieContext) {
  return $.request({
    method: "DELETE",
    url: url,
    query: query,
    header: header,
    cookieContext: cookieContext
  });
};

/**
 * サーバサイドモジュールによるHTTP通信
 * @param {Object} params 以下の形式のオブジェクト
 * {
 *   url: リクエスト先URL
 *   method (String, optional): HTTPメソッド. GET, POST, PUT, DELETE. 省略した場合は GET
 *   query (Object, optional): クエリ文字列にわたすパラメータオブジェクト.
 *                             オブジェクトのキーをパラメータ名とする.
 *   header (Object, optional): リクエストヘッダを表すオブジェクト.
 *                              オブジェクトのキーをパラメータ名とする.
 *   cookieContext (RL.CookieContext, optional): HTTP通信に用いるCookie Context.
 *   body (String | Object | Blob, optional): リクエストボディ
 * }
 * @returns {Object} 以下の形式のオブジェクト
 * {
 *   success (Boolean): 通信に成功したか.
 *   errorMessage (String): エラーメッセージ
 *   status (Number): HTTP ステータス
 *   header (String): レスポンスヘッダ
 *   body (String): レスポンスボディ
 * }
 */
$._requestWithServerModule = function(params, async) {
  var url = params.url;
  // メソッド名の正規化
  var method = params.method || "GET";
  method = method.toUpperCase();
  // クエリ文字列処理
  var query = params.query;
  if (query) {
    var queryString = "";
    for (var key in query) {
      queryString += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(query[key]);
    }
    if (queryString) {
      if (url.indexOf("?") == -1) {
        url = url + "?" + queryString.substr(1);
      }
      else {
        url = url + queryString;
      }
    }
  }
  
  // モジュール呼び出しURL作成
  url = $._serverHTTPModulePath + "?m=" + encodeURIComponent(method) + "&u=" + encodeURIComponent(url);
  // ヘッダ処理
  var header;
  if (params.header) {
    header = params.header
  }
  if (params.cookieContext) {
    header = header || {};
    if (header.Cookie) {
     header.Cookie += "; " + params.cookieContext.makeRequestHeader(params.url);
    }
    else {
      header.Cookie = params.cookieContext.makeRequestHeader(params.url);
    }
  }
  if (header) {
    url += "&h=" + encodeURIComponent(JSON.stringify(header));
  }
  // データタイプ
  var type;
  switch (params.type) {
    case "json":
    case "arraybuffer":
    case "blob":
      type = params.type;
      break;
    default:
      type = "text";
  }
  
  // データボディ
  /*
  if (typeof params.body === "object") {
  }
  */
  
  var xhr = new XMLHttpRequest();
  xhr.responseType = type;
  
  // send request
  if (method == "POST" || method == "PUT") {
    xhr.open("POST" , url, false);
    xhr.send(params.body);
  }
  else {
    xhr.open("GET" , url, false);
    xhr.send(params.body);
  }
  
  if (xhr.status !== 200) {
    return {
      success: false,
      errorMessage: "Cannot connect to the HTTP module. status: " + xhr.status,
    };
  }
  
  var httpResult;
  var response;
  try {
    httpResult = xhr.getResponseHeader("X-RLHTTP-Result");
    httpResult = JSON.parse(decodeURIComponent(httpResult));
  }
  catch (e) {
    console.log(e);
    console.log(xhr.getResponseHeader("X-RLHTTP-Result"));
    throw(e);
  }
  response = xhr.response;
  
  // success
  if (httpResult.success) {
    httpResult.body = response;
    
    if (params.cookieContext) {
      params.cookieContext.manageResponseHeader(params.url, httpResult.header);
    }
  }
  // failed
  else {
    httpResult.body = null;
  }
  return httpResult;
}

/**
 * XMLHttpRequestによるHTTP通信
 * @param {Object} params 以下の形式のオブジェクト
 * {
 *   url: リクエスト先URL
 *   method: (optional) HTTPメソッド. get or post or put or delete. 省略した場合は get
 *   query: (optional) クエリ文字列にわたすパラメータオブジェクト.
 *                     オブジェクトのキーをパラメータ名とする.
 *   header: (optional) リクエストヘッダを表すオブジェクト.
 *                      オブジェクトのキーをパラメータ名とする.
 *   cookieContext (RL.CookieContext, optional): HTTP通信に用いるCookie Context.
 *   body: (optional) POST時のリクエストボディ
 * }
 */
$._requestWithXMLHttpRequest = function(params, async) {
  // メソッド名の正規化
  var method = params.method || "GET";
  method = method.toUpperCase();
  // クエリ文字列処理
  var query = params.query;
  if (query) {
    var queryString = "";
    for (var key in query) {
      queryString += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(query[key]);
    }
    if (queryString) {
      if (url.indexOf("?") == -1) {
        url = url + "?" + queryString.substr(1);
      }
      else {
        url = url + queryString;
      }
    }
  }
  
  var xhr = new XMLHttpRequest();
  var result = {};
  switch (method) {
    case "POST": {
      xhr.open("POST" , url, false);
      xhr.send(params.body);
      break;
    }
    case "PUT": {
      xhr.open("PUT" , url, false);
      xhr.send(params.body);
      break;
    }
    case "DELETE": {
      xhr.open("DELETE" , url, false);
      xhr.send(null);
      break;
    }
    default: {
      xhr.open("GET" , url, false);
      xhr.send(null);
      break;
    }
  }
  
  // success
  if (xhr.response !== null) {
    result.success = true;
    result.body = xhr.response;
    result.header = xhr.getAllResponseHeaders();
    result.status = xhr.status;
    result.statusText = xhr.statusText;
  }
  // failed
  else {
    result.success = false;
    result.body = "";
    result.header = null;
    result.status = 0;
    result.statusText = "";
  }
  
  return result;
}

/* ==================================================
 * 非同期
 * ================================================== */

/**
 * HTTP通信を行う
 * @param {Object} params 以下の形式のオブジェクト
 * {
 *   url (String): リクエスト先URL
 *   method (String, optional): HTTPメソッド. GET, POST, PUT, DELETE. 省略した場合は get
 *   query (Object, optional): クエリ文字列にわたすパラメータオブジェクト.
 *                             オブジェクトのキーをパラメータ名とする.
 *   header (Object, optional): リクエストヘッダを表すオブジェクト.
 *                              オブジェクトのキーをパラメータ名とする.
 *   body (String, optional): POST時のリクエストボディ
 * }
 * 
 * @returns {Object} 以下の形式のオブジェクト
 * {
 *   success (Boolean): 通信に成功したか.
 *   errorMessage (String): エラーメッセージ
 *   status (Number): HTTP ステータス
 *   header (String): レスポンスヘッダ
 *   body (String): レスポンスボディ
 * }
 */
$.Async.request = function(params) {
  var func;
  if ($._serverHTTPModuleEnabled) {
    func = $.Async._requestWithServerModule;
  }
  else {
    func = $.Async._requestWithXMLHttpRequest;
  }
  return func(params);
};

/**
 * GETメソッドによるHTTP通信
 */
$.Async.get = function(url, query, header) {
  return $.Async.request({
    method: "GET",
    url: url,
    query: query,
    header: header
  });
};

/**
 * POSTメソッドによるHTTP通信
 */
$.Async.post = function(url, query, header, body) {
  return $.Async.request({
    method: "POST",
    url: url,
    query: query,
    header: header,
    body: body
  });
};

/**
 * サーバサイドモジュールによるHTTP通信
 * @param {Object} params 以下の形式のオブジェクト
 * {
 *   url: リクエスト先URL
 *   method: (String, optional) HTTPメソッド. GET, POST, PUT, DELETE. 省略した場合は GET
 *   query: (Object, optional) クエリ文字列にわたすパラメータオブジェクト. オブジェクトのキーをパラメータ名とする.
 *   header: (Object, optional) リクエストヘッダを表すオブジェクト. オブジェクトのキーをパラメータ名とする.
 *   body: (String, optional) POST時のリクエストボディ
 * }
 * @returns {Object} 以下の形式のオブジェクト
 * {
 *   success: (Boolean) 通信に成功したか.
 *   errorMessage: (String) エラーメッセージ
 *   status: (Number) HTTP ステータス
 *   header: (String) レスポンスヘッダ
 *   body: (String) レスポンスボディ
 * }
 */
$.Async._requestWithServerModule = function(params) {
  return new Promise(resolve, reject, function() {
    var url = params.url;
    // メソッド名の正規化
    var method = params.method || "GET";
    method = method.toUpperCase();
    // クエリ文字列処理
    var query = params.query;
    if (query) {
      var queryString = "";
      for (var key in query) {
        queryString += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(query[key]);
      }
      if (queryString) {
        if (url.indexOf("?") == -1) {
          url = url + "?" + queryString.substr(1);
        }
        else {
          url = url + queryString;
        }
      }
    }
    
    // モジュール呼び出しURL作成
    url = $._serverHTTPModulePath + "?m=" + encodeURIComponent(method) + "&u=" + encodeURIComponent(url);
    // ヘッダ処理
    if (params.header) {
      url += "&h=" + encodeURIComponent(JSON.stringify(params.header));
    }
    
    var xhr = new XMLHttpRequest();
    var result = {};
    xhr.responseType = "json";
    
    xhr.onload = function() {
      var response = xhr.response;
      // success
      if (response !== null && xhr.status === 200 && response.header) {
        result.success = true;
        result.body = response.body;
        result.header = response.header;
        
        var responseStatus = getHTTPStatusFromResponseHeaders(result.header);
        
        result.status = responseStatus.status;
        result.statusText = responseStatus.statusText;
      }
      // failed
      else {
        result.success = false;
        result.body = "";
        result.header = null;
        result.status = 0;
        result.statusText = "";
      }
      resolve(result);
    };
    // failed
    xhr.onerror = function() {
      result.success = false;
      result.body = "";
      result.header = null;
      result.status = 0;
      result.statusText = "";
      resolve(result);
    };
    
    // send request
    if (method == "POST" || method == "PUT") {
      xhr.open("POST" , url);
      xhr.send(params.body);
    }
    else {
      xhr.open("GET" , url);
      xhr.send(params.body);
    }
  });
}

/**
 * XMLHttpRequestによるHTTP通信
 * @param {Object} params 以下の形式のオブジェクト
 * {
 *   url: リクエスト先URL
 *   method: (String, optional) HTTPメソッド. GET, POST, PUT, DELETE. 省略した場合は GET
 *   query: (optional) クエリ文字列にわたすパラメータオブジェクト. オブジェクトのキーをパラメータ名とする.
 *   header: (optional) リクエストヘッダを表すオブジェクト. オブジェクトのキーをパラメータ名とする.
 *   body: (optional) POST時のリクエストボディ
 * }
 */
$.Async._requestWithXMLHttpRequest = function(params) {
  return new Promise(resolve, reject, function() {
    // メソッド名の正規化
    var method = params.method || "GET";
    method = method.toUpperCase();
    // クエリ文字列処理
    var query = params.query;
    if (query) {
      var queryString = "";
      for (var key in query) {
        queryString += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(query[key]);
      }
      if (queryString) {
        if (url.indexOf("?") == -1) {
          url = url + "?" + queryString.substr(1);
        }
        else {
          url = url + queryString;
        }
      }
    }
    
    
    // success
    xhr.onload = function() {
      result.success = true;
      result.body = xhr.response;
      result.header = xhr.getAllResponseHeaders();
      result.status = xhr.status;
      result.statusText = xhr.statusText;
      resolve(result);
    };
    // failed
    xhr.onerror = function() {
      result.success = false;
      result.body = "";
      result.header = null;
      result.status = 0;
      result.statusText = "";
      resolve(result);
    }
    
    var xhr = new XMLHttpRequest();
    var result = {};
    switch (method) {
      case "POST": {
        xhr.open("POST" , url);
        xhr.send(params.body);
        break;
      }
      case "PUT": {
        xhr.open("PUT" , url);
        xhr.send(params.body);
        break;
      }
      case "DELETE": {
        xhr.open("DELETE" , url);
        xhr.send();
        break;
      }
      default: {
        xhr.open("GET" , url);
        xhr.send();
        break;
      }
    }
  });
}

/* ==================================================
 * Helper Functions
 * ================================================== */
/**
 * レスポンスヘッダからHTTPステータスコードを抽出する.
 * 複数のレスポンスヘッダが連なっている場合は、最後のヘッダが対象となる.
 * @param {String} header
 * @returns {Object} 以下の形式のオブジェクト
 * {
 *  status: (Number) ステータスコード
 *  statusText: (String) 文字列を含んだステータスコード
 * }
 */
function getHTTPStatusFromResponseHeaders(header) {
  // 最後のヘッダの開始位置
  var lastHeaderBegin = header.lastIndexOf("\r\n\r\n", header.length - 5);
  if (lastHeaderBegin >= 0) {
    header = header.substr(lastHeaderBegin + 4);
  }
  
  var responseStatus = header.match(/^([^\s]+) ([0-9]+) ([^\s]+)/);
  if (! responseStatus) {
    return {
      status: 0,
      statusText: ""
    }
  }
  
  return {
    status: Number(responseStatus[2]),
    statusText: responseStatus[2] + " " + responseStatus[3]
  }
}

}); // End SL.code;
