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

let walletState;

async function readWallet() {
  // Try and load the wallet state from json file
  try {
    const currentState = fs.readFileSync("./Wallet.json");
    if (currentState) {
      walletState = JSON.parse(currentState.toString());
    }
  } catch (e) {}
}

// readMamState
// extractPrivateEventKey
// readAttendeeIndexation
// makeAttendeeList
// showAttendeeCount
// readAttendeeRecord, decrypt, extract AttendeeID, add2List
// appendAttendeeList2MAM
// appendCloseMessage -include closingTimestamp
// writeMAMstate for appending extra information

console.log("Event-close-app".cyan);
readWallet();
console.log("Wallet".red);
console.log(`EventSEED : ${walletState.seed}`);
console.log(`Password : ${walletState.password}`);
console.log(`Indexation : ${walletState.indexation}`);
console.log(`AttendeeQR : ${walletState.aQR}`);

// show EventInformation

let theEnd = false;
while (!theEnd) {
  let menuChoice = prompt("Menu [l]-list, [c]-close, [q]-quit : ");
  if (menuChoice == "l") {
    // show current list of attendees
  }
  if (menuChoice == "c") {
    // close the event
    // makelist, writeList2MAM, writeCloseMessage
  }
  if (menuChoice == "q") {
    // close the application
    theEnd = true;
  }
}
