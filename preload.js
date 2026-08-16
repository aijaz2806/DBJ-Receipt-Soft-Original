const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    saveData: (data) => ipcRenderer.send("saveData", data),
    onExcelUpdated: (callback) => ipcRenderer.on("excelUpdated", (event, message) => callback(message))
});