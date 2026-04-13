"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import Calculator from "@/components/Calculator";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === "dashboard" ? <Dashboard /> : <Calculator />}
      </main>
      <footer className="border-t border-card-border py-4 text-center text-xs text-muted">
        FinanceLab &mdash; Dados fornecidos por brapi.dev · Atualização a cada 5
        minutos
      </footer>
    </>
  );
}
