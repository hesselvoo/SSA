# Node-SSA-app

This is the Self Sovereign Attendancy application.
Written for NodeJS as a PoC (with lots of remarks en debug-info in the source).

The code-dir has a JS-file for 4 modules:

- organiser.js
- attendee.js
- closeevent.js
- verifier.js

No personal attendee-information is shared over the Tangle (GDPR-proof), the attendee-token is secured with Elliptic Curve Encryption.

Information between the modules is shared through a JSON-file with minimal values (in actual deployment this is done with QR-code and scanner or via iBeacon-function).

It is all based upon IOTA-MAMchannels on the chrysalis-testnet. To be replaced with IOTA-Streams before final deployment.

(c) Adri Wischmann 2021
