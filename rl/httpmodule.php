<?php
/*
 * 外部URLへのHTTPリクエスト
 * 
 */

set_time_limit(0);

/**
 * HTTPリクエストを行う
 * @param {String} method
 *     HTTPメソッド GET, POST, PUT, DELETE のいずれか
 *     大文字小文字を区別しない. 値が当てはまらない場合はGETメソッドで実行
 * @param {String} url リクエスト先URL
 * @param {Array} header リクエストヘッダー. パラメータ名をキーとする連想配列
 * @param {String | Array | Body} body
 *     リクエストボディ POST, PUT時に送信される
 *     配列 or オブジェクトで渡した場合はhttp_build_queryでクエリ文字列化される
 * @param {Boolean} getAsText
 *     レスポンスをテキストとして受け取るか
 *     trueの場合、内容をUTF-8にエンコードして返す
 */
function request($method, $url, $header = null, $body = null, $getAsText = true) {
  // リクエストボディが配列 or オブジェクトならば
  // クエリ文字列化
  if (is_array($body) || is_object($body)) {
    $body = http_build_query($body);
  }
  
  // メソッド名を小文字化
  if (is_string($method)) {
    $method = strtoupper($method);
  }

  $ch = curl_init();
  // URL 設定
  curl_setopt($ch, CURLOPT_URL, $url);
  // 変数に出力
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  // HTTPメソッドごとの設定
  switch ($method) {
    case "POST": {
      curl_setopt($ch, CURLOPT_POST, 1);
      if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
      }
      break;
    }
    case "PUT": {
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
      if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
      }
      break;
    }
    case "DELETE": {
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
      break;
    }
    default: {
      break;
    }
  }
  // レスポンスヘッダを出力
  curl_setopt($ch, CURLOPT_HEADER, true);
  // リクエストヘッダを出力
  curl_setopt($ch, CURLINFO_HEADER_OUT, true);
  // SSL 認証をスキップ
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  // 30X系リダイレクトに関する設定
  curl_setopt($ch, CURLOPT_AUTOREFERER, true);
  curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
  // リクエストヘッダ
  if($header) {
    $headerArray = array();
    foreach($header as $key => $value) {
      $headerArray[] = $key.": ".$value;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headerArray);
  }
  // Cookie
  //curl_setopt($ch, CURLOPT_COOKIEFILE, "");
  curl_setopt($ch, CURLOPT_COOKIEJAR, "");
  // HTTPリクエスト実行
  $curlResult =  curl_exec($ch);

  // cURL Error Check
  $err = curl_errno($ch);
  if ($err !== CURLE_OK) {
    if ($err == CURLE_OPERATION_TIMEDOUT) {
      $errorMessage = "connection timeout";
    }
    else {
      $errorMessage = "connection error";
    }
    return array("success" => false, "errorMessage" => $errorMessage);
  }
  
  $url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
  $request = curl_getinfo($ch, CURLINFO_HEADER_OUT);
  
  $header = substr($curlResult, 0, $headerSize);
  $body = substr($curlResult, $headerSize);
  
  $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
  
  // テキストとして取得する場合はUTF-8にエンコードする
  /*
  if($getAsText) {
    // charsetを取得してUTF-8へエンコード
    if($contentType !== NULL && preg_match("/charset=([-_a-zA-Z0-9]*)/", $contentType, $matches)) {
      $charset = $matches[1];
      $body = iconv($charset, "utf-8//IGNORE", $body);
    }
  }
  */
  
  curl_close($ch);
  return array(
    "success" => true,
    "url" => $url,
    "contentType" => $contentType,
    "headerSize" => $headerSize,
    "status" => $status,
    "header" => $header,
    "body" => $body,
    "request" => $request
  );
}

function outResult($resultArray) {
  $json = json_encode($resultArray);
  
  $err = json_last_error();
  if($err !== JSON_ERROR_NONE) {
    outResult(array(
      "success" => false,
      "errorMessage" => "failed to encode HTTP result to JSON.",
      "jsonError" => json_last_error_msg()
    ));
    exit;
  }
  
  header("X-RLHTTP-Result: ".rawurlencode($json));
}

/* ==================================================
 * Main
 * ================================================== */
$url = (isset($_GET["u"]) ? $_GET["u"] : "");
$method = (isset($_GET["m"]) ? $_GET["m"] : "GET");
$header = (isset($_GET["h"]) ? $_GET["h"] : null);

$method = strtoupper($method);

if($url === "") {
  outResult(array(
    "success" => false,
    "errorMessage" => "URL parameter is empty."
  ));
  exit;
}

if($header !== null) {
  $header = json_decode($header);
}

$startTime = time();

switch($method) {
  case "P" :
  case "POST" :
    $body = file_get_contents("php://input");
    $httpResult = request("POST", $url, $header, $body);
    break;
  case "PUT" :
    $body = file_get_contents("php://input");
    $httpResult = request("PUT", $url, $header, $body);
    break;
  case "DELETE" :
    $httpResult = request("DELETE", $url, $header);
    break;
  default:
    $httpResult = request("GET", $url, $header);
    break;
}

$finishTime = time();

$httpResult["time"] = $finishTime - $startTime;

if ($httpResult["success"] === false) {
  outResult($httpResult);
  exit;
}

$body = $httpResult["body"];
unset($httpResult["body"]);

header("Content-type: ".$httpResult["contentType"]);

outResult($httpResult);
echo $body;


