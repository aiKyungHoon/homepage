import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { Search, Clock, ShieldAlert } from "lucide-react";

export default function HistoryLog() {
  const { auditLogs } = useData();
  const [searchQuery, setSearchQuery] = useState("");

  // Format date helper: YYYY-MM-DD HH:MM:SS
  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  };

  const filteredLogs = auditLogs.filter((log) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (log.memberName && log.memberName.toLowerCase().includes(q)) ||
      (log.operatorName && log.operatorName.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
  });

  return (
    <div className="history-wrapper animate-fade">
      {/* Search Header */}
      <div className="history-header glass-panel">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="수정자, 대상 성도, 또는 변경 내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Log Feed */}
      <div className="log-panel glass-panel">
        <div className="log-header">
          <Clock size={16} />
          <h3>수정 이력 감사 로그</h3>
          <span>실시간 기록</span>
        </div>

        <div className="log-feed">
          {filteredLogs.map((log) => (
            <div key={log.logId} className="log-item">
              <div className="log-icon-container">
                <ShieldAlert size={14} />
              </div>
              
              <div className="log-details-col">
                <p className="log-details-text">{log.details}</p>
                <div className="log-meta">
                  <span className="log-operator">수정자: {log.operatorName}</span>
                  <span className="log-meta-divider">•</span>
                  <span className="log-target">대상 성도: {log.memberName}</span>
                  <span className="log-meta-divider">•</span>
                  <span className="log-time">{formatDate(log.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="no-logs">기록된 이력이 없습니다.</div>
          )}
        </div>
      </div>

      <style>{`
        .history-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .history-header {
          padding: 16px 20px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }

        .search-box input {
          width: 100%;
          padding: 10px 12px 10px 38px;
          border-radius: var(--radius-md);
          font-size: 13px;
        }

        .log-panel {
          padding: 24px;
        }

        .log-header {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 14px;
          margin-bottom: 16px;
          color: var(--text-secondary);
        }

        .log-header h3 {
          font-size: 15px;
        }

        .log-header span {
          margin-left: auto;
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .log-feed {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: calc(100vh - 280px);
          overflow-y: auto;
        }

        .log-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .log-item:hover {
          border-color: var(--accent-cyan);
          background-color: var(--bg-tertiary);
        }

        .log-icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background-color: hsla(185, 90%, 48%, 0.1);
          color: var(--accent-cyan);
          flex-shrink: 0;
        }

        .log-details-col {
          display: flex;
          flex-direction: column;
          gap: 6px;
          justify-content: center;
        }

        .log-details-text {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .log-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          color: var(--text-muted);
        }

        .log-meta-divider {
          color: var(--glass-border);
        }

        .log-time {
          font-family: monospace;
        }

        .no-logs {
          text-align: center;
          padding: 30px;
          color: var(--text-muted);
          font-size: 13.5px;
        }
      `}</style>
    </div>
  );
}
