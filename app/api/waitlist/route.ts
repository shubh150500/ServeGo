import { NextResponse } from "next/server";
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// 1. Robust Firebase Admin initialization
let serviceAccount: any = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", e);
  }
} else if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
} else {
  // Try local service account file in dev mode
  try {
    const saPath = path.join(process.cwd(), "service-account.json");
    if (fs.existsSync(saPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));
    }
  } catch (err) {
    console.error("Failed to read local service-account.json:", err);
  }
}

if (!getApps().length) {
  try {
    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      initializeApp({
        credential: applicationDefault(),
      });
    }
  } catch (initErr) {
    console.error("Firebase Admin initialization error:", initErr);
  }
}

const db = getFirestore();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, mobile, city, area, service, referredBy, browser, device } = body;

    // Validation checks
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
    }
    if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
      return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    }
    if (!city || !city.trim()) {
      return NextResponse.json({ error: "City is required." }, { status: 400 });
    }
    if (!service || !service.trim()) {
      return NextResponse.json({ error: "Interested Service is required." }, { status: 400 });
    }

    const cleanMobile = mobile.trim();
    const cleanName = name.trim();
    const cleanCity = city.trim();
    const cleanArea = area ? area.trim() : "";
    const cleanService = service.trim();
    const cleanReferredBy = referredBy ? referredBy.trim() : null;

    // Get client IP address
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    const waitlistRef = db.collection("waitlist").doc(cleanMobile);
    const counterRef = db.collection("system_config").doc("counters");

    // Run transaction
    const result = await db.runTransaction(async (transaction) => {
      // Check duplicate mobile
      const waitlistDoc = await transaction.get(waitlistRef);
      if (waitlistDoc.exists) {
        return {
          alreadyRegistered: true,
          waitlistPosition: waitlistDoc.data()?.waitlistPosition || 0
        };
      }

      // Check if referred by someone (find referrer by position number from code SGXXXX)
      let referrerRef = null;
      let referrerData = null;
      if (cleanReferredBy && cleanReferredBy.startsWith("SG")) {
        const referrerPos = parseInt(cleanReferredBy.substring(2), 10);
        if (!isNaN(referrerPos)) {
          const referrerQuery = db.collection("waitlist").where("waitlistPosition", "==", referrerPos).limit(1);
          const querySnapshot = await transaction.get(referrerQuery);
          if (!querySnapshot.empty) {
            referrerRef = querySnapshot.docs[0].ref;
            referrerData = querySnapshot.docs[0].data();
          }
        }
      }

      // Get counter
      const counterDoc = await transaction.get(counterRef);
      let currentCount = 2582; // Baseline counter value

      if (counterDoc.exists) {
        const data = counterDoc.data();
        if (data && typeof data.waitlistCount === "number") {
          currentCount = data.waitlistCount;
        }
      }

      const nextCount = currentCount + 1;

      // Set new waitlist position document
      transaction.set(waitlistRef, {
        name: cleanName,
        mobile: cleanMobile,
        city: cleanCity,
        area: cleanArea,
        interestedService: cleanService,
        waitlistPosition: nextCount,
        status: "pending",
        ip: ip,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        device: device || "unknown",
        browser: browser || "unknown",
        referredBy: cleanReferredBy,
        referralCount: 0
      });

      // Update position counter
      transaction.set(counterRef, { waitlistCount: nextCount }, { merge: true });

      // If referral is valid, reward the referrer by boosting their position
      if (referrerRef && referrerData) {
        const currentReferrals = referrerData.referralCount || 0;
        const currentPos = referrerData.waitlistPosition || nextCount;
        
        // Move them up by 5 positions (max priority #1)
        const newPos = Math.max(1, currentPos - 5);
        
        transaction.update(referrerRef, {
          referralCount: currentReferrals + 1,
          waitlistPosition: newPos,
          updatedAt: FieldValue.serverTimestamp()
        });
      }

      return {
        alreadyRegistered: false,
        waitlistPosition: nextCount
      };
    });

    if (result.alreadyRegistered) {
      return NextResponse.json({
        success: true,
        alreadyRegistered: true,
        message: "✅ Welcome back!\n\nYou're already on the ServeGo Waitlist.",
        waitlistPosition: result.waitlistPosition,
      });
    }

    return NextResponse.json({
      success: true,
      alreadyRegistered: false,
      message: "🎉 You're officially on the ServeGo Waitlist!",
      waitlistPosition: result.waitlistPosition,
    });

  } catch (error: any) {
    console.error("Waitlist registration failed:", error);
    return NextResponse.json({
      error: error.message || "Failed to join waitlist. Please try again later.",
    }, { status: 500 });
  }
}

