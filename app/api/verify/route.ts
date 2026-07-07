import { NextResponse } from "next/server";
import crypto from "crypto";
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
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
    console.error("Firebase Admin initialization error in verify API:", initErr);
  }
}

const db = getFirestore();

// Configure web-push details
webPush.setVapidDetails(
  "mailto:support@servego.co.in",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

// Broadcast notification helper
async function broadcastPushNotification(serviceType: string, customerArea: string, bookingId: string) {
  try {
    const serviceLabel = serviceType.toUpperCase();

    // Query active workers registered under this service type
    const workersSnap = await db.collection("workers")
      .where("status", "==", "active")
      .where("serviceType", "==", serviceType)
      .get();

    if (workersSnap.empty) {
      console.log(`No active partners matching serviceType: ${serviceType}`);
      return;
    }

    const payload = JSON.stringify({
      title: `🚨 NEW ${serviceLabel} BOOKING!`,
      body: `A new dispatch request is available in area: ${customerArea}. Tap here to accept!`,
      tag: bookingId,
      url: `/partner/portal`
    });

    const sendPromises = workersSnap.docs.map(async (doc) => {
      const data = doc.data();
      const sub = data.pushSubscription;

      if (sub && sub.endpoint) {
        try {
          await webPush.sendNotification(sub, payload);
          console.log(`Successfully sent Web Push to partner: ${data.name}`);
        } catch (err: any) {
          console.error(`Failed to send Web Push to partner: ${data.name}`, err);
          // If notification subscription endpoint is dead, clear it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await doc.ref.update({ pushSubscription: null });
          }
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error("Error in Web Push broadcasting:", err);
  }
}

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

    // Action 1: check_order (mobile tab recovery checking)
    if (body.action === "check_order") {
      const { order_id, booking_id } = body;

      if (!order_id || !booking_id) {
        return NextResponse.json(
          { error: "Missing order_id or booking_id" },
          { status: 400 }
        );
      }

      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      const rpResponse = await fetch(`https://api.razorpay.com/v1/orders/${order_id}/payments`, {
        headers: {
          Authorization: authHeader,
        },
      });

      if (!rpResponse.ok) {
        const errText = await rpResponse.text();
        console.error("Razorpay payments query failed:", errText);
        return NextResponse.json({ verified: false, error: "Failed to query Razorpay order" });
      }

      const paymentsData = await rpResponse.json();
      const items = paymentsData.items || [];
      const capturedPayment = items.find((p: any) => p.status === "captured");

      if (!capturedPayment) {
        return NextResponse.json({ verified: false, error: "No captured payment found for this order" });
      }

      // Update booking and payment status on server
      const bookingRef = db.collection("bookings").doc(booking_id);
      const bookingSnap = await bookingRef.get();

      if (!bookingSnap.exists) {
        return NextResponse.json({ error: "Booking record not found" }, { status: 404 });
      }

      const bookingData = bookingSnap.data();
      if (bookingData?.status === "INITIATED") {
        await db.runTransaction(async (transaction) => {
          transaction.update(bookingRef, {
            status: "NEW",
            assuranceFeePaid: true,
            razorpayPaymentId: capturedPayment.id,
            updatedAt: new Date(),
          });

          // Create payment doc
          const paymentRef = db.collection("payments").doc();
          transaction.set(paymentRef, {
            bookingId: booking_id,
            razorpayOrderId: order_id,
            razorpayPaymentId: capturedPayment.id,
            amount: capturedPayment.amount / 100,
            customerId: "",
            status: "captured",
            createdAt: new Date(),
          });

          // Create guest customer profile
          const customerRef = db.collection("customers").doc(bookingData.customerMobile);
          transaction.set(customerRef, {
            name: bookingData.customerName,
            mobile: bookingData.customerMobile,
            createdAt: new Date(),
          }, { merge: true });
        });

        // Broadcast notifications in background
        await broadcastPushNotification(bookingData.serviceType, bookingData.customerArea, booking_id);
      }

      return NextResponse.json({ verified: true });
    }

    // Action 2: Standard signature verification and server-side db writing
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
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

    // Update booking and payment status on server
    const bookingRef = db.collection("bookings").doc(booking_id);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json({ error: "Booking record not found" }, { status: 404 });
    }

    const bookingData = bookingSnap.data();
    if (bookingData?.status === "INITIATED") {
      await db.runTransaction(async (transaction) => {
        transaction.update(bookingRef, {
          status: "NEW",
          assuranceFeePaid: true,
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: new Date(),
        });

        // Create payment doc
        const paymentRef = db.collection("payments").doc();
        transaction.set(paymentRef, {
          bookingId: booking_id,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          amount: bookingData.appliedDiscountAmount ? (50 - bookingData.appliedDiscountAmount) : 50, // default assurance fee calculations
          customerId: "",
          status: "captured",
          createdAt: new Date(),
        });

        // Create customer profile
        const customerRef = db.collection("customers").doc(bookingData.customerMobile);
        transaction.set(customerRef, {
          name: bookingData.customerName,
          mobile: bookingData.customerMobile,
          createdAt: new Date(),
        }, { merge: true });
      });

      // Broadcast notifications in background
      await broadcastPushNotification(bookingData.serviceType, bookingData.customerArea, booking_id);
    }

    return NextResponse.json({ verified: true });
  } catch (err: any) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
