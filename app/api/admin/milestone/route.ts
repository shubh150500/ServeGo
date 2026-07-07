import { NextResponse } from "next/server";
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import webPush from "web-push";

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
    console.error("Firebase Admin initialization error in milestone API:", initErr);
  }
}

const db = getFirestore();

// Configure web-push details
webPush.setVapidDetails(
  "mailto:support@servego.co.in",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

async function sendWorkerPush(workerId: string, title: string, bodyText: string) {
  try {
    const workerSnap = await db.collection("workers").doc(workerId).get();
    if (!workerSnap.exists) return;

    const data = workerSnap.data();
    const sub = data?.pushSubscription;

    if (sub && sub.endpoint) {
      const payload = JSON.stringify({
        title,
        body: bodyText,
        url: "/partner/portal"
      });
      await webPush.sendNotification(sub, payload);
      console.log(`Successfully sent Push to worker: ${workerId}`);
    }
  } catch (err) {
    console.error(`Failed to send Push to worker: ${workerId}`, err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, workerId, bonusAmount, referenceNumber, manualExpenses, adminNotes } = body;

    if (!workerId) {
      return NextResponse.json({ error: "Missing workerId" }, { status: 400 });
    }

    const workerRef = db.collection("workers").doc(workerId);

    // Action 1: Update Notes & Expenses
    if (action === "update_meta") {
      await workerRef.update({
        manualExpenses: parseFloat(manualExpenses) || 0,
        adminNotes: adminNotes || "",
        updatedAt: FieldValue.serverTimestamp()
      });
      return NextResponse.json({ success: true, message: "Metadata updated successfully" });
    }

    // Action 2: Approve Milestone
    if (action === "approve") {
      if (!bonusAmount || isNaN(bonusAmount)) {
        return NextResponse.json({ error: "Invalid bonus amount" }, { status: 400 });
      }

      await workerRef.update({
        milestoneStatus: "approved",
        milestoneBonusAmount: parseFloat(bonusAmount),
        milestoneApprovedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      await sendWorkerPush(
        workerId,
        "🎉 Bonus Approved!",
        "Your milestone reward has been approved. Tap here to withdraw your bonus."
      );

      return NextResponse.json({ success: true, message: "Milestone approved successfully" });
    }

    // Action 3: Reject Milestone
    if (action === "reject") {
      await workerRef.update({
        milestoneStatus: "rejected",
        updatedAt: FieldValue.serverTimestamp()
      });

      await sendWorkerPush(
        workerId,
        "⚠️ Milestone Update",
        "Your milestone submission status has been updated. Check portal for notes."
      );

      return NextResponse.json({ success: true, message: "Milestone rejected successfully" });
    }

    // Action 4: Complete Payment
    if (action === "pay") {
      if (!referenceNumber) {
        return NextResponse.json({ error: "Reference number is required" }, { status: 400 });
      }

      const workerSnap = await workerRef.get();
      if (!workerSnap.exists) {
        return NextResponse.json({ error: "Worker not found" }, { status: 404 });
      }

      const wData = workerSnap.data() || {};
      const currentMilestone = wData.currentMilestone || 100;
      const bonus = wData.milestoneBonusAmount || 0;

      await workerRef.update({
        milestoneStatus: "paid",
        milestonePaymentDetails: {
          paidAt: new Date(),
          referenceNumber: referenceNumber,
          bonusAmount: bonus
        },
        updatedAt: FieldValue.serverTimestamp()
      });

      await sendWorkerPush(
        workerId,
        "💸 Bonus Paid Successfully!",
        `Your milestone bonus of ₹${bonus} has been successfully credited.`
      );

      return NextResponse.json({ success: true, message: "Payment recorded successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Milestone API Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
