const {
  createChannel,
  createMessage,
  parseMessage,
  mamAttach,
  mamFetch,
  TrytesHelper,
} = require("@iota/mam-chrysalis.js");
const crypto = require("crypto");
const { sendData, SingleNodeClient, Converter } = require("@iota/iota.js");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");

const node = "https://api.lb-0.testnet.chrysalis2.com/";

const privateOrgPrivateTitle = "Interreg Blockchain-event";
const privateOrgPrivateEventKey = "1928374655367182725143759";

const publicEventKey = "92837151423132255588337736251662";

const organiserName = "Courseware Ltd.";
const organiserAddress = "53 Pumbertonstreet";
const organiserPostcode = "23788";
const organiserCity = "London";
const organiserURL = "http://courseware.com";
const organiserTelephone = "01 234 56 789";
const organiserMail = "info@courseware.com";

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

async function setupMam(payload) {
  // add message to MAM
  const mode = "restricted";
  const sideKey = organiserKey;
  //   const sideKey = commonSideKey;

  channelState = createChannel(eventSEED, 2, mode, sideKey);
  const mamMessage = createMessage(
    channelState,
    TrytesHelper.fromAscii(JSON.stringify(payload))
  );

  //   console.log("mamMessage =================".red);
  //   console.log(mamMessage);
  console.log("channelState =================".red);
  console.log(channelState);
  console.log("Payload =================".red);
  console.log(JSON.stringify(payload));
  console.log("=================".red);

  // Display the details for the MAM message.
  console.log("Seed:", channelState.seed);
  console.log("Address:", mamMessage.address);
  console.log("Root:", mamMessage.root);
  console.log("NextRoot:", channelState.nextRoot);

  console.log("Attaching =================".red);
  // Attach the message.
  console.log("Attaching private-Eventmessage to tangle, please wait...");
  const { messageId } = await mamAttach(node, mamMessage, "SSA9EXPERIMENT");
  console.log(`Message Id`, messageId);
  console.log(
    `You can view the mam channel here https://explorer.iota.org/chrysalis/streams/0/${mamMessage.root}/${mode}/${sideKey}`
  );
  console.log("===============================".yellow);
}

async function addEvent2Mam(payload) {
  // add message to MAM
  const mode = "restricted";
  const sideKey = commonSideKey;

  //TODO change channel-sidekey to commonKey
  channelState.sideKey = commonSideKey;
  console.log("Payload =================".red);
  console.log(JSON.stringify(payload));

  const mamMessage = createMessage(
    channelState,
    TrytesHelper.fromAscii(JSON.stringify(payload))
  );

  console.log("channelState =================".red);
  console.log(channelState);
  //   console.log("mamMessage =================".red);
  //   console.log(mamMessage);

  // Display the details for the MAM message.
  console.log("=================".red);
  console.log("Seed:", channelState.seed);
  console.log("Address:", mamMessage.address);
  console.log("Root:", mamMessage.root);
  console.log("NextRoot:", channelState.nextRoot);

  console.log("Attaching =================".red);
  // Attach the message.
  console.log("Attaching Eventmessage to tangle, please wait...");
  const { messageId } = await mamAttach(node, mamMessage, "SSA9EXPERIMENT");
  console.log(`Message Id`, messageId);
  console.log(
    `You can view the mam channel here https://explorer.iota.org/chrysalis/streams/0/${mamMessage.root}/${mode}/${sideKey}`
  );
  console.log("===============================".yellow);
}
function generateSeed(length) {
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

console.log("SSA-organiser-app".cyan);
// Unique SEED per event
eventSEED = prompt("Event SEED (*=default): ");
// password for the private organiser MAMrecord (first in the MAM)
organiserKey = prompt("OrganiserKey -Uppercase, no numbers- (*=default): ");

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

const payload0 = {
  title: privateOrgPrivateTitle,
  timestamp: new Date().toLocaleString(),
  eventPrivateKey: privateOrgPrivateEventKey,
};

const payload1 = {
  orgname: organiserName,
  orgaddress: organiserAddress,
  orgzip: organiserPostcode,
  orgcity: organiserCity,
  orgtel: organiserTelephone,
  orgmail: organiserMail,
  orgurl: organiserURL,
  eventname: eventName,
  eventloc: eventLocation,
  eventdate: eventDate,
  eventtime: eventTime,
  eventPublicKey: publicEventKey,
};

function makeMamEntryPointAttendee() {
  attendeeQRcode = generateSeed(81);
  console.log(`Attendee QR-seed : ${attendeeQRcode}`.cyan);

  // doe een datatransactie met nextroot als arg. op adres1 van seed

  addEvent2Mam(payload1);

  // sla nextroot op om deelnemerslijst te appenden
}

setupMam(payload0).then(() => makeMamEntryPointAttendee());
