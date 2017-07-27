const fs = require('fs');

function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};
    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }
    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');
    return response;
}




module.exports = function imageDecoder(data, path,callback) {
   // var imageBuffer = decodeBase64Image(data);
   let img = data.replace('data:image/png;base64,','');
   console.log(img.length%4);
   console.log(/[^+a-zA-Z0-9/]/.test(img))
   var decodedData = base64.decode(img); 
   fs.writeFile(path, new Buffer(decodedData,'utf-8'), function (err) {
        console.log('saved')
        callback();
    });

}