import { Router, type Request, type Response } from "express";
import { createSuccessResponse } from "@signal/shared";
import { prisma } from "@signal/database";
import { asyncHandler } from "../middleware/asyncHandler";

export const plansRouter = Router();

export interface PublicPlan {
  id: string;
  name: string;
  audience: string;
  price: string;
  priceCents: number;
  currency: string;
  cadence: string;
  equivalent: string;
  save: string | null;
  cta: string;
  featured: boolean;
  maxScansPerMonth: number;
  features: string[];
}

export const DEFAULT_PLANS: PublicPlan[] = [
  {
    id: "month",
    name: "1 Month",
    audience: "One hunt, no commitment",
    price: "$39",
    priceCents: 3900,
    currency: "USD",
    cadence: "billed monthly",
    equivalent: "$39 / month",
    save: null,
    cta: "Start 1 Month",
    featured: false,
    maxScansPerMonth: 50,
    features: [
      "CI/CD workflow scanning",
      "Trigger & permissions analysis",
      "Secret exposure detection",
      "Risk prioritization scores",
      "Line-level code findings",
    ],
  },
  {
    id: "quarter",
    name: "3 Months",
    audience: "A season of targets",
    price: "$99",
    priceCents: 9900,
    currency: "USD",
    cadence: "every 3 months",
    equivalent: "$33 / month",
    save: "Save 15%",
    cta: "Start 3 Months",
    featured: false,
    maxScansPerMonth: 200,
    features: [
      "Everything in 1 Month",
      "Continuous repository monitoring",
      "Advanced risk filtering",
      "Exportable JSON/Markdown reports",
      "Team triage sharing",
    ],
  },
  {
    id: "year",
    name: "1 Year",
    audience: "For serious researchers",
    price: "$299",
    priceCents: 29900,
    currency: "USD",
    cadence: "billed yearly",
    equivalent: "$25 / month",
    save: "Save 36%",
    cta: "Start 1 Year",
    featured: true,
    maxScansPerMonth: 1000,
    features: [
      "Everything in 3 Months",
      "Advanced workflow AST detection",
      "Priority background processing",
      "Full research year coverage",
      "Early access to new rule packs",
    ],
  },
];

plansRouter.get("/plans", asyncHandler(async (_req: Request, res: Response) => {
  try {
    const dbPlans = await prisma.plan.findMany({
      orderBy: { priceCents: "asc" },
    });

    if (dbPlans && dbPlans.length > 0) {
      const formatted: PublicPlan[] = dbPlans.map(
        (p: {
          id: string;
          name: string;
          priceCents: number;
          currency: string;
          interval: string;
          features: string[];
          maxScansPerMonth: number;
        }) => {
        const fallback = DEFAULT_PLANS.find((dp) => dp.id === p.id);
        const price = `$${Math.round(p.priceCents / 100)}`;
        return {
          id: p.id,
          name: p.name,
          audience: fallback?.audience || "Research access",
          price,
          priceCents: p.priceCents,
          currency: p.currency,
          cadence: fallback?.cadence || `billed ${p.interval}`,
          equivalent: fallback?.equivalent || `${price} / ${p.interval}`,
          save: fallback?.save || null,
          cta: fallback?.cta || `Start ${p.name}`,
          featured: p.id === "year",
          maxScansPerMonth: p.maxScansPerMonth,
          features: p.features,
        };
      });

      res.status(200).json(createSuccessResponse(formatted));
      return;
    }
  } catch {
    // Graceful fallback to default verified plans if DB query is interrupted
  }

  res.status(200).json(createSuccessResponse(DEFAULT_PLANS));
}));

