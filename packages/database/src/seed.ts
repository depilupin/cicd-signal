import { prisma } from "./index";
import { BUILTIN_RULES } from "@signal/scanner-rules";

export async function seedDatabase() {
  console.log("Seeding plans...");
  const plans = [
    {
      id: "month",
      name: "1 Month",
      priceCents: 3900,
      currency: "USD",
      interval: "month",
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
      priceCents: 9900,
      currency: "USD",
      interval: "quarter",
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
      priceCents: 29900,
      currency: "USD",
      interval: "year",
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

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      create: plan,
      update: plan,
    });
  }

  console.log(`Seeding ${BUILTIN_RULES.length} scanner rules...`);
  for (const rule of BUILTIN_RULES) {
    await prisma.scanRule.upsert({
      where: { id: rule.id },
      create: {
        id: rule.id,
        name: rule.name,
        category: rule.category,
        defaultSeverity: rule.defaultSeverity,
        defaultConfidence: rule.defaultConfidence,
        description: rule.description,
        remediation: rule.remediation,
      },
      update: {
        name: rule.name,
        category: rule.category,
        defaultSeverity: rule.defaultSeverity,
        defaultConfidence: rule.defaultConfidence,
        description: rule.description,
        remediation: rule.remediation,
      },
    });
  }

  const finalPlans = await prisma.plan.count();
  const finalRules = await prisma.scanRule.count();
  console.log(`Database seed completed successfully: ${finalPlans} plans, ${finalRules} rules.`);
}

seedDatabase()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
