import "dotenv/config";
import {
  sendSubscriptionCancelledEmail,
  sendSubscriptionReactivatedEmail,
} from "../apps/api/src/services/email";

async function main() {
  const cancelRes = await sendSubscriptionCancelledEmail({
    to: "delivered@resend.dev",
    name: "Alex Security Researcher",
    planName: "1 Year Dedicated",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  console.log("Cancel Email Result:", cancelRes);

  const reactivateRes = await sendSubscriptionReactivatedEmail({
    to: "delivered@resend.dev",
    name: "Alex Security Researcher",
    planName: "1 Year Dedicated",
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });
  console.log("Reactivate Email Result:", reactivateRes);
}

main().catch(console.error);
