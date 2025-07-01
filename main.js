const { app, BrowserWindow } = require('electron')
const zmq = require("zeromq");

let mainWindow = null;

///////////////////////////////////////////////////////
// Setup SUB socket to send orders to the backend
/////////////////////////////////////////////////////////

async function subscribeToEvents() {
  const sock = new zmq.Subscriber();

  // Connect to the Python PUB socket
  sock.connect("ipc:///tmp/ouch-ipc.sock");
  sock.subscribe();
  console.log("Subscribed to Python backend events...");

  
  for await (const [msg] of sock) {
    const event = JSON.parse(msg.toString());
    // if(!event.payload.content == "ServerHeartbeat()"){
    //   console.log("Received event:", event);
    // }
    console.log("Received event:", event);

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

const { ipcMain } = require('electron');
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