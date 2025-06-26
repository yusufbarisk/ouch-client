const { app, BrowserWindow } = require('electron')
const zmq = require("zeromq");

async function subscribeToEvents() {
  const sock = new zmq.Subscriber();

  // Connect to the Python PUB socket
  sock.connect("ipc:///tmp/ouch-ipc.sock");
  sock.subscribe(); // Subscribe to all topics

  console.log("Subscribed to Python backend events...");

  for await (const [msg] of sock) {
    const event = JSON.parse(msg.toString());
    console.log("Received event:", event);
    if (mainWindow) {
      mainWindow.webContents.send('backend-event', event);
    }
  }
}


const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: __dirname + '/preload.js',
    }
  });

  win.loadURL('http://localhost:8081');
}

app.whenReady().then(() => {
  subscribeToEvents();
  createWindow();
})