//////////////////////////////////////////////////////////
// Attendee attend-event-app
//////////////////////////////////////////////////////////

const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");

function readQR() {
  // Try and load the QR-seed from file
  try {
    const data = fs.readFileSync("./QRcode.json", "utf8");
    return data;
  } catch (err) {}
}

console.log("SSA-attendee-app".cyan);
let eventQR = prompt("Event QR-code (*=savedversion): ");
if (eventQR === "*") {
  eventQR = readQR(eventQR);
  console.log(eventQR.yellow);
}
