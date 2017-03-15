/**
 * domdescriptor.js
 * 
 * スクリプトによるDOM作成ためのクラス
 */

SL.namespace("RL.DOMDescriptor");
SL.code(function($ = RL.DOMDescriptor) {

$.create = function(description) {
  var result = {};
  var rootElement = _parseDescription(description, result);
  
  return result;
}


var _parseDescription = function(description, map) {
  if(description instanceof window.Element) {
    return description;
  }
  
  var element = description.element;
  if(! element) {
    element = document.createElement(description.type);
  }
  
  if(description.key) {
    map[description.key] = element;
  }
  
  var children = description.children;
  if(children) {
    for(let i = 0, childDescription; childDescription = children[i]; i++) {
      let child = _parseDescription(childDescription, map);
      element.appendChild(child);
    }
  }
  
  var attributes = description.attributes;
  if(attributes) {
    for(let key in attributes) {
      if(key === "class") {
        element.className = attributes[key];
      }
      else {
        element[key] = attributes[key];
      }
    }
  }
  
  return element;
}

}); // End SL.code;