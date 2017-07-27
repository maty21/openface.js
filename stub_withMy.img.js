
const base64Img = require('base64-img');
let img = base64Img.base64Sync('./photos/1.jpg');
const stub = require('./stub');
stub.dataUrl = img;


module.exports = stub;
