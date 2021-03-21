//////////////////////////////////////////////////////////
// Attendee attend-event-app
// (c) A.J. Wischmann 2021
//////////////////////////////////////////////////////////
const { sendData, SingleNodeClient, Converter } = require("@iota/iota.js");

const {
  mamFetch,
  TrytesHelper,
  channelRoot,
  createChannel,
} = require("@iota/mam-chrysalis.js");
const { bufferToHex, hexToBuffer } = require("eccrypto-js");
const eccryptoJS = require("eccrypto-js");
const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");
// const { Console } = require("console");

const node = "https://api.hornet-0.testnet.chrysalis2.com";
const commonSideKey =
  "SSACOMMONKEY999999999999999999999999999999999999999999999999999999999999999999999";
let publicEventRoot = "";
let attendancyAddress = "";
let eventInformation = "";

// Personal information to calculate the Merkle-root
const personalFirstName = "Robert";
const personalSurname = "Smith";
const personalBirthdate = "19980820";
const personalMail = "robertsmith@gmail.com";
const personalDID = "did:example:123456789abcdefghi#key-1";
const organisation = "International Red Cross";
// for demo-purpose
const personalMerkleRoot =
  "ec76f5e70d24137494dbade31136119b52458b19105fd7e5b5812f4de38b82d5";

function readQR() {
  // Try and load the QR-root from file - as substitute for QRscan from camera
  try {
    const data = fs.readFileSync("./QRcode.json", "utf8");
    return data;
  } catch (err) {}
}

// readQRmam
async function readQRmam(qrSeed) {
  const mode = "restricted";
  const sideKey = "DATE"; //TODO make it dynamic UTC-date
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
  //DEBUGINFO
  // console.log("MAMdata ===================".red);
  // console.log(`fetched : ${fetched.message}`.green);
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
    // console.log("Fetched : ", fMessage);
    eventInformation = fMessage;
  } else {
    console.log("Nothing was fetched from the MAM channel");
  }
  //DEBUGINFO
  // console.log("MAMdata ===================".red);
  // console.log(`fetched : ${fetched.message}`.green);
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

function saveVerifierQR(verifierdata) {
  // Store QR-code for verifier so we can use it in verifier.js
  console.log("Save VerifierQR >>>>>>>>".green);
  try {
    fs.writeFileSync("./attendeeQR.json", verifierdata);
  } catch (e) {
    console.error(e);
  }
}

async function mamInteract(eventQR) {
  const payload0 = {
    attendeeID: personalMerkleRoot,
    remark: "Robert", // optional, can remain empty. Will be striped by closeevent.
    timestamp: new Date().toLocaleString(),
  };

  await readQRmam(eventQR);
  if (publicEventRoot === "NON") {
    //TODO also check for expiry
    console.log("Invalid eventRoot-address".red);
    return;
  }
  await readPublicEventInfo(publicEventRoot);
  presentEventInfo(eventInformation);

  //TODO hashPersonalInfo
  //setup&calculate merkle-root

  // writeAttendancy2Tangle
  console.log("Writing attendancy to Tangle ... ========".yellow);
  const client = new SingleNodeClient(node);
  const myIndex = attendancyAddress;

  // encrypt attendeeData with eventPublicKey
  const attendeeData = JSON.stringify(payload0);
  const pubKey = eccryptoJS.hexToBuffer(eventInformation.eventPublicKey);
  const encrypted2 = await eccryptoJS.encrypt(pubKey, attendeeData);
  const payloadEnc = {
    a: eccryptoJS.bufferToHex(encrypted2.iv),
    b: eccryptoJS.bufferToHex(encrypted2.ephemPublicKey),
    c: eccryptoJS.bufferToHex(encrypted2.ciphertext),
    d: eccryptoJS.bufferToHex(encrypted2.mac),
  };
  //DEBUGINFO
  // console.log("enc2");
  encrypted = JSON.stringify(payloadEnc);
  // console.log(encrypted);

  console.log(`PublicKey : ${eventInformation.eventPublicKey}`.green);
  // const encrypted = attendeeData;

  const sendResult = await sendData(
    client,
    myIndex,
    Converter.utf8ToBytes(encrypted)
  );
  console.log("Done writing attendancy to Tangle ... ========".yellow);
  console.log(`Payload : `);
  console.dir(encrypted);
  console.log("Received Message Id", sendResult.messageId);

  // compileVerifierQR
  // combine Hash(personalMerkleRoot)+publicEventRoot
  // saveVerifierQR(attendeeQR);
}

console.log("SSA-attendee-app".cyan);
let readQRcode = readQR();
console.log(`QRcode from file = ${readQRcode}`.yellow);
let eventQR = prompt("Event QR-code (*=savedversion): ");
if (eventQR === "*") eventQR = readQRcode;

mamInteract(eventQR);
