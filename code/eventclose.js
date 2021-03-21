//////////////////////////////////////////////////////////
// Organiser eventclose-app
// (c) A.J. Wischmann 2021
//////////////////////////////////////////////////////////

const { bufferToHex } = require("eccrypto-js");
const eccryptoJS = require("eccrypto-js");
const {
  createChannel,
  createMessage,
  mamAttach,
  TrytesHelper,
} = require("@iota/mam-chrysalis.js");
const { sendData, SingleNodeClient, Converter } = require("@iota/iota.js");
const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");

// readMamState
// extractPrivateEventKey
// readAttendeeIndexation
// makeAttendeeList
// showAttendeeCount
// readAttendeeRecord, decrypt, extract AttendeeID, add2List
// appendAttendeeList2MAM
// appendCloseMessage
// writeMAMstate for appending extra information

console.log("Event-close-app");
const eventQR = prompt("Event QR-code : ");
