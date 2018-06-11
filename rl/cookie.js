/*
 * Cookie 管理クラス
 */
SL.namespace("RL");
SL.import("url.js");

SL.code(function($ = RL) {

/**
 * Cookie
 */
$.Cookie = class self {
  constructor() {
    this.name = "";
    this.value = "";
    
    // パスは末尾にスラッシュを持たせる
    this.path = "";
    
    // ドメインは先頭にドットを持たない
    this.domain = "";
    
    // Cookieの対象ドメインにサブドメインも含めるか.
    // Set-Cookieヘッダでdomain指示子によって対象ドメインが指定された場合
    // そのドメインのサブドメインもCookieの対象となる.
    // 指定されていない場合は、発行元ドメインのみを対象として
    // サブドメインは対象とはならない.
    this.includeSubdomain = false;
    
    // Cookie有効期限のタイムスタンプ
    // 有効期限が指定されていない場合は -1
    this.expires = -1;
    
    // HTTPSプロトコル時のみ渡すか
    this.secure = false;
  }
  
  /**
   * 別Cookieオブジェクトの代入
   */
  set(cookie) {
    this.name = cookie.name;
    this.value = cookie.value;
    this.path = cookie.path;
    this.domain = cookie.domain;
    this.includeSubdomain = cookie.includeSubdomain;
    this.expires = cookie.expires;
    this.secure = cookie.secure;
  }
  
  /**
   * リクエストヘッダに渡す際のフォーマットの文字列に変換
   */
  headerFormat() {
    return this.name + "=" + this.value;
  }
  
  /**
   * Cookieが指定したURLの対象であるか.
   * urlとCookieのドメイン, パス情報から照合する.
   */
  matchFor(url) {
    var components = RL.parseURL(url);
    return this.matchForURLComponents(components);
  }
  /**
   * Cookieが指定したURLの対象であるか.
   * urlとCookieのドメイン, パス情報から照合する.
   * 引数にURLの構成成分を表すオブジェクトを渡す.
   */
  matchForURLComponents(components) {
    // ドメイン
    if (this.includeSubdomain) {
      if (! ("." + components.domain).endsWith("." + this.domain)) {
        return false;
      }
    }
    else {
      if (components.domain !== this.domain) {
        return false;
      }
    }
    // パス
    if (! (components.path).startsWith(this.path)) {
      return false;
    }
    // HTTPS セキュア
    if (this.secure && components.scheme !== "https") {
      return false;
    }
    return true;
  }
  
  /**
   * Set-Cookieヘッダを解釈し, Cookieオブジェクトを作成する.
   * @param origin {String} 発行元のドメイン
   * @param setCookieStr {String} Set-Cookieヘッダの文字列 ("Set-Cookie: "も含む)
   */
  static parseSetCookieHeader(origin, setCookieStr) {
    console.log("origin: " + origin + ", " + setCookieStr);
    var startPos = setCookieStr.indexOf(" ");
    if (startPos < 0) {
      return null;
    }
    
    var cookie = new self();
    
    var params = setCookieStr.substr(startPos + 1).split("; ");
    for (var j = 0; j < params.length; j++) {
      var param = params[j];
      var equalPos = param.indexOf("=");
      var key, value;
      if (equalPos < 0) {
        key = param;
        value = "";
      }
      else {
        key = param.substr(0, equalPos);
        value = param.substr(equalPos + 1);
      }
      
      if (key === "") {
        continue;
      }
      
      // 最初のパラメータはCookieの名前と値を指す
      if (j == 0) {
        cookie.name = key;
        cookie.value = value;
      }
      else {
        key = key.toLowerCase();
        switch (key) {
          case "expires": {
            value = value.replace(/-/g, " ");
            var d = Date.parse(value);
            if (d.toString() !== "Invalid Date") {
              cookie.expires = (Number(d) / 1000) | 0;
            }
            break;
          }
          case "domain": {
            // 生成元と異なるドメインならば invalid
            if (! origin.endsWith(value)) {
              return null;
            }
            cookie.domain = value;
            // remove first dot
            if (cookie.domain.startsWith(".")) {
              cookie.domain = cookie.domain.substr(1);
            }
            cookie.includeSubdomain = true;
            break;
          }
          case "path": {
            cookie.path = value;
            // add "/"
            if (! cookie.path.endsWith("/")) {
              cookie.path += "/";
            }
            break;
          }
          case "secure": {
            cookie.secure = true;
            break;
          }
          case "max-age": {
            cookie.expires = value + (Date.now() / 1000) | 0;
            break;
          }
          case "httponly": {
            break;
          }
        }
      }
      
    } // param loop
    
    if (cookie.domain === "") {
      cookie.domain = origin;
    }
    
    return cookie;
  }
};

/**
 * Cookieの集合の管理
 */
$.CookieContext = class self {
  constructor() {
    this._cookies = [];
    this._domainAndCookieNameToCookie = {};
  }
  
  /**
   * 全Cookieの削除
   */
  clear() {
    this._cookies.length = 0;
    this._domainAndCookieNameToCookie = {};
  }
  
  /**
   * 指定した URL に応じて、リクエストヘッダのCookie項目を作成する.
   * @param {String} url 対象とするURL
   * @return {String} リスクエストヘッダのCookieに渡す値
   */
  makeRequestHeader(url) {
    var str = "";
    var urlComponents = RL.parseURL(url);
    for (var i = 0, len = this._cookies.length; i < len; i++) {
      var cookie = this._cookies[i];
      if (cookie.matchForURLComponents(urlComponents)) {
        if (str !== "") {
          str += "; ";
        }
        str += cookie.headerFormat();
      }
    }
    return str;
  }
  
  /**
   * コンテキストへのクッキーの追加
   * @param {RL.Cookie} cookie
   * @param {Boolean} copy true ならば cookie のコピーをコンテキストに登録.
   *                       false ならば cookie をそのままコンテキストに登録.
   */
  setCookie(cookie, copy = true) {
    var dicKey = cookie.domain + "&" + cookie.name;
    var dst = this._domainAndCookieNameToCookie[dicKey];
    if (typeof dst === "undefined") {
      this._cookies.push(cookie);
      this._domainAndCookieNameToCookie[dicKey] = cookie;
    }
    else {
      dst.set(cookie);
    }
  }
  
  /**
   * レスポンスヘッダのSet-Cookieの値からCookieの更新を行う。
   * @param {String} headerStr レスポンスヘッダの内容
   */
  manageResponseHeader(url, headerStr) {
    var currentTime = Date.now();
    var setCookieLineRegExp = /^Set-Cookie: (.*)$/mig;
    
    var setCookieLines = headerStr.match(setCookieLineRegExp);
    if (setCookieLines === null) {
      return;
    }
    
    var urlComponents = RL.parseURL(url);
    
    for (var i = 0; i < setCookieLines.length; i++) {
      var line = setCookieLines[i];
      var cookie = RL.Cookie.parseSetCookieHeader(urlComponents.domain, line);
      if (cookie === null) {
        continue;
      }
      
      var dicKey = cookie.domain + "&" + cookie.name;
      var dst = this._domainAndCookieNameToCookie[dicKey];
      if (typeof dst === "undefined") {
        this._cookies.push(cookie);
        this._domainAndCookieNameToCookie[dicKey] = cookie;
      }
      else {
        dst.set(cookie);
      }
    }
    
  }
  
};

  
});
