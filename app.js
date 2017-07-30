'use strict'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const WebSocket = require('ws');
const socket = require('./socketApi');
const base64Img = require('base64-img');
const imageHandler = require('./imageLoadingAndCorrecting');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const address = 'wss://localhost:9000';



const inputRaw = "/home/matyz/dev/photos/train/raw/maty zisserman";
const outputResized = "/home/matyz/dev/photos/other/api_tests";


const log = (data) => {
    console.log(`#################### ${data} #########################`);
}

// log("ResizingImages")
// imageHandler.resizeAndStoreImages(inputRaw, outputResized).then(async () => {
//     log("ResizingImages completed")
//     await delay(10000);
//     log("training on images")
//     imageHandler.trainForIdentity(address, "maty zisserman", outputResized).then(async () => {
//         log("images trained completed");
//         await delay(3000);
//         log("start classification")
//         imageHandler.classify(outputResized).then(() => {
//             log("classification completed")
//         })
//     });

// });


let videoPath = "/home/matyz/Downloads/obama.mp4";
let outputScreenshotPath = "/home/matyz/dev/photos/other/videos/obama";
// imageHandler.createScreenShotsFromVideo(videoPath, outputScreenshotPath).then(async () => {
//     log('obama screeenshot ended')
//     await delay(5000);
//     imageHandler.trainForIdentity(address, "obama", outputScreenshotPath).then(async () => {
//         log("images trained completed");
//         await delay(3000);
//         log("start classification")
//         imageHandler.classifyImages(outputScreenshotPath).then(() => {
//             log("classification completed")
//         })
//     });

// })
//     .catch(() => {
//         log('obama failed');
//     })


let streamFolder = '/home/matyz/dev/openface_api/photos/bla'
imageHandler.createScreenShotsFromVideo(videoPath, outputScreenshotPath).then(async () => {
    log('obama screeenshot ended')
    await delay(5000);
    imageHandler.trainForIdentity(address, "obama", outputScreenshotPath).then(async () => {
        log("images trained completed");
        await delay(3000);
        log("start classification")
        imageHandler.createScreenShotsFromStream('udp://234.234.234.234:12345', streamFolder, 5, async (path) => {
            //    let fullPath = `${path.folder}/${path.file}`
            let fullPath = path.path;
            log(`image saved ${fullPath}`)
            await delay(10000)
            imageHandler.classifyImage(fullPath).then(() => {
                log("classification completed")
            })
        })
    });

})
    .catch(() => {
        log('obama failed');
    })


// imageHandler.InitSystem(address).then(() => {
//     imageHandler.classifyImages(streamFolder).then(() => {
//         log("classification completed")
//     })
// })




