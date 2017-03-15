/**
 * rl_memorystream.js
 * (C) 2014-2017 Daichi Aihara
 * licensed under the MIT license
 * 
 * メモリ内容を読み書きするための容量拡張可能なストリーム
 */

//declare namespace
SL.namespace("RL");
SL.code(function($ = RL) {

// --------------------------------------------------

/**
 * Constants 
 */
$.BASE64_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
$.BASE64_URL_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
$.BINARY_WRITE_BUFFER_CAPACITY = 256;
$.MEMORY_STREAM_EXTEND_CAPACITY_RATE = 2;
$.MEMORY_STREAM_DEFAULT_CAPACITY = 256;

$.SEEK_BEGIN   = 0;
$.SEEK_CURRENT = 1;
$.SEEK_END     = 2;
// --------------------------------------------------

/**
 * 実行環境がリトルエンディアンか
 */
$.IS_LITTLE_ENDIAN = (function() {
  var arr32 = new Uint32Array(1);
  var arr8 = new Uint8Array(arr32.buffer);
  arr32[0] = 1;
  if (arr8[0] == 1) {
    return true;
  }
  return false;
}());

// --------------------------------------------------

/**
 * MemoryStream Class 
 * 
 * Overloads
 *   $.MemoryStream $.MemoryStream();
 *   デフォルトの初期容量を持つ空のストリームを作成します.
 * 
 *   $.MemoryStream $.MemoryStream(int capacity);
 *   指定した初期容量を持つ空のストリームを作成します.
 *   @param {int} capacity
 *  
 *   $.MemoryStream $.MemoryStream(string base64Str);
 *   Base 64形式の文字列をデコードしたストリームを作成します.
 *   @param {string} base64Str
 * 
 *   $.MemoryStream $.MemoryStream(ArrayBuffer buffer, bool copyData = false);
 *   指定したArrayBufferを基にしたストリームを作成します.
 *   @param {ArrayBuffer} buffer
 *   @param {bool} copyData falseが渡された場合bufferを対象としたストリームを作成します.trueが渡された場合bufferを複製したものを対象としたストリームを作成します.
 *
 *   $.MemoryStream $.MemoryStream(TypedArray array, bool copyData = false);
 *   指定したTypedArrayを基にしたストリームを作成します.
 *   @param {TypedArray} array
 *   @param {bool} copyData falseが渡された場合arrayを対象としたストリームを作成します.trueが渡された場合arrayを複製したものを対象としたストリームを作成します.
 */
$.MemoryStream = function(arg, copyData) {
  // 初期容量指定による初期化
  if (typeof arg === "undefined" || typeof arg === "number") {
    var capacity = arg | 0;
    if (capacity < 1) capacity = $.MEMORY_STREAM_DEFAULT_CAPACITY;
    this._capacity = capacity;
    this._bytes = new Uint8Array(capacity);
    this._length = 0;
  }
  // Base64文字列による初期化
  else if (typeof arg === "string") {
    try {
      var bytes = $.decodeBase64(arg);
    }
    catch (err) {
      console.log(err);
      throw new Error("cannot decode string as base64.");
    }
    this._bytes = bytes;
    this._length = bytes.length;
    this._capacity = bytes.length;
  }
  // ArrayBufferによる初期化
  else if (ArrayBuffer.prototype.isPrototypeOf(arg)) {
    if (copyData) {
      this._bytes = new Uint8Array(new Uint8Array(buffer));
    }
    else {
      this._bytes = new Uint8Array(buffer);
    }
    this._length = bytes.length;
    this._capacity = bytes.length;
  }
  // TypedArray による初期化
  else if (TypedArray.prototype.isPrototypeOf(arg)) {
    if (copyData) {
      this._bytes = new Uint8Array(array);
    }
    else {
      this._bytes = new Uint8Array(array.buffer, array.bufferOffset, array.bufferLength);
    }
    this._length = bytes.length;
    this._capacity = bytes.length;
  }
  else {
    throw new Error("invalid arguments.");
  }
  
  this._isLittleEndian = false;
  this._position = 0;
  this._dataView = new DataView(this._bytes.buffer);
};

/*
 * Properties 
 */
Object.defineProperties($.MemoryStream.prototype, {
  /**
   * length (readonly)
   * ストリームの長さをbyte単位で返します.
   */
  "length" : {
    get : function() { return this._length; },
  },
  /**
   * position (readonly)
   * 現在のストリームの参照位置を返す.
   */
  "position" : {
    get : function() { return this._position; },
  },
  /**
   * data (readonly)
   * ストリームの基となっているメモリ領域をUint8Arrayとして返す
   */
  "data" : {
    get : function() {
    if (this._length == this._capacity) {
      return this._bytes;
    }
    else {
      return this._bytes.subarray(0, this._length);
    }
    },
  },
  
  /**
   * isLittleEndian
   * バイトオーダーをリトルエンディアンとして扱うか
   */
  "isLittleEndian" : {
    get : function() { return this._isLittleEndian; },
    set : function(value) {
    this._isLittleEndian = !!value;
    },
  },
});

/**
 * fromASCIIString
 * ASCII文字列からMemoryStreamを作成
 * @param {String} str ASCII文字列(文字コード0-127)
 */
$.MemoryStream.fromASCIIString = function(str) {
  if (typeof arg !== "string") {
    throw new Error("invalid type argument.");
  }
  
  var i;
  var len = str.length;
  for (i = 0; i < len; i++) {
    if (str.charCodeAt(i) > 127) {
      throw new Error("argument is not ASCII string.");
    }
  }
  
  var stream = new $.MemoryStream(len);
  var data = stream._bytes;
  for (i = 0; i < len; i++) {
    data[i] = str.charCodeAt(i);
  }
  
  return stream;
};

/**
 * fromBase64String
 * Base64文字列からMemoryStreamを作成
 * @param {String} str Base64形式の文字列
 */
$.MemoryStream.fromBase64String = function(str) {
  try {
    return new $.MemoryStream(str);
  }
  catch (e) {
    throw e;
  }
};

/**
 * extend
 * メモリ容量の拡大
 * @param {int} newCapacity 拡大後の容量をbyte単位で指定する.現在の容量以下の値が指定された場合このメソッドは何も行わない.
 */
$.MemoryStream.prototype.extend = function(newCapacity) {
  newCapacity = newCapacity | 0;
  if (newCapacity <= this._capacity) {
    return;
  }
  var newBytes = new Uint8Array(newCapacity);
  newBytes.set(this._bytes, 0);
  
  this._capacity = newCapacity;
  this._bytes = newBytes;
  this._dataView = new DataView(newBytes.buffer);
};

/**
 * save
 * ストリームの内容を保存(ダウンロード)する (window)
 */
$.MemoryStream.prototype.save = function(fileName, mimeType) {
  var downloadLink = document.createElement('a');
  var href = "data:";
  if (mimeType) {
    href += mimeType + ";";
  }
  href += "base64," + this.base64Encode();
  
  downloadLink.download = fileName;
  downloadLink.href = href;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};

/**
 * encodeBase64
 * ストリームの内容をbase64形式にエンコードする.
 */
$.MemoryStream.prototype.encodeBase64 = function() {
  return $.encodeBase64(this.data);
};

/** 
 * seek
 * ストリームの現在位置を変更する.
 * param {Number} offset 新しいストリーム位置をoriginからの相対位置で指定する.
 * param {Number} origin 位置指定の基準となる点。$.SEEK_BEGIN, $.SEEK_CURRENT, $.SEEK_ENDから指定する.
 */
$.MemoryStream.prototype.seek = function(offset, origin) {
  var newPosition;
  if (origin == $.SEEK_BEGIN) {
    newPosition = offset;
  }
  else if (origin == $.SEEK_END){
    newPosition = offset + this._length;
  }
  else {
    newPosition = offset + this._position;
  }
  
  if (newPosition < 0) {
    throw new Error("OutOfRangeException");
  }
  else if (newPosition > this._length) {
    throw new Error("OutOfRangeException");
  }
  
  this._position = newPosition;
};

/**
 * isEndOfStream
 * 現在のストリーム位置がストリーム末尾に達しているか返す
 * @return {bool} 末尾に達していたらtrue
 */
$.MemoryStream.prototype.isEndOfStream = function() {
  return this._position >= this._length;
};

/**
 * readInt8
 * 現在のストリーム位置から8bit符号付き整数として読み込み、その分ストリーム位置を進める.
 */
$.MemoryStream.prototype.readInt8 = function() {
  var value = this._dataView.getUint8(this._position);
     
  this._position += 1;
  if (this._position > this._length) {
    this._position = this._length;
  }
  
  return value;
};

/**
 * readUint8
 * 現在のストリーム位置から8bit符号無し整数として読み込み、その分ストリーム位置を進める.
 */
$.MemoryStream.prototype.readUint8 = function() {
  var value = this._dataView.getUint8(this._position);
  
  this._position += 1;
  if (this._position > this._length) {
    this._position = this._length;
  }
  
  return value;
};

/**
 * readInt16
 * 現在のストリーム位置から16bit符号付き整数として読み込み、その分ストリーム位置を進める.
 */
$.MemoryStream.prototype.readInt16 = function() {
  var value = this._dataView.getInt16(this._position, _isLittleEndian);
  
  this._position += 2;
  if (this._position > this._length) {
    this._position = this._length;
  }
  
  return value;
};

/**
 * readUint16
 * 現在のストリーム位置から8bit符号無し整数として読み込み、その分ストリーム位置を進める.
 */
$.MemoryStream.prototype.readUint16 = function() {
  var value = this._dataView.getUint16(this._position, _isLittleEndian);
  
  this._position += 2;
  if (this._position > this._length) {
    this._position = this._length;
  }
  
  return value;
};

/**
 * readInt32
 * 現在のストリーム位置から32bit符号付き整数として読み込み、その分ストリーム位置を進める.
 */
$.MemoryStream.prototype.readInt32 = function() {
  var value = this._dataView.getInt32(this._position, this._isLittleEndian);
  
  this._position += 4;
  if (this._position > this._length) {
    this._position = this._length;
  }
  
  return value;
};

/**
 * readUInt32
 * 現在のストリーム位置から32bit符号無し整数として読み込み、その分ストリーム位置を進める.
 */
$.MemoryStream.prototype.readUint32 = function() {
  var value = this._dataView.getUint32(this._position, _isLittleEndian);
  
  this._position += 4;
  if (this._position > this._length) {
    this._position = this._length;
  }
  
  return value;
};

/**
 * readFloat32
 * 現在のストリーム位置から32bit浮動小数点数として読み込み、その分ストリーム位置を進める.
 */
$.MemoryStream.prototype.readFloat32 = function() {
  var value = this._dataView.getFloat32(this._position, _isLittleEndian);
  
  this._position += 4;
  if (this._position > this._length) {
    this._position = this._length;
  }
  
  return value;
};

/**
 * readFloat64
 * 現在のストリーム位置から64bit浮動小数点数として読み込み、その分ストリーム位置を進める.
 */
$.MemoryStream.prototype.readFloat32 = function() {
  var value = this._dataView.getFloat64(this._position, _isLittleEndian);
  
  this._position += 8;
  if (this._position > this._length) {
    this._position = this._length;
  }
  
  return value;
};

/**
 * readStringAsUTF8
 * Overloads
 *   readStringAsUTF8()
 *   現在のストリーム位置から終端文字(\0)またはストリーム末尾までをUTF-8文字列として読み込む
 *
 *   readStringAsUTF8(length)
 *   現在のストリーム位置からlength byte分UTF-8文字列として読み込む
 */
$.MemoryStream.prototype.readStringAsUTF8 = function(length) {
  if (length === undefined) {
    return this.readStringAsUTF8NullTerminated();
  }
  else {
    return this.readStringAsUTF8WithLength(length);
  }
};
$.MemoryStream.prototype.readStringAsUTF8NullTerminated = function(length) {
  var endPoint = this._position;
  while (endPoint < this._length) {
    if (this._bytes[endPoint++] == 0) {
      break;
    }
  }
  
  var str = createStringFromUTF8Bytes(this._bytes.subarray(this._position, endPoint-1));
  this._position = endPoint;
  return str;
};
$.MemoryStream.prototype.readStringAsUTF8WithLength = function(length) {
  length = length | 0;
  if (this._position + length > this._length) {
    length = this._length - this._position;
  }
  
  var str = createStringFromUTF8Bytes(this._bytes.subarray(this._position, this._position + length));
  this._position += length;
  return str;
};

/**
 * writeArrayBuffer
 * 現在のストリーム位置から指定されたArrayBufferの内容を書き込み、その分ストリーム位置を進める.
 */
$.MemoryStream.prototype.writeArrayBuffer = function(buffer) {
  if (this._position + buffer.byteLength > this._capacity) {
    this.extend((this._position + buffer.byteLength) * $.MEMORY_STREAM_EXTEND_CAPACITY_RATE);
  }
  this._bytes.set(new Uint8Array(buffer), this._position);
  this._position += buffer.byteLength;
  if (this._length < this._position) {
    this._length = this._position;
  }
};

/**
 * writeBytes
 * 現在のストリーム位置から指定されたTypedArrayの内容を書き込み、その分ストリーム位置をすすめる.
 * (この際のバイトオーダーはisLittleEndianプロパティではなくTypedArrayに依存する.)
 */
$.MemoryStream.prototype.writeBytes = function(bytes) {
  if (this._position + bytes.byteLength > this._capacity) {
    this.extend((this._position + bytes.byteLength) * $.MEMORY_STREAM_EXTEND_CAPACITY_RATE);
  }
  this._bytes.set(bytes, this._position);
  this._position += bytes.byteLength;
  if (this._length < this._position) {
    this._length = this._position;
  }
};

/**
 * writeInt8
 * 現在のストリーム位置に8bit符号付き整数を書き込み、その分ストリーム位置をすすめる.
 */
$.MemoryStream.prototype.writeInt8 = function(value) {
  if (this._position >= this._capacity) {
    this.extend((this._position + 1) * $.MEMORY_STREAM_EXTEND_CAPACITY_RATE);
  }
  this._dataView.setInt8(this._position, value);
  this._position += 1;
  if (this._length < this._position) {
    this._length = this._position;
  }
};

/**
 * writeUint8
 * 現在のストリーム位置に8bit符号無し整数を書き込み、その分ストリーム位置をすすめる.
 */
$.MemoryStream.prototype.writeUint8 = function(value) {
  if (this._position >= this._capacity) {
    this.extend((this._position + 1) * $.MEMORY_STREAM_EXTEND_CAPACITY_RATE);
  }
  this._dataView.setUint8(this._position, value);
  this._position += 1;
  if (this._length < this._position) {
    this._length = this._position;
  }
};

/**
 * writeInt16 
 * 現在のストリーム位置に16bit符号付き整数を書き込み、その分ストリーム位置をすすめる.
 */
$.MemoryStream.prototype.writeInt16 = function(value) {
  if (this._position + 2 > this._capacity) {
    this.extend((this._position + 2) * $.MEMORY_STREAM_EXTEND_CAPACITY_RATE);
  }
  this._dataView.setInt16(this._position, value, this._isLittleEndian);
  this._position += 2;
  if (this._length < this._position) {
    this._length = this._position;
  }
};

/**
 * writeUint16 
 * 現在のストリーム位置に16bit符号無し整数を書き込み、その分ストリーム位置をすすめる.
 */
$.MemoryStream.prototype.writeUint16 = function(value) {
  if (this._position + 2 > this._capacity) {
    this.extend((this._position + 4) * $.MEMORY_STREAM_EXTEND_CAPACITY_RATE);
  }
  this._dataView.setUint16(this._position, value, this._isLittleEndian);
  this._position += 2;
  if (this._length < this._position) {
    this._length = this._position;
  }
};

/**
 * writeInt32 
 * 現在のストリーム位置に32bit符号付き整数を書き込み、その分ストリーム位置をすすめる.
 */
$.MemoryStream.prototype.writeInt32 = function(value) {
  if (this._position + 4 > this._capacity) {
    this.extend((this._position + 4) * $.MEMORY_STREAM_EXTEND_CAPACITY_RATE);
  }
  this._dataView.setInt32(this._position, value, this._isLittleEndian);
  this._position += 4;
  if (this._length < this._position) {
    this._length = this._position;
  }
};

/**
 * writeUint32 
 * 現在のストリーム位置に32bit符号無し整数を書き込み、その分ストリーム位置をすすめる.
 */
$.MemoryStream.prototype.writeUint32 = function(value) {
  if (this._position + 4 > this._capacity) {
    this.extend((this._position + 4) * $.MEMORY_STREAM_EXTEND_CAPACITY_RATE);
  }
  this._dataView.setUint32(this._position, value, this._isLittleEndian);
  this._position += 4;
  if (this._length < this._position) {
    this._length = this._position;
  }
};

/**
 * writeFloat32 
 * 現在のストリーム位置に32bit浮動小数点数を書き込み、その分ストリーム位置をすすめる.
 */
$.MemoryStream.prototype.writeFloat32 = function(value) {
  if (this._position + 4 > this._capacity) {
    this.extend((this._position + 4) * $.MEMORY_STREAM_EXTEND_CAPACITY_RATE);
  }
  this._dataView.setFloat32(this._position, value, this._isLittleEndian);
  this._position += 4;
  if (this._length < this._position) {
    this._length = this._position;
  }
};

/**
 * writeFloat64 
 * 現在のストリーム位置に64bit浮動小数点数を書き込み、その分ストリーム位置をすすめる.
 */
$.MemoryStream.prototype.writeFloat64 = function(value) {
  if (this._position + 8 > this._capacity) {
    this.extend((this._position + 8) * $.MEMORY_STREAM_EXTEND_CAPACITY_RATE);
  }
  this._dataView.setFloat64(this._position, value, this._isLittleEndian);
  this._position += 8;
  if (this._length < this._position) {
    this._length = this._position;
  }
};

/**
 * writeStringAsUTF8
 * 現在のストリーム位置に文字列をUTF-8エンコーディングで書き込み、その分ストリーム位置をすすめる.
 * @param {string} str 書き込む文字列
 */
$.MemoryStream.prototype.writeStringAsUTF8 = function(str) {
  var utf8Bytes = $.createUTF8BytesFromString(str);
  this.writeBytes(utf8Bytes);
};

// ----------------------------------------

/**
 * createUTF8BytesFromString
 * StringオブジェクトをUTF8コード列に変換しUint8Arrayとして返す
 * @param {String} 変換する文字列
 * @returns {Uint8Array} 変換されたバイト列
 */
$.createUTF8BytesFromString = function(str) {
  var i, j;
  var strLen = str.length;
  
  //変換結果を代入するUint8配列
  //変換後のバイト数はせいぜいUTF16コード数 * 3
  //配列サイズをきっちり合わせる場合はループを2度回す必要がある
  var utf8Bytes = new Uint8Array(strLen * 3);
  var utf8Length = 0;
  
  //Unicodeポイント
  var code;
  //サロゲートペア
  var high, low;
  //Unicodeポイントに対応するUTF-8コード列
  var bytes = new Uint8Array(4);
  var bytesLen;
  
  i = 0;
  while (i < strLen) {
    code = str.charCodeAt(i++);
    //surrogate
    if ( 0xD800 <= code && code <= 0xDFFF ) {
      high = code;
      low = str.charCodeAt(i++);
      
      code = 0x10000 + (high - 0xD800) * 0x400 + (low - 0xDC00);
    }
    
    bytesLen = unicodeToUTF8Bytes(code, bytes);
    
    for (j = 0; j < bytesLen; j++) {
      utf8Bytes[utf8Length++] = bytes[j];
    }
  }
  
  return utf8Bytes.subarray(0, utf8Length);
};

/**
 * UnicodeポイントからUTF-8形式のバイト列を返す 
 * @param {int} code 変換するUnicodeポイント値
 * @param {Uint8Array} result 変換結果を代入するUint8Array(lengthが4以上)
 * @returns {int} 総バイト数
 */
function unicodeToUTF8Bytes(code, result) {
  if (code <= 0x7F) {
    result[0] = code;
    return 1;
  }
  else if (code <= 0xD77) {
    result[0] = 0xC0 | (code >>> 6);
    result[1] = 0x80 | (code & 0x3F);
    return 2;
  }
  else if (code <= 0xFFFF) {
    result[0] = 0xE0 | (code >>> 12);
    result[1] = 0x80 | ((code >>> 6) & 0x3F);
    result[2] = 0x80 | (code & 0x3F);
    return 3;
  }
  else if (code <= 0x10FFFF) {
    result[0] = 0xF0 | (code >>> 18);
    result[1] = 0x80 | ((code >>> 12) & 0x3F);
    result[2] = 0x80 | ((code >>> 6) & 0x3F);
    result[3] = 0x80 | (code & 0x3F);
    return 4;
  }
  
  return 0;
};

/**
 * checkValidUTF8String
 */
function checkValidUTF8String(bytes, result) {
  if (!result) {
    result = {};
  }
  
  var hasBOM;
  var yPart;
  var utf8Len = bytes.length;
  var utf16Len = 0;
  var ptr = 0;
  var code;
  var isValid = true;
  
  //check BOM
  if (bytes.length >= 3 &&
      bytes[ptr] == 0xEF &&
      bytes[ptr+1] == 0xBB &&
      bytes[ptr+2] == 0xBF)
  {
    hasBOM = true;
    ptr += 3;
  }
  else {
    hasBOM = false;
  }

  while (ptr < utf8Len) {
    code = bytes[ptr++];
    //1byte - ASCII
    if (code == 0) {
      isValid = false;
      break;
    }
    if (code <= 0x7f) {
      continue;
    }
    //2byte
    else if (0xC2 <= code && code <= 0xDF) {
      //
      code = bytes[ptr++];
      if ( !(0x80 <= code && code <= 0xBF) ) {
          isValid = false;
          break;
      }
      //
      continue;
    }
    //3byte
    else if (0xE0 < code && code <= 0xEF) {
      yPart  = (code&0x0F) << 1;
      //
      code = bytes[ptr++];
      if ( !(0x80 <= code && code <= 0xBF) ) {
          isValid = false;
          break;
      }
      yPart  = yPart | ( (code >> 5)&0x01 );
      if (yPart == 0x00 ||
         yPart == 0x1B)   /* 11011 surrogate code*/
      {
          isValid = false;
          break;
      }
      //
      code = bytes[ptr++];
      if ( !(0x80 <= code && code <= 0xBF) ) {
          isValid = false;
          break;
      }
      //
      continue;
    }
    //4byte
    else if (0xF0 <= code && code <= 0xF7) {
      yPart  = (code&0x07) << 2;
      //
      code = bytes[ptr++];
      if ( !(0x90 <= code && code <= 0xBF) ) {
          isValid = false;
          break;
      }
      yPart  = yPart | ( (code >> 4)&0x03 );
      if (yPart == 0x00 ||
         yPart >= 0x11) /* over +U10FFFF*/
      {
          isValid = false;
          break;
      }
      //
      code = bytes[ptr++];
      if ( !(0x80 <= code && code <= 0xBF) ){
          isValid = false;
          break;
      }
      //
      code = bytes[ptr++];
      if ( !(0x80 <= code && code <= 0xBF) ){
          isValid = false;
          break;
      }
      //
      continue;
    }
    //error
    else {
      isValid = false;
      break;
    }
  }

  if (!isValid) {
    result.isValid = false;
    return;
  }
  
  result.isValid = true;
  result.hasBOM = hasBOM;
  return result;
}

/**
 * createStringFromUTF8Bytes
 */
function createStringFromUTF8Bytes(bytes) {
  var checkValidResult = checkValidUTF8String(bytes);

  var utf8Len = bytes.length;
  var code = 0;
  var surrogateHi, surrogateLow;
  var ptr = 0;
  var str = "";
  
  if (! checkValidResult.isValid ) {
    return "";
  }

  //skip BOM
  if (checkValidResult.hasBOM) {
    ptr += 3;
  }
  //decoding
  while (ptr < utf8Len) {
    code = bytes[ptr++];
    //1byte - (U+0000 _ U+007F)
    if (code <= 0x7f) {
      str += String.fromCharCode(code);
      continue;
    }
    //2byte - (U+0080 … U+07FF)
    else if (0xC2 <= code && code <= 0xDF) {
      code  = (code&0x1F) << 6;
      code  = code | (bytes[ptr++]&0x3F);
      str += String.fromCharCode(code);
    }
    //3byte - (U+0800 … U+FFFF)
    else if (0xE0 <= code && code <= 0xEF) {
      code  = (code&0x0F) << 12;
      code  = code | ((bytes[ptr++]&0x3F) << 6);
      code  = code | (bytes[ptr++]&0x3F);
      str += String.fromCharCode(code);
    }
    //4byte
    else if (0xF0 <= code && code <= 0xF7) {
      code  = (code&0x0F) << 18;
      code  = code | ((bytes[ptr++]&0x3F) << 12);
      code  = code | ((bytes[ptr++]&0x3F) << 6);
      code  = code | (bytes[ptr++]&0x3F);

      surrogateHi  = (code - 0x10000) / 0x400 + 0xD800;
      surrogateLow = (code - 0x10000) % 0x400 + 0xDC00;

      str += String.fromCharCode(surrogateHi);
      str += String.fromCharCode(surrogateLow);
    }
    //error
    else {
      return "";
    }
  }

  return str;
}

// Base64 character -> 6bit unsinged int
var _BASE64_CHARCODE_TO_UINT6_TABLE = null;
function BASE64_CHARCODE_TO_UINT6_TABLE() {
  if (!_BASE64_CHARCODE_TO_UINT6_TABLE) {
    var i;
    _BASE64_CHARCODE_TO_UINT6_TABLE = new Uint8Array(123);
    for (i = 0; i < $.BASE64_TABLE.length; i++) {
      _BASE64_CHARCODE_TO_UINT6_TABLE[$.BASE64_TABLE.charCodeAt(i)] = i;
    }
    for (i = 0; i < $.BASE64_URL_TABLE.length; i++) {
      _BASE64_CHARCODE_TO_UINT6_TABLE[$.BASE64_TABLE.charCodeAt(i)] = i;
    }
  }
  return _BASE64_CHARCODE_TO_UINT6_TABLE;
}

/**
 * decodeBase64
 * Base64形式の文字列をデコードしUint8Arrayとして返す
 * @param {base64Str} デコードするBase64形式文字列
 */
$.decodeBase64 = function(base64Str) {
  if (typeof base64Str !== "string") {
    throw new Error("the argument is not a Base64 encoded string.");
  }
  var matches = base64Str.match(/^([A-Za-z0-9+/]*)=*$/);
  if (!matches) {
    throw new Error("the argument is not a Base64 encoded string.");
  }
  base64Str = matches[1];
  
  var bytes = new Uint8Array( Math.floor(base64Str.length * 3 / 4) );
  var blankLength = base64Str.length % 4;
  var blankTop = base64Str.length - blankLength;
  var table = BASE64_CHARCODE_TO_UINT6_TABLE();
  var i;
  var code0, code1, code2, code3;
  var readPtr = 0;
  var writePtr = 0;
  
  while (readPtr < blankTop) {
    code0 = table[base64Str.charCodeAt(readPtr++)];
    code1 = table[base64Str.charCodeAt(readPtr++)];
    code2 = table[base64Str.charCodeAt(readPtr++)];
    code3 = table[base64Str.charCodeAt(readPtr++)];
    bytes[writePtr++] = (code0 << 2) | (code1 >>> 4);
    bytes[writePtr++] = ((code1 << 4) | (code2 >>> 2)) & 0xFF;
    bytes[writePtr++] = ((code2 << 6) | code3) & 0xFF;
  }
  
  if (blankLength == 2) {
    code0 = table[base64Str.charCodeAt(readPtr++)];
    code1 = table[base64Str.charCodeAt(readPtr)];
    bytes[writePtr] = (code0 << 2) | (code1 >>> 4);
  }
  else if (blankLength == 3) {
    code0 = table[base64Str.charCodeAt(readPtr++)];
    code1 = table[base64Str.charCodeAt(readPtr++)];
    code2 = table[base64Str.charCodeAt(readPtr)];
    bytes[writePtr++] = (code0 << 2) | (code1 >>> 4);
    bytes[writePtr] = ((code1 << 4) | (code2 >>> 2)) & 0xFF;
  }
  
  return bytes;
};

/**
 * encodeBase64
 * Uint8ArrayによるバイナリをBase64エンコードする.
 * @param {Uint8Array} bytes エンコードするバイナリ
 * @param {bool} isUrlEncode Base64 URL形式にエンコードするか(false)
 * @return {string} Base64エンコードされたテキスト 
 */
$.encodeBase64 = function(bytes, isUrlEncode) {
  var table = (isUrlEncode === true) ? $.BASE64_URL_TABLE : $.BASE64_TABLE;
  var base64Str = "";
  var chunkCount = Math.floor(bytes.length / 3);
  var code;
  var bytesPtr = 0;
  var i;
  
  for (i = 0; i < chunkCount; i++) {
    base64Str +=
        table.charAt( (bytes[bytesPtr] >>> 2) & 0x3F)
      + table.charAt( (bytes[bytesPtr] << 4 | bytes[bytesPtr + 1] >>> 4) & 0x3F)
      + table.charAt( (bytes[bytesPtr + 1] << 2 | bytes[bytesPtr + 2] >>> 6) & 0x3F)
      + table.charAt( (bytes[bytesPtr + 2]) & 0x3F);
    bytesPtr += 3;
  }
  
  //last chunk
  var blank = bytes.length - bytesPtr;
  if (blank == 1) {
    base64Str += table.charAt( (bytes[bytesPtr] >>> 2) & 0x3F)
               + table.charAt( (bytes[bytesPtr] << 4) & 0x3F)
               + "==";
  }
  else if (blank == 2) {
    base64Str += table.charAt( (bytes[bytesPtr] >>> 2) & 0x3F)
               + table.charAt( (bytes[bytesPtr] << 4 | bytes[bytesPtr + 1] >>> 4) & 0x3F)
               + table.charAt( (bytes[bytesPtr + 1] << 2) & 0x3F)
               + "=";
  }
  
  return base64Str;
};


});





