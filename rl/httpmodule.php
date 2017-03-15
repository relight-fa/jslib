<?php
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
function request($method, $url, $header = null, $body = null, $getAsText = false) {
  // リクエストボディが配列 or オブジェクトならば
  // クエリ文字列化
  if (is_array($body) || is_object($body)) {
    $body = http_build_query($body);
  }
  
  // メソッド名を小文字化
  if (is_string($method)) {
    $method = strtolower($method);
  }

  $ch = curl_init();
  // URL 設定
  curl_setopt($ch, CURLOPT_URL, $url);
  // 変数に出力
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  // HTTPメソッドごとの設定
  switch ($method) {
    case "post": {
      curl_setopt($ch, CURLOPT_POST, 1);
      curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
      break;
    }
    case "put": {
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
      curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
      break;
    }
    case "delete": {
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
  
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
  $request = curl_getinfo($ch, CURLINFO_HEADER_OUT);
  
  $header = substr($curlResult, 0, $headerSize);
  $body = substr($curlResult, $headerSize);
  
  // テキストとして取得する場合はUTF-8にエンコードする
  if($getAsText) {
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    // charsetを取得してUTF-8へエンコード
    if($contentType !== NULL && preg_match("/charset=([-_a-zA-Z0-9]*)/", $contentType, $matches)) {
      $charset = $matches[1];
      $body = iconv($charset, "utf-8//IGNORE", $body);
    }
  }
  
  curl_close($ch);
  return array(
    "success" => "true",
    "headerSize" => $headerSize,
    "status" => $status,
    "header" => $header,
    "body" => $body,
    "request" => $request
  );
}

/*
 * curlを用いたHTTP GET
 */
function curl_get($url, $header, $body) {
  return request("get", $url, $header, $body);
  /*
  $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
  $content = substr($curlResult, $headerSize);
  // get charset
  if($contentType !== NULL && preg_match("/charset=([-_a-zA-Z0-9]*)/", $contentType, $matches)) {
    $charset = $matches[1];
    $content = iconv($charset, "utf-8//IGNORE", $content);
  }
  
  return array("headerSize" => $headerSize, "header" => $header, "content" => $content);
  */
}

/*
 * curlを用いたHTTP POST
 */
function curl_post($url, $header, $body) {
  return request("post", $url, $header, $body);
}

/* ==================================================
 * Main
 * ================================================== */
header("Content-type: application/json;");
$url = (isset($_GET["u"]) ? $_GET["u"] : "");
$method = (isset($_GET["m"]) ? $_GET["m"] : "get");
$header = (isset($_GET["h"]) ? $_GET["h"] : null);
$method = strtolower($method);
if($url === "") {
  echo "{}";
  exit;
}

if($header !== null) {
  $header = json_decode($header);
}

$startTime = time();

switch($method) {
  case "p" :
  case "post" :
    $body = file_get_contents("php://input");
    $httpResult = request("post", $url, $header, $body);
    break;
  case "put" :
    $body = file_get_contents("php://input");
    $httpResult = request("put", $url, $header, $body);
    break;
  default:
    $httpResult = request("get", $url, $header);
}

$finishTime = time();

$httpResult["request"] = $header;
$httpResult["time"] = $finishTime - $startTime;

header("Content-type: application/json");

$json = json_encode($httpResult);
$err = json_last_error();
if($err !== JSON_ERROR_NONE) {
  echo '{"success":false,"errorMessage":"failed to encode HTTP result."}';
  exit;
}

echo $json;




