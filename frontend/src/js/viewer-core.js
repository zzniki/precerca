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

function getLimits(keyPoints) {

    let minX = -1000;
    let maxX = 1000;
    let minY = -1000;
    let maxY = 1000;
    let minZ = -1000;
    let maxZ = 1000;

    keyPoints.forEach((points) => {

        if (points.x < minX) minX = points.x;
        if (points.x > maxX) maxX = points.x;

        if (points.y < minY) minY = points.y;
        if (points.y > maxY) maxY = points.y;

        if (points.z < minY) minY = points.z;
        if (points.z > maxY) maxY = points.z;

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

    return (value - min) / max;

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

    console.log("Loop2");


    const predictions = await detector.estimateHands(preview, {flipHorizontal: false});

    if (predictions.length > 0) {

        const keypoints3D = predictions[0].keypoints3D;
        const limits = getLimits(keypoints3D);
        const normalizedPoints = normalizeKeypoints(keypoints3D, limits);

        console.log("keypoints");
        console.log(keypoints3D);
        console.log("limits");
        console.log(limits);
        console.log("normalized");
        console.log(normalizedPoints);
        console.log("first");
        console.log(normalizedPoints[0]);

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

    }*/

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

    setInterval(loop, 1000 / 30, detector);

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