import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AnalyzerCard from "./components/AnalyzerCard";
import HowItWorks from "./components/HowItWorks";
import Examples from "./components/Examples";
import Metrics from "./components/Metrics";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-[#F7F6FB] text-[#1E1E1E]">
      <Navbar />
      <Hero />
      <AnalyzerCard />
      <HowItWorks />
      <Examples />
      <Metrics />
      <Footer />
    </div>
  );
}