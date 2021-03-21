//////////////////////////////////////////////////////////
// Verifier verification-app
//////////////////////////////////////////////////////////

const { retrieveData, SingleNodeClient, Converter } = require("@iota/iota.js");
const { bufferToHex } = require("eccrypto-js");
const eccryptoJS = require("eccrypto-js");
const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");

// readAttendeeQR
// split attendeePersonalMerkleRoot+publicEventRoot
// readEventInfo
// readAttendeeList -till ClosedMessage
// checkAttendeeOnList

console.log("SSA-verifier-app");
const verifyQR = prompt("Attendee verifier-QR-code : ");
