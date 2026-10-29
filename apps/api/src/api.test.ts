import test from "node:test";
import assert from "node:assert/strict";
import { loadMonorepoEnv } from "@signal/shared";

loadMonorepoEnv();

import { createApp } from "./app";

test("API System Integration Tests", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 4001;
  const baseUrl = `http://localhost:${port}`;

  t.after(() => {
    server.close();
  });

  await t.test("GET /healthz returns ok status and uptime", async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    assert.equal(res.status, 200);
    const json = (await res.json()) as { success: boolean; data: { status: string; uptime: number } };
    assert.equal(json.success, true);
    assert.equal(json.data.status, "ok");
    assert.ok(json.data.uptime >= 0);
  });

  await t.test("GET /readyz returns live database readiness", async () => {
    const res = await fetch(`${baseUrl}/readyz`);
    assert.equal(res.status, 200);
    const json = (await res.json()) as {
      success: boolean;
      data: { services: { database: { status: string }; api: { status: string } } };
    };
    assert.equal(json.success, true);
    assert.equal(json.data.services.api.status, "up");
    assert.equal(json.data.services.database.status, "up");
  });

  await t.test("GET /api/v1/plans returns 3 public subscription tiers", async () => {
    const res = await fetch(`${baseUrl}/api/v1/plans`);
    assert.equal(res.status, 200);
    const json = (await res.json()) as { success: boolean; data: Array<{ id: string; price: string }> };
    assert.equal(json.success, true);
    assert.equal(json.data.length, 3);
    const planIds = json.data.map((p) => p.id);
    assert.ok(planIds.includes("month"));
    assert.ok(planIds.includes("quarter"));
    assert.ok(planIds.includes("year"));
  });

  await t.test("GET /api/v1/auth/google initiates OAuth redirect", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/google`, { redirect: "manual" });
    assert.equal(res.status, 302);
    const location = res.headers.get("location") || "";
    assert.ok(location.startsWith("https://accounts.google.com/o/oauth2/v2/auth"));
    assert.ok(location.includes("client_id="));
    assert.ok(location.includes("scope=openid+email+profile") || location.includes("scope=openid%20email%20profile"));
    const cookie = res.headers.get("set-cookie") || "";
    assert.ok(cookie.includes("signal_oauth_state="));
  });

  await t.test("GET /api/v1/auth/me returns 401 when no session cookie is provided", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.equal(res.status, 401);
    const json = (await res.json()) as { success: boolean; error: { code: string } };
    assert.equal(json.success, false);
    assert.equal(json.error.code, "UNAUTHORIZED");
  });

  const testEmail = `researcher_${Date.now()}@example.com`;
  const testPassword = "SuperSecurePassword123!";
  let sessionCookie = "";

  await t.test("POST /api/v1/auth/signup registers a user, creates session, and redirects to pricing", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: "Test Researcher",
      }),
    });

    assert.equal(res.status, 201);
    const setCookie = res.headers.get("set-cookie") || "";
    assert.ok(setCookie.includes("signal_session="));
    sessionCookie = setCookie.split(";")[0];

    const json = (await res.json()) as {
      success: boolean;
      data: { user: { email: string; name: string }; redirectTo: string };
    };
    assert.equal(json.success, true);
    assert.equal(json.data.user.email, testEmail);
    assert.equal(json.data.redirectTo, "/pricing");
  });

  await t.test("POST /api/v1/auth/login logs in user and returns session", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    assert.equal(res.status, 200);
    const setCookie = res.headers.get("set-cookie") || "";
    assert.ok(setCookie.includes("signal_session="));
    sessionCookie = setCookie.split(";")[0];

    const json = (await res.json()) as {
      success: boolean;
      data: { user: { email: string }; redirectTo: string };
    };
    assert.equal(json.success, true);
    assert.equal(json.data.redirectTo, "/pricing");
  });

  await t.test("GET /api/v1/billing/subscription returns no active subscription initially", async () => {
    const res = await fetch(`${baseUrl}/api/v1/billing/subscription`, {
      headers: { Cookie: sessionCookie },
    });

    assert.equal(res.status, 200);
    const json = (await res.json()) as {
      success: boolean;
      data: { hasActiveSubscription: boolean; subscription: unknown };
    };
    assert.equal(json.success, true);
    assert.equal(json.data.hasActiveSubscription, false);
  });

  await t.test("POST /api/v1/billing/checkout activates a dedicated research subscription", async () => {
    const res = await fetch(`${baseUrl}/api/v1/billing/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        planId: "year",
        billingDetails: {
          name: "Test Researcher",
          email: testEmail,
          country: "US",
        },
        paymentMethod: {
          cardBrand: "Visa",
          cardLast4: "4242",
        },
      }),
    });

    assert.equal(res.status, 200);
    const json = (await res.json()) as {
      success: boolean;
      data: {
        subscription: { id: string; status: string; plan: { id: string; priceCents: number } };
        invoice: { invoiceId: string; amount: string; status: string };
      };
    };
    assert.equal(json.success, true);
    assert.equal(json.data.subscription.status, "ACTIVE");
    assert.equal(json.data.subscription.plan.id, "year");
    assert.ok(json.data.invoice.invoiceId.startsWith("INV-"));
    assert.equal(json.data.invoice.status, "PAID");
  });

  await t.test("GET /api/v1/billing/subscription returns activated subscription with quota", async () => {
    const res = await fetch(`${baseUrl}/api/v1/billing/subscription`, {
      headers: { Cookie: sessionCookie },
    });

    assert.equal(res.status, 200);
    const json = (await res.json()) as {
      success: boolean;
      data: {
        hasActiveSubscription: boolean;
        subscription: {
          status: string;
          plan: { id: string; maxScansPerMonth: number };
          usage: { maxScansPerMonth: number };
        };
      };
    };
    assert.equal(json.success, true);
    assert.equal(json.data.hasActiveSubscription, true);
    assert.equal(json.data.subscription.plan.id, "year");
    assert.equal(json.data.subscription.usage.maxScansPerMonth, 1000);
  });

  await t.test("GET /api/v1/billing/invoices returns billing transaction history", async () => {
    const res = await fetch(`${baseUrl}/api/v1/billing/invoices`, {
      headers: { Cookie: sessionCookie },
    });

    assert.equal(res.status, 200);
    const json = (await res.json()) as {
      success: boolean;
      data: Array<{ invoiceId: string; amount: string; status: string }>;
    };
    assert.equal(json.success, true);
    assert.ok(json.data.length >= 1);
    assert.equal(json.data[0].status, "PAID");
  });
});
