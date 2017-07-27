
const EventEmitter = require('events');
const WebSocket = require('ws');
const frameStub = require('./stub')
const base64Img = require('base64-img');
const base64 = require('./base64ToImage');
const jpeg = require('jpeg-js');


const fs = require('fs');
class socketApi extends EventEmitter {
    constructor() {
        super();
        this.socket = null;
        this.imageCounterOutput = 0;
        this.functionsCall = new Proxy({
            "PROCESSED": this._onProcessed.bind(this),
            "NULL": this._onNull.bind(this),
            "NEW_IMAGE": this._onNewImage.bind(this),
            "IDENTITIES": this._onIdentities.bind(this),
            "ANNOTATED": this._onAnnotated.bind(this),
            "TSNE_DATA": this._onTsneData.bind(this)
        },
            {
                get: (t, n) => {
                    console.log(` message:${n} was called`)
                    return t[n]
                }
            })
        this.person = []
        this.callbackFunctions = new Map()

    }

    async init(address, name) {
        console.log("socket started");
        this.socketName = name;
        this.binaryType = "arraybuffer";
        this.sentTimes = [];
        this.receivedTimes = [];
        this.tok = 0;
        this.numNulls = 0
        this.images = [];
        this._initFolders(`./photos/output/anotate`);
        this._initFolders(`./photos/output/rgb`);
        this._initFolders(`./photos/output/png`);
        await this._socketEvents(address, name);



    }
    sendFrame(image) {
        let msg = {
            type: 'FRAME',
            dataURL: image,
            identity: -1
        };
        // this.socket.send(JSON.stringify(msg));

        //this.socket.send(JSON.stringify(frameStub))
        // frameStub.dataURL =image;
        this.socket.send(JSON.stringify(msg))

    }
    startTraining() {
        let msg = {
            type: 'TRAINING',
            val: true
        };
        this.socket.send(JSON.stringify(msg));
    }
    stopTraining() {
        let msg = {
            type: 'TRAINING',
            val: false
        };
        this.socket.send(JSON.stringify(msg));
    }
    addIdentitiy(name) {
        let msg = {
            'type': 'ADD_PERSON',
            'val': name
        };
        this.person.push(name);
        this.socket.send(JSON.stringify(msg));

    }

    _allState() {
        var msg = {
            'type': 'ALL_STATE',
            'images': this.images,
            'people': this.person,
            'training': false
        };
        this.socket.send(JSON.stringify(msg));
    }


    async  _socketEvents(address, name) {

        this.socket = new WebSocket(address);
        this.socket.onopen = () => {
            console.log("Connected to " + name);
            this.receivedTimes = [];
            this.tok = 0;
            this.numNulls = 0
            this.socket.send(JSON.stringify({ 'type': 'NULL' }));
            this.sentTimes.push(new Date());
            this.emit('connect', null);
        }
        this.socket.onmessage = (e) => {
            //   console.log(e);
            let j = JSON.parse(e.data)
            this.functionsCall[j.type](j)
        }
        
        this.socket.onerror = function (e) {
            console.log("Error creating WebSocket connection to " + address);
            console.log(e);
        }
        this.socket.onclose = function (e) {
            if (e.target == this.socket) {
                //   $("#serverStatus").html("Disconnected.");
            }
        }
    }
    _onTsneData(j) {
        console.log("tsne TSNE_DATA")
    }
    _onProcessed(j) {
        this.tok++;
    }
    _onNull() {
        this.receivedTimes.push(new Date());
        this.numNulls++;
        if (this.numNulls == 20) {
            this._allState();
            this.emit('ready', null);
            //  updateRTT();
            //  sendState();
            //   sendFrameLoop();
        } else {
            this.socket.send(JSON.stringify({ 'type': 'NULL' }));
            this.sentTimes.push(new Date());
        }
    }
    _initFolders(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        } else {
            console.log("Directory already exist");
        }
    }

    _onAnnotated(j) {
        this._saveImageAsHtml(`./photos/output/anotate`, 'annotated', this.imageCounterOutput++, j.content)
        console.log("Annotated")
    }
    _saveImageAsHtml(dir, prefix, suffix, contnet) {
        this.imageCounterOutput++
        let htmlFile = `<img alt="Embedded Image" src=${contnet}\>`

        fs.writeFile(`${dir}/${prefix}-${suffix}.html`, htmlFile, function (err) {
            console.log('saved')

        });
    }
    _onNewImage(j) {
        this.images.push({
            hash: j.hash,
            identity: j.identity,
            image: j.content,
            representation: j.representation
        });
        // var data = base64Img.base64Sync('path/demo.png');
        this._rgbTojpeg(`./photos/output`, 'new_image', this.imageCounterOutput++, j.content)
    }
    _onIdentities(j) {
        let len = j.identities.length
        if (len > 0) {
            for (var i = 0; i < len; i++) {
                let identity = "Unknown";
                let idIdx = j.identities[i];
                if (idIdx != -1) {
                    identity = this.person[idIdx];
                }
                console.log(`${identity}`)
                //   h += "<li>" + identity + "</li>";
            }
        } else {
            console.log(`Nobody detected`)
            //   h += "<li>Nobody detected.</li>";
        }
    }

    async _rgbTojpeg(dir, prefix, suffix, rgb) {
        let width = 96, height = 96;
        // let frameData = new Buffer(width * height * 4);
        let i = 0, t = 0;

        let data = new Buffer(width*height*4);
        for (; i < data.length; i += 4) {
            data[i] = rgb[t + 2];
            data[i + 1] = rgb[t + 1];
            data[i + 2] = rgb[t];
            data[i + 3] = 255;
            t += 3;
        }
        // while (i < frameData.length) {
        //   frameData[i++] = 0xFF; // red 
        //   frameData[i++] = 0x00; // green 
        //   frameData[i++] = 0x00; // blue 
        //   frameData[i++] = 0xFF; // alpha - ignored in JPEGs 
        // }
        let rawImageData = {
            data: data,
            width: width,
            height: height
        };
        let jpegImageData = jpeg.encode(rawImageData, 50);
        fs.writeFile(`${dir}/rgb/${prefix}-${suffix}.rgb`, data, 'binary', (err) => {
            if (err) throw err
            console.log('File saved.')
        })
        fs.writeFile(`${dir}/png/${prefix}-${suffix}.jpeg`, jpegImageData.data, 'binary', (err) => {
            if (err) throw err
            console.log('File saved.')
        })

    }
}



module.exports = new socketApi();


