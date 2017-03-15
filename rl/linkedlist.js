/**
 * rl_linkedlist.js
 * (C) 2014-2017 Daichi Aihara
 * licensed under the MIT license
 * 
 * 双方向連結リスト
 */

SL.namespace("RL");
SL.code(function($ = RL) {
/**
 * LinkedListNode
 */
$.LinkedListNode = function(value) {
  this._value = value;
  this._list = null;
  this._next = null;
  this._previous = null;
};

/**
 * Define Properties 
 */
Object.defineProperties($.LinkedListNode.prototype, {
  /*
   * ノードが属するリスト
   */
  "list": {
    get: function() { return this._list; }
  },
  /*
   * ノードに設定されているリスト
   */
  "value": {
    get: function() { return this._value; },
    set: function(newValue) {
      this._value = newValue;
    },
  },
  /*
   * このノードの次のノード. このノードが末尾の場合はnull
   */
  "next": {
    get: function() { return this._next; }
  },
  /*
   * このノードの前のノード. このノードが先頭の場合はnull
   */
  "previous": {
    get: function() { return this._previous; }
  }
});

//------------------------------------------------------------

/**
 * LinkedList
 */
$.LinkedList = function() {
  this._count = 0; // readonly
  this._first = null; // readonly
  this._last = null; // readonly
};

/**
 * Define Properties 
 */
Object.defineProperties($.LinkedList.prototype, {
  /*
   * リスト内のノード数
   */
  "count": {
    get : function() { return this._count; }
  },
  /*
   * リストの先頭のノード
   */
  "first": {
    get: function() { return this._first; }
  },
  /*
   * リストの末尾のノード
   */
  "last": {
    get: function() { return this._last; }
  }
});

/**
 * 指定した値を持つノードを作成し、末尾に追加する
 * @param {Object} 追加する値
 * @returns {$.LinkedListNode} 作成され追加されたノード
 */
$.LinkedList.prototype.addValueLast = function(value){
  //create a new node
  var node = new $.LinkedListNode(value);
  node._list = this;
  node._previous = this._last;
  
  //when a list is empty, set new node as first node
  if (this._first == null) {
    this._first = node;
  }
  //else update last node
  else {
    this._last._next = node;
  }
  this._last = node;
  
  this._count++;
  return node;
};

/**
 * ノードをリスト末尾に追加する.
 * ノードが既にリスト内に存在する場合は末尾に移動させる.
 * @param {$.LinkedListNode} node 追加するノード
 */
$.LinkedList.prototype.addNodeLast = function(node){
  if (node == null) {
    return;
  }
  
  //新規追加
  if (node._list == null) {
    node._list = this;
    this._count++;
  }
  //リスト内移動
  else if (node._list == this) {
    //移動の必要なし
    if (node == this._last) {
      return;
    }
    
    //移動前の前後ノードの更新
    if (node._previous == null) {
      this._first = node._next;
    }
    else {
      node._previous._next = node._next;
    }
    
    node._next._previous = node._previous;
  }
  else {
    return;
  }
  
  //nodeのリンクを張る
  node._next = null;
  node._previous = this._last;
  
  //前ノードの更新
  if (this._first == null) {
    this._first = node;
  }
  else {
    this._last._next = node;
  }
  this._last = node;
};

/**
 * 指定した値を持つノードを作成し、先頭に追加する
 * @param {Object} value 追加する値
 * @returns {$.LinkedListNode} 作成され追加されたノード
 */
$.LinkedList.prototype.addValueFirst = function(value){
  //create a new node
  var node = new $.LinkedListNode(value);
  node._list = this;
  node._next = this._first;
  
  //when a list is empty, set new node as last node
  if (this._last == null) {
    this._last = node;
  }
  //else update first node
  else {
    this._first._previous = node;
  }
  this._first = node;
  
  this._count++;
  return node;
};

/**
 * 指定したノードを先頭に追加する
 * @param {$.LinkedListNode} node 追加するノード
 */
$.LinkedList.prototype.addNodeFirst = function(node){
  if (node == null){
    return;
  }
  
  //新規追加
  if (node._list == null) {
    node._list = this;
    this._count++;
  }
  //リスト内移動
  else if (node._list == this) {
    //移動の必要なし
    if (node == this._first) {
      return;
    }
    
    //移動前の前後ノードの更新
    if (node._next == null) {
      this._last = node._previous;
    }
    else {
      node._next._previous = node._previous;
    }
    
    node._previous._next = node._next;
  }
  else {
    return;
  }
  
  //nodeのリンクを張る
  node._previous = null;
  node._next = this._first;
  
  //前ノードの更新
  if (this._last == null) {
    this._last = node;
  }
  else {
    this._first._previous = node;
  }
  this._first = node;
};

/**
 * 指定した値を持つノードを作成し、指定したノードの後ろに追加する 
 * @param {Object} value 追加する値
 * @param {$.LinkedListNode} node 追加先となるノード
 * @returns {$.LinkedListNode} 新規に作成されたノード
 */
$.LinkedList.prototype.addValueAfter = function(value, node){
  if (node == null || node._list != this){
    return null;
  }
  
  //create a new node
  var newNode = new $.LinkedListNode(value);
  newNode._list = this;
  newNode._previous = node;
  newNode._next = node._next;
  
  //update next node
  if (newNode._next != null)
  {
    newNode._next._previous = newNode;
  }
  //when next node is null, update last node.
  else
  {
    this._last = newNode;
  }
  
  //update previous node
  node._next = newNode;
  
  this._count++;
  return newNode;
};

/**
 * addNodeAfter 
 * add aNode after bNode.
 * if aNode is already contained by list, move aNode after bNode.
 * @param {$.LinkedListNode} value
 * @param {$.LinkedListNode} node
 */
$.LinkedList.prototype.addNodeAfter = function(aNode, bNode){
  if (aNode == null || bNode == null || bNode._list != this){
    return;
  }
  if (aNode._previous == bNode) {
    return;
  }
  
  //新規追加
  if (aNode._list == null) {
    aNode._list = this;
    this._count++;
  }
  //リスト内移動
  else if (aNode._list == this) {
    //移動前の前後ノードの更新
    if (aNode._previous == null) {
      this._first = aNode._next;
    }
    else {
      aNode._previous._next = aNode._next;
    }
    
    if (aNode._next == null) {
      this._last = aNode._previous;
    }
    else {
      aNode._next._previous = aNode._previous;
    }
  }
  else {
    return;
  }
  
  //aNodeのリンクを張りなおす
  aNode._previous = bNode;
  aNode._next = bNode._next;
  
  //移動後の前後のノードの更新
  if (bNode._next == null) {
    this._last = aNode;
  }
  else {
    bNode._next._previous = aNode;
  }
  bNode._next = aNode;
}; 

/**
 * addValueBefore 
 * @param {Object} value
 * @param {$.LinkedListNode} node
 * @returns {$.LinkedListNode} new node
 */
$.LinkedList.prototype.addValueBefore = function(value, node){
  if (node == null || node._list != this){
    return null;
  }
  
  //create a new node
  var newNode = new $.LinkedListNode(value);
  newNode._list = this;
  newNode._next = node;
  newNode._previous = node._previous;
  
  //update previous node
  if (newNode._previous != null)
  {
    newNode._previous._next = newNode;
  }
  //when previous node is null, update first node.
  else
  {
    this._first = newNode;
  }
  
  //update next node
  node._previous = newNode;
  
  this._count++;
  return newNode;
}; 

/**
 * addNodeBefore 
 * add aNode before bNode.
 * if aNode is already contained by list, move aNode before bNode.
 * @param {$.LinkedListNode} value
 * @param {$.LinkedListNode} node
 */
$.LinkedList.prototype.addNodeBefore = function(aNode, bNode){
  if (aNode == null || bNode == null || bNode._list != this){
    return;
  }
  if (aNode._next == bNode) {
    return;
  }
  
  //新規追加
  if (aNode._list == null) {
    aNode._list = this;
    this._count++;
  }
  //リスト内移動
  else if (aNode._list == this) {
    //移動前の前後ノードの更新
    if (aNode._previous == null) {
      this._first = aNode._next;
    }
    else {
      aNode._previous._next = aNode._next;
    }
    
    if (aNode._next == null) {
      this._last = aNode._previous;
    }
    else {
      aNode._next._previous = aNode._previous;
    }
  }
  else {
    return;
  }
  
  //aNodeのリンクを張りなおす
  aNode._next = bNode;
  aNode._previous = bNode._previous;
  
  //移動後の前後のノードの更新
  if (bNode._previous == null) {
    this._first = aNode;
  }
  else {
    bNode._previous._next = aNode;
  }
  bNode._previous = aNode;
};

/**
 * removeValue
 * @param {Object} value
 * @returns {LinkedListNode} removed node.
 */
$.LinkedList.prototype.removeValue = function(value) {
  var target;
  for(target = this._first;
    target != null;
    target = target._next)
  {
    if (target.value == value) {
      removeNode(target);
      return target;
    }
  }
  
  return null;
};

/**
 * removeNode
 * @param {$.LinkedListNode} node
 */
$.LinkedList.prototype.removeNode = function(node) {
  //check node
  if (node == null || node._list != this) {
    return;
  }
  
  //update previous of node
  if (node._previous == null) {
    this._first = node._next;
  }
  else {
    node._previous._next = node._next;
  }
  
  //update next of node
  if (node._next == null) {
    this._last = node._previous;
  }
  else {
    node._next._previous = node._previous;
  }
  
  node._list = null;
  node._next = null;
  node._previous = null;
  this._count--;
};

/**
 * removeFirst
 */
$.LinkedList.prototype.removeFirst = function() {
  var firstNode = this._first;
  if (firstNode == null) {
    return null;
  }
  
  this._first = null;
  if (firstNode._next) {
    firstNode._next._previous = null;
    firstNode._next = null;
  }
  firstNode._list = null;

  this._count--;
};

/**
 * removeLast
 */
$.LinkedList.prototype.removeLast = function() {
  if (this._last == null) {
    return null;
  }
  
  var lastNode = this._last;
  this._last = null;
  if (lastNode._previous) {
    lastNode._previous._next = null;
    lastNode._previous = null;
  }
  lastNode._list = null;

  this._count--;
};

/**
 * 値がvalueであるノードを作成し、最後尾に追加する。
 * 追加後のノード数を返す.
 */
$.LinkedList.prototype.push = function(value) {
  this.addValueLast(value);
  return this._count;
};

/**
 * 最後尾のノードを取り除き、その値を返す
 */
$.LinkedList.prototype.pop = function() {
  if (this._last == null) {
    return null;
  }
  
  var lastNode = this._last;
  var value = lastNode._value;
  
  this._last = null;
  if (lastNode._previous) {
    lastNode._previous._next = null;
    lastNode._previous = null;
  }
  lastNode._list = null;

  this._count--;
  return value;
};

/**
 * 挿入ソートによるソート
 * @param {Function} compareFunction 比較関数
 */
$.LinkedList.prototype.sort = function(compareFunction) {
  if (this._first == null) {
    return;
  };
  
  var target, nextTarget, compareTarget;
  for(target = this._first._next;
    target != null;
    target = nextTarget)
  {
    nextTarget = target._next;
    if (compareFunction(target.value, target._previous.value) >= 0) {
      continue;
    }
    
    compareTarget = target._previous._previous;
    while(true) {
      //move to first
      if (compareTarget == null) {
        this.moveNodeFirstInSort(target);
        break;
      }
      //move after node
      if (compareFunction(target.value, compareTarget.value) >= 0) {
        this.moveNodeAfterInSort(target, compareTarget);
        break;
      }
      compareTarget = compareTarget._previous;
    }
  }
};

/**
 * sortメソッド内で呼び出しヘルパーメソッド (private)
 * aNodeをbNodeの後ろに移動する。引数の例外チェックを省略している。
 * @param {$.LinkedListNode} aNode
 * @param {$.LinkedListNode} bNode
 */
$.LinkedList.prototype.moveNodeAfterInSort = function(aNode, bNode) {
  //aNodeの前後ノードの更新
  aNode._previous._next = aNode.next;
  if (aNode._next == null) {
    this._last = aNode._previous;
  }
  else {
    aNode._next._previous = aNode._previous;
  }
  
  //link aNode to bNode
  aNode._previous = bNode;
  aNode._next = bNode._next;
  
  bNode._next._previous = aNode;
  
  bNode._next = aNode;
}; 
/**
 * sortメソッド内で呼び出しヘルパーメソッド (private)
 * 指定したノードを先頭に移動する。引数の例外チェックを省略している。
 * @param {$.LinkedListNode} aNode
 * @param {$.LinkedListNode} bNode
 */
$.LinkedList.prototype.moveNodeFirstInSort = function(node) {
  //nodeの前後ノードの更新
  node._previous._next = node._next;
  if (node._next == null) {
    this._last = node._previous;
  }
  else {
    node._next._previous = node._previous;
  }
  
  node._previous = null;
  node._next = this._first;
  node._next._previous = node;
  
  this._first = node;
}; 

/**
 * dump
 */
$.LinkedList.prototype.dump = function() {
  var target;
  var str = "";
  var index = 0;
  for(target = this._first;
    target != null;
    target = target._next)
  {
    str += "[" + index + "] =>" +target.value.toString() + "\n";
    index++;
  }
};

}());


























