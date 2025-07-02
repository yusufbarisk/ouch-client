const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onBackendEvent: (callback) => ipcRenderer.on('backend-event', (event, data) => callback(data)),
  sendOrder: (order) => ipcRenderer.invoke('send-order', order),
  onBackendDisconnected: (callback) => ipcRenderer.on('backend-disconnected', (event) => callback()),
  onBackendConnected: (callback) => ipcRenderer.on('backend-connected', callback),
  sendConnectionConfig: (config) => ipcRenderer.invoke('send-connection-config', config),
  onConnectionConfigResponse: (callback) => ipcRenderer.on('connection-config-response', (event, response) => {
    callback(response);
  }),
  onConnectionError: (callback) => ipcRenderer.on('connection-error', (event, error) => {
    callback(error);
  }),
  sendDisconnect: () => ipcRenderer.invoke('disconnect-backend'),
  onDisconnectResponse: (callback) => ipcRenderer.on('disconnect-response', (event, response) => {
    callback(response);
  }),
});
