//////////////////////////////////////////////////////////
// Attendee generate QR-app
// (c) A.J. Wischmann 2021
//////////////////////////////////////////////////////////

const { bufferToHex, sha256, utf8ToBuffer } = require("eccrypto-js");
const luxon = require("luxon");
const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");

// let eventPersonalMerkleRoot = "";

async function readInfoFromWallet() {
  // Try and load the wallet personalinfo from json file
  let parsedData;
  try {
    const personalInformation = fs.readFileSync("./personalWallet.json");
    if (personalInformation) {
      parsedData = JSON.parse(personalInformation.toString());
    }
  } catch (e) {
    console.log(`Error : ${e}`);
  }
  console.log(`Name : ${parsedData.firstname} ${parsedData.lastname}`.green);
  return parsedData;
}

async function saveVerifierQR(verifierdata) {
  // Store QR-code for verifier so we can use it in verifier.js
  console.log("Save VerifierQR >>>>>>>>".green);
  try {
    fs.writeFileSync("./verifierQR.json", verifierdata);
  } catch (e) {
    console.error(e);
  }
}

async function hashHash(mroot) {
  let element = utf8ToBuffer(mroot);
  element = await sha256(element);
  return bufferToHex(element);
}

function encTime(invoer) {
  //encrypt
  const epocCharSet = "KFU9EBPOSQ";
  let timeWord = "";
  for (let i = 0; i < invoer.length; i++) {
    timeWord += epocCharSet.charAt(parseInt(invoer[i]));
  }
  return timeWord;
}

// readWallet
// generateQR
// writeQR

async function run() {
  // generate a new verifierQRcode for a past event from personalWallet

  console.log(`VerifierQRcode-generator`.cyan);
  console.log(`Generating....`);
  const personalInformation = await readInfoFromWallet();
  console.log(`mr : ${personalInformation.mr}`);
  let eventPersonalMerkleRoot = personalInformation.mr + personalInformation.er;
  const merkleHash = await hashHash(eventPersonalMerkleRoot);
  const nowEpoch = luxon.DateTime.now().toMillis();
  let stringWaarde = "";
  stringWaarde += nowEpoch;
  let verifierQR =
    bufferToHex(merkleHash) + personalInformation.er + encTime(stringWaarde);
  const crcCheck = await hashHash(verifierQR + "SSAsaltQ3v%");
  verifierQR += crcCheck.slice(-5);
  verifierQR = verifierQR.toUpperCase();
  console.log(`VerifierQR : ${verifierQR}`.yellow);
  saveVerifierQR(verifierQR);
}

run();
