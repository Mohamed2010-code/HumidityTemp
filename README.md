# Arduino Temperature & Humidity Tester (Web UI)

This is a small WebStorm project that shows live temperature and humidity readings
from your Arduino in the browser using the **Web Serial API**.

## 1. Arduino code

Upload this sketch to your Arduino (this matches the one you already use):

```cpp
#include <DHT.h>

#define DHTPIN 7        // Pin connected to DHT sensor
#define DHTTYPE DHT11   // Change to DHT22 if using DHT22 sensor

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
  delay(2000); // Wait for sensor to stabilize
}

void loop() {
  // Read temperature and humidity
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); // Celsius

  // Check if readings failed
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("ERROR");
    delay(2000);
    return;
  }

  // Send data in format: temperature,humidity
  Serial.print(temperature);
  Serial.print(",");
  Serial.println(humidity);

  delay(1000); // Read every 1 second
}
```

The important part is that the Arduino prints lines like:

```text
24.5,60.2
```

at **9600 baud**.

## 2. Browser & Web Serial requirements

- Use **Google Chrome** or **Microsoft Edge** (latest version) on desktop.
- Open the page via **http://localhost** (WebStorm built‑in server is perfect).
  Web Serial does **not** work from plain `file://` in many cases.

## 3. How to use in WebStorm

1. Open WebStorm.
2. `File → New Project from Existing Sources…` and point it to this folder.
3. Make sure you have these three files in the root:
   - `index.html`
   - `style.css`
   - `script.js`
4. Right‑click `index.html` → **Open in Browser** (or run with the WebStorm HTTP server).
5. Connect your Arduino board to USB and confirm the sketch above is running.
6. In the web page, click **“Connect to Sensor”**.
7. Choose the serial port that corresponds to your Arduino.
8. You should see live **temperature** and **humidity** values update every second.

## 4. How it works

- `script.js` uses the Web Serial API (`navigator.serial`) to:
  - Open the serial port at 9600 baud.
  - Read incoming text from the Arduino.
  - Split the text into lines of the form `temp,humidity`.
  - Parse the numbers and update the HTML values.
- `index.html` defines the layout of the page.
- `style.css` gives you a dark theme card UI with clear values.

If Web Serial is not available in your browser, you will see a message asking you
to use the latest Chrome or Edge on desktop.
