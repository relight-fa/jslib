/**
 * rl_intlist.js
 * (C) 2014-2017 Daichi Aihara
 * licensed under the MIT license
 * 
 * 可変長32bit数値型リスト
 */
SL.namespace("RL");
SL.code(function($ = RL) {

/**
 * IntList Class
 * @param {int} capacity 内部配列の初期容量
 */
$.IntList = function(capacity) {
    capacity = capacity | 0;
    if (capacity <= 0) {
        capacity = 1;
    }
    
    this._count = 0; /* readonly */
    this._capacity = capacity;  /* readonly */
    this._array = new Int32Array(capacity); /* private */
};

/**
 * Properties 
 */
Object.defineProperties($.IntList.prototype, {
    /**
     * count (readonly)
     * number of items in the list
     */
    "count" : {
        get : function() { return this._count; },
    },
    /**
     * length (readonly)
     * alias of count.
     */
    "length" : {
        get : function() { return this._count; },
    },
    /**
     * capacity (readonly)
     * capacity of internal array;
     */
    "capacity" : {
        get : function() { return this._capacity; },
    },
    /**
     * internalArray (readonly)
     * コード最適化が必要な時に利用する
     */
    "internalArray" : {
        get : function() { return this._array; },
    },
});

/**
 * リストをInt32Arrayとして返す
 * @param {bool} withCopy
 *   trueならば返される配列はIntListの内部配列と共有される.
 *   falseならば返される配列は内部配列のコピーとなる.
 */
$.IntList.prototype.toArray = function(withCopy) {
    var array;
    if (this._count == this._capacity) {
        array = this._array;
    }
    else {
        array = this._array.subarray(0, this._length);
    }
    
    if (withCopy) {
        return new Int32Array(array);
    }
    else {
        return array;
    }
};

/**
 * 指定インデックスの値を返す
 * @param {int} index
 * @returns {int}
 */
$.IntList.prototype.get = function(index) {
    return this._array[index];
};

/**
 * 指定インデックスの値を設定する.
 * リストサイズを越えた場合は間の値を0で埋める 
 * @param {int} index
 * @param {int} value
 */
$.IntList.prototype.set = function(index, value) {
    if (index < 0) {
        return;
    }
    else if (index < this._count) {
        this._array[index] = value;
        return;
    }
    else if (this._capacity <= index) {
        this.extend(index * 2);
    }
    this._array[index] = value;
    
    for(var i = this._count; i < this._index; i++) {
        this._array[i] = 0;
    }
    this._count = index+1;
};

/**
 * setUnsafe
 * indexの範囲チェックを行わない値設定
 * 0 <= index < count が保障される場合のみ呼び出す
 */
$.IntList.prototype.setUnsafe = function(index, value) {
    this._array[index] = value;
};

/**
 * add
 * リスト末尾へ値を追加する.
 * @param {int} value
 */
$.IntList.prototype.add = function(value) {
    if (this._count == this._capacity) {
        this.extend(this._capacity * 2);
    }
    this._array[this._count] = value;
    ++this._count;
};

/**
 * push
 */
$.IntList.prototype.push = function(value) {
    if (this._count == this._capacity) {
        this.extend(this._capacity * 2);
    }
    this._array[this._count] = value;
    return ++this._count;
};

/**
 * pop
 * リスト末尾の値を取り除き、その値を返す 
 */
$.IntList.prototype.pop = function(value) {
    if (this._count == 0) {
        return 0;
    }
    --this._count;
    return this._array[this._count];
};

/**
 * peek
 * リスト末尾の値を返す 
 */
$.IntList.prototype.pop = function(value) {
    if (this._count == 0) {
        return 0;
    }
    return this._array[this._count - 1];
};

/**
 * insert 
 * 指定indexへの値の挿入
 */
$.IntList.prototype.insert = function(index, value) {
    if (index < 0) {
        throw new Error("index is less than 0.");
    }
    else if (index > this.count){
        throw new Error("index is greater than count.");
    }
    
    if (this._count == this._capacity) {
        this.extend(this._capacity * 2);
    }
    var array = this._array;
    var len = this._count;
    for(var i = len; i > index; i--) {
        array[i] = array[i-1];
    }
    array[index] = value;
    ++this._count;
};

/**
 * extend
 * 内部配列サイズを拡張する
 * @param {int} newCapacity 拡張後の容量
 */
$.IntList.prototype.extend = function(newCapacity) {
    if (newCapacity <= this._capacity) {
        return;
    }

    var oldArray = this._array;
    var newArray = new Int32Array(newCapacity);
    
    newArray.set(oldArray, 0);
    
    this._array = newArray;
    this._capacity = newCapacity;
};

/**
 * copy
 * 別のIntListから値をコピーする
 * @param {$.IntList} list 
 */
$.IntList.prototype.copy = function(list) {
    this._count = list._count;
    this.extend(this._count);
    
    this._array.set(list._array.subarray(0, this._count), 0);
};

/**
 * pop
 * 末尾のアイテムを取り除き、返す
 * @returns {int} 末尾に存在していた値。リストが空だった場合は0
 */
$.IntList.prototype.pop = function() {
    if (this._count == 0) {
        throw new Error("The List is empty.");
    }
    --this._count;
    return this._array[this._count];
};

/**
 * remove
 * 指定した値を先頭から検索し、値が等しいアイテムを1つ削除する.
 * @param {int} value
 * @returns {Boolean} 指定した値が存在していたらtrue
 */
$.IntList.prototype.remove = function(value) {
    var i, len = this._count;
    var array = this._array;
    for(i = 0; i < len; i++) {
        //found
        if (array[i] == value) {
            this._count = (--len);
            for(; i < len; i++) {
                array[i] = array[i+1];
            }
            return true;
        }
    }
    //not found
    return false;
};

/**
 * removeFast
 * 指定した値を先頭から検索し、値が等しいアイテムを1つ削除する.
 * removeメソッドに比べてリスト内の順序が崩壊する代わりに高速に動作する.
 * @param {int} value
 * @returns {Boolean} 指定した値が存在していたらtrue
 */
$.IntList.prototype.removeFast = function(value) {
    var i, len = this._count - 1;
    var array = this._array;
    for(i = 0; i < len; i++) {
        //found
        if (array[i] == value) {
            this._count--;
            array[i] = array[this._count];
            return true;
        }
    }
    if (array[len] == value) {
        this._count--;
        return true;
    }
    //not found
    return false;
};

/**
 * removeAt
 * 指定インデックスのアイテムを削除する
 * @param {int} index
 */
$.IntList.prototype.removeAt = function(index) {
    if (index < 0) {
        throw new Error("the index is less than 0.");
    }
    else if (index >= this._count){
        throw new Error("the index is equal to or greater than count.");
    }
    
    var array = this._array;
    var len = (--this._count);
    for(var i = index; i < len; i++) {
        array[i] = array[i+1];
    }
};

/**
 * clear 
 * リストのアイテムを全て消去する
 */
$.IntList.prototype.clear = function() {
    this.count = 0;
};

/**
 * contains
 * 指定した値がリストに含まれているか検索する
 * @param {int} value
 */
$.IntList.prototype.contains = function(value) {
    var array = this._array;
    var len = this._count;
    for(var i = 0; i < len; i++) {
        if (array[i] == value) {
            return true;
        }
    }
    return false;
};

/**
 * indexOf
 * 値を検索し、ヒットしたもっとも小さいインデックスを返す
 * 見つからなかった場合は-1を返す
 */
$.IntList.prototype.indexOf = function(value) {
    /*
     *  TypedArray#indexOfを使わず自前で検索したほうがパフォーマンスが高い
     *  (特にChrome系)
     */
    var array = this._array;
    var len = this._count;
    for(var i = 0; i < len; i++) {
        if (array[i] == value) {
            return i;
        }
    }
    return -1;
};

/**
 * forEach 
 * リスト内のそれぞれの値に対して処理を行う
 * @param {Function} action 
 */
$.IntList.prototype.forEach = function(callback) {
    var array = this._array;
    var i, len = this._count;
    for(i = 0; i < len; i++) {
        callback(array[i], i);
    }
};

/**
 * toString 
 * リストを文字列として出力
 */
$.IntList.prototype.toString = function() {
    var str = "IntList\n";
    var i, len = this._count;
    var array = this._array;
    for(i = 0; i < len; i++) {
        str += "[" + i + "] => " + array[i].toString() + "\n";
    }
    return str;
};

/**
 * insertionSort
 * 挿入ソート
 */
$.IntList.prototype.insertionSort = function() {
    var i, j, len = this._count;
    var temp;
    var array = this._array;
    for(i = 1; i < len; i++) {
        temp = array[i];
        if (temp >= array[i-1]) {
            continue;
        }
        
        j = i;
        do {
            array[j] = array[j-1];
            j = j-1;
        } while( j > 0 && temp < array[j-1]);
        array[j] = temp;
    }
};

(function(){
//radixSort用static変数
var zeroArray = new Int32Array(256);
var c4 = new Int32Array(256);
var c3 = new Int32Array(256);
var c2 = new Int32Array(256);
var c1 = new Int32Array(256);
var copy = new Int32Array(1024);
/**
 * radixSort
 * 基数ソート
 * 参考:http://stackoverflow.com/questions/8082425/fastest-way-to-sort-32bit-signed-integer-arrays-in-javascript
 */
$.IntList.prototype.radixSort = function() {
    var array = this._array;
    var len = this._count;
    if (copy.length < len) {
        copy = new Int32Array(len);
    }
    c4.set(zeroArray);
    c3.set(zeroArray);
    c2.set(zeroArray);
    c1.set(zeroArray);
    var o4 = 0; var t4;
    var o3 = 0; var t3;
    var o2 = 0; var t2;
    var o1 = 0; var t1;
    var i;
    for(i = 0; i < len; i++) {
        t4 = array[i] & 0xFF;
        t3 = (array[i] >> 8) & 0xFF;
        t2 = (array[i] >> 16) & 0xFF;
        t1 = (array[i] >> 24) & 0xFF ^ 0x80;
        c4[t4]++;
        c3[t3]++;
        c2[t2]++;
        c1[t1]++;
    }
    for(i = 0; i < 256; i++) {
        t4 = o4 + c4[i];
        t3 = o3 + c3[i];
        t2 = o2 + c2[i];
        t1 = o1 + c1[i];
        c4[i] = o4;
        c3[i] = o3;
        c2[i] = o2;
        c1[i] = o1;
        o4 = t4;
        o3 = t3;
        o2 = t2;
        o1 = t1;
    }
    for(i = 0; i < len; i++) {
        t4 = array[i] & 0xFF;
        copy[c4[t4]] = array[i];
        c4[t4]++;
    }
    for(i = 0; i < len; i++) {
        t3 = (copy[i] >> 8) & 0xFF;
        array[c3[t3]] = copy[i];
        c3[t3]++;
    }
    for(i = 0; i < len; i++) {
        t2 = (array[i] >> 16) & 0xFF;
        copy[c2[t2]] = array[i];
        c2[t2]++;
    }
    for(i = 0; i < len; i++) {
        t1 = (copy[i] >> 24) & 0xFF ^ 0x80;
        array[c1[t1]] = copy[i];
        c1[t1]++;
    }
};
}());

/**
 * sort
 */
$.IntList.prototype.sort = function() {
    if (this._count < 80) {
        this.insertionSort();
    }
    else {
        this.radixSort();
    }
};

/**
 * intersectionOfSortedLists
 * 2つのソート済みリストaList, bListから共通部分を取り出しdstListに代入する
 * @param {IntList} aList
 * @param {IntList} bList
 * @param {IntList} dstList
 */
$.IntList.intersectionOfSortedLists = function(aList, bList, dstList) {
    var count = 0;
    var aArray = aList._array, bArray = bList._array;
    var aLen = aList._count, bLen = bList._count;
    var aIndex = 0, bIndex = 0;
    var value;
    
    dstList.clear();
    dstList.extend( Math.min(aLen, bLen) );
    var dstArray = dstList._array;
    
    while(aIndex < aLen && bIndex < bLen) {
        if (aArray[aIndex] < bArray[bIndex]) {
            aIndex++;
        }
        else if (aArray[aIndex] > bArray[bIndex]) {
            bIndex++;
        }
        else {
            dstArray[count] = aArray[aIndex];
            count++;
            aIndex++;
            bIndex++;
        }
    }
    dstList._count = count;
};



});



