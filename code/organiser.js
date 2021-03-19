//////////////////////////////////////////////////////////
// Organiser init-event-app
//////////////////////////////////////////////////////////

const {
  createChannel,
  createMessage,
  mamAttach,
  TrytesHelper,
} = require("@iota/mam-chrysalis.js");
const crypto = require("crypto");
const { sendData, SingleNodeClient, Converter } = require("@iota/iota.js");
const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");

const node = "https://api.lb-0.testnet.chrysalis2.com/";

const privateOrgPrivateTitle = "Interreg Blockchain-event";
const privateOrgPrivateEventKey = "1928374655367182725143759";
// the privatekey which generates the publickey to encrypt attendancy-transaction
const publicEventKey = "92837151423132255588337736251662";

const organiserName = "Courseware Ltd.";
const organiserAddress = "53 Pumbertonstreet";
const organiserPostcode = "23788";
const organiserCity = "London";
const organiserURL = "http://courseware.com";
const organiserTelephone = "01 234 56 789";
const organiserMail = "info@courseware.com";
const organiserDID = "did:example:123456789abcdefghi#key-1";

const eventName = "Interreg Bling Midterm-conference";
const eventDate = "March 9th 2021";
const eventTime = "10:00 - 16:30";
const eventLocation = "Online";

let eventSEED = "";
let organiserKey = "";
let channelState;
const commonSideKey =
  "SSACOMMONKEY999999999999999999999999999999999999999999999999999999999999999999999";

let attendeeQRcode = "";

const payload0 = {
  // Information for the private-organiser-Mam-record
  title: privateOrgPrivateTitle,
  timestamp: new Date().toLocaleString(),
  eventPrivateKey: privateOrgPrivateEventKey,
};

const payload1 = {
  // Information for the 1st public-Mam-record
  orgname: organiserName,
  orgaddress: organiserAddress,
  orgzip: organiserPostcode,
  orgcity: organiserCity,
  orgtel: organiserTelephone,
  orgmail: organiserMail,
  orgurl: organiserURL,
  orgdid: organiserDID,
  eventname: eventName,
  eventloc: eventLocation,
  eventdate: eventDate,
  eventtime: eventTime,
  eventPublicKey: publicEventKey,
};

function generateSeed(length) {
  // Random string A-Z,9 -for seeds
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ9";
  let seed = "";
  while (seed.length < length) {
    const byte = crypto.randomBytes(1);
    if (byte[0] < 243) {
      seed += charset.charAt(byte[0] % 27);
    }
  }
  return seed;
}

function saveChannelState() {
  // Store the channel state so we can use it in evenclose.js
  console.log("Save channelstate >>>>>>>>".green);
  try {
    fs.writeFileSync(
      "./channelState.json",
      JSON.stringify(channelState, undefined, "\t")
    );
  } catch (e) {
    console.error(e);
  }
}

function saveQR(qrcode) {
  // save QRcode so we can use it in attendee.js

  //TODO add expirationtime in QR-code so attendee-app signals expired

  console.log("Save QRcode >>>>>>>>".green);
  try {
    fs.writeFileSync("./QRcode.json", qrcode);
  } catch (e) {
    console.error(e);
  }
}

async function setupMam(payload) {
  // add Organiser-Privatemessage to MAM
  const mode = "restricted";
  const sideKey = organiserKey;

  channelState = createChannel(eventSEED, 2, mode, sideKey);
  const mamMessage = createMessage(
    channelState,
    TrytesHelper.fromAscii(JSON.stringify(payload))
  );

  // console.log("mamMessage =================".red);
  // console.log(mamMessage);
  // console.log("channelState =================".red);
  // console.log(channelState);
  console.log("Payload =================".red);
  console.log(JSON.stringify(payload));
  console.log("=================".red);

  // Display the details for the MAM message.
  console.log("Seed:", channelState.seed);
  console.log("Address:", mamMessage.address);
  console.log("Root:", mamMessage.root);
  console.log("NextRoot:", channelState.nextRoot);

  // Attach the message.
  console.log("Attaching =================".red);
  console.log("Attaching private-Eventmessage to tangle, please wait...");
  const { messageId } = await mamAttach(node, mamMessage, "SSA9EXPERIMENT");
  console.log(`Message Id`, messageId);
  console.log(
    `You can view the mam channel here https://explorer.iota.org/chrysalis/streams/0/${mamMessage.root}/${mode}/${sideKey}`
  );
  console.log("===============================".yellow);
}

