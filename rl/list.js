/**
 * rl_list.js
 * (C) 2014-2017 Daichi Aihara
 * licensed under the MIT license
 * 
 * 可変長リスト 
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
  ++this._count;
};

/**
 * リスト末尾へ渡された配列の各要素を追加する.
 * @param {any} value 追加する値
 */
$.List.prototype.addArray = function(array) {
  var len = array.length;
  for (var i = 0; i < len; i ++) {
    this._array[this._count++] = array[i];
  }
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
 * 指定した値にヒットした項目をすべて削除する
 * @param {Object} value
 * @return {int} 削除件数
 */
$.List.prototype.removeAll = function(value) {
  var i, len = this._count;
  var removeCount = 0;
  var array = this._array;
  // 最初の1件目の検索
  for (i = 0; i < len; i++) {
    if (array[i] === value) {
      removeCount = 1;
      break;
    }
  }
  // 2件目以降の検索
  for (; i < len; i++) {
    if (array[i] === value) {
      removeCount++;
    }
    // 非ヒットの場合は、これまでの削除件数分 前につめる
    else {
      array[i - removeCount] = array[i];
    }
  }
  
  for (i = len - removeCount; i < len; i++) {
      array[i] = null;
  }
  this._count -= removeCount;
  
  return removeCount;
};

/**
 * 先頭から検索し、条件にヒットしたアイテムを1つ削除する.
 * @param {Function} func 条件関数. 引数にリスト項目を受け取り、true or falseを返す.
 */
$.List.prototype.removeWithFunc = function(func) {
  var i, len = this._count;
  var array = this._array;
  for (i = 0; i < len; i++) {
    //found
    if (func(array[i]) === true) {
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
 * 条件にヒットしたアイテムを全て削除する.
 * @param {Function} func 条件関数. 引数にリスト項目を受け取り、true or falseを返す.
 * @return {int} 削除件数
 */
$.List.prototype.removeAllWithFunc = function(func) {
  var i, len = this._count;
  var removeCount = 0;
  var array = this._array;
  // 最初の1件目の検索
  for (i = 0; i < len; i++) {
    if (func(array[i]) === true) {
      removeCount = 1;
      break;
    }
  }
  // 2件目以降の検索
  for (; i < len; i++) {
    if (func(array[i]) === true) {
      removeCount++;
    }
    // 非ヒットの場合は、これまでの削除件数分 前につめる
    else {
      array[i - removeCount] = array[i];
    }
  }
  
  // 削除した分 末尾をnullで上書き
  for (i = len - removeCount; i < len; i++) {
    array[i] = null;
  }
  this._count -= removeCount;
  
  return removeCount;
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
 * @param {Function} func
 */
$.List.prototype.forEach = function(func) {
  var i, len = this._count;
  var array = this._array;
  for (i = 0; i < len; i++) {
    func(array[i], i);
  }
};

/**
 * clean
 * 内部配列のサイズをアイテム数にあわせる
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
 * クイックソート
 */
$.List.prototype.quickSort = function(compareFunction) {
  this._quickSort(0, this._count - 1);
};
$.List.prototype._quickSort = function(compareFunction, i, j) {
  if (i >= j) {
    return;
  }
  
  var left = i; right = j;
  var array = this._array;
  
  var tmp;
  var x = array[i], y = array[i + (j - 1) / 2], z = array[j];
  // x, y, zの中間値の検索
  var pivot;
  if (x < y) {
    if (y < z) {
      pivot = y;
    }
    else if (z < x) {
      pivot = x;
    }
    else {
      pivot = z;
    }
  }
  else {
    if (z < y) {
      pivot = y;
    }
    else if (x < z) {
      pivot = x;
    }
    else {
      pivot = z;
    }
  }
    
  while (true) {
    while (array[i] < pivot) {
      i++;
    }
    while (pivot < array[j]) {
      j--;
    }
    if (i >= j) {
      break;
    }
    // swap array[i] and array[j]
    tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
    
    i++;
    j--;
  }
  this._quicksort(a, left, i - 1);
  this._quicksort(a, j + 1, right);
};

/**
 * sort
 */
$.List.prototype.sort = function(compareFunction) {
  this.clean();
  this._array.sort(compareFunction);
};

});
















