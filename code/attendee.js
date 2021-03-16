//////////////////////////////////////////////////////////
// Attendee attend-event-app
//////////////////////////////////////////////////////////

const { mamFetch, TrytesHelper } = require("@iota/mam-chrysalis.js");
const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");
const { Console } = require("console");

const node = "https://api.hornet-0.testnet.chrysalis2.com";
const commonSideKey =
  "SSACOMMONKEY999999999999999999999999999999999999999999999999999999999999999999999";
let publicEventRoot = "";
let attendancyAddress = "";

function readQR() {
  // Try and load the QR-root from file
  try {
    const data = fs.readFileSync("./QRcode.json", "utf8");
    return data;
  } catch (err) {}
}

// readQRmam
async function readQRmam(qrRoot) {
  const mode = "restricted";
  const sideKey = "DATE";
  let rootValue = "NON";
  let indexationKey = "";

  console.log("Fetching from tangle, please wait...");
  console.log(`Node : ${node}`.yellow);
  console.log(`qrRoot : ${qrRoot}`.yellow);
  console.log(`mode : ${mode}`.yellow);
  console.log(`sideKey : ${sideKey}`.yellow);

  // Try fetching from MAM
  console.log("Fetching from tangle, please wait...");
  const fetched = await mamFetch(node, qrRoot, mode, sideKey);
  if (fetched) {
    let fMessage = JSON.parse(TrytesHelper.toAscii(fetched.message));
    console.log("Fetched : ", fMessage);
    rootValue = fMessage.root;
    indexationKey = fMessage.indexation;
    console.log(`Message.root : ${rootValue}`);
    console.log(`Message.indexation : ${indexationKey}`);
  } else {
    console.log("Nothing was fetched from the MAM channel");
  }
  console.log("MAMdata ===================".red);
  console.log(`fetched : ${fetched.message}`.green);
  console.log("============================".yellow);
  publicEventRoot = rootValue;
  attendancyAddress = indexationKey;
}

// readPublicEventInfo
async function readPublicEventInfo(publicEventRoot) {
  const mode = "restricted";
  const sideKey = commonSideKey;

  console.log("Fetching from tangle, please wait...");
  console.log(`Node : ${node}`.yellow);
  console.log(`EventRoot : ${publicEventRoot}`.yellow);
  console.log(`mode : ${mode}`.yellow);
  console.log(`sideKey : ${sideKey}`.yellow);

  // Try fetching from MAM
  console.log("Fetching from tangle, please wait...");
  const fetched = await mamFetch(node, publicEventRoot, mode, sideKey);
  if (fetched) {
    let fMessage = JSON.parse(TrytesHelper.toAscii(fetched.message));
    console.log("Fetched : ", fMessage);
  } else {
    console.log("Nothing was fetched from the MAM channel");
  }
  console.log("MAMdata ===================".red);
  console.log(`fetched : ${fetched.message}`.green);
}

// presentEventInfo

// hashPersonalInfo

// writeAttendancy2Tangle

// compileVerifierQR

console.log("SSA-attendee-app".cyan);
let readQRcode = readQR();
console.log(`QRcode from file = ${readQRcode}`.yellow);
let eventQR = prompt("Event QR-code (*=savedversion): ");
if (eventQR === "*") eventQR = readQRcode;

readQRmam(eventQR).then(function () {
  if (publicEventRoot === "NON") {
    console.log("Invalid eventRoot-address".red);
  } else readPublicEventInfo(publicEventRoot);
});
