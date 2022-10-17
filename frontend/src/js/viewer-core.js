/*const tf = require("@tensorflow/tfjs-core");
require("@tensorflow/tfjs-converter");

require("@tensorflow/tfjs-backend-wasm");

const handpose = require("@tensorflow-models/handpose");*/

import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-core';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-wasm';
import '@mediapipe/hands';

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

var showingVideo = false;
var lastLetter = "";

function getLimits(keyPoints) {

    var minX = 1000;
    var maxX = -1000;
    var minY = 1000;
    var maxY = -1000;
    var minZ = 1000;
    var maxZ = -1000;

    keyPoints.forEach((points) => {

        if (points.x < minX) minX = points.x;
        if (points.x > maxX) maxX = points.x;

        if (points.y < minY) minY = points.y;
        if (points.y > maxY) maxY = points.y;

        if (points.z < minZ) minZ = points.z;
        if (points.z > maxZ) maxZ = points.z;

    });

    return {
        minX: minX,
        maxX: maxX,
        minY: minY,
        maxY: maxY,
        minZ: minZ,
        maxZ: maxZ
    };

}

function normalize(value, min, max) {

    var result = 0.1 + (value - min) / (max - min);

    if (result != NaN) return result;
    else return 0.1;

}

function normalizeV3(vector, limits) {

    return [normalize(vector.x, limits.minX, limits.maxX), 
    normalize(vector.y, limits.minY, limits.maxY), 
    normalize(vector.z, limits.minZ, limits.maxZ)];

}

function normalizeKeypoints(keypoints, limits) {

    var output = [];

    keypoints.forEach((keypoint) => {

        output.push(normalizeV3(keypoint, limits));

    });

    return output;

}

async function loop(detector) {

    const predictions = await detector.estimateHands(preview, {flipHorizontal: false});

    if (predictions.length > 0) {

        const keypoints3D = predictions[0].keypoints3D;
        const limits = getLimits(keypoints3D);
        const normalizedPoints = normalizeKeypoints(keypoints3D, limits);

        var output = "";

        normalizedPoints.forEach((landmark) => {

            landmark.forEach((point) => {

                output += point.toString() + ",";

            });

        });

        output = output.slice(0, -1); // remove last character

        if (!showingVideo) {

            hideVideoLoader();
            showPreviewVideo();
            showingVideo = true;

        }

        socket.send(output);

    }

    /*const predictions = await model.estimateHands(preview);

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
        // resolved

    }*/

    //addOutputText(Math.floor(Math.random() * 9).toString());

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

    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig = {

        runtime: "mediapipe",
        solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands"

    }

    const detector = await handPoseDetection.createDetector(model, detectorConfig);

    console.log("Started...")

    //hands.onResults(onResults);

    //await tf.setBackend("wasm");

    console.log("Loaded backend...");

    //const model = await handpose.load();

    setInterval(loop, 1000 / 15, detector);

    console.log("Started!");

}

socket.onopen = (event) => {

    console.log("Connected!");

    loadingScreen.style.opacity = "0";
    loadingScreen.style.visibility = "hidden";

}

socket.onmessage = (event) => {

    console.log(event.data);

    if (event.data != lastLetter) {

        addOutputText(event.data);

    }

    lastLetter = event.data;

}

socket.onerror = (event) => {

    console.log(event);

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