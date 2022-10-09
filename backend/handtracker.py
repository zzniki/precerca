from turtle import tilt
from typing import final
import cv2
import mediapipe as mp
import time
import numpy as np
import os
import bayes
import time

mpDrawing = mp.solutions.drawing_utils
mpDrawingStyles = mp.solutions.drawing_styles
mpHands = mp.solutions.hands

hands = mpHands.Hands(
    model_complexity=1,
    min_detection_confidence=0.4,
    min_tracking_confidence=0.4
)

recordingStarted = False
recordedFrames = 10000
recordedData = ""

letterTime = 0
lastLetter = ""
letterDone = False
finalText = ""

def processHand(image):
    image.flags.writeable = False
    #image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    start = time.time()

    results = hands.process(image)

    end = time.time()

    processTime = end - start

    return results, processTime

def scrapeData(results):

    handData = [[], []]

    if (results.multi_hand_landmarks != None):
        for i, landmarks in enumerate(results.multi_hand_landmarks):
            for dataPoint in landmarks.landmark:
                pointData = [dataPoint.x, dataPoint.y, dataPoint.y]
                handData[i].append(pointData)
    
    """for i, hand in enumerate(handData):
        if (len(hand) < 21):
            for x in range(21 - len(hand)):
                handData[i].append([0, 0, 0])"""

    handData[1] = [] # TEMPORARY FOR DATA GATHERING IN ONE HAND

    return handData


def showResults(image, results, processTime, label, windowTitle="Hand Tracker"):

    global recordedData, recordedFrames, recordingStarted, recordTime

    image.flags.writeable = True
    #image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    imgHeight, imgWidth, _ = image.shape
    annotatedImage = image.copy()
    blackImage = np.zeros((imgHeight, imgWidth, 3), np.uint8)

    if (results.multi_hand_landmarks != None):

        for i, landmarks in enumerate(results.multi_hand_landmarks):

            mpDrawing.draw_landmarks(
                annotatedImage,
                landmarks,
                mpHands.HAND_CONNECTIONS,
                mpDrawingStyles.get_default_hand_landmarks_style(),
                mpDrawingStyles.get_default_hand_connections_style()
            )

            mpDrawing.draw_landmarks(
                blackImage,
                landmarks,
                mpHands.HAND_CONNECTIONS,
                mpDrawingStyles.get_default_hand_landmarks_style(),
                mpDrawingStyles.get_default_hand_connections_style()
            )

    annotatedImage = cv2.flip(cv2.putText(annotatedImage, "FPS: " + str(int(1 / processTime)), (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2), 1)
    blackImage = cv2.flip(cv2.putText(blackImage, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2), 1, 1)

    concated = np.concatenate((blackImage, annotatedImage), axis=1)
    cv2.imshow(windowTitle, cv2.flip(concated, 1))
    key = cv2.waitKey(1)

    if (key == 13):
        recordTime = time.time()
        recordingStarted = True
        recordedFrames = 0
        recordedData = ""
        print("[INFO] Recording started")
    if (recordedFrames <= 200 and recordingStarted):
        finalText = ""
        scrapedData = scrapeData(result)
        for hand in scrapedData:
            for point in hand:
                finalText += str(point[0]) + " " + str(point[1]) + " " + str(point[2]) + " "

        if (finalText != ""):
            recordedData += finalText[:-1] + "\n"
            recordedFrames += 1

        print("[INFO] Recorded frame: " + str(recordedFrames), end="\r")
    elif (recordedFrames > 200 and recordingStarted):
        recordingStarted = False
        print()
        print("[INFO] Recording stopped")
        filename = input("[INPUT] Sign name: ") + ".txt"
        f = open("dataset/" + filename, "w+")
        f.write(recordedData)
        f.close()
        print("[INFO] Saved to dataset/" + filename)
        reloadDataset()

    if (key == 27):
        cv2.destroyAllWindows()
        os._exit(1)

def reloadDataset():
    global dataset, summary

    print()
    dataset, summary = bayes.load("dataset", debug=True)

def getResultText(label, perc):

    global letterTime, lastLetter, letterDone

    if ("letter" in label):
        letter = label.replace("letter", "").replace("_left", "").replace("_right", "").lower()
        if (lastLetter != letter):
            lastLetter = letter
            letterTime = time.time()
            letterDone = False
        if (time.time() - letterTime >= .5 and not letterDone):
            letterDone = True
            lastLetter = letter
            return letter
        
    return ""

#cap = cv2.VideoCapture(0)

dataset, summary = bayes.load("dataset", debug=True)

def predictData(scrapedData):
    finalArray = []
    for handData in scrapedData[0]:
        finalArray.append(handData[0])
        finalArray.append(handData[1])
        finalArray.append(handData[2])

    emptyArray = []
    for x in range(len(finalArray)):
        emptyArray.append(0.0)

    label = "None"
    perc = 0
    if (finalArray != emptyArray):
        label, perc = bayes.predict(finalArray, dataset, summary)
    
    return label, perc
    
    
    

"""while (cap.isOpened()):
    success, image = cap.read()
    print(type(image))
    if (not success):
        print("error")

    result, processTime = processHand(image)
    scrapedData = scrapeData(result)
    label, perc = predictData(scrapedData)
    newLetter = getResultText(label, perc)

    if (newLetter != ""):
        finalText += newLetter
        print(finalText)


    showResults(image, result, processTime, label)"""
