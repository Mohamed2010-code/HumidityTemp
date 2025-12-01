// script.js
// Front-end code for reading temperature & humidity from Arduino using Web Serial API.
// Assumes Arduino is sending lines like: 24.50,60.20

const connectButton = document.getElementById("connectButton");
const statusSpan = document.getElementById("status");
const tempSpan = document.getElementById("tempValue");
const humSpan = document.getElementById("humValue");
const logEl = document.getElementById("log");

let port = null;
let reader = null;
let keepReading = false;

function log(message) {
  const time = new Date().toLocaleTimeString();
  logEl.textContent += `[${time}] ${message}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(text, type = "") {
  statusSpan.textContent = text;
  statusSpan.classList.remove("ok", "error");
  if (type) {
    statusSpan.classList.add(type);
  }
}

async function connectSerial() {
  if (!("serial" in navigator)) {
    alert("Web Serial API not supported. Use latest Chrome or Edge on desktop.");
    setStatus("Web Serial not supported in this browser", "error");
    return;
  }

  try {
    // Ask user to select a serial port
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    setStatus("Connected", "ok");
    connectButton.textContent = "Disconnect";
    log("Serial port opened at 9600 baud.");

    keepReading = true;
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const readerStream = textDecoder.readable;

    reader = readerStream.getReader();

    let buffer = "";

    while (keepReading) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      if (value) {
        buffer += value;
        let lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          handleSerialLine(line.trim());
        }
      }
    }

    reader.releaseLock();
  } catch (err) {
    console.error(err);
    setStatus("Error: " + err.message, "error");
    log("Error: " + err.message);
    await disconnectSerial();
  }
}

function handleSerialLine(line) {
  log("Received: " + line);

  // Expect "temp,humidity"
  const parts = line.split(",");
  if (parts.length !== 2) {
    return;
  }

  const temp = parseFloat(parts[0]);
  const hum = parseFloat(parts[1]);

  if (Number.isNaN(temp) || Number.isNaN(hum)) {
    return;
  }

  tempSpan.textContent = temp.toFixed(1);
  humSpan.textContent = hum.toFixed(1);
}

async function disconnectSerial() {
  try {
    keepReading = false;
    if (reader) {
      await reader.cancel();
    }
  } catch (e) {
    console.warn("Error cancelling reader:", e);
  }

  try {
    if (port) {
      await port.close();
    }
  } catch (e) {
    console.warn("Error closing port:", e);
  }

  port = null;
  reader = null;
  connectButton.textContent = "Connect to Sensor";
  setStatus("Not connected");
  log("Serial port closed.");
}

connectButton.addEventListener("click", async () => {
  if (port) {
    await disconnectSerial();
  } else {
    connectButton.disabled = true;
    setStatus("Connecting...");
    try {
      await connectSerial();
    } finally {
      connectButton.disabled = false;
    }
  }
});
