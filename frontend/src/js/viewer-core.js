/*const tf = require("@tensorflow/tfjs-core");
require("@tensorflow/tfjs-converter");

require("@tensorflow/tfjs-backend-wasm");

const handpose = require("@tensorflow-models/handpose");*/

require("@mediapipe/camera_utils");
require("@mediapipe/control_utils");
require("@mediapipe/drawing_utils");
const handpose = require("@mediapipe/hands");

var preview = document.getElementById("preview");

var cameraStream = null;
var mediaRecorder = null;

var address = "wss://pr.niki.cat:8443/detect";

if (document.location.href.includes("localhost")) address = "ws://localhost:5000/detect";

var socket = new WebSocket(address);

var loadingScreen = document.getElementById("screen-connecting");
var viewScreen = document.getElementById("screen-preview");

var videoLoder = document.getElementById("video-loader");
var prevErrorScreen = document.getElementById("prev-error");
var prevErrorMsg = document.getElementById("prev-errormsg");

var letterDisplay = document.getElementById("letter-display");
var outputElem = document.getElementById("output-text");
var displayWidth = letterDisplay.scrollWidth;

async function loop(model) {

    console.log("Loop3");

    const predictions = await model.estimateHands(preview);

    if (predictions.length > 0) {

        //console.log(predictions[0].landmarks);

        var output = "";

        predictions[0].landmarks.forEach((landmark) => {

            landmark.forEach((point) => {

                output += point.toString() + ",";

            });

        });

        output = output.slice(0, -1);

        console.log(predictions[0].boundingBox);
        console.log(output);
        socket.send(output);

        // the issue: coordinates on the database range from 0 to 1, meanwhile the coordinates
        // from the cam are based on the camera picture size

    }

    addOutputText(Math.floor(Math.random() * 9).toString());

}

function onResults() {

    console.log(results.multiHandLandmarks);

}

async function init() {

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
        preview.srcObject = cameraStream;
    } catch (e) {
        console.log(e);
        hideVideoLoader();
        showPreviewError(e);
        //showPreviewError("Couldn't access camera");
        return;
    }

    console.log("Starting...");

    const hands = new Hands();
    hands.onResults(onResults);

    //await tf.setBackend("wasm");

    console.log("Loaded backend...");

    const camera = new Camera(preview, {

        onFrame: async () => {
            await hands.send({image: preview});
        }

    });

    camera.start();

    //const model = await handpose.load();

    //setInterval(loop, 1000 / 30, model);

    console.log("Started!");
    hideVideoLoader();
    showPreviewVideo();

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

function showPreviewVideo() {

    preview.style.display = "block";

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