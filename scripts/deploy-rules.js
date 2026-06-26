const { initializeApp, cert } = require("firebase-admin/app");
const { getSecurityRules } = require("firebase-admin/security-rules");
const fs = require("fs");
const path = require("path");

// Load the copied service account credential
const serviceAccountPath = path.join(__dirname, "../service-account.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: service-account.json not found in root directory.");
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "services-z-f920f.firebasestorage.app",
});

async function deploySecurityRules() {
  try {
    const rulesService = getSecurityRules();

    // 1. Deploy Firestore Rules
    const firestoreRulesPath = path.join(__dirname, "../firestore.rules");
    if (fs.existsSync(firestoreRulesPath)) {
      console.log("Reading firestore.rules...");
      const firestoreRulesSource = fs.readFileSync(firestoreRulesPath, "utf8");
      
      console.log("Deploying Firestore Security Rules programmatically...");
      await rulesService.releaseFirestoreRulesetFromSource(firestoreRulesSource);
      console.log("✓ Firestore Security Rules deployed successfully!");
    } else {
      console.warn("Warning: firestore.rules file not found. Skipping.");
    }

    // 2. Deploy Storage Rules
    const storageRulesPath = path.join(__dirname, "../storage.rules");
    if (fs.existsSync(storageRulesPath)) {
      console.log("Reading storage.rules...");
      const storageRulesSource = fs.readFileSync(storageRulesPath, "utf8");
      
      console.log("Deploying Storage Security Rules programmatically...");
      await rulesService.releaseStorageRulesetFromSource(storageRulesSource);
      console.log("✓ Firebase Storage Security Rules deployed successfully!");
    } else {
      console.warn("Warning: storage.rules file not found. Skipping.");
    }

    console.log("\nAll Firebase Rules are now ACTIVE and secured in production!");
    process.exit(0);
  } catch (error) {
    console.error("FATAL: Failed to deploy rules:", error);
    process.exit(1);
  }
}

deploySecurityRules();
