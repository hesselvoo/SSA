//////////////////////////////////////////////////////////
// Verifier verification-app
// (c) A.J. Wischmann 2021
//////////////////////////////////////////////////////////

const {
  mamFetch,
  mamFetchAll,
  TrytesHelper,
} = require("@iota/mam-chrysalis.js");
const { Converter } = require("@iota/iota.js");
const { sha256, utf8ToBuffer, bufferToHex } = require("eccrypto-js");
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
let eventInformation = "";
let nextMAMRoot = "";

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
    // console.log(`attendeeToken :${attendeeToken}`);
    qrTime = luxon.DateTime.fromMillis(+timecode);
    nowTime = luxon.DateTime.now();
    let timeDiff = nowTime.diff(qrTime);
    if (timeDiff.as(`minutes`) > 10)
      console.log(
        `Suspicious behaviour : QR-code is older than 10 minutes!`.underline
          .brightRed
      );
    console.log(
      `QR-code was generated ${parseInt(
        timeDiff.as(`minutes`)
      )} minutes ago at: ${qrTime.toISO()}`.yellow
    );
    return true;
  }
  console.log("-- QR code is incorrect! --".red);
  return false;
}

// This could be done much more efficient by only running mamFetchAll once
// to provide the information for all routines..
// for demo-purposes we made seperate functions (and doing double/triple work)

async function mamStillOpenStatus() {
  // check if event was already closed or stil open
  const mode = "restricted";
  const sideKey = commonSideKey;

  console.log("Checking if event was closed....".yellow);
  let mamOpenStatus = true;
  const fetched = await mamFetchAll(node, publicEventRoot, mode, sideKey);
  if (fetched && fetched.length > 0) {
    for (let i = 0; i < fetched.length; i++) {
      const element = fetched[i].message;
      let fMessage = JSON.parse(TrytesHelper.toAscii(element));
      // console.log(i, fMessage);
      if (fMessage.message == "Event closed") {
        mamOpenStatus = false;
        // console.log(
        //   `Eventregistration was closed attt : ${fMessage.date}`.brightRed
        // );
      }
    }
  }
  return mamOpenStatus;
}

async function readPublicEventInfo(publicEventRoot) {
  const mode = "restricted";
  const sideKey = commonSideKey;
  //DEBUGINFO
  //   console.log("Fetching from tangle with this information :");
  //   console.log(`Node : ${node}`.yellow);
  //   console.log(`EventRoot : ${publicEventRoot}`.yellow);
  //   console.log(`mode : ${mode}`.yellow);
  //   console.log(`sideKey : ${sideKey}`.yellow);

  // Try fetching from MAM
  console.log("Fetching from tangle, please wait...");
  const fetched = await mamFetch(node, publicEventRoot, mode, sideKey);
  if (fetched) {
    let fMessage = JSON.parse(TrytesHelper.toAscii(fetched.message));
    nextMAMRoot = fetched.nextRoot;
    //DEBUGINFO
    // console.log("MAMdata ===================".red);
    // console.log(`fetched : ${fetched.message}`.green);
    // console.log(`fmessage : ${fMessage}`);
    // console.log(`nextMAMRoot : ${nextMAMRoot}`);
    return fMessage;
  }
  console.log("Nothing was fetched from the MAM channel".red);
  return;
}

function presentEventInfo(eventRecord) {
  console.log("Eventinformation =================================".red);
  console.log("Event :".cyan);
  console.log(`Name : ${eventRecord.eventname}`);
  console.log(`Date : ${eventRecord.eventdate}`);
  console.log(`Time : ${eventRecord.eventtime}`);
  console.log(`Location : ${eventRecord.eventloc}`);
  console.log("=================================".red);
  console.log("Organised by :".cyan);
  console.log(`Organisation : ${eventRecord.orgname}`);
  console.log(`Address : ${eventRecord.orgaddress}`);
  console.log(`Zipcode : ${eventRecord.orgzip}`);
  console.log(`City : ${eventRecord.orgcity}`);
  console.log(`Tel.nr. : ${eventRecord.orgtel}`);
  console.log(`E-mail : ${eventRecord.orgmail}`);
  console.log(`WWW : ${eventRecord.orgurl}`);
  console.log(`DID : ${eventRecord.orgdid}`);
  console.log("=================================".red);
}

async function loadAttendeeTokens() {
  // readAttendeeList -till ClosedMessage
  const mode = "restricted";
  const sideKey = commonSideKey;
  let aList = [];
  //DEBUGINFO
  //   console.log("Fetching attendeeIDs from tangle with this information :");
  //   console.log(`Node : ${node}`.yellow);
  //   console.log(`EventRoot : ${nextMAMRoot}`.yellow);
  //   console.log(`mode : ${mode}`.yellow);
  //   console.log(`sideKey : ${sideKey}`.yellow);

  // Try fetching from MAM
  let readMAM = true;
  while (readMAM) {
    // readMAMrecord
    // console.log("ReadMAM ===========".red);
    const fetched = await mamFetch(node, nextMAMRoot, mode, sideKey);
    // console.log(`fetched : ${fetched.message}`.green);

    if (fetched) {
      let fMessage = JSON.parse(TrytesHelper.toAscii(fetched.message));
      //   console.log(`fMessage : ${fMessage}`.cyan);
      nextMAMRoot = fetched.nextRoot;
      //DEBUGINFO
      //   console.log("MAMdata ===================".red);
      //   console.log(`fetched : ${fMessage.count}`.green);
      if (fMessage.message == "Event closed") {
        console.log(
          `Eventregistration closed at : ${fMessage.date} =====`.cyan
        );
        readMAM = false;
      } else {
        aList = aList.concat(fMessage.ids);
        // console.log("attendeeList ========");
        // console.log(`aList : ${aList}`.yellow);
      }
    }
  }
  return aList;
}

function checkAttended(ID, idList) {
  // check if attendeeID is on the list of registeredIDs
  // ID = ID + "a";      // to test if not registered
  if (idList.indexOf(ID) === -1) {
    console.log(`ID : ${ID} was not registered at this event!`.brightRed);
    return false;
  } else {
    console.log(`ID : ${ID} has attended this event.`.green);
    return true;
  }
}

async function run() {
  console.log("SSA-verifier-app".cyan);
  verificationQR = readQR();
  console.log(`VerificationQR : ${verificationQR}`);
  qrOkay = await checkQR(verificationQR);
  if (!qrOkay) {
    console.log("-- Verification aborted --".red);
    return;
  } else {
    // readEventInfo
    eventInformation = await readPublicEventInfo(publicEventRoot);
    // console.log(eventInformation);
    if (eventInformation.eventPublicKey.length > 0) {
      // show eventinfo
      presentEventInfo(eventInformation);
      if (await mamStillOpenStatus()) {
        console.log(
          `Eventregistration is open at this moment, no check possible.`
            .brightRed
        );
        return;
      }
      const attendeeList = await loadAttendeeTokens();
      // checkAttendeeOnList
      checkAttended(attendeeToken, attendeeList);
    }
  }
}

run();
