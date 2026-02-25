import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AnalyzerCard from "./components/AnalyzerCard";
import HowItWorks from "./components/HowItWorks";
//import Examples from "./components/Examples";
import Metrics from "./components/Metrics";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <Hero />
      <AnalyzerCard />
      <HowItWorks />
      <Metrics />
      <Footer />
    </div>
  );
}