async function addEvent2Mam(payload) {
  // add Event-message to MAM
  const mode = "restricted";
  const sideKey = commonSideKey;

  channelState.sideKey = commonSideKey;
  console.log("Payload =================".red);
  console.log(JSON.stringify(payload));

  const mamMessage = createMessage(
    channelState,
    TrytesHelper.fromAscii(JSON.stringify(payload))
  );

  // console.log("channelState =================".red);
  // console.log(channelState);
  // console.log("mamMessage =================".red);
  // console.log(mamMessage);

  // Display the details for the MAM message.
  console.log("=================".red);
  console.log("Seed:", channelState.seed);
  console.log("Address:", mamMessage.address);
  console.log("Root:", mamMessage.root);
  console.log("NextRoot:", channelState.nextRoot);

  // Attach the message.
  console.log("Attaching =================".red);
  console.log("Attaching Eventmessage to tangle, please wait...");
  const { messageId } = await mamAttach(node, mamMessage, "SSA9EXPERIMENT");
  console.log(`Message Id`, messageId);
  console.log(
    `You can view the mam channel here https://explorer.iota.org/chrysalis/streams/0/${mamMessage.root}/${mode}/${sideKey}`
  );
  console.log("===============================".yellow);
}

async function makeQRmam(
  publicEventRoot,
  attendanceNotificationKey,
  expiryDateTime
) {
  //This is a MAM with only 1 restricted-record:
  // publicRootEventMAM -as link to Eventinformation
  // indexation - as tag for attendance-transactions/notifications
  // timestamp - expiryDateTime

  const mode = "restricted";
  const sideKey = "DATE"; //TODO change for dynamic UTC-date
  let channelQRState;

  const payloadQR = {
    root: publicEventRoot,
    indexation: attendanceNotificationKey,
    expirytimestamp: expiryDateTime,
  };

  console.log("PayloadQR =================".red);
  console.log(payloadQR);
  console.log("=================".red);

  attendeeQRcode = "SSA" + generateSeed(78);
  console.log(`Attendee QR-seed : ${attendeeQRcode}`.cyan);

  channelQRState = createChannel(attendeeQRcode, 2, mode, sideKey);

  const mamMessage = createMessage(
    channelQRState,
    TrytesHelper.fromAscii(JSON.stringify(payloadQR))
  );

  saveQR(attendeeQRcode); // SEED    : plus sidekey?!

  // console.log("channelQRState =================".red);
  // console.log(channelQRState);

  // Display the details for the MAM message.
  console.log("=================".red);
  console.log("Seed:", channelQRState.seed);
  console.log("Address:", mamMessage.address);
  console.log("Root:", mamMessage.root);
  console.log("NextRoot:", channelQRState.nextRoot);

  // Attach the message.
  console.log("Attaching =================".red);
  console.log("Attaching Eventmessage to tangle, please wait...");
  const { messageId } = await mamAttach(node, mamMessage, "SSA9EXPERIMENTQR");
  console.log(`Message Id`, messageId);
  console.log(
    `You can view the mam channel here https://explorer.iota.org/chrysalis/streams/0/${mamMessage.root}/${mode}/${sideKey}`
  );
  console.log("===============================".yellow);
}

function makeMamEntryPointAttendee() {
  let attendanceNotificationKey = "";
  const publicEventRoot = channelState.nextRoot;
  const expiryDateTime = new Date();

  attendanceNotificationKey = generateSeed(64);
  console.log(`nextroot : ${channelState.nextRoot}`.red);
  makeQRmam(channelState.nextRoot, attendanceNotificationKey, expiryDateTime);

  addEvent2Mam(payload1);
  // sla nextroot op om deelnemerslijst te appenden
  saveChannelState();
}

console.log("SSA-organiser-app".cyan);
// Unique SEED per event
eventSEED = prompt("Event SEED -81 UPPERCASE A-Z,9- (*=default): ");
// password for the private organiser MAMrecord (first in the MAM)
organiserKey = prompt("OrganiserKey -UPPERCASE A-Z,9- (*=default): ");

if (eventSEED === "*") {
  // generate default for debugging -for lazy people-
  eventSEED = generateSeed(81);
}
if (organiserKey === "*") {
  // for first record of MAM (which is private)
  organiserKey = commonSideKey;
}
console.log(`EventSEED = ${eventSEED}`.green);
console.log(`OrganiserKey = ${organiserKey}`.green);

setupMam(payload0).then(() => makeMamEntryPointAttendee());
