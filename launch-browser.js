// Start een Chromium-browser voor de testscripts.
//
// In sommige ontwikkelomgevingen (zoals de cloud-werkomgeving waarin deze
// tests oorspronkelijk zijn gebouwd) staat Chromium op een vaste plek,
// zonder de gebruikelijke Playwright-browserdownload. Op een gewone
// computer werkt de standaard Playwright-installatie prima: na `npx
// playwright install chromium` (zie README.md) vindt Playwright de browser
// vanzelf, zonder dat hier een pad voor nodig is.
"use strict";

const fs = require("fs");
const { chromium } = require("playwright");

const SANDBOX_CHROMIUM = "/opt/pw-browsers/chromium";

function launchBrowser(options){
  const opts = Object.assign({}, options);
  if(fs.existsSync(SANDBOX_CHROMIUM)){
    opts.executablePath = SANDBOX_CHROMIUM;
  }
  return chromium.launch(opts);
}

module.exports = { launchBrowser };
