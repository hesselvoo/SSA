//////////////////////////////////////////////////////////
// Attendee generate QR-app
// (c) A.J. Wischmann 2021
//////////////////////////////////////////////////////////

const { bufferToHex, sha256, utf8ToBuffer } = require("eccrypto-js");
const luxon = require("luxon");
const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");

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
  //encrypt timestamp
  const epocCharSet = "KFU9EBPOSQ";
  let timeWord = "";
  for (let i = 0; i < invoer.length; i++) {
    timeWord += epocCharSet.charAt(parseInt(invoer[i]));
  }
  return timeWord;
}

function engarble(txt) {
  // encrypt verifierQR
  let base = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let dict = "5TXY6VWD8BEF7CUHI2RSZ34LM9ANOGJK01PQ";
  let cipherwaarde = Math.floor(Math.random() * 36);
  let key = dict[cipherwaarde];
  let z = "";

  for (let i = 0; i < txt.length; i++) {
    z += dict[(base.indexOf(txt[i]) + cipherwaarde) % 36];
  }
  let schuif = cipherwaarde % 31;
  let arretje = z.split("");
  for (let s = 0; s < schuif; s++) {
    l = arretje.shift();
    arretje.push(l);
  }
  z = arretje.join("") + key;
  return z;
}

// readWalletInformation
// generateQR
// writeQR

async function run() {
  // generate a new verifierQRcode for a past event from personalWallet

  console.log(`VerifierQRcode-generator`.cyan);
  let includePersonalData = false;
  let menuChoice = prompt(
    `Would you like to incorporate your Name and Birthdate? [y,N] : `.yellow
  );
  if (menuChoice.toUpperCase() === "Y") includePersonalData = true;

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
  let personalString = "";
  if (includePersonalData)
    personalString = `${personalInformation.firstname} ${personalInformation.lastname}, ${personalInformation.birthdate}//`;
  const crcCheck = await hashHash(verifierQR + personalString + "SSAsaltQ3v%");
  verifierQR += crcCheck.slice(-5);
  verifierQR = verifierQR.toUpperCase();
  verifierQR = engarble(verifierQR);
  if (includePersonalData) verifierQR = personalString + verifierQR;
  console.log(`VerifierQR : ${verifierQR}`.green);
  saveVerifierQR(verifierQR);
}

run();
