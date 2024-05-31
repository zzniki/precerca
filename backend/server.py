from sys import flags
from flask import Flask
from flask_threaded_sockets import Sockets, ThreadedWebsocketServer
import handtracker
import threading
import sys
import os
import json

IP = "0.0.0.0"
PORT = 8443

RECORD = False
TARGETFRAMES = 100

recordOutput = ""
recordedFrames = 0

if (len(sys.argv) >= 2):
    if (sys.argv[1].lower() == "rec"):
        print("[INFO] Starting in recording mode")

        RECORD = True
        TARGETFRAMES = int(sys.argv[2])

print("[INFO] Loading labels...")
f = open("labels.json", "r")
labels = json.load(f)
f.close()

app = Flask(__name__)
sockets = Sockets(app)

@sockets.route("/detect")
def detect(ws):

    currentData = ""

    while (not ws.closed):
        rawFrame = ws.receive()
        
        processFrame(rawFrame, ws)

def processFrameInThread(data, ws):
    t = threading.Thread(target=processFrame, args=(data, ws,))
    t.start()

def processFrame(frameData, ws):

    global recordedFrames, recordOutput

    splitData = frameData.split(",")

    for i, elem in enumerate(splitData):
        splitData[i] = float(elem)

    scrapedData = [splitData[i:i + 3] for i in range(0, len(splitData), 3)] # Split data into chunks of 3

    if (RECORD):
        for landmark in scrapedData:
            for point in landmark:
                recordOutput += str(point) + " "
            
        recordOutput = recordOutput[:-1] + "\n"

        recordedFrames += 1

        if (recordedFrames >= TARGETFRAMES):

            print("[INFO] Saving recording...")

            recordOutput = recordOutput[:-1]

            f = open("dataset/recorded.hand", "w+")
            f.write(recordOutput)
            f.close()

            print("[INFO] Saved!")

            os._exit(1)


    if (not RECORD):
        label, perc = handtracker.predictData([scrapedData])

        if (label in labels):
            ws.send(labels[label])


    
srv = ThreadedWebsocketServer(IP, PORT, app, ssl_context="adhoc")
srv.serve_forever()