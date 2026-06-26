const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.join(__dirname, "../service-account.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: service-account.json not found in root directory.");
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "services-z-f920f.firebasestorage.app",
});

const db = getFirestore();
const storage = getStorage();
const auth = getAuth();

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on next batch
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

async function clearStorage() {
  try {
    const bucket = storage.bucket();
    // Delete files in completions/
    const [completionsFiles] = await bucket.getFiles({ prefix: "completions/" });
    for (const file of completionsFiles) {
      await file.delete();
      console.log(`Deleted storage file: ${file.name}`);
    }

    // Delete files in logos/
    const [logosFiles] = await bucket.getFiles({ prefix: "logos/" });
    for (const file of logosFiles) {
      await file.delete();
      console.log(`Deleted storage file: ${file.name}`);
    }
    console.log("✓ Firebase Storage completions and logos cleared.");
  } catch (error) {
    console.error("Storage clear error or no files to delete:", error.message);
  }
}

async function clearAuthUsers() {
  try {
    let nextPageToken;
    do {
      const listUsersResult = await auth.listUsers(100, nextPageToken);
      const userUids = listUsersResult.users.map((user) => user.uid);
      if (userUids.length > 0) {
        await auth.deleteUsers(userUids);
        console.log(`Deleted ${userUids.length} authentication users.`);
      }
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    console.log("✓ Firebase Authentication users cleared.");
  } catch (error) {
    console.error("Auth clear error:", error.message);
  }
}

async function run() {
  console.log("Starting Firebase fresh reset...");

  // 1. Clear Firestore collections
  const collections = ["bookings", "workers", "payments", "reviews", "complaints", "admin_logs", "customers"];
  for (const col of collections) {
    console.log(`Clearing collection: ${col}...`);
    await deleteCollection(col);
    console.log(`✓ Collection ${col} cleared.`);
  }

  // 2. Clear Storage
  console.log("Clearing Storage...");
  await clearStorage();

  // 3. Clear Auth
  console.log("Clearing Authentication Users...");
  await clearAuthUsers();

  console.log("\nFirebase reset complete! Your Firebase project is now 100% FRESH.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
