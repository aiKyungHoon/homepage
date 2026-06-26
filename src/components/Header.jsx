import React, { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Sun, Moon, Calendar, ChevronRight, Lock, CheckCircle2 } from "lucide-react";

export default function Header() {
  const { currentUser } = useAuth();
  const { 
    months, 
    activeMonthId, 
    setActiveMonthId, 
    activeWeekNo, 
    setActiveWeekNo 
  } = useData();

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "dark";
    } catch (e) {
      console.warn("localStorage is disabled or not available:", e);
      return "dark";
    }
  });

  // Apply theme to document body
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const activeMonth = months.find(m => m.monthId === activeMonthId);
  const isClosed = activeMonth ? activeMonth.status === "closed" : false;

  // Format month label: YYYY년 MM월
  const formatMonthLabel = (mId) => {
    if (!mId) return "";
    const [year, month] = mId.split("-");
    return `${year}년 ${parseInt(month)}월`;
  };

  return (
    <header className="app-header glass-panel">
      <div className="header-breadcrumbs">
        <Calendar size={18} className="breadcrumb-icon" />
        <span className="breadcrumb-main">교구 현황</span>
        <ChevronRight size={14} className="breadcrumb-arrow" />
        <span className="breadcrumb-sub">
          {formatMonthLabel(activeMonthId)} {activeWeekNo}주차
        </span>
      </div>

      <div className="header-controls">
        {/* Month Selector */}
        <div className="control-group">
          <label htmlFor="header-month-select" className="control-label">월 선택</label>
          <select
            id="header-month-select"
            value={activeMonthId}
            onChange={(e) => {
              setActiveMonthId(e.target.value);
              // Safely reset week to 1 when changing month
              setActiveWeekNo(1);
            }}
            className="header-select"
          >
            {months.map((m) => (
              <option key={m.monthId} value={m.monthId}>
                {formatMonthLabel(m.monthId)}
              </option>
            ))}
          </select>
        </div>

        {/* Week Selector */}
        <div className="control-group">
          <span className="control-label">주차</span>
          <div className="week-pills">
            {[1, 2, 3, 4, 5].map((w) => (
              <button
                key={w}
                onClick={() => setActiveWeekNo(w)}
                className={`week-pill-btn ${activeWeekNo === w ? "active" : ""}`}
              >
                {w}주
              </button>
            ))}
          </div>
        </div>

        {/* Month status indicator */}
        <div className={`status-badge-container ${isClosed ? "closed" : "open"}`}>
          {isClosed ? (
            <>
              <Lock size={13} />
              <span>마감됨 (조회 전용)</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={13} />
              <span>작성 가능</span>
            </>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn" 
          title={theme === "dark" ? "라이트 모드로 변경" : "다크 모드로 변경"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <style>{`
        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          margin-bottom: 24px;
          border-radius: var(--radius-md);
        }

        .header-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .breadcrumb-icon {
          color: var(--accent-cyan);
        }

        .breadcrumb-main {
          font-weight: 500;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .breadcrumb-arrow {
          color: var(--text-muted);
        }

        .breadcrumb-sub {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary);
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .header-select {
          background-color: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          padding: 6px 12px;
          font-weight: 500;
          font-size: 13px;
        }

        .week-pills {
          display: flex;
          background-color: var(--bg-tertiary);
          padding: 3px;
          border-radius: var(--radius-md);
          border: 1px solid var(--glass-border);
        }

        .week-pill-btn {
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .week-pill-btn.active {
          background-color: var(--bg-primary);
          color: var(--accent-cyan);
          box-shadow: var(--shadow-sm);
        }

        .status-badge-container {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge-container.closed {
          background-color: hsla(355, 80%, 60%, 0.12);
          color: var(--accent-red);
          border: 1px solid hsla(355, 80%, 60%, 0.2);
        }

        .status-badge-container.open {
          background-color: hsla(150, 70%, 50%, 0.12);
          color: var(--accent-emerald);
          border: 1px solid hsla(150, 70%, 50%, 0.2);
        }

        .theme-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--glass-border);
        }

        .theme-toggle-btn:hover {
          background-color: var(--glass-border);
        }

        @media (max-width: 1024px) {
          .app-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            padding: 16px;
          }

          .header-controls {
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 12px;
          }

          .control-group {
            flex: 1;
            min-width: 120px;
            justify-content: space-between;
          }

          .week-pills {
            width: 100%;
            justify-content: space-between;
          }

          .week-pill-btn {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
    </header>
  );
}
