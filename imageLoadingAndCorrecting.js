const fs = require('fs-extra');
const sharp = require('sharp');
const base64Img = require('base64-img');
const socket = require('./socketApi');
const async = require('async');
const ffmpeg = require('fluent-ffmpeg');
const { spawn } = require('child_process');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const chokidar = require('chokidar');
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


    async createScreenShotsFromVideo(videoPath, outputPath) {
        return new Promise((res, rej) => {

            ffmpeg(videoPath)
                .screenshots({
                    count: 10,
                    filename: 'obamma-at-%s-seconds.jpeg',
                    folder: outputPath,
                    size: '400x300'
                })
                .on('end', async () => {
                    await delay(5000);
                    res();
                    console.log('Screenshots taken');
                })
                .on('progress', () => {
                    console.log('image saved')

                })
                .on('error', (err, stdout, stderr) => {
                    console.log('Cannot process video: ' + err.message);
                    rej();

                });

        })


    }

    async createScreenShotsFromStream(streamPath, outputFolder, intervalInSecond, callback) {
        let lastFrame = -1;

        await fs.remove(outputFolder)
        await fs.ensureDir(outputFolder)

        let watcher = chokidar.watch(outputFolder, {
            ignored: /(^|[\/\\])\../,
            persistent: true
        });
        watcher.on('add', path => {
            console.log(`$$$$$$$$$$$$$$$$$$$$$$$$$$$$File ${path} has been added`);
            callback({ path:`${path}` })
        })
        var ffmpeg = spawn("ffmpeg", [
            '-i', `${streamPath}`,
            '-vf', `scale=400:300,fps=${intervalInSecond}/60 `,
            `${outputFolder}/img%03d.jpeg` // bitrate to 64k

        ]);
        ffmpeg.on('error', function (err) {
            console.log(err);
        })
        ffmpeg.stderr.on('data', function (data) {
            console.log('stderr: ' + data);

            let arr = data.toString().replace(/\s+/, "").split('frame=')
            if (arr.length == 2) {
                let currentFrame = arr[1].split('fps=')[0];
                if (currentFrame > lastFrame) {
                    currentFrame++;
                    console.log(currentFrame)
                    lastFrame = currentFrame;
                    let PrefImgName = lastFrame > 9 ? '0' : '00'


                    //   callback({ folder: `${outputFolder}`, file: `img${PrefImgName}${lastFrame}.jpeg` });
                }
            }

        })
        ffmpeg.on('close', function (code) {
            console.log('child process exited with code ' + code);
        });
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
    async InitSystem(address) {
        return new Promise((res, rej) => {
            socket.init(address, "bla").then(() => {
                socket.on('ready', async () => {
                    res()
                })
            }).catch(e => {
                console.log('connection not opened')
                console.dir(e);
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
    async classifyImages(ImagesPath) {
        await this._sendImages(ImagesPath);
        console.log("imagesSentForClassification");
    }
    async classifyImage(ImagePath) {
        await this._sendImage(ImagePath);
        console.log("imageSentForClassification");
    }

    async _sendImage(filePath) {
        return new Promise(async (res, rej) => {

            console.log('Processing file ' + filePath);
            let img = base64Img.base64Sync(`${filePath}`);
            await delay(1000);
            socket.sendFrame(img);
        })
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