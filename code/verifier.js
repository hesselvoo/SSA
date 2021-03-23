//////////////////////////////////////////////////////////
// Verifier verification-app
// (c) A.J. Wischmann 2021
//////////////////////////////////////////////////////////

const {
  mamFetch,
  TrytesHelper,
  channelRoot,
  createChannel,
} = require("@iota/mam-chrysalis.js");
const { Converter } = require("@iota/iota.js");
const {
  hexToBuffer,
  sha256,
  encrypt,
  bufferToUtf8,
  utf8ToBuffer,
  bufferToHex,
} = require("eccrypto-js");
// const crypto = require("crypto");
const luxon = require("luxon");
const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");

const node = "https://api.hornet-0.testnet.chrysalis2.com";
const commonSideKey =
  "SSACOMMONKEY9SSACOMMONKEY9SSACOMMONKEY9SSACOMMONKEY9SSACOMMONKEY9SSACOMMONKEY9SSA";
let publicEventRoot = "";
let verificationQR = "";
let attendeeToken = "";
let qrTime = "";

async function hashHash(hashData) {
  let element = utf8ToBuffer(hashData);
  element = await sha256(element);
  return bufferToHex(element);
}

// readAttendeeQR
function readQR() {
  // Try and load the QR-root from file - as substitute for QRscan from camera
  try {
    const data = fs.readFileSync("./verifierQR.json", "utf8");
    return data;
  } catch (err) {}
}

async function checkQR(code) {
  // check integrity of QR-code
  let crccode = code.slice(-5).toLowerCase();
  let idstring = code.slice(0, 64).toLowerCase();
  let rootcode = code.slice(64, -18);
  let timecode = code.slice(-18, -5);
  let rest = idstring + rootcode + timecode + "SSAsaltQ3v%";
  //DEBUGINFO
  //   console.log(`crccode :${crccode}`);
  //   console.log(`idstring :${idstring}`);
  //   console.log(`rootcode :${rootcode}`);
  //   console.log(`timecode :${timecode}`);
  //   console.log(`rest :${rest}`);

  let crcValueString = await hashHash(rest);
  let crcValue = crcValueString.slice(-5);
  if (crccode == crcValue) {
    publicEventRoot = rootcode;
    attendeeToken = await hashHash(idstring);
    console.log(`attendeeToken :${attendeeToken}`);
    qrTime = luxon.DateTime.fromMillis(+timecode);
    nowTime = luxon.DateTime.now();
    let timeDiff = nowTime.diff(qrTime);
    if (timeDiff.as(`minutes`) > 210) console.log(`Suspicious behaviour :`.red);
    console.log(
      `QR-code was generated ${timeDiff.as(`minutes`)} minutes ago`.yellow
    );
    return true;
  }
  console.log("-- QR code is incorrect! --".red);
  return false;
}

// readEventInfo
// readAttendeeList -till ClosedMessage
// checkAttendeeOnList

async function run() {
  console.log("SSA-verifier-app".cyan);
  verificationQR = readQR();
  console.log(`VerificationQR : ${verificationQR}`);
  qrOkay = await checkQR(verificationQR);
  if (!qrOkay) {
    console.log("This QR-code is not correct! - Verification aborted.".red);
    return;
  } else {
    const verifyQR = prompt("Attendee verifier-QR-code : ");
  }
}

run();
