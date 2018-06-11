if (typeof RL === "undefined") {
  var RL = {};
}
if (typeof RL.Image === "undefined") {
  RL.Image = {};
}

/**
 * Image オブジェクトから ImageData オブジェクトの作成
 */
RL.Image.createImageDataFromImage = function(image) {
  if (typeof OffscreenCanvas !== "undefined") {
    var canvas = new OffscreenCanvas(image.width, image.height);
  }
  else {
    var canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
  }
  var context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  var imageData = context.getImageData(0, 0, image.width, image.height);
  return imageData;
}



