import React from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Lock, Unlock, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

export default function MonthClose() {
  const { currentUser, isMockMode } = useAuth();
  const { months, closeMonth, seedFirebaseDatabase } = useData();

  const handleCloseMonth = (monthId) => {
    const formattedMonth = `${monthId.split("-")[0]}년 ${parseInt(monthId.split("-")[1])}월`;
    if (window.confirm(`${formattedMonth} 출결 입력을 마감하시겠습니까?\n마감 후에는 리더 및 팀장의 수정이 잠금 처리되며, 다음 달 데이터베이스가 자동으로 개설됩니다.`)) {
      closeMonth(monthId);
    }
  };

  // Format month label: YYYY년 MM월
  const formatMonthLabel = (mId) => {
    if (!mId) return "";
    const [year, month] = mId.split("-");
    return `${year}년 ${parseInt(month)}월`;
  };

  return (
    <div className="month-close-wrapper animate-fade">
      <div className="month-intro-card glass-panel">
        <AlertCircle size={24} className="intro-icon" />
        <div>
          <h3>월 마감 처리 및 권한 잠금</h3>
          <p>월을 마감하면 일반 구역장 및 팀장은 해당 월의 출결 및 활동 기록을 더 이상 수정할 수 없습니다.</p>
          <p>마감 처리 즉시 다음 달 기록이 자동으로 생성됩니다. (수정은 오직 임원만 가능합니다.)</p>
        </div>
      </div>

      <div className="month-list-card glass-panel">
        <div className="card-header">
          <Calendar size={18} />
          <h3>월별 마감 이력</h3>
        </div>

        <div className="month-list">
          {months.map((m) => (
            <div key={m.monthId} className="month-row">
              <div className="month-name-col">
                <span className="month-label">{formatMonthLabel(m.monthId)}</span>
                <span className="month-id-raw">({m.monthId})</span>
              </div>

              <div className="month-status-col">
                {m.status === "closed" ? (
                  <span className="status-indicator closed">
                    <Lock size={12} />
                    <span>마감 완료</span>
                  </span>
                ) : (
                  <span className="status-indicator open">
                    <Unlock size={12} />
                    <span>작성 중 (수정 가능)</span>
                  </span>
                )}
              </div>

              <div className="month-action-col">
                {m.status === "open" && currentUser?.role === "admin" && (
                  <button
                    onClick={() => handleCloseMonth(m.monthId)}
                    className="btn btn-danger btn-sm"
                  >
                    <span>마감 처리하기</span>
                  </button>
                )}
                {m.status === "closed" && (
                  <span className="closed-label">관리자 수정 모드만 허용</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentUser?.role === "admin" && (
        <div className="dev-seed-card glass-panel">
          <div className="card-header">
            <AlertCircle size={18} className="text-warning" />
            <h3>시스템 초기화 (Firebase Seed)</h3>
          </div>
          <div className="dev-seed-body">
            <p>
              현재 연동 상태: <strong>{isMockMode ? "로컬 Mock 모드 (localStorage)" : "실제 Firebase 연동 모드"}</strong>
            </p>
            <p className="description">
              처음 Firebase를 연동했거나 데이터베이스가 비어있는 경우, 아래 버튼을 클릭하여 데모 데이터(교구, 구역, 성도 및 관리자 계정 등)를 Firebase Firestore에 업로드할 수 있습니다.
            </p>
            <button
              onClick={() => {
                if (window.confirm("정말로 데이터베이스 초기화 및 데모 데이터 업로드를 진행하시겠습니까?\n이 작업은 기존의 Firestore 데이터를 덮어쓸 수 있습니다.")) {
                  seedFirebaseDatabase();
                }
              }}
              className="btn btn-warning"
              disabled={isMockMode}
            >
              <span>{isMockMode ? "Mock 모드에서는 사용 불가 (Firebase 연동 필요)" : "Firebase 초기 데이터 업로드 (Seed)"}</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .btn-warning {
          background: hsla(42, 90%, 55%, 0.15);
          color: var(--accent-gold);
          border: 1px solid hsla(42, 90%, 55%, 0.2);
        }

        .btn-warning:hover:not(:disabled) {
          background: var(--accent-gold);
          color: var(--bg-primary);
        }

        .btn-warning:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dev-seed-card {
          padding: 24px;
          border-color: hsla(42, 90%, 55%, 0.15) !important;
        }

        .dev-seed-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 14px;
        }

        .dev-seed-body p {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .dev-seed-body p.description {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .text-warning {
          color: var(--accent-gold);
        }

        .month-close-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .month-intro-card {
          display: flex;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(135deg, hsla(355, 80%, 60%, 0.05), hsla(210, 100%, 55%, 0.03)) !important;
          border-color: hsla(355, 80%, 60%, 0.15) !important;
        }

        .intro-icon {
          color: var(--accent-red);
          flex-shrink: 0;
        }

        .month-intro-card h3 {
          font-size: 15px;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .month-intro-card p {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .month-list-card {
          padding: 24px;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 14px;
          margin-bottom: 16px;
          color: var(--text-secondary);
        }

        .card-header h3 {
          font-size: 15px;
        }

        .month-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .month-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .month-row:hover {
          border-color: var(--glass-border);
          background-color: var(--bg-tertiary);
        }

        .month-name-col {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .month-label {
          font-weight: 700;
          font-size: 15px;
          color: var(--text-primary);
        }

        .month-id-raw {
          font-size: 11px;
          color: var(--text-muted);
          font-family: monospace;
        }

        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 600;
        }

        .status-indicator.closed {
          background-color: hsla(355, 80%, 60%, 0.12);
          color: var(--accent-red);
        }

        .status-indicator.open {
          background-color: hsla(150, 70%, 50%, 0.12);
          color: var(--accent-emerald);
        }

        .closed-label {
          font-size: 12px;
          color: var(--text-muted);
        }

        @media (max-width: 600px) {
          .month-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .month-action-col {
            width: 100%;
          }
          .month-action-col button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
