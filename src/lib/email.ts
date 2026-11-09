// Email notifications via Resend
// Get a free API key at https://resend.com (3,000 emails/month free)
// Add RESEND_API_KEY + RESEND_FROM_EMAIL to .env to enable real emails.
// Falls back to console.log if not configured (great for dev).

import { db } from "@/lib/db";

type EmailParams = {
  to: string;
  subject: string;
  html: string;
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RENTINGIT <noreply@rentingit.app>";
const API_KEY = process.env.RESEND_API_KEY;

export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  if (!API_KEY) {
    console.log(`[EMAIL (dev mode)] → ${to}\nSubject: ${subject}\n---\n${html}\n---`);
    return true;
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    if (!r.ok) {
      const j = await r.json();
      console.error("Email send failed:", j);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Email send error:", e);
    return false;
  }
}

// Helpers for common event emails
export async function notifyBookingRequested(owner: any, renter: any, item: any, booking: any) {
  await sendEmail({
    to: owner.email,
    subject: `New booking request: ${item.title}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #FF385C;">New booking request 🎉</h2>
        <p><strong>${renter.name}</strong> wants to rent your <strong>${item.title}</strong>.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #666;">Dates</td><td style="padding: 8px 0;">${new Date(booking.startDate).toLocaleDateString("en-IN")} → ${new Date(booking.endDate).toLocaleDateString("en-IN")}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Total payout</td><td style="padding: 8px 0; font-weight: 600;">₹${(booking.totalRent - booking.platformFee).toLocaleString("en-IN")}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Renter trust score</td><td style="padding: 8px 0;">⭐ ${renter.trustScore} (${renter.totalRatings} reviews)</td></tr>
        </table>
        <p>Log in to RENTINGIT to approve or decline within 24 hours.</p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">RENTINGIT · P2P Rental Marketplace</p>
      </div>
    `,
  });
}

export async function notifyBookingApproved(renterEmail: string, item: any, booking: any, payoutUrl = "") {
  await sendEmail({
    to: renterEmail,
    subject: `Booking approved — pay to confirm: ${item.title}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #FF385C;">Your booking was approved ✅</h2>
        <p>The owner approved your request for <strong>${item.title}</strong>.</p>
        <p>Total payable: <strong>₹${booking.grandTotal.toLocaleString("en-IN")}</strong> (includes ₹${booking.securityDeposit.toLocaleString("en-IN")} refundable deposit)</p>
        <p>Complete your payment to lock in the dates.</p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">RENTINGIT · P2P Rental Marketplace</p>
      </div>
    `,
  });
}

export async function notifyPaymentReceived(ownerEmail: string, renterName: string, item: any, booking: any) {
  await sendEmail({
    to: ownerEmail,
    subject: `Payment received — coordinate pickup: ${item.title}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #FF385C;">Payment received 💰</h2>
        <p><strong>${renterName}</strong> paid ₹${booking.grandTotal.toLocaleString("en-IN")} for <strong>${item.title}</strong>.</p>
        <p>Pickup window: ${new Date(booking.startDate).toLocaleDateString("en-IN")} → ${new Date(booking.endDate).toLocaleDateString("en-IN")}</p>
        <p>Open the in-app chat to coordinate pickup time and location.</p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">RENTINGIT · P2P Rental Marketplace</p>
      </div>
    `,
  });
}

export async function notifyBookingCompleted(ownerEmail: string, renterName: string, item: any, payoutAmount: number) {
  await sendEmail({
    to: ownerEmail,
    subject: `Booking completed — ₹${payoutAmount.toLocaleString("en-IN")} credited to wallet`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #FF385C;">Booking completed ✅</h2>
        <p>${renterName} returned <strong>${item.title}</strong> successfully.</p>
        <p><strong>₹${payoutAmount.toLocaleString("en-IN")}</strong> has been credited to your RENTINGIT wallet. Withdraw anytime via UPI.</p>
        <p>Don't forget to leave a review for ${renterName.split(" ")[0]}!</p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">RENTINGIT · P2P Rental Marketplace</p>
      </div>
    `,
  });
}

export async function notifyDisputeRaised(otherPartyEmail: string, raisedByName: string, item: any, reason: string) {
  await sendEmail({
    to: otherPartyEmail,
    subject: `Dispute raised on booking: ${item.title}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #FF385C;">Dispute raised ⚠️</h2>
        <p><strong>${raisedByName}</strong> raised a dispute on your booking for <strong>${item.title}</strong>.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Our admin team will review within 24 hours. Both parties will be notified of the decision.</p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">RENTINGIT · P2P Rental Marketplace</p>
      </div>
    `,
  });
}

export async function notifyKycApproved(userEmail: string, userName: string) {
  await sendEmail({
    to: userEmail,
    subject: `KYC verified — you can now list items on RENTINGIT`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #FF385C;">KYC verified ✅</h2>
        <p>Hi ${userName}, your identity has been verified.</p>
        <p>You can now list items on RENTINGIT and start earning from your unused stuff.</p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">RENTINGIT · P2P Rental Marketplace</p>
      </div>
    `,
  });
}
