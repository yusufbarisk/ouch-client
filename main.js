const { app, BrowserWindow, ipcMain } = require('electron'); 
const zmq = require("zeromq");

let mainWindow = null;
let HEARTBEAT_INTERVAL = 5;
let heartbeatTimer = null;
let isConnected = false;
let pubSocket = null; 

///////////////////////////////////////////////////////
// Setup SUB socket to send orders to the backend
/////////////////////////////////////////////////////////

function handleBackendDisconnect() {
  console.log("No backend events received for", HEARTBEAT_INTERVAL, "seconds. Marking as disconnected.");
  if (mainWindow) {
    mainWindow.webContents.send('backend-disconnected');
  }
  isConnected = false;
}

ipcMain.handle('send-connection-config', async (event, config) => {
  try {

    if (pubSocket) {
      await pubSocket.send(JSON.stringify({
        type: "CONN",
        command: "connect",
        ...config
      }));
      event.sender.send('connection-config-response', { success: true });
    } else {
      event.sender.send('connection-config-response', { success: false, error: "No pubSocket" });
    }
  } catch (error) {
    event.sender.send('connection-error', error.message || error);
  }
});

ipcMain.handle('disconnect-backend', async (event) => {
  try {
    if (pubSocket) {
      await pubSocket.send(JSON.stringify({
        type: "CONN",
        command: "disconnect"
      }));
      event.sender.send('disconnect-response', { success: true });
    } else {
      event.sender.send('disconnect-response', { success: false, error: "No pubSocket" });
    }
  } catch (error) {
    event.sender.send('disconnect-response', { success: false, error: error.message || error });
  }
});

async function subscribeToEvents() {
  const sock = new zmq.Subscriber();
  heartbeatTimer = setTimeout(handleBackendDisconnect, HEARTBEAT_INTERVAL * 1000);


  // Connect to the Python PUB socket
  sock.connect("ipc:///tmp/ouch-ipc.sock");
  sock.subscribe();
  console.log("Subscribed to Python backend events...");

  
  for await (const [msg] of sock) {
    const event = JSON.parse(msg.toString());
    // if(!event.payload.content == "ServerHeartbeat()"){
    //   console.log("Received event:", event);
    // }
    if (heartbeatTimer) clearTimeout(heartbeatTimer);
    heartbeatTimer = setTimeout(handleBackendDisconnect, HEARTBEAT_INTERVAL * 1000);

    console.log("Received event:", event);
    if (!isConnected && mainWindow) {
      mainWindow.webContents.send('backend-connected');
      isConnected = true;
    }
    if (mainWindow) {
      mainWindow.webContents.send('backend-event', event);
    }
  }
}
///////////////////////////////////////////////////////
// Setup PUB socket to send orders to the backend
/////////////////////////////////////////////////////////

async function setupPubSocket() {
  pubSocket = new zmq.Publisher();
  pubSocket.bind("ipc:///tmp/ouch-ipc-orders.sock");
  console.log("PUB socket bound to /tmp/ouch-ipc-orders.sock");
}
async function sendOrderToBackend(order) {
  if (!pubSocket) {
    console.error("PUB socket is not initialized");
    return;
  }

  try {
    const orderJson = JSON.stringify(order);
    await pubSocket.send([orderJson]);
    console.log("Order sent to backend:", order);
  } catch (error) {
    console.error("Error sending order to backend:", error);
  }
  return { status: "ok" };
}

ipcMain.handle('send-order', async (event, order) => {
  return await sendOrderToBackend(order);
});

///////////////////////////////////////////////////////
// Rest window stuff
/////////////////////////////////////////////////////////

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      preload: __dirname + '/preload.js',
    },
    autoHideMenuBar: true,

  });
  mainWindow.loadURL('http://localhost:8081');
}

app.whenReady().then(() => {
  subscribeToEvents();
  setupPubSocket();
  createWindow();
})