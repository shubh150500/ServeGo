import { NextResponse } from "next/server";
import crypto from "crypto";
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
    console.error("Firebase Admin initialization error in verify API:", initErr);
  }
}

const db = getFirestore();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured" },
        { status: 500 }
      );
    }

    // Action 1: check_order (recovery mode for mobile UPI redirect state loss)
    if (body.action === "check_order") {
      const { order_id, booking_id } = body;

      if (!order_id || !booking_id) {
        return NextResponse.json(
          { error: "Missing order_id or booking_id" },
          { status: 400 }
        );
      }

      // Query Razorpay API for payments matching this order_id
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      const rpResponse = await fetch(`https://api.razorpay.com/v1/orders/${order_id}/payments`, {
        headers: {
          Authorization: authHeader,
        },
      });

      if (!rpResponse.ok) {
        const errText = await rpResponse.text();
        console.error("Razorpay payments fetch failed:", errText);
        return NextResponse.json({ verified: false, error: "Failed to query Razorpay order" });
      }

      const paymentsData = await rpResponse.json();
      const items = paymentsData.items || [];

      // Find any payment that was successfully captured
      const capturedPayment = items.find((p: any) => p.status === "captured");

      if (!capturedPayment) {
        return NextResponse.json({ verified: false, error: "No captured payment found for this order" });
      }

      // Payment was successful! Update the staged booking inside Firestore
      const bookingRef = db.collection("bookings").doc(booking_id);
      const bookingSnap = await bookingRef.get();

      if (!bookingSnap.exists) {
        return NextResponse.json({ error: "Booking record not found" }, { status: 404 });
      }

      const bookingData = bookingSnap.data();
      if (bookingData?.status === "INITIATED") {
        // Run a Firestore transaction to update status & create payment records
        await db.runTransaction(async (transaction) => {
          transaction.update(bookingRef, {
            status: "NEW",
            assuranceFeePaid: true,
            razorpayPaymentId: capturedPayment.id,
            updatedAt: new Date(),
          });

          // Create payment document
          const paymentRef = db.collection("payments").doc();
          transaction.set(paymentRef, {
            bookingId: booking_id,
            razorpayOrderId: order_id,
            razorpayPaymentId: capturedPayment.id,
            amount: capturedPayment.amount / 100, // paise to INR
            customerId: "",
            status: "captured",
            createdAt: new Date(),
          });

          // Register guest customer
          const customerRef = db.collection("customers").doc(bookingData.customerMobile);
          transaction.set(customerRef, {
            name: bookingData.customerName,
            mobile: bookingData.customerMobile,
            createdAt: new Date(),
          }, { merge: true });
        });
      }

      return NextResponse.json({ verified: true });
    }

    // Action 2: Standard inline signature verification
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment verification parameters" },
        { status: 400 }
      );
    }

    // Razorpay signature verification algorithm
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        { verified: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ verified: true });
  } catch (err: any) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
