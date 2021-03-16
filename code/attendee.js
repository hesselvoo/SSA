//////////////////////////////////////////////////////////
// Attendee attend-event-app
//////////////////////////////////////////////////////////

const {
  channelRoot,
  mamFetch,
  TrytesHelper,
} = require("@iota/mam-chrysalis.js");
const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");

const node = "https://api.hornet-0.testnet.chrysalis2.com";

function readQR() {
  // Try and load the QR-root from file
  try {
    const data = fs.readFileSync("./QRcode.json", "utf8");
    return data;
  } catch (err) {}
}

console.log("SSA-attendee-app".cyan);
let readQRcode = readQR();
console.log(`QRcode from file = ${readQRcode}`.yellow);
let eventQR = prompt("Event QR-code (*=savedversion): ");
if (eventQR === "*") eventQR = readQRcode;

// readQRmam
async function readQRmam(qrRoot) {
  const mode = "restricted";
  const sideKey = "DATE";

  console.log("Fetching from tangle, please wait...");
  console.log(`Node : ${node}`.yellow);
  console.log(`qrRoot : ${qrRoot}`.yellow);
  console.log(`mode : ${mode}`.yellow);
  console.log(`sideKey : ${sideKey}`.yellow);

  // Try fetching from MAM
  console.log("Fetching from tangle, please wait...");
  const fetched = await mamFetch(node, qrRoot, mode, sideKey);
  if (fetched) {
    console.log("Fetched", JSON.parse(TrytesHelper.toAscii(fetched.message)));
  } else {
    console.log("Nothing was fetched from the MAM channel");
  }
  console.log("MAMdata ===================".red);
  console.log(`fetched : ${fetched.message}`.green);
}

// readPublicEventInfo

// presentEventInfo

// hashPersonalInfo

// writeAttendancy2Tangle

// compileVerifierQR

readQRmam(eventQR);
