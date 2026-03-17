const { contextBridge } = require("electron");

// Expose APIs that are safe for the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  appVersion: process.env.npm_package_version,
});
