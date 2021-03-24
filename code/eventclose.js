//////////////////////////////////////////////////////////
// Organiser eventclose-app
// (c) A.J. Wischmann 2021
//////////////////////////////////////////////////////////

const { bufferToHex, hexToBuffer, decrypt } = require("eccrypto-js");
const eccryptoJS = require("eccrypto-js");
const {
  createChannel,
  createMessage,
  parseMessage,
  mamAttach,
  mamFetch,
  TrytesHelper,
  channelRoot,
} = require("@iota/mam-chrysalis.js");
const { retrieveData, SingleNodeClient, Converter } = require("@iota/iota.js");
const luxon = require("luxon");
const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");

let walletState;
const node = "https://api.hornet-0.testnet.chrysalis2.com";
const commonSideKey =
  "SSACOMMONKEY9SSACOMMONKEY9SSACOMMONKEY9SSACOMMONKEY9SSACOMMONKEY9SSACOMMONKEY9SSA";
let mamNextRoot;
let privateSideKey = "";
let privateOrgPrivateEventKey = "";
let attendancyAddress = "";
let eventInformation = "";

async function readWallet() {
  // Try and load the wallet state from json file
  try {
    const currentState = fs.readFileSync("./Wallet.json");
    if (currentState) {
      walletState = JSON.parse(currentState.toString());
    }
  } catch (e) {}
  privateSideKey = walletState.password;
  attendancyAddress = walletState.indexation;
}

async function readPrivateOrganiserInfo() {
  const mode = "restricted";
  const sideKey = privateSideKey;

  let root = channelRoot(createChannel(walletState.seed, 2, mode, sideKey));
  //DEBUGINFO
  // console.log("Fetching from tangle with this information :");
  // console.log(`Node : ${node}`.yellow);
  // console.log(`EventRoot : ${root}`.yellow);
  // console.log(`mode : ${mode}`.yellow);
  // console.log(`sideKey : ${sideKey}`.yellow);

  // Try fetching from MAM
  console.log(
    "Fetching privateOrganiserInformation from tangle, please wait..."
  );
  const fetched = await mamFetch(node, root, mode, sideKey);
  if (fetched) {
    let fMessage = JSON.parse(TrytesHelper.toAscii(fetched.message));
    // console.log("Fetched : ", fMessage);
    eventTitle = fMessage.title;
    privateOrgPrivateEventKey = hexToBuffer(fMessage.ePKey);
    publicEventRoot = fetched.nextRoot;
  } else {
    console.log("Nothing was fetched from the MAM channel");
  }
  //DEBUGINFO
  // console.log("MAMdata ===================".red);
  // console.log(`fetched : ${fetched.message}`.green);
}

async function readPublicEventInfo() {
  const mode = "restricted";
  const sideKey = commonSideKey;

  console.log(
    "Fetching publicEventInformation from tangle with this information :"
  );
  //DEBUGINFO
  // console.log(`Node : ${node}`.yellow);
  // console.log(`EventRoot : ${publicEventRoot}`.yellow);
  // console.log(`mode : ${mode}`.yellow);
  // console.log(`sideKey : ${sideKey}`.yellow);

  // Try fetching from MAM
  console.log("Fetching from tangle, please wait...");
  const fetched = await mamFetch(node, publicEventRoot, mode, sideKey);
  if (fetched) {
    let fMessage = JSON.parse(TrytesHelper.toAscii(fetched.message));
    // console.log("Fetched : ", fMessage);
    eventInformation = fMessage;
    mamNextRoot = fetched.nextRoot;
  } else {
    console.log("Nothing was fetched from the MAM channel");
  }
  //DEBUGINFO
  // console.log("MAMdata ===================".red);
  // console.log(`fetched : ${fetched.message}`.green);
}

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

async function attendeeList(attIndexation) {
  // retrieve a raw list of attendeetransactions
  const client = new SingleNodeClient(node);
  console.log(`attendeeList : ${attIndexation}`.green);
  const found = await client.messagesFind(attIndexation);
  return found;
}

async function showAlist(attendeeIndex) {
  // show attendeeTransactionList

  console.log("===============".red);
  const mList = await attendeeList(attendeeIndex);
  for (let i = 0; i < mList.count; i++) {
    console.log(`${i} : ${mList.messageIds[i]}`);
  }
  // showAttendeeCount
  console.log(`Total : ${mList.count} ===============`.red);
}

async function getAttendee(attendeeMessageID) {
  // retrieve attendeeTransaction from Tangle
  const client = new SingleNodeClient(node);
  // console.log(`Retrieving : ${attendeeMessageID}`.dim);
  const transactionDataRAW = await retrieveData(client, attendeeMessageID);
  transactionData = JSON.parse(Converter.bytesToUtf8(transactionDataRAW.data));
  //DEBUGINFO
  // console.log(`Raw : ${transactionData}`);
  // console.dir(transactionData);

  if (transactionData) {
    const encryptedData = {
      iv: hexToBuffer(transactionData.a),
      ephemPublicKey: hexToBuffer(transactionData.b),
      ciphertext: hexToBuffer(transactionData.c),
      mac: hexToBuffer(transactionData.d),
    };
    decrypted = await decrypt(privateOrgPrivateEventKey, encryptedData);
    return decrypted;
  }
}

