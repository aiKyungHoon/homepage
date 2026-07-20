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
import VisitManagement from "./components/VisitManagement";
import ErrorBoundary from "./components/ErrorBoundary";
import { isInAppBrowser, isIOS, openInExternalBrowser } from "./utils/browserEnv";

function AppContent() {
  const { currentUser, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();
  const [activePage, setActivePage] = useState("dashboard");
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setActivePage(["leader", "team_secretary"].includes(currentUser.role) ? "attendance" : "dashboard");
    }
  }, [currentUser]);

  const isAppLoading = authLoading || (currentUser && dataLoading);

  // 로딩이 너무 오래 걸리면(인앱 브라우저에서 Firestore 연결이 막히는 등)
  // 빈 화면으로 멈추지 않도록 복구 화면을 띄운다
  useEffect(() => {
    if (!isAppLoading) {
      setLoadTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setLoadTimedOut(true), 10000);
    return () => clearTimeout(timer);
  }, [isAppLoading]);

  if (isAppLoading) {
    // 10초 넘게 로딩되면: 새로고침 / 크롬으로 열기 안내
    if (loadTimedOut) {
      const inApp = isInAppBrowser();
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)"
        }}>
          <div style={{ fontSize: "44px" }}>📡</div>
          <h2 style={{ margin: 0, fontSize: "18px" }}>불러오는 데 시간이 오래 걸리고 있어요</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", maxWidth: "330px", lineHeight: 1.6 }}>
            {inApp
              ? "네이버·카카오톡 등 앱 안에서 열면 접속이 원활하지 않을 수 있어요. 크롬(Chrome) 브라우저로 열면 정상 동작합니다."
              : "네트워크 상태가 원활하지 않습니다. 새로고침 하거나 잠시 후 다시 시도해 주세요."}
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            {inApp && (
              <button
                type="button"
                onClick={openInExternalBrowser}
                style={{
                  padding: "10px 22px", borderRadius: "8px", border: "none",
                  backgroundColor: "var(--accent-cyan)", color: "#00131a",
                  fontWeight: 700, fontSize: "14px", cursor: "pointer"
                }}
              >
                크롬으로 열기
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 22px", borderRadius: "8px",
                border: "1px solid var(--glass-border)",
                backgroundColor: "transparent", color: "var(--text-primary)",
                fontWeight: 700, fontSize: "14px", cursor: "pointer"
              }}
            >
              새로고침
            </button>
          </div>
          {inApp && isIOS() && (
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)", maxWidth: "330px", lineHeight: 1.6 }}>
              아이폰은 우측 하단 <b>공유 버튼 → &apos;Safari로 열기&apos;</b> 를 눌러주세요.
            </p>
          )}
        </div>
      );
    }

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
        {activePage === "visit_manage" && <VisitManagement />}
        {activePage === "org" && <OrgManagement />}
        {activePage === "month" && <MonthClose />}
        {activePage === "history" && <HistoryLog />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
