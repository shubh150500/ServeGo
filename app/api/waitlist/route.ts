import { NextResponse } from "next/server";
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    // Read service-account.json from project root using process.cwd()
    const saPath = path.join(process.cwd(), "service-account.json");
    const serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));
    initializeApp({
      credential: cert(serviceAccount as any),
    });
  } catch (err) {
    // If running in environment without local file (like Vercel production), fallback
    initializeApp({
      credential: applicationDefault(),
    });
  }
}

const db = getFirestore();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, mobile, city, area, service } = body;

    // 1. Validation checks
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

    // Get client IP address
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    // 2. Run Firestore transaction to check duplicate and increment position atomically
    const waitlistRef = db.collection("waitlist").doc(cleanMobile);
    const counterRef = db.collection("system_config").doc("counters");

    const result = await db.runTransaction(async (transaction) => {
      // Check duplicate mobile
      const waitlistDoc = await transaction.get(waitlistRef);
      if (waitlistDoc.exists) {
        throw new Error("ALREADY_REGISTERED");
      }

      // Get counter
      const counterDoc = await transaction.get(counterRef);
      let currentCount = 2582; // Start from 2582 as a premium default baseline

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
      });

      // Update position counter
      transaction.set(counterRef, { waitlistCount: nextCount }, { merge: true });

      return nextCount;
    });

    return NextResponse.json({
      success: true,
      message: "🎉 You're officially on the ServeGo Waitlist!",
      waitlistPosition: result,
    });

  } catch (error: any) {
    console.error("Waitlist registration failed:", error);
    if (error.message === "ALREADY_REGISTERED") {
      return NextResponse.json({
        error: "This mobile number is already registered on the waitlist.",
      }, { status: 400 });
    }
    return NextResponse.json({
      error: "Failed to join waitlist. Please try again later.",
    }, { status: 500 });
  }
}
