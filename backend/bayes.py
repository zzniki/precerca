# Gaussian Naive Bayes Algorithm

from distutils.command.sdist import sdist
from distutils.dep_util import newer_group
from multiprocessing.sharedctypes import Value
import os
import math
import sys

DIR = "dataset"

def debugPrint(text, enabledDebug):
    if (enabledDebug):
        print("[INFO] " + str(text))

def mean(numbers): # Mean (mitjana aritmètica)
    return sum(numbers) / float(len(numbers))

def stdev(numbers): # Standard deviation (desviació estàndar)
    avg = mean(numbers)
    variance = sum([pow(x - avg, 2) for x in numbers]) / float(len(numbers) - 1)
    return math.sqrt(variance)

def loadDataset(dir): # Carga la base de dades

    dataset = {}

    for (dirpath, dirnames, filenames) in os.walk(dir):
        for i, filename in enumerate(filenames):
            if (filename.endswith(".hand")):
                f = open(os.path.join(dirpath, filename), "r")
                data = f.read().split("\n")
                f.close()

                dataset[i] = {"data": [], "label": ""}
                
                for dataPoint in data:

                    if (dataPoint == ""):
                        continue

                    dataset[i]["data"].append([float(z) for z in dataPoint.split(" ")]) # Convertir a float

                dataset[i]["label"] = filename.replace(".hand", "")

    return dataset

def deScrapeSet(dataset): # Re-estructura les variables, optimització
    newDataSet = []

    for dataClass in dataset:
        for dataPoint in dataset[dataClass]["data"]:
            newReg = dataPoint
            newReg.append(dataClass)
            newDataSet.append(newReg)

    return newDataSet

def separateByClass(dataset): # Separa dades per classe

    classified = {}

    for item in dataset:
        if (item[len(item) - 1] not in classified):
            classified[item[len(item) - 1]] = []
            
        classified[item[len(item) - 1]].append(item)

    return classified

def summarizeDataset(dataset): # returns [mean*(V1, V2, V3...), stdev*(V1, V2, V3...)]
    
    summaries = [(mean(attribute), stdev(attribute), len(attribute)) for attribute in zip(*dataset)]
    del summaries[-1]
    
    return summaries

def summarizeByClass(dataset):
    
    separated = separateByClass(dataset)
    summaries = {}

    for classValue, rows in separated.items():
        summaries[classValue] = summarizeDataset(rows)
    
    return summaries

def calculateProbability(x, mean, stdev): # Gaussian Probability Distribution Function / Gaussian PDF

    # f(x) = (1 / sqrt(2 * PI) * sigma) * exp(-((x-mean)^2 / (2 * sigma^2)))
    # sigma = derivation for x
    # mean is mean for x
    # x is x value

    exponent = math.exp(-((x-mean)**2 / (2 * stdev**2 )))
    return (1 / (math.sqrt(2 * math.pi) * stdev)) * exponent

def calcClassProbabilities(summaries, row): # Calculate the probabilities of predicting each class for a given row
    total_rows = sum([summaries[label][0][2] for label in summaries])
    probabilities = {}
    for class_value, class_summaries in summaries.items():
        probabilities[class_value] = summaries[class_value][0][2] / float(total_rows)
        for i in range(len(class_summaries)):
            mean, stdev, count = class_summaries[i]
            probabilities[class_value] *= calculateProbability(row[i], mean, stdev)
    return probabilities

def predict(data, dataset, summary):
    probabilities = calcClassProbabilities(summary, data)

    bestProb = [-1, -1]
    for key, value in probabilities.items():
        if (value > bestProb[1]):
            bestProb[0] = key
            bestProb[1] = value

    return dataset[bestProb[0]]["label"], bestProb[1]

def load(datasetDir, debug=False):

    debugPrint("Loading dataset...", debug)

    dataset = loadDataset(datasetDir)
    summary = summarizeByClass(deScrapeSet(dataset))

    debugPrint("Loaded " + str(len(dataset)) + " one hand static signs", debug)
    debugPrint("Dataset uses " + str(sys.getsizeof(dataset) + sys.getsizeof(summary)) + " bytes of ram", debug)
    debugPrint("Raw dataset: " + str(sys.getsizeof(dataset)) + " bytes", debug)
    debugPrint("Summary: " + str(sys.getsizeof(summary)) + " bytes", debug)
    
    return dataset, summary