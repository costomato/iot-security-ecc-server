# IoT Security ECC Server

**Secure Decryption Gateway for Encrypted IoT Data (ESP32 → Server → ThingSpeak)**

This Node.js-based server receives encrypted environmental sensor data from IoT clients, performs secure ECC-based decryption, parses the data, and forwards it to [ThingSpeak](https://thingspeak.com) for cloud visualization and analysis.

It complements the [iot-security-ecc-client](https://github.com/costomato/iot-security-ecc-client) project that runs on ESP32.

---

## 📦 Features

* 🌐 Accepts encrypted sensor data over HTTP (POST `/upload`)
* 🔐 Uses **Elliptic Curve Diffie-Hellman (ECDH)** with curve `secp256r1` to derive a shared AES key
* 🔓 Decrypts AES-128-CBC encrypted payloads from IoT devices
* 🔄 Parses sensor values (Temperature, Pressure, Altitude)
* 📤 Forwards parsed values to **ThingSpeak** using its API
* 🧪 Basic endpoint at `/` to confirm server is running

---

## 🔐 Cryptography Used

* **ECC Curve:** SECP256R1 (`p256`)
* **Key Exchange:** ECDH between server and IoT client
* **Encryption:** AES-128-CBC (AES key derived from ECDH shared secret)
* **Encoding:** Base64 for encrypted payload

---

## 📂 Project Structure

```bash
.
├── index.js           # Main server implementation
├── .env               # Environment variables (private key, API key)
├── package.json       # Node.js dependencies
└── README.md          # You are here
```

---

## 🛠 Requirements

* Node.js (v16+ recommended)
* A `.env` file with the following:

```env
SERVER_PRIVATE_KEY=<64-character hex string>  # Server ECC private key (generated once and reused)
THINGSPEAK_API_KEY=<your_thingspeak_api_key>
PORT=3000  # optional
```

You can generate a new ECC key pair using this snippet (if needed):

```js
const elliptic = require('elliptic');
const ec = new elliptic.ec('p256');
const key = ec.genKeyPair();
console.log("Private Key:", key.getPrivate('hex'));
console.log("Public Key:", key.getPublic('hex'));
```


Sure! Here's a short and clean version you can include in your README:

---

### 🔐 Using Server Public Key on the Client Side

To use the server's public key on your microcontroller (e.g., ESP32), convert the X and Y coordinates into a C-style array like this:

```c
const uint8_t serverPubKeyX[32] = {
  0x16, 0x75, 0xe8, 0x11, 0x08, 0x95, 0xea, 0xff,
  0x9a, 0xcc, 0xa4, 0xed, 0x14, 0xc5, 0x48, 0x64,
  0x0f, 0x53, 0xc6, 0x73, 0x8b, 0x3e, 0xb3, 0x6a,
  0x78, 0x21, 0xf6, 0x13, 0x06, 0xa8, 0x34, 0xda
};

const uint8_t serverPubKeyY[32] = {
  0x16, 0x75, 0xe8, 0x11, 0x08, 0x95, 0xea, 0xff,
  0x9a, 0xcc, 0xa4, 0xed, 0x14, 0xc5, 0x48, 0x64,
  0x0f, 0x53, 0xc6, 0x73, 0x8b, 0x3e, 0xb3, 0x6a,
  0x78, 0x21, 0xf6, 0x13, 0x06, 0xa8, 0x34, 0xda
};
```

To generate this format from a Node.js buffer:

```js
const publicKey = key.getPublic();
const pubX = publicKey.getX().toArray('be', 32);
const pubY = publicKey.getY().toArray('be', 32);
console.log(Buffer.from(pubX).toJSON().data.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', '));
console.log(Buffer.from(pubY).toJSON().data.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', '));
```

Or you can simply run `node util/keygen.js` to generate the C-style arrays for client public keys.

---

## 📡 API Endpoints

### `POST /upload`

**Description:** Accepts an encrypted payload from the client, decrypts it using ECC and AES, and forwards the sensor data to ThingSpeak.

**Expected JSON Payload:**

```json
{
  "data": "Base64EncodedEncryptedPayload",
  "pubkey": [clientPubKeyX[0], ..., clientPubKeyY[31]],
  "iv": [16-byte IV array]
}
```

---

## 🚀 Running the Server

```bash
npm install
node index.js
```

Server runs on `http://localhost:3000` (default) unless overridden by `PORT` in `.env`.

---

## 📦 Related Projects

* **Client (ESP32)** → [iot-security-ecc-client](https://github.com/costomato/iot-security-ecc-client)
* **MITM Demo** → [nodemcu-mitm-attack](https://github.com/costomato/nodemcu-mitm-attack)
* **Research Paper** → [Enhancing Trust and Security in IoT Architecture for Low-Cost Microcontroller Devices using Elliptic Curve Cryptography](https://www.researchgate.net/publication/378995928_Enhancing_Trust_and_Security_in_IoT_Architecture_for_Low-Cost_Microcontroller_Devices_using_Elliptic_Curve_Cryptography)
  Published research detailing the architecture, design decisions, and security implications of this ECC-based IoT encryption system.

---

## 🛡️ License

This project is licensed under the MIT License.

---

## 🙋‍♂️ Author

Created by [Kaustubh](https://github.com/costomato)
