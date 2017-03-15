/**
 * rl_list.js
 * (C) 2014-2017 Daichi Aihara
 * licensed under the MIT license
 * 
 * 値の追加・削除に最適化された可変長リスト 
 */

SL.namespace("RL");
SL.code(function($ = RL){

$.LIST_DEFAULT_CAPACITY = 32;
/**
 * initWithCapacity 
 */
$.List = function(capacity) {
  capacity = capacity | 0;
  if (capacity <= 0) {
    capacity = $.LIST_DEFAULT_CAPACITY;
  }
  this._array = new Array(capacity);
  this._count = 0;
};

/**
 * defineProperties 
 */
Object.defineProperties($.List.prototype, {
  /**
   * count (readonly)
   */
  "count": {
    get: function() { return this._count; },
  },
  /**
   * length (readonly)
   * alias of count.
   */
  "length": {
    get: function() { return this._count; },
  },
  /**
   * capacity (readnly) 
   */
  "capacity": {
    get: function() { return this._array.length; },
  },
  /**
   * internalArray (readonly)
   * コード最適化が必要な時に利用する
   */
  "internalArray": {
    get: function() { return this._array; },
  },
});

/**
 * 値のセット
 * @param {int} index
 * @param {any} value
 */
$.List.prototype.set = function(index, value) {
  if (index < 0) {
    throw new Error("out of range");
  }
  if (index >= this._count) {
    this._count = index + 1;
  }
  this._array[index] = value;
};

/**
 * 指定したインデックスの値を返す
 * @param {int} index
 * @returns {any}
 */
$.List.prototype.get = function(index) {
  return this._array[index];
};

/**
 * リスト末尾へ値を追加する.
 * @param {any} value 追加する値
 */
$.List.prototype.add = function(value) {
  this._array[this._count] = value;
};

/**
 * 末尾に値を追加し、追加後のリストの長さを返す
 * @param {any} value 追加する値
 * @returns {int} 追加後のリストの長さ
 */
$.List.prototype.push = function(value) {
  this._array[this._count] = value;
  return ++this._count;
};

/**
 * 末尾の値を取り除き、それを返す
 * @returns {any} 末尾に存在していた値. リストが空だった場合はnull
 */
$.List.prototype.pop = function() {
  if (this._count == 0) {
    return null;
  }
  --this._count;
  var value = this._array[this._count];
  this._array[this._count] = null;
  return value;
};

/**
 * 末尾の値を返す
 * @return {any} 末尾に存在している値. リストが空の場合はnull
 */
$.List.prototype.peek = function() {
  if (this._count == 0) {
    return null;
  }
  return this._array[this._count - 1];
};

/**
 * remove
 * 指定した値を先頭から検索し、値が等しいアイテムを1つ削除する.
 * @param {Object} value
 */
$.List.prototype.remove = function(value) {
  var i, len = this._count;
  var array = this._array;
  for (i = 0; i < len; i++) {
    //found
    if (array[i] == value) {
      this._count = (--len);
      for (; i < len; i++) {
        array[i] = array[i+1];
      }
      array[len] = null;
      return true;
    }
  }
  //not found
  return false;
};

/**
 * removeAt 
 * 指定インデックスのアイテムを削除する
 * @param {int} index
 */
$.List.prototype.removeAt = function(index) {
  if (index < 0 || index >= this._count) {
    return;
  }
  
  var array = this._array;
  var len = (--this._count);
  for (var i = index; i < len; i++) {
    array[i] = array[i+1];
  }
  array[i] = null;
};

/**
 * clear
 * リストのアイテムを全て消去する
 */
$.List.prototype.clear = function() {
  var i, len = this._count;
  var array = this._array;
  for (i = 0; i < len; i++) {
    array[i] = null;
  }
  
  this._count = 0;
};

/**
 * contains
 * 指定した値がリストに含まれるか返す
 * @param {Object} value
 */
$.List.prototype.contains = function(value) {
  var i, len = this._count;
  var array = this._array;
  for (i = 0; i < len; i++) {
    //found
    if (array[i] == value) {
      return true;
    }
  }
  //not found
  return false;
};

/**
 * indexOf
 * 指定された値を先頭から検索し、見つかった最初のインデックスを返す
 * @param {any} value
 * @returns {int} 検索がヒットしたインデックス.値が見つからなかった場合は-1.
 */
$.List.prototype.indexOf = function(value) {
  var i, len = this._count;
  var array = this._array;
  for (i = 0; i < len; i++) {
    // found
    if (array[i] == value) {
      return i;
    }
  }
  //not found
  return -1;
};

/**
 * 指定された値を末尾から検索し、見つかった最初のインデックスを返す
 * @param {any} value
 * @returns {int} 検索がヒットしたインデックス.値が見つからなかった場合は-1.
 */
$.List.prototype.lastIndexOf = function(value) {
  var i;
  var array = this._array;
  for (i = this._count - 1; i >= 0; i--) {
    // found
    if (array[i] == value) {
      return i;
    }
  }
  // not found
  return -1;
};

/**
 * forEach
 * リスト内のそれぞれの値に対して処理を行う
 * @param {Function} action
 */
$.List.prototype.forEach = function(callback) {
  var i, len = this._count;
  var array = this._array;
  for (i = 0; i < len; i++) {
    action(array[i], i);
  }
};

/**
 * clean
 * 余分なインデックスプロパティを削除する.
 */
$.List.prototype.clean = function() {
  this._array.length = this._count;
};

/**
 * toString
 * リストを文字列として出力
 */
$.List.prototype.toString = function() {
  var str = "";
  var i, len = this._count;
  for (i = 0; i < len; i++) {
    str += "[" + i + "] " + this._array[i].toString() + "\n";
  }
  return str;
};

/**
 * insertionSort
 * 挿入ソート(比較関数指定)
 */
$.List.prototype.insertionSort = function(compareFunction) {
  var i, j, len = this._count;
  var temp;
  var array = this._array;
  for (i = 1; i < len; i++) {
    temp = array[i];
    if ( compareFunction(temp, array[i-1]) >= 0 ) {
      continue;
    }
    
    j = i;
    do {
      array[j] = array[j-1];
      j = j-1;
    } while( j > 0 && compareFunction(temp, array[j-1]) < 0);
    array[j] = temp;
  }
};

/**
 * sort
 */
$.List.prototype.sort = function(compareFunction) {
  this.clean();
  this._array.sort(compareFunction);
};

});
















