# Node-SSA-app

This is the Self Sovereign Attendancy application.
Written for NodeJS as a PoC (with lots of remarks en debug-info in the source).

The code-dir has a JS-file for 4 modules:

- organiser.js
- attendee.js
- closeevent.js
- verifier.js

organiser.js: registers the eventinformation on the Tangle and generates a QRcode (expirytime +15min.) for the attendee to find the eventinfo.

attendee.js: looks up the event on the Tangle, registers the attendee and generates a verifierQR (as a demo)

closeevent.js: makes a list of all attendees who registered, writes is to the Tangle and closes the event.

verifier.js: reads the verifierQR and checks on the Tangle at the event if the attendee was registered.

No personal attendee-information is shared over the Tangle (GDPR-proof), the attendee-token is secured with Elliptic Curve Encryption (comparable with RSA-3072).

Information between the modules is shared through a JSON-file with minimal values (in actual deployment this is done with QR-code and scanner or via iBeacon-function).

It is all based upon IOTA-MAMchannels on the chrysalis-testnet. To be replaced with IOTA-Streams before final deployment.

(c) Adri Wischmann 2021
