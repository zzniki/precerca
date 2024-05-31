# Sign Language Translation App

A prototype sing language translation application made for my [baccalaureate's research project](https://github.com/zzniki/precerca/blob/cac3c2175c857cc4339cd0207bea8b47be2fed61/memoria.pdf).

This app translates basic Spanish Sign Language fingerspelling signs to text using Mediapipe HandPose and an implementation of a Naive Bayes Classifier.

## Showcase
A 50-page document written in catalan explaining all the inner-workings and showcasing the final product can be found [here](https://github.com/zzniki/precerca/blob/cac3c2175c857cc4339cd0207bea8b47be2fed61/memoria.pdf).

(video)

## Possible Improvements
These are some of the possible improvements and features that could be implemented if the project was updated:

### Feature Classification
Instead of passing the hand's points directly to the classifier, which difficults classification when the hand is rotated, image features could be extracted using the [7 moments of Hu](https://cvexplained.wordpress.com/2020/07/21/10-4-hu-moments/).

### Data Storage
Instead of storing the data as plain text files with numbers, data could be stored as raw binary files containing floating point numbers.