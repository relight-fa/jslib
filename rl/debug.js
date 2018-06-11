SL.namespace("RL");
SL.code(function($ = RL) {

$.dump = function(value) {
  var manager = new dumpManager();
  return manager.dump(value, "");
}

var dumpManager = class {
  constructor() {
    this.nextId = 0;
    this.processedObjects = new WeakMap();
  }
  
  dump(value, indentStr) {
    var str;
    if (typeof value === "object") {
      // NULL
      if (value === null) {
        return "null"
      }
      // Array
      if (value instanceof Array) {
        if (this.processedObjects.has(value)) {
          return "*Array*";
        }
        this.processedObjects.set(value, this.nextId++);
        str = "[\n";
          for (var i = 0; i < value.length; i++) {
            str += indentStr + "  " + this.dump(value[i], indentStr + "  ");
            str += (i == value.length - 1 ? "\n" : ",\n");
          }
        str += indentStr + "]";
        return str;
      }
      // Object
      if (this.processedObjects.has(value)) {
        return "*Object*";
      }
      this.processedObjects.set(value, this.nextId++);
      var keys = Object.keys(value);
      str = "{\n";
      for (var i = 0; i < keys.length; i++) {
        str += indentStr + "  \"" + keys[i] + "\": "
            + this.dump(value[keys[i]], indentStr + "  ");
        str += (i == keys.length - 1 ? "\n" : ",\n");
      }
      str += indentStr + "}";
      return str;
    }
    else if (typeof value === "string") {
      return "\"" + value + "\"";
    }
    else if (typeof value === "number" || typeof value === "boolean") {
      return value.toString();
    }
    return "";
  }
};



}); // End SL.code;
