SL.namespace("RL");
SL.import("vector.js");

SL.code(function($ = RL) {

$.makeRect = function(x, y, width, height) {
  return new $.Rect(x, y, width, height);
};

/**
 * 矩形情報
 */
$.Rect = function(x, y, width, height) {
  this.origin = new RL.Vector2(x, y);
  this.size = new RL.Vector2(width, height);
};

Object.defineProperties($.Rect.prototype, {
  "x": {
    get: function() {
      return this.origin.x;
    },
    set: function(value) {
      this.origin.x = value;
    },
  },
  "y": {
    get: function() {
      return this.origin.y;
    },
    set: function(value) {
      this.origin.y = value;
    },
  },
  "width": {
    get: function() {
      return this.size.x;
    },
    set: function(value) {
      this.size.x = value;
    },
  },
  "height": {
    get: function() {
      return this.size.y;
    },
    set: function(value) {
      this.size.y = value;
    },
  },
  "left": {
    get: function() {
      return this.origin.x;
    },
  },
  "top": {
    get: function() {
      return this.origin.y;
    },
  },
  "right": {
    get: function() {
      return this.origin.x + this.size.x;
    },
  },
  "bottom": {
    get: function() {
      return this.origin.y + this.size.y;
    },
  },
  "minX": {
    get: function() {
      return this.origin.x;
    },
  },
  "minY": {
    get: function() {
      return this.origin.y;
    },
  },
  "midX": {
    get: function() {
      return this.origin.x + this.size.x/2;
    },
  },
  "midY": {
    get: function() {
      return this.origin.y + this.size.y/2;
    },
  },
  "maxX": {
    get: function() {
      return this.origin.x + this.size.x;
    },
  },
  "maxY": {
    get: function() {
      return this.origin.y + this.size.y;
    },
  },
});

/* --------------------------------------------------
 * static methods
 * -------------------------------------------------- */
/**
 * サイズが空の矩形を作成して返す
 */
$.Rect.zero = function() {
  return new $.Rect(0, 0, 0, 0);
}

/**
 * 2つの矩形を囲む最小の矩形
 */
$.Rect.union = function(rect1, rect2) {
  if (rect1.size.x == 0 || rect1.size.y == 0 || rect2.size.x == 0 || rect3.size.y == 0) {
    return new $.Rect(0, 0, 0, 0);
  }
  
  var left   = Math.min(rect1.origin.x, rect2.origin.x);
  var top    = Math.min(rect1.origin.y, rect2.origin.y);
  var right  = Math.max(
                 rect1.origin.x + rect1.size.x,
                 rect2.origin.x + rect2.size.x);
  var bottom = Math.max(
                 rect1.origin.y + rect1.size.y,
                 rect2.origin.y + rect2.size.y);
  return new $.Rect(left, top, right - left, bottom - top);
}
/**
 * 2つの矩形の共通部分
 */
$.Rect.intersection = function(rect1, rect2) {
  var left   = Math.max(rect1.origin.x, rect2.origin.x);
  var top    = Math.max(rect1.origin.y, rect2.origin.y);
  var right  = Math.min(
                 rect1.origin.x + rect1.size.x,
                 rect2.origin.x + rect2.size.x);
  var bottom = Math.min(
                 rect1.origin.y + rect1.size.y,
                 rect2.origin.y + rect2.size.y);
  if (right <= left || bottom <= top) {
    return $.Rect.zero();
  }
  return new $.Rect(left, top, right - left, bottom - top);
}

/* --------------------------------------------------
 * instance methods
 * -------------------------------------------------- */
/**
 * 矩形の横幅または高さが0であるか
 */
$.Rect.prototype.isZero = function() {
  return this.size.x == 0 || this.size.y == 0;
}
$.Rect.prototype.isEmpty = $.Rect.prototype.isZero;

/**
 * 指定した矩形と等しいか
 * 両矩形の座標・サイズが全て等しい or 両矩形とも空の場合に等しいとする.
 */
$.Rect.prototype.isEqual = function(rect) {
  if (this.size.x == 0 || this.size.y == 0) {
    return rect.size.x == 0 || rect.size.y == 0;
  }
  else {
    return (
        this.origin.x == this.origin.x &&
        this.origin.y == this.origin.y &&
        this.size.x == this.size.x &&
        this.size.y == this.size.y
    );
  }
}

/**
 * 矩形のコピー
 */
$.Rect.prototype.copy = function() {
  return new $.Rect(
    this.origin.x,
    this.origin.y,
    this.size.x,
    this.size.y
  );
};

/**
 * 矩形の値のセット
 */
$.Rect.prototype.set = function(arg0, arg1, arg2, arg3) {
  if (typeof arg1 === "undefined") {
    this.setRect(arg0);
  }
  else {
    this.set4f(arg0, arg1, arg2, arg3);
  }
};
$.Rect.prototype.setRect = function(rect) {
  this.origin.x = rect.origin.x;
  this.origin.y = rect.origin.y;
  this.size.x = rect.size.x;
  this.size.y = rect.size.y;
};
$.Rect.prototype.set4f = function(x, y, width, height) {
  this.origin.x = x;
  this.origin.y = y;
  this.size.x = width;
  this.size.y = height;
};

/**
 * 現在の矩形と指定した矩形を囲む最小の矩形に拡張
 */
$.Rect.prototype.union = function(rect) {
  if (this.size.x == 0 || this.size.y == 0) {
    this.setRect(rect);
    return;
  }
  if (rect.size.x == 0 || this.size.y == 0) {
    return;
  }
  
  // Horizontal
  if (this.origin.x > rect.origin.x) {
    if (this.origin.x + this.size.x < rect.origin.x + rect.size.x) {
      this.size.x = rect.size.x;
    }
    else {
      this.size.x = this.size.x + this.origin.x - rect.origin.x;
    }
    this.origin.x = rect.origin.x;
  }
  else if (this.origin.x + this.size.x < rect.origin.x + rect.size.x) {
    this.size.x = rect.size.x + rect.origin.x - this.origin.x;
  }
  // Vertical
  if (this.origin.y > rect.origin.y) {
    if (this.origin.y + this.size.y < rect.origin.y + rect.size.y) {
      this.size.y = rect.size.y;
    }
    else {
      this.size.y = this.size.y + this.origin.y - rect.origin.y;
    }
    this.origin.y = rect.origin.y;
  }
  else if (this.origin.y + this.size.y < rect.origin.y + rect.size.y) {
    this.size.y = rect.size.y + rect.origin.y - this.origin.y;
  }
}

/**
 * 現在の矩形を指定した矩形との共通部分に縮小
 */
$.Rect.prototype.intersection = function(rect) {
  // Horizontal
  if (this.origin.x < rect.origin.x) {
    if (this.origin.x + this.size.x > rect.origin.x + rect.size.x) {
      this.size.x = rect.size.x;
    }
    else {
      this.size.x = this.size.x + this.origin.x - rect.origin.x;
    }
    this.origin.x = rect.origin.x;
  }
  else if (this.origin.x + this.size.x > rect.origin.x + rect.size.x) {
    this.size.x = rect.size.x + rect.origin.x - this.origin.x;
  }
  
  if (this.size.x <= 0) {
    this.size.x = 0;
    this.size.y = 0;
    return;
  }
  
  // Vertical
  if (this.origin.y < rect.origin.y) {
    if (this.origin.y + this.size.y > rect.origin.y + rect.size.y) {
      this.size.y = rect.size.y;
    }
    else {
      this.size.y = this.size.y + this.origin.y - rect.origin.y;
    }
    this.origin.y = rect.origin.y;
  }
  else if (this.origin.y + this.size.y > rect.origin.y + rect.size.y) {
    this.size.y = rect.size.y + rect.origin.y - this.origin.y;
  }
  
  if (this.size.y <= 0) {
    this.size.x = 0;
    this.size.y = 0;
  }
}

/**
 * 矩形の平行移動 (2次元ベクトルで指定)
 */
$.Rect.prototype.offset = function(vector) {
  this.origin.x += vector.x;
  this.origin.y += vector.y;
}

/**
 * 矩形の平行移動 (2つの整数で指定)
 */
$.Rect.prototype.offsetXY = function(x, y) {
  this.origin.x += x;
  this.origin.y += y;
}

/**
 * 指定した矩形を含んでいるか
 */
$.Rect.prototype.containsRect = function(rect) {
  return ! (
       this.maxX <= rect.minX
    || rect.maxX <= this.minX 
    || this.maxY <= rect.minY 
    || rect.maxY <= this.minY 
    || this.isEmpty()
    || rect.isEmpty()
  );
}
/**
 * 指定した点が矩形に含まれるか
 */
$.Rect.prototype.containsPoint = function(point) {
  return (
       point.x >= this.x
    && point.x < this.x + this.width
    && point.y >= this.y
    && point.y < this.y + this.height
  );
}
$.Rect.prototype.containsPointXY = function(x, y) {
  return (
       x >= this.x
    && x < this.x + this.width
    && y >= this.y
    && y < this.y + this.height
  );
}

$.isPointInRect2f4f = function (pointX, pointY, rectX, rectY, rectWidth, rectHeight) {
  return (
       pointX >= rectX
    && pointX < rectX + rectWidth
    && pointY >= rectY
    && pointY < rectY + rectHeight
  );
}

});
