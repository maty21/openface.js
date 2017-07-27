const fs = require('fs-extra');
const sharp = require('sharp');
const base64Img = require('base64-img');
const socket = require('./socketApi');
const async = require('async');
const ffmpeg =require('fluent-ffmpeg');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const orientationToRotate = {
    1: 0,
    3: 180,
    6: 90,
    8: 270
}
class imageHandler {
    constructor() {
        this.images = null;
    }


async createScreenShotsFromVideo(videoPath,outputPath){
       return new  Promise((res,rej)=>{

        ffmpeg(videoPath)
        .screenshots({
            count: 10,
          filename: 'obamma-at-%s-seconds.jpeg',
          folder: outputPath,
          size: '400x300'
        })
        .on('end', async()=> {
            await delay(5000); 
            res();    
            console.log('Screenshots taken');
          })
          .on('error', (err, stdout, stderr)=> {
            console.log('Cannot process video: ' + err.message);
          rej();
          
          });

       }) 
       

    }

    async  resizeAndStoreImages(inputPath, outputPath, resizeCretieria = { width: 400, height: 300 }) {
        return new Promise(async (res, rej) => {
            this._outputPath = outputPath;
            this._inputPath = inputPath;
            let files = await fs.readdir(inputPath);
            async.eachSeries(files, (file, callback) => {

                console.log('Processing file ' + file);

                let image = sharp(`${inputPath}/${file}`);
                image.metadata().then((metadata) => {


                    return image.resize(resizeCretieria.width, resizeCretieria.height)
                        .ignoreAspectRatio()
                        .rotate(orientationToRotate[metadata.orientation])
                        .toFormat('jpeg')
                        .toFile(`${outputPath}/${file}.jpeg`, (err) => {
                            console.log(file);
                            callback()
                        })




                })

            }, function (err) {
                if (err) {
                    rej()
                    console.log('A file failed to process');
                } else {
                    res()
                    console.log('All files have been processed successfully');
                }
            });
        })
    }

    async  trainForIdentity(address, indentity, ImagePath) {
        return new Promise((res, rej) => {
            socket.init(address, "bla").then(() => {
                socket.on('ready', async () => {
                    socket.addIdentitiy(indentity);
                    await delay(2000);
                    socket.startTraining();
                    try {
                        await this._sendImages(ImagePath);
                        res()
                    } catch (e) {
                        rej()
                    } finally {
                        socket.stopTraining()
                    }

                })
            }).catch(e => {
                console.log('connection not opened')
                console.dir(e);
            });
        })
    }
    async classify(ImagePath) {
        await this._sendImages(ImagePath);
        console.log("imagesSentForClassification");
    }

    
    async _sendImages(ImagePath) {

        return new Promise(async (res, rej) => {
            let files = await fs.readdir(ImagePath);
            async.each(files, (file, callback) => {
                console.log('Processing file ' + file);
                let img = base64Img.base64Sync(`${ImagePath}/${file}`);
                setTimeout(() => {
                    socket.sendFrame(img)
                    callback()
                }, 1000)
            }, function (err) {
                if (err) {
                    rej()
                    console.log('A file failed to process');
                } else {
                    res()
                    console.log('All files have been processed successfully');
                }
            });
        })
    }
}

module.exports = new imageHandler();