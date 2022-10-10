from concurrent.futures import process
from sys import flags
from threading import Thread
from flask import Flask
from flask_threaded_sockets import Sockets, ThreadedWebsocketServer
import handtracker
import io
import cv2
import numpy as np
import base64
import threading
import sys

IP = "0.0.0.0"

if (len(sys.argv) >= 2):
    PORT = sys.argv[1]
else:
    PORT = 8443

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
    splitData = frameData.split(",")

    for i, elem in enumerate(splitData):
        splitData[i] = float(elem)

    scrapedData = [splitData[i:i + 3] for i in range(0, len(splitData), 3)] # Split data into chunks of 3

    print(scrapedData)
    print("predicting")

    label, perc = handtracker.predictData([scrapedData])

    print("predicted")
    print(label)
    

srv = ThreadedWebsocketServer(IP, PORT, app, ssl_context="adhoc")
srv.serve_forever()