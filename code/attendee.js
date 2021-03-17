//////////////////////////////////////////////////////////
// Attendee attend-event-app
//////////////////////////////////////////////////////////

const {
  mamFetch,
  TrytesHelper,
  channelRoot,
  createChannel,
} = require("@iota/mam-chrysalis.js");
const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");
const { Console } = require("console");

const node = "https://api.hornet-0.testnet.chrysalis2.com";
const commonSideKey =
  "SSACOMMONKEY999999999999999999999999999999999999999999999999999999999999999999999";
let publicEventRoot = "";
let attendancyAddress = "";
let eventInformation = "";

function readQR() {
  // Try and load the QR-root from file
  try {
    const data = fs.readFileSync("./QRcode.json", "utf8");
    return data;
  } catch (err) {}
}

// readQRmam
async function readQRmam(qrSeed) {
  const mode = "restricted";
  const sideKey = "DATE";
  let rootValue = "NON";
  let indexationKey = "";

  let qrRoot = channelRoot(createChannel(qrSeed, 2, mode, sideKey));
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

  console.log("Fetching from tangle with this information :");
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
    eventInformation = fMessage;
  } else {
    console.log("Nothing was fetched from the MAM channel");
  }
  console.log("MAMdata ===================".red);
  console.log(`fetched : ${fetched.message}`.green);
}

// presentEventInfo
function presentEventInfo(eventRecord) {
  console.log("=================================".red);
  console.log("Event :".cyan);
  console.log(`Name : ${eventRecord.eventname}`);
  console.log(`Date : ${eventRecord.eventdate}`);
  console.log(`Time : ${eventRecord.eventtime}`);
  console.log(`Location : ${eventRecord.eventloc}`);
  console.log("Organised by :".cyan);
  console.log(`Organisation : ${eventRecord.orgname}`);
  console.log(`Address : ${eventRecord.orgaddress}`);
  console.log(`Zipcode : ${eventRecord.orgzip}`);
  console.log(`City : ${eventRecord.orgcity}`);
  console.log(`Tel.nr. : ${eventRecord.orgtel}`);
  console.log(`E-mail : ${eventRecord.orgmail}`);
  console.log(`WWW : ${eventRecord.orgurl}`);
  console.log(`DID : ${eventRecord.orgdid}`);
}

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
  } else readPublicEventInfo(publicEventRoot).then(() => presentEventInfo(eventInformation));
});
