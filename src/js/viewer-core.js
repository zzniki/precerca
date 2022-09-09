const handpose = require("@tensorflow-models/handpose");
require("@tensorflow/tfjs-backend-webgl");

var preview = document.getElementById("preview");

var cameraStream = null;
var mediaRecorder = null;

var socket = new WebSocket("ws://2.tcp.ngrok.io:13825/detect");

var loadingScreen = document.getElementById("screen-connecting");
var viewScreen = document.getElementById("screen-preview");

var videoLoder = document.getElementById("video-loader");
var prevErrorScreen = document.getElementById("prev-error");
var prevErrorMsg = document.getElementById("prev-errormsg");

var letterDisplay = document.getElementById("letter-display");
var outputElem = document.getElementById("output-text");
var displayWidth = letterDisplay.scrollWidth;

async function loop(model) {

    const predictions = await model.estimateHands(preview);

    if (predictions.length > 0) {

        console.log(predictions[0].landmarks);
        socket.send(predictions[0].landmarks);

    }

}

async function init() {

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
        preview.srcObject = cameraStream;
    } catch (e) {
        console.log(e);
        hideVideoLoader();
        showPreviewError("Couldn't access camera");
        return;
    }

    console.log("Starting...");

    const model = await handpose.load();

    setInterval(loop, 1000 / 30, model);

    console.log("Started!");
    hideVideoLoader();

}

socket.onopen = function(event) {

    console.log("Connected!");

    loadingScreen.style.opacity = "0";
    loadingScreen.style.visibility = "hidden";

}

socket.onerror = function(event) {

    //console.log(event);

}

function showPreviewError(text) {

    prevErrorScreen.style.display = "flex";
    prevErrorMsg.text = text;

}

function hideVideoLoader() {

    videoLoder.style.display = "none";

}

function addOutputText(text) {

    outputElem.text += text;
    console.log(outputElem.scrollWidth);
    console.log(letterDisplay.scrollWidth);

    if (outputElem.scrollWidth > displayWidth) {

        console.log("overflow");
        outputElem.style.transform = "translateX(-" + (outputElem.scrollWidth - displayWidth).toString() + "px)";

    }

}

init();