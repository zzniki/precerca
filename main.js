const electron = require("electron");
const url = require("url");
const path = require("path");

const {app, BrowserWindow, ipcMain} = electron;

let mainWindow;

// Listen for the app to be ready
app.on("ready", function() {

    // Create new window
    mainWindow = new BrowserWindow({

        title: "HandTracker",
        webPreferences: {

            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInWorker: true,

        }

    });

    mainWindow.setMenuBarVisibility(false);

    mainWindow.loadURL(url.format({

        pathname: path.join(__dirname, "src/html/viewer.html"),
        protocol: "file:",
        slahes: true

    }));

});

const getRawData = (URL) => {
        
    return fetch(URL).then((response) => response.text()).then((data) => {return data;});

};