import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RtiGuidanceModal from './components/RtiGuidanceModal';
import AuditHistoryDrawer from './components/AuditHistoryDrawer';

import HomeAnalyzerView from './views/HomeAnalyzerView';
import StarMapView from './views/StarMapView';
import EscapeVelocityView from './views/EscapeVelocityView';
import HowItWorksView from './views/HowItWorksView';
import { ACCEPTANCE_PRESETS } from './constants';

export default function App() {
  const [activeTab, setActiveTab] = useState('home-analyzer');
  const [text, setText] = useState(ACCEPTANCE_PRESETS[0].text);
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Pune");
  const [selectedLang, setSelectedLang] = useState("EN");
  const [fontSizeModifier, setFontSizeModifier] = useState("base"); // 'sm' | 'base' | 'lg'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [starMapRules, setStarMapRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Pre-load Star Map rules from backend on mount
  useEffect(() => {
    const loadStarMap = async () => {
      try {
        let res;
        try {
          res = await fetch("/api/starmap");
        } catch {
          res = await fetch("http://127.0.0.1:8000/api/starmap");
        }
        if (res.ok) {
          const data = await res.json();
          setStarMapRules(data);
        }
      } catch (err) {
        console.warn("Could not pre-fetch Star Map rules", err);
      }
    };
    loadStarMap();
  }, []);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError("");

    const payload = { text, state, district };

    try {
      let res;
      try {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch {
        res = await fetch("http://127.0.0.1:8000/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setResult(data);

      // Record in session audit history
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setHistory((prev) => [
        {
          id: Date.now(),
          text,
          state,
          district,
          timestamp: timeString,
          result: data
        },
        ...prev
      ]);

      // Scroll to results workbench if on home page
      setTimeout(() => {
        const el = document.getElementById("results-workbench");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to communicate with backend service.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setError("");
  };

  const handleSelectPreset = (p) => {
    setText(p.text);
    if (p.state) setState(p.state);
    if (p.district) setDistrict(p.district);
    setResult(null);
    setError("");
  };

  const handleSelectHistoryItem = (item) => {
    setText(item.text);
    setState(item.state);
    setDistrict(item.district);
    setResult(item.result);
    setError("");
    setActiveTab('home-analyzer');
    setTimeout(() => {
      const el = document.getElementById("results-workbench");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  // Font size modifier container class
  const fontClass =
    fontSizeModifier === "sm" ? "text-[13px]" : fontSizeModifier === "lg" ? "text-[15px]" : "";

  return (
    <div className={`min-h-screen bg-[#f9f9ff] text-[#121b2e] flex flex-col ${fontClass}`}>
      {/* Persistent Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGuidance={() => setIsGuidanceOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        selectedLang={selectedLang}
        setSelectedLang={setSelectedLang}
        fontSizeModifier={fontSizeModifier}
        setFontSizeModifier={setFontSizeModifier}
        historyCount={history.length}
      />

      {/* Main View Area with Top Padding for Fixed Navbar */}
      <main className="flex-1 w-full pt-[116px]">
        {activeTab === 'home-analyzer' && (
          <HomeAnalyzerView
            presets={ACCEPTANCE_PRESETS}
            text={text}
            setText={setText}
            state={state}
            setState={setState}
            district={district}
            setDistrict={setDistrict}
            selectedLang={selectedLang}
            setSelectedLang={setSelectedLang}
            loading={loading}
            result={result}
            error={error}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            onSelectPreset={handleSelectPreset}
            onNavigate={(tab) => setActiveTab(tab)}
            onInspectStarMap={() => setActiveTab('star-map')}
          />
        )}

        {activeTab === 'star-map' && (
          <StarMapView
            initialRules={starMapRules}
            onSelectSubject={(subj) => {
              setText(`Please furnish records and files regarding ${subj}.`);
              setActiveTab('home-analyzer');
            }}
          />
        )}

        {activeTab === 'escape-velocity-engine' && (
          <EscapeVelocityView />
        )}

        {activeTab === 'how-it-works' && (
          <HowItWorksView onNavigate={(tab) => setActiveTab(tab)} />
        )}
      </main>

      {/* Persistent Institutional Footer */}
      <Footer onNavigate={(tab) => setActiveTab(tab)} />

      {/* Modals and Drawers */}
      <RtiGuidanceModal
        isOpen={isGuidanceOpen}
        onClose={() => setIsGuidanceOpen(false)}
      />

      <AuditHistoryDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
