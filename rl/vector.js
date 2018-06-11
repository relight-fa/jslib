SL.namespace("RL");

SL.code(function($ = RL) {

/**
 * 2次元ベクトルクラス
 */
$.Vector2 = function(x, y) {
  this.x = x;
  this.y = y;
};

/* -------------------------------------------------- 
 * static methods
 * -------------------------------------------------- */
/**
 * 零ベクトルを作成して返す.
 */
$.Vector2.zero = function() {
  return new $.Vector2(0, 0);
};

/* -------------------------------------------------- 
 * properties
 * -------------------------------------------------- */
Object.defineProperties($.Vector2.prototype, {
  "width": {
    get: function() {
      return this.x;
    },
    set: function(value) {s
      this.x = value;
    },
  },
  "height": {
    get: function() {
      return this.y;
    },
    set: function(value) {
      this.y = value;
    },
  },
});
/* -------------------------------------------------- 
 * instance methods
 * -------------------------------------------------- */
/**
 * 零ベクトルであるか
 */
$.Vector2.prototype.isZero = function() {
    return this.x == 0 && this.y == 0;
};

/**
 * オブジェクトのコピー
 */
$.Vector2.prototype.copy = function() {
  return new RL.Vector2(this.x, this.y);
};

/**
 * ベクトルの値をセット
 */
$.Vector2.prototype.set = function(arg0, arg1) {
  if (typeof arg1 === "undefined") {
    this.setVector(arg0);
  }
  else {
    this.setXY(arg0, arg1);
  }
}
/**
 * ベクトルの値をセット(数値x2)
 */
$.Vector2.prototype.setXY = function(x, y) {
  this.x = x;
  this.y = y;
};
/**
 * ベクトルの値をセット(ベクトルオブジェクト)
 */
$.Vector2.prototype.setVector = function(vector) {
  this.x = vector.x;
  this.y = vector.y;
};

/**
 * ベクトルの値に加算
 */
$.Vector2.prototype.set = function(arg0, arg1) {
  if (typeof arg1 === "undefined") {
    this.addVector(arg0);
  }
  else {
    this.addXY(arg0, arg1);
  }
}

/**
 * ベクトルの値に加算(数値x2 指定)
 */
$.Vector2.prototype.addXY = function(x, y) {
  this.x += x;
  this.y += y;
};

/**
 * ベクトルの値に加算(ベクトル指定)
 */
$.Vector2.prototype.addVector = function(vector) {
  this.x += vector.x;
  this.y += vector.y;
};

/**
 * ベクトルとx軸との成す角を返す
 * 値は-0.5 ～ 0.5の間で返される. 
 * (1 = 2pi [radian] = 360 [degree] とした値)
 */
$.Vector2.prototype.angle = function() {
    var atan =  Math.atan2(this.y, this.x);
    return atan / (2 * Math.PI);
};

/**
 * ベクトルの正規化
 * 零ベクトルではない場合に、長さを1にする.
 */
$.Vector2.prototype.normalize = function() {
    var l = Math.sqrt(this.x * this.x + this.y * this.y);
    if(l != 0) {
        this.x = this.x / l;
        this.y = this.y / l;
    }
};

/**
 * ベクトルの長さ(ノルム)
 */
$.Vector2.prototype.norm = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

/**
 * ノルムの2乗
 */
$.Vector2.prototype.norm2 = function() {
    return this.x * this.x + this.y * this.y;
};

});