async function detailedList(attendeeIndex) {
  // show list of attendees with details
  const idList = [];
  const aList = await attendeeList(attendeeIndex);
  // readAttendeeRecord, decrypt, extract AttendeeID, timestamp
  for (let i = 0; i < aList.count; i++) {
    let attendeeToken = await getAttendee(aList.messageIds[i]);
    let aTokenJson = JSON.parse(attendeeToken);
    if (idList.indexOf(aTokenJson.attendeeID) === -1) {
      idList.push(aTokenJson.attendeeID);
      console.log(
        `${i} : ${aList.messageIds[i]} \n\t ${aTokenJson.attendeeID} - ${aTokenJson.remark} - ${aTokenJson.timestamp}`
      );
    } else {
      console.log(
        `${i} : ${aList.messageIds[i]} - DOUBLE ID - \n\t ${aTokenJson.attendeeID} - ${aTokenJson.remark} - ${aTokenJson.timestamp}`
          .brightRed
      );
    }
  }
  console.log(`Total unique IDs : ${idList.length} =========`.green);
}

async function closeEvent(attendeeIndex) {
  // makelist, writeList2MAM, writeCloseMessage
  const mode = "restricted";
  const sideKey = commonSideKey;

  const attList = [];
  const aList = await attendeeList(attendeeIndex);
  // readAttendeeRecord, decrypt, extract AttendeeID, add2List
  for (let i = 0; i < aList.count; i++) {
    let attendeeToken = await getAttendee(aList.messageIds[i]);
    let aTokenJson = JSON.parse(attendeeToken);
    // add to list if unique
    if (attList.indexOf(aTokenJson.attendeeID) === -1) {
      attList.push(aTokenJson.attendeeID);
    }
  }
  // appendAttendeeList2MAM
  const payloadDataRec = {
    count: attList.length,
    ids: attList,
  };
  // console.log("AttendeeListRec ===============".red);
  // console.log(payloadDataRec);

  // loadchannelState
  try {
    const currentState = fs.readFileSync("./channelState.json");
    if (currentState) {
      channelState = JSON.parse(currentState.toString());
    }
  } catch (e) {
    console.error(e);
  }

  const mamMessage = createMessage(
    channelState,
    TrytesHelper.fromAscii(JSON.stringify(payloadDataRec))
  );

  // Display the details for the MAM message.
  console.log("=================".red);
  console.log("Seed:", channelState.seed);
  console.log("Address:", mamMessage.address);
  console.log("Root:", mamMessage.root);
  console.log("NextRoot:", channelState.nextRoot);

  // Attach the message.
  console.log("Attaching =================".red);
  console.log("Attaching attendeeListMessage to tangle, please wait...");
  const { messageId } = await mamAttach(node, mamMessage, "SSA9EXPERIMENT");
  console.log(`Message Id`, messageId);
  console.log(
    `You can view the mam channel here https://explorer.iota.org/chrysalis/streams/0/${mamMessage.root}/${mode}/${sideKey}`
  );
  console.log("===============================".yellow);
  // appendCloseMessage -include closingTimestamp
  let nu = luxon.DateTime.now();
  const payloadClose = {
    message: "Event closed",
    date: nu.toISO(),
  };

  const mamCloseMessage = createMessage(
    channelState,
    TrytesHelper.fromAscii(JSON.stringify(payloadClose))
  );

  // Attach the message.
  console.log("Attaching =================".red);
  console.log("Attaching closingMessage to tangle, please wait...");
  const { messageCloseId } = await mamAttach(
    node,
    mamCloseMessage,
    "SSA9EXPERIMENT"
  );

  // Store the channel state for appending messages
  try {
    fs.writeFileSync(
      "./channelState.json",
      JSON.stringify(channelState, undefined, "\t")
    );
  } catch (e) {
    console.error(e);
  }
  console.log(`Message Id`, messageCloseId);
  console.log(
    `You can view the mam channel here https://explorer.iota.org/chrysalis/streams/0/${mamCloseMessage.root}/${mode}/${sideKey}`
  );
  console.log("===============================".yellow);
  console.log("-- Event closed by organiser --".cyan);
  // writeMAMstate for appending extra information
}

async function run() {
  console.log("Event-close-app".cyan);
  readWallet();
  console.log("Wallet".red);
  console.log(`EventSEED  : ${walletState.seed}`);
  console.log(`Password   : ${walletState.password}`);
  console.log(`Indexation : ${walletState.indexation}`);
  console.log(`AttendeeQR : ${walletState.aQR}`);

  // extractPrivateEventKey
  await readPrivateOrganiserInfo();
  await readPublicEventInfo();
  // show EventInformation
  presentEventInfo(eventInformation);
  //TODO show if event was already closed

  console.log("=================================================".green);
  let theEnd = false;
  while (!theEnd) {
    let menuChoice = prompt(
      "Menu [l]-list, [d]-detailedlist, [c]-close, [q]-quit : "
    );
    if (menuChoice == "l") {
      // show current list of attendees
      await showAlist(attendancyAddress);
    }
    if (menuChoice == "d") {
      // close the event
      await detailedList(attendancyAddress);
    }
    if (menuChoice == "c") {
      // close the event
      await closeEvent(attendancyAddress);
    }
    if (menuChoice == "q") {
      // exit the application
      theEnd = true;
    }
  }
}

run();
