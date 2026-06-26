import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { amount, serviceId } = await request.json();

    if (!amount || !serviceId) {
      return NextResponse.json(
        { error: "Amount and Service ID are required" },
        { status: 400 }
      );
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured" },
        { status: 500 }
      );
    }

    // Amount in Razorpay is represented in the smallest currency unit (paise for INR)
    // Hence, multiply by 100
    const amountInPaise = Math.round(amount * 100);

    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_booking_${serviceId}_${Date.now()}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Razorpay order creation failed:", data);
      let errorDescription = data.error?.description || "Failed to create order";
      if (response.status === 401) {
        errorDescription = "Razorpay Authentication Failed. Please update your .env.local file with your actual Razorpay Test Key ID and Secret from the Razorpay Dashboard.";
      }
      return NextResponse.json(
        { error: errorDescription },
        { status: response.status }
      );
    }

    return NextResponse.json({
      id: data.id,
      amount: data.amount,
      currency: data.currency,
    });
  } catch (err: any) {
    console.error("Razorpay API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
