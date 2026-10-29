import { BountyWorkflow } from "./components/BountyWorkflow";
import { DashboardMock } from "./components/DashboardMock";
import { Detections } from "./components/Detections";
import { Docs } from "./components/Docs";
import { FinalCta } from "./components/FinalCta";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { LineByLine } from "./components/LineByLine";
import { Navbar } from "./components/Navbar";
import { Pricing } from "./components/Pricing";
import { DedicatedPricing } from "./components/DedicatedPricing";
import { BillingPage } from "./components/BillingPage";
import { Problem } from "./components/Problem";
import { ResearchExample } from "./components/ResearchExample";
import { Solution } from "./components/Solution";
import { Supported } from "./components/Supported";
import { UiProvider } from "./components/UiProvider";
import { useUi } from "./components/useUi";
import { WhyResearchers } from "./components/WhyResearchers";

function AppContent() {
  const { currentPath } = useUi();

  return (
    <div className="relative min-h-screen overflow-x-clip bg-ink font-sans text-zinc-100 antialiased">
      <div className="grid-fade pointer-events-none fixed inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-128 bg-[radial-gradient(ellipse_at_top,rgba(124,140,255,0.16),transparent_58%)]"
        aria-hidden="true"
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-zinc-950"
      >
        Skip to content
      </a>
      <Navbar />

      {currentPath === "/pricing" ? (
        <main id="main" className="relative">
          <DedicatedPricing />
        </main>
      ) : currentPath === "/billing" ? (
        <main id="main" className="relative">
          <BillingPage />
        </main>
      ) : currentPath === "/app" ? (
        <main id="main" className="relative">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <DashboardMock />
          </div>
        </main>
      ) : (
        <main id="main" className="relative">
          <Hero />
          <Problem />
          <Solution />
          <Detections />
          <LineByLine />
          <BountyWorkflow />
          <ResearchExample />
          <WhyResearchers />
          <DashboardMock />
          <Supported />
          <Docs />
          <Pricing />
          <FinalCta />
        </main>
      )}

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <UiProvider>
      <AppContent />
    </UiProvider>
  );
}
