/** Edit pricing here before launch. Numbers are preview placeholders. */
export const product = {
  name: "Signal",
  descriptor: "CI/CD vulnerability scanner",
};

export const nav = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#detections", label: "Detections" },
  { href: "#researchers", label: "For Researchers" },
  { href: "#pricing", label: "Pricing" },
  { href: "#docs", label: "Docs" },
] as const;

export const plans = [
  {
    id: "month",
    name: "1 Month",
    audience: "One hunt, no commitment",
    price: "$39",
    cadence: "billed monthly",
    equivalent: "$39 / month",
    save: null,
    cta: "Start 1 Month",
    featured: false,
    features: [
      "CI/CD scanning",
      "Workflow analysis",
      "Security findings",
      "Risk prioritization",
      "Code-level findings",
    ],
  },
  {
    id: "quarter",
    name: "3 Months",
    audience: "A season of targets",
    price: "$99",
    cadence: "every 3 months",
    equivalent: "$33 / month",
    save: "Save 15%",
    cta: "Start 3 Months",
    featured: false,
    features: [
      "Everything in 1 Month",
      "Repository monitoring",
      "Advanced filtering",
      "Exportable reports",
    ],
  },
  {
    id: "year",
    name: "1 Year",
    audience: "For serious researchers",
    price: "$299",
    cadence: "billed yearly",
    equivalent: "$25 / month",
    save: "Save 36%",
    cta: "Start 1 Year",
    featured: true,
    features: [
      "Everything in 3 Months",
      "Advanced detection",
      "Priority processing",
      "Full research year",
    ],
  },
] as const;

export const solutionSteps = [
  "Repository",
  "CI/CD Discovery",
  "Workflow Analysis",
  "Security Detection",
  "Risk Prioritization",
  "Manual Validation",
  "Bug Bounty Report",
] as const;

export const bountySteps = [
  "Discover",
  "Scan",
  "Investigate",
  "Validate",
  "Report",
  "Bounty",
] as const;

export const platforms = [
  { name: "GitHub Actions", status: "Supported" },
  { name: "GitLab CI/CD", status: "Coming Soon" },
  { name: "Jenkins", status: "Coming Soon" },
  { name: "CircleCI", status: "Coming Soon" },
  { name: "Azure Pipelines", status: "Coming Soon" },
  { name: "Bitbucket Pipelines", status: "Coming Soon" },
] as const;
