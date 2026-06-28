import { NextResponse } from "next/server";
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

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
    console.error("Firebase Admin initialization error in worker action API:", initErr);
  }
}

const db = getFirestore();

export async function POST(req: Request) {
  try {
    const { bookingId, token, action, completionPhotoUrl } = await req.json();

    if (!bookingId || !token || !action) {
      return NextResponse.json({ error: "Booking ID, token, and action are required." }, { status: 400 });
    }

    const bookingRef = db.collection("bookings").doc(bookingId);

    // Run transaction
    const result = await db.runTransaction(async (transaction) => {
      const bSnap = await transaction.get(bookingRef);

      if (!bSnap.exists) {
        throw new Error("Job booking record not found.");
      }

      const bData = bSnap.data() || {};

      // Security check: Verify token
      if (bData.securityToken !== token) {
        throw new Error("Unauthorized access token.");
      }

      const workerId = bData.assignedWorkerId;
      if (!workerId) {
        throw new Error("No worker assigned to this job.");
      }

      const workerRef = db.collection("workers").doc(workerId);
      const wSnap = await transaction.get(workerRef);

      if (!wSnap.exists) {
        throw new Error("Assigned worker profile not found.");
      }

      const wData = wSnap.data() || {};

      if (action === "accept") {
        if (bData.status !== "ASSIGNED") {
          throw new Error(`Job status is ${bData.status}. You cannot accept it.`);
        }

        const currentAccepted = wData.totalAcceptedJobs || 0;

        transaction.update(bookingRef, {
          status: "ACCEPTED",
          updatedAt: FieldValue.serverTimestamp()
        });

        transaction.update(workerRef, {
          totalAcceptedJobs: currentAccepted + 1,
          activeJobId: bookingId,
          updatedAt: FieldValue.serverTimestamp()
        });

        return { message: "Job accepted successfully." };

      } else if (action === "reject") {
        if (bData.status !== "ASSIGNED") {
          throw new Error(`Job status is ${bData.status}. You cannot reject it.`);
        }

        const currentRejected = wData.totalRejectedJobs || 0;

        transaction.update(bookingRef, {
          status: "REJECTED",
          assignedWorkerId: null, // Release worker
          updatedAt: FieldValue.serverTimestamp()
        });

        transaction.update(workerRef, {
          totalRejectedJobs: currentRejected + 1,
          updatedAt: FieldValue.serverTimestamp()
        });

        return { message: "Job rejected successfully." };

      } else if (action === "complete") {
        if (bData.status !== "ACCEPTED") {
          throw new Error(`Job status is ${bData.status}. Only accepted jobs can be completed.`);
        }

        if (!completionPhotoUrl) {
          throw new Error("Completion proof photo is required.");
        }

        const currentCompleted = wData.totalCompletedJobs || 0;

        transaction.update(bookingRef, {
          status: "COMPLETED",
          completionPhotoUrl: completionPhotoUrl,
          completedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });

        transaction.update(workerRef, {
          totalCompletedJobs: currentCompleted + 1,
          activeJobId: null, // Clear active job slot
          updatedAt: FieldValue.serverTimestamp()
        });

        return { message: "Job marked as completed successfully." };

      } else {
        throw new Error("Invalid action request.");
      }
    });

    return NextResponse.json({ success: true, message: result.message });

  } catch (error: any) {
    console.error("Worker action API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
