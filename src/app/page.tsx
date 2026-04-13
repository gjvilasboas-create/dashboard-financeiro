"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import News from "@/components/News";
import TechnicalAnalysis from "@/components/TechnicalAnalysis";
import Expenses from "@/components/Expenses";
import Calculator from "@/components/Calculator";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "news" && <News />}
        {activeTab === "analysis" && <TechnicalAnalysis />}
        {activeTab === "expenses" && <Expenses />}
        {activeTab === "calculator" && <Calculator />}
      </main>
      <footer className="border-t border-card-border py-4 text-center text-xs text-muted">
        Finanças do Gabriel V &mdash; Dados fornecidos por brapi.dev
      </footer>
    </>
  );
}
