/*
 * コンソールアプリケーション
 */

SL.import("/js/rl/url.js");
SL.import("/js/rl/exec.js");

SL.namespace("RL");
SL.namespace("RL.Console");
SL.code(function($ = RL, SL_GLOBAL) {

if (SL_GLOBAL !== window) {
  return;
}

var _consoleElem;
var _inputLineElem;
var _inputElem;

var _showMessageDate = true;

var _currentPath;

// ExportされたファイルのobjectURLリスト
// clean時にrevokeObjectURLで明示的に一括して解放するために保持する.
var _objectURLs = [];

/**
 * Workerからのメッセージ受信処理
 */
var _workerDelegate = function(e) {
  var data = e.data;
  switch (data.command) {
    case "print": {
      $.print(data.message, data.className);
      break;
    }
    case "export": {
      $.export(data.name, data.data);
      break;
    }
  }
};

/**
 * Date型の値をコンソール表示用の日付書式の文字列に変換する
 */
function makeDateStr(time) {
  var dateStr = "";
  if (typeof t === "undefined") {
    time = new Date();
  }
  if (_showMessageDate === true) {
    var hours = time.getHours();
    if (hours < 10) {
      hours = "0" + hours;
    }
    var minutes = time.getMinutes();
    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    var seconds = time.getSeconds();
    if (seconds < 10) {
      seconds = "0" + seconds;
    }
    
    dateStr = "[" + hours + ":" + minutes + ":" + seconds + "] ";
  }
  return dateStr;
}

/**
 * コンソールへの文字列表示
 * @param message 表示する文字列
 * @param className 文字列のスタイルのクラス名
 */
$.print = function(message, className) {
  var dateStr = makeDateStr();
  
  var lineElem = document.createElement("div");
  lineElem.className = "line";
  if (typeof className !== "undefined") {
    lineElem.className += " " + className;
  }
  
  var dateElem = document.createElement("div");
  dateElem.className = "date";
  dateElem.innerText = dateStr;
  lineElem.appendChild(dateElem);
  var messageElem = document.createElement("div");
  messageElem.className = "message";
  messageElem.innerText = message;
  lineElem.appendChild(messageElem);
  
  _consoleElem.insertBefore(lineElem, _inputLineElem);

  window.scrollTo(0, document.body.scrollHeight);
}

/**
 * ファイルの出力
 * @param name ファイル名
 * @param data ファイルのBlobデータ
 */
$.export = function(name, data) {
  var objectURL = window.URL.createObjectURL(data);
  _objectURLs.push(objectURL);
  var dateStr = makeDateStr();
  
  var lineElem = document.createElement("div");
  lineElem.className = "line";
  var dateElem = document.createElement("div");
  dateElem.className = "date";
  dateElem.innerText = dateStr;
  lineElem.appendChild(dateElem);
  
  var messageElem = document.createElement("div");
  messageElem.className = "message";
  
  var linkElem = document.createElement("a");
  linkElem.href = objectURL;
  linkElem.download = name;
  linkElem.target = "_blank";
  
  var buttonElem = document.createElement("div");
  buttonElem.className = "download";
  buttonElem.innerText = name;
  
  linkElem.appendChild(buttonElem);
  messageElem.appendChild(linkElem);
  lineElem.appendChild(messageElem);
  
  _consoleElem.insertBefore(lineElem, _inputLineElem);

  window.scrollTo(0, document.body.scrollHeight);
}

/**
 * スクリプトの実行
 * @param scriptPath 実行するスクリプトのパス
 * @param args 引数の配列
 */
$.run = function(scriptPath, args) {
  _inputElem.disabled = true;
  startRunningAnimation();
  return RL.Async.exec(scriptPath, args, _workerDelegate)
  .then(function(result) {
    stopRunningAnimation();
    _inputElem.disabled = false;
    _inputElem.focus();
    return result;
  })
  .catch(function(e) {
    if (e.type == "load error") {
      $.print("スクリプトのロードに失敗しました.", "error");
    }
    else if (e.type == "exec timeout") {
      $.print("スクリプトの起動がタイムアウトしました.", "error");
    }
    else {
      $.print(e.message, "error");
    }
    stopRunningAnimation();
    _inputElem.disabled = false;
    _inputElem.focus();
  });
}

/* スクリプト実行中のアニメーション処理 */
var runningAnimationInterval;
var runningAnimationPhase = 0;
var startRunningAnimation = function() {
  runningAnimationPhase = 0;
  runningAnimationInterval = setInterval(runningAnimation, 1000);
};
var runningAnimation = function() {
  runningAnimationPhase = (runningAnimationPhase + 1) % 5;
  var str = "";
  for (var i = 0; i < runningAnimationPhase; i++) {
    str += ".";
  }
  _inputElem.value = str;
}
var stopRunningAnimation = function() {
  clearInterval(runningAnimationInterval);
  _inputElem.value = "";
}

// スタイル定義
$.Console._applyStyle = function() {
  var styleElem = document.createElement("style");
  styleElem.innerText = "html{margin:0;padding:0;background:#222;padding:10px}body{margin:0;padding:0}.rl_console{background:#222;color:#FFF;margin:0;padding:0;display:table;font-family:'Source Han Code JP';font-size:14px;line-height:22px;width:100%}.rl_console > *{display:table-row}.rl_console > * > *{display:table-cell;white-space:pre}.rl_console > * > .date{padding:0 8px 0 0;text-align:right;width:100px;color:#C6C6C6}.rl_console > .line.error > .message{color:#F66}.rl_console > .line.command > .message{color:#A5E2Af}.rl_console > .line.quote > .message{color:#CCF}.rl_console .input input{margin:0;padding:0;border:none;background-color:#3E3E3E;color:#FFF;width:100%;font-family:'Source Han Code JP';font-size:14px;height:22px;outline:0}.rl_console .input input[disabled]{background-color:#303030}.rl_console .download{display:inline-block;border-radius:4px;border:1px solid #FFF;color:#FFF;padding:4px 20px;margin:4px 0}.rl_console .download:hover{background-color:#888;color:#FFF}.rl_console .download:active{background-color:#444;color:#FFF}";
  document.head.appendChild(styleElem);
};

// 画面構築
$.Console._buildBody = function() {
  _consoleElem = document.createElement("div");
  _consoleElem.className = "rl_console";
  
  _inputLineElem = document.createElement("div");
  _inputLineElem.className = "input_line";
  
  var leftElem = document.createElement("div");
  leftElem.className = "date";
  leftElem.innerText = ">";
  
  var rightElem = document.createElement("div");
  rightElem.className = "input";
  
  _inputElem = document.createElement("input");
  _inputElem.type = "text";
  
  _consoleElem.appendChild(_inputLineElem);
  _inputLineElem.appendChild(leftElem);
  _inputLineElem.appendChild(rightElem);
  rightElem.appendChild(_inputElem);
  
  document.body.appendChild(_consoleElem);
};

// コマンド定義
var _commands = {
  // スクリプト実行
  "run": function(argStr) {
    var path;
    var idx = argStr.indexOf(" ");
    if (idx === -1) {
      path = argStr;
      argStr = "";
    }
    else {
      path = argStr.substr(0, idx);
      argStr = argStr.substr(idx + 1);
    }
    
    path = RL.getURLFromRelativeURL(_currentPath, path);
    
    var args = argStr.split(" ");

    $.run(path, args);
  },
  
  // 画面消去
  "clean": function() {
    var lines = _consoleElem.querySelectorAll(".line");
    for (var i = 0, len = lines.length; i < len; i++) {
      _consoleElem.removeChild(lines[i]);
    }
    
    var objectURL;
    while (objectURL = _objectURLs.pop()) {
      window.URL.revokeObjectURL(objectURL);
    }
  },
  
  // 現在のパスの表示
  "path": function() {
    $.print(_currentPath);
  }
};

  var WHITE_CHARACTERS = " \t\n\r";
/**
 * コマンド入力から引数リストの作成
 */
function parseArguments(argStr) {
  var args = [];
  var i = 0, len = argStr.length;
  
  while ( i < len) {
    var c = argStr[i];
    // 空白スキップ
    if (WHITE_CHARACTERS.indexOf(c) >= 0) {
      i++;
      continue;
    }
    
    var left, right;
    // ダブルクオテーション
    if (c == "\"") {
      left = i + 1
      right = argStr.indexOf("\"", left);
      if (right < 0) {
        right = len;
      }
      args.push(argStr.substr(left, right - left));
      i = right + 1;
    }
    // 非空白文字
    else {
      left = i;
      i++;
      // 次の空白検索
      while ( i < len && WHITE_CHARACTERS.indexOf(argStr[i]) == -1) {
        i++;
      }
      args.push(argStr.substr(left, i - left));
    }
  }
  return args;
}

/*
 * コマンド入力イベント処理
 */
function onEnterField() {
  var text = _inputElem.value;
  _inputElem.value = "";
  
  $.print(text, "command");
  
  var command, argStr;
  var idx = text.indexOf(" ");
  if (idx === -1) {
    command = text;
    argStr = "";
  }
  else {
    command = text.substr(0, idx);
    argStr = text.substr(idx + 1);
  }
  
  // 標準コマンドの検索
  var func = _commands[command];
  if (typeof func === "function") {
    func(argStr);
    return;
  }
  // 標準コマンドに存在しない場合は, スクリプト名と解釈して実行
  else {
    if (! command.endsWith(".js")) {
      command += ".js";
    }
    _commands.run(command + " " + argStr);
    return;
  }
}

/**
 * コンソール起動処理
 */
$.Console._setup = function() {
  $.Console._applyStyle();
  $.Console._buildBody();
  
  var urlinfo = RL.parseURL(location.href);
  _currentPath = RL.getDirectory(urlinfo.path);
  if (_currentPath == "") {
    _currentPath = "/";
  }
  
  _inputElem.addEventListener("keydown", function(e) {
    var keyCode = e.keyCode;
    if (keyCode === 13) {
      onEnterField();
      return false;
    }
  }, false);
  _inputElem.focus();
}

$.getCurrentPath = function() {
  return _currentPath;
};

$.Console._setup();

});
