/**
 * you can run this file with `node util/keygen.js` and it will generate a new key pair
 * you can then use the public key to encrypt data and the private key to decrypt it
*/

const elliptic = require('elliptic');
const ec = new elliptic.ec('p256'); // secp256r1
const keyPair = ec.genKeyPair();

const publicKey = keyPair.getPublic();
const privateKeyHex = keyPair.getPrivate('hex');
console.log("Private key (hex):", privateKeyHex);

const pubX = publicKey.getX().toArray('be', 32);
const pubY = publicKey.getY().toArray('be', 32);

console.log("Pubkey X:", pubX);
console.log(Buffer.from(pubX).toJSON().data.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', '));

console.log("Pubkey Y:", pubY);
console.log(Buffer.from(pubY).toJSON().data.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', '));
