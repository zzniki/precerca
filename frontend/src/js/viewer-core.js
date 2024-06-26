import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-core';
// Register Wasm backend.
import '@tensorflow/tfjs-backend-wasm';
import '@mediapipe/hands';

var preview = document.getElementById("preview");

var cameraStream = null;
var mediaRecorder = null;
var camSwitch = false;
var loopInterval = null;
var detector = null;

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
var timesReceived = 0;
var shownLetter = false;

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

        socket.send(output);

    }

    if (!showingVideo) {

        hideVideoLoader();
        showPreviewVideo();
        showingVideo = true;

    }

}

async function init() {

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({video: {facingMode: { exact: "user"}}, audio: false, facingMode: "user"});
        preview.srcObject = cameraStream;
    } catch (e) {
        console.log(e);
        hideVideoLoader();
        showPreviewError(e);
        return;
    }

    console.log("Starting...");

    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig = {

        runtime: "mediapipe",
        solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands"

    }

    detector = await handPoseDetection.createDetector(model, detectorConfig);

    loopInterval = setInterval(loop, 1000 / 10, detector);

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

        timesReceived = 0;
        shownLetter = false;

    }

    if (event.data == lastLetter) {

        timesReceived++;

        if (timesReceived >= 2 && !shownLetter) {

            addOutputText(event.data);
            shownLetter = true;

        }

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

    if (outputElem.scrollWidth >= displayWidth) {

        outputElem.style.transform = "translateX(-" + (outputElem.scrollWidth - displayWidth).toString() + "px)";

    }

}

preview.onclick = async () => {

    clearInterval(loopInterval);
    cameraStream.getTracks().forEach((track) => {track.stop()});

    if (!camSwitch) {
        cameraStream = await navigator.mediaDevices.getUserMedia({video: {facingMode: { exact: "environment"}}, audio: false, facingMode: "enviroment"});
    } else if (camSwitch) {
        cameraStream = await navigator.mediaDevices.getUserMedia({video: {facingMode: { exact: "user"}}, audio: false, facingMode: "user"});
    }

    preview.srcObject = cameraStream;

    loopInterval = setInterval(loop, 1000 / 10, detector);

    camSwitch = !camSwitch;


};

init();
