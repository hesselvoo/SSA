//////////////////////////////////////////////////////////
// Attendee generate QR-app
// (c) A.J. Wischmann 2021
//////////////////////////////////////////////////////////

const {
  bufferToHex,
  hexToBuffer,
  sha256,
  encrypt,
  utf8ToBuffer,
} = require("eccrypto-js");
const luxon = require("luxon");
const fs = require("fs");
const prompt = require("prompt-sync")({ sigint: true });
const colors = require("colors");

// readWallet
// generateQR
// writeQR
