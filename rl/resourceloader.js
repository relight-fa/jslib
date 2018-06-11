// Declare namespace
if (typeof RL === "undefined") {
  var RL = {};
}

/**
 * Resource Loader class
 */
RL.ResourceLoader = class _self {
  /**
   * @param {Array} items 以下の形式のオブジェクトの配列
   *     {
   *       key: String リソースのキー
   *       path: String 読み込み元となるファイルパス
   *       type: String リソースの種別. image
   *     }
   * @return 
   */
  constructor(items) {
    this.nodes = [];
    // 読み込み完了したリソースのセット
    this.resources = {};
    
    for (var i = 0; i < items.length; i++) {
      var node = _self.createNode(items[i]);
      this.nodes.push(node);
    }
  }
  
  load() {
    return new Promise((resolve, reject) => {
      if (this.nodes.length == 0) {
        resolve();
      }
      var loadPromises = [];
      for (var i = 0; i < this.nodes.length; i++) {
        var node = this.nodes[i];
        loadPromises.push(node.load());
      }
      Promise.all(loadPromises)
      .then((results) => {
        for (var i = 0; i < results.length; i++) {
          this.resources[results[i].key] = results[i].value;
        }
        resolve(this.resources);
      })
      .catch((reasons) => {
        reject(reasons);
      });
    });
  }
};

RL.ResourceLoader.createNode = function(item) {
  if (item.type == "image") {
    return new RL.ResourceLoader.ImageNode(item);
  }
  else {
    return null;
  }
}

RL.ResourceLoader.ImageNode = class {
  constructor(item) {
    this.path = item.path;
    this.key = item.key;
    this.value = null;
  }
  
  load() {
    return new Promise((resolve, reject) => {
      var image = new Image();
      image.onload = () => {
        this.value = image;
        resolve(this);
      }
      image.onerror = () => {
        reject("Failed to load image: " + this.path);
      }
      image.src = this.path;
    });
  }
};
