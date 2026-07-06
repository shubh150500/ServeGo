const { initializeApp, cert } = require('firebase-admin/app');
const { getSecurityRules } = require('firebase-admin/security-rules');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

async function deploy() {
  try {
    const rulesPath = path.join(__dirname, 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    const rules = getSecurityRules();
    console.log("Creating ruleset...");
    const rulesFile = {
      name: 'firestore.rules',
      content: rulesContent
    };
    const ruleset = await rules.createRuleset(rulesFile);
    console.log("Releasing ruleset...");
    await rules.releaseFirestoreRuleset(ruleset);
    console.log("Firestore rules deployed successfully!");
  } catch (error) {
    console.error("Failed to deploy rules:", error);
  }
}

deploy();
