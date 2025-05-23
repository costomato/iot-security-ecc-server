const express = require('express');
const bodyParser = require('body-parser');
const elliptic = require('elliptic');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const ec = new elliptic.ec('p256'); // secp256r1

// If you want to generate a new key pair, uncomment the following lines
// const serverKeyPair = ec.genKeyPair();
// const serverPublicKeyHex = serverKeyPair.getPublic('hex');
// const serverPrivateKey = serverKeyPair;

// === Server Key Info ===
const privateKeyHex = process.env.SERVER_PRIVATE_KEY;
const privateKey = Buffer.from(privateKeyHex, 'hex');


// === ThingSpeak Info ===
const THINGSPEAK_API_KEY = process.env.THINGSPEAK_API_KEY;
// const THINGSPEAK_CHANNEL_ID = '<your_channel_id>'; // if needed


// Just wanted to show the public key for testing
// app.get('/pubkey', (req, res) => {
//   res.send({ publicKey: serverPublicKeyHex });
// });


app.get('/', (req, res) => {
  res.send("Welcome to the ECC Gateway server!");
});

// === Decrypt and Forward Data to ThingSpeak ===
app.post('/upload', async (req, res) => {
  console.log("Request body:", req.body);

  try {
    const { data, pubkey } = req.body;

    if (!data || !pubkey || pubkey.length !== 64) {
      return res.status(400).send("Invalid payload");
    }

    const clientPubKey = ec.keyFromPublic({
      x: Buffer.from(pubkey.slice(0, 32)).toString('hex'),
      y: Buffer.from(pubkey.slice(32)).toString('hex')
    }, 'hex');

    const serverKey = ec.keyFromPrivate(privateKey);
    const sharedSecret = serverKey.derive(clientPubKey.getPublic()); // BN.js object
    const sharedSecretBuf = Buffer.from(sharedSecret.toArray('be', 32)); // Force big-endian 32-byte buffer
    const aesKey = sharedSecretBuf.subarray(0, 16); // First 16 bytes


    console.log("Shared Secret:", sharedSecretBuf.toString('hex'));


    if (!Array.isArray(req.body.iv) || req.body.iv.length !== 16) {
      return res.status(400).send("Invalid IV");
    }

    const encryptedData = Buffer.from(data, 'base64');
    const iv = Buffer.from(req.body.iv);

    const decipher = crypto.createDecipheriv('aes-128-cbc', aesKey, iv);
    decipher.setAutoPadding(false);
    const decrypted = decipher.update(encryptedData) + decipher.final();
    const payload = decrypted.toString('utf-8').replace(/\0+$/, ''); // Strip null padding

    console.log("Decrypted payload:", payload);

    const values = {};
    payload.split(',').forEach(pair => {
      const [k, v] = pair.split('=');
      values[k] = Number(v);
    });

    console.log("Values:", values.T, values.P, values.A);

    const tsRes = await axios.post(`https://api.thingspeak.com/update.json`, null, {
      params: {
        api_key: THINGSPEAK_API_KEY,
        field1: values.T,
        field2: values.P,
        field3: values.A
      }
    });

    if (tsRes.data === 0) throw new Error("ThingSpeak rejected the data");

    res.status(200).send("Data decrypted and forwarded to ThingSpeak");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing the request");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ECC Gateway server listening on port ${PORT}`);
});
