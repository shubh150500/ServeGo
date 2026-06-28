import { NextResponse } from "next/server";
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
let serviceAccount: any = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", e);
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
    console.error("Firebase Admin initialization error in worker job API:", initErr);
  }
}

const db = getFirestore();

export async function POST(req: Request) {
  try {
    const { bookingId, token } = await req.json();

    if (!bookingId || !token) {
      return NextResponse.json({ error: "Booking ID and token are required." }, { status: 400 });
    }

    // Fetch booking document using Admin SDK
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json({ error: "Job booking not found." }, { status: 404 });
    }

    const bookingData = bookingSnap.data() || {};

    // Verify token matches securityToken
    if (bookingData.securityToken !== token) {
      return NextResponse.json({ error: "Unauthorized access token." }, { status: 403 });
    }

    let workerData = null;

    // Fetch assigned worker details using Admin SDK
    if (bookingData.assignedWorkerId) {
      const workerSnap = await db.collection("workers").doc(bookingData.assignedWorkerId).get();
      if (workerSnap.exists) {
        workerData = { id: workerSnap.id, ...workerSnap.data() };
      }
    }

    return NextResponse.json({
      success: true,
      booking: { id: bookingSnap.id, ...bookingData },
      worker: workerData
    });

  } catch (error: any) {
    console.error("Fetch worker job details error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
