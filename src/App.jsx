import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider, useData } from "./context/DataContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AttendanceGrid from "./components/AttendanceGrid";
import OrgManagement from "./components/OrgManagement";
import MonthClose from "./components/MonthClose";
import HistoryLog from "./components/HistoryLog";

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    if (currentUser) {
      setActivePage(currentUser.role === "leader" ? "attendance" : "dashboard");
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div style={{
        display: "flex", 
        height: "100vh", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)"
      }}>
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p style={{ marginTop: "16px", fontWeight: 500, color: "var(--text-secondary)" }}>로딩 중입니다...</p>
        </div>
        <style>{`
          .loading-spinner-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--glass-border);
            border-top: 4px solid var(--accent-cyan);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        <Header />
        
        {/* Active Tab Switcher */}
        {activePage === "dashboard" && <Dashboard />}
        {activePage === "attendance" && <AttendanceGrid />}
        {activePage === "org" && <OrgManagement />}
        {activePage === "month" && <MonthClose />}
        {activePage === "history" && <HistoryLog />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
