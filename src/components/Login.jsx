import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { Sparkles, User, Lock, Shield, ArrowRight } from "lucide-react";
import { demoUsers } from "../utils/mockData";

export default function Login() {
  const { login, loginAsDemoUser, isMockMode } = useAuth();
  const { seedFirebaseDatabase } = useData();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userId) => {
    loginAsDemoUser(userId);
  };

  return (
    <div className="login-wrapper">
      <div className="login-stars"></div>
      <div className="login-card glass-panel animate-slide">
        <div className="login-header">
          <div className="login-logo">
            <Sparkles size={36} />
          </div>
          <h1>교구 출결 및 활동 관리</h1>
          <p className="login-subtitle">스프레드시트에서 혁신적인 웹 대시보드로</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error-box">{error}</div>}

          <div className="input-group-icon">
            <User size={16} className="input-icon" />
            <input
              type="text"
              placeholder="아이디"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group-icon">
            <Lock size={16} className="input-icon" />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-login-submit">
            <span>{loading ? "로그인 중..." : "로그인"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {isMockMode && (
          <div className="quick-login-section">
            <div className="quick-login-divider">
              <span>빠른 로컬 테스트 로그인</span>
            </div>
            
            <div className="quick-login-grid">
              {demoUsers.map((user) => (
                <button
                  key={user.userId}
                  onClick={() => handleQuickLogin(user.userId)}
                  className="quick-login-card"
                >
                  <Shield size={16} className="quick-icon" />
                  <div className="quick-info">
                    <span className="quick-name">{user.name}</span>
                    <span className="quick-role">
                      {user.role === "admin" && "임원"}
                      {user.role === "team" && "해봄 팀장"}
                      {user.role === "leader" && (user.userId === "zone8_leader" ? "8구역장" : "9구역장")}
                    </span>
                    <span className="quick-credentials">ID: {user.username} / PW: {user.password}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isMockMode && (
          <div className="quick-login-section">
            <div className="quick-login-divider">
              <span>Firebase 연동 초기화</span>
            </div>
            
            <button
              onClick={async () => {
                if (window.confirm("Firebase Authentication 및 Firestore에 초기 데모 데이터(팀, 구역, 성도 및 로그인 계정들)를 업로드하겠습니까?\n이 작업은 Firestore 데이터베이스 규칙이 임시로 누구나 쓰기 가능한 상태(allow read, write: if true;)여야 성공합니다.")) {
                  try {
                    setLoading(true);
                    setError("");
                    await seedFirebaseDatabase();
                  } catch (err) {
                    setError(`초기화 실패: ${err.message}`);
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              className="btn btn-secondary"
              style={{ width: "100%", borderColor: "var(--accent-gold)", color: "var(--accent-gold)", gap: "8px" }}
              disabled={loading}
            >
              <Shield size={16} />
              <span>{loading ? "데이터 업로드 중..." : "Firebase 초기 데이터 업로드 (Seed)"}</span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 10% 20%, hsl(222, 30%, 8%) 0%, hsl(222, 25%, 12%) 90%);
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .login-stars {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px),
            radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px);
          background-size: 550px 550px, 350px 350px;
          background-position: 0 0, 40px 60px;
          opacity: 0.08;
          top: 0;
          left: 0;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 40px 32px;
          background: rgba(22, 28, 45, 0.6) !important;
          border-radius: var(--radius-lg);
          border: 1px solid hsla(185, 90%, 48%, 0.1) !important;
          box-shadow: 0 20px 50px 0 rgba(0, 0, 0, 0.4);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: linear-gradient(135deg, hsla(185, 90%, 48%, 0.2), hsla(210, 100%, 55%, 0.05));
          color: var(--accent-cyan);
          border: 1px solid hsla(185, 90%, 48%, 0.2);
          margin-bottom: 20px;
          filter: drop-shadow(0 0 15px hsla(185, 90%, 48%, 0.2));
        }

        .login-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .login-subtitle {
          font-size: 13px;
          color: var(--text-muted);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .login-error-box {
          background-color: hsla(355, 80%, 60%, 0.15);
          border: 1px solid hsla(355, 80%, 60%, 0.2);
          color: var(--accent-red);
          border-radius: var(--radius-md);
          padding: 12px;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
          line-height: 1.4;
        }

        .input-group-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }

        .input-group-icon input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border-radius: var(--radius-md);
          background-color: var(--bg-primary);
          border: 1px solid var(--glass-border);
          font-size: 14px;
        }

        .input-group-icon input:focus {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 10px 0 hsla(185, 90%, 48%, 0.1);
        }

        .btn-login-submit {
          width: 100%;
          padding: 12px;
          margin-top: 8px;
          justify-content: center;
          gap: 10px;
        }

        .quick-login-section {
          margin-top: 36px;
        }

        .quick-login-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin-bottom: 20px;
        }

        .quick-login-divider::before,
        .quick-login-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--glass-border);
        }

        .quick-login-divider span {
          padding: 0 10px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .quick-login-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .quick-login-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          text-align: left;
          transition: all var(--transition-fast);
        }

        .quick-login-card:hover {
          border-color: var(--accent-cyan);
          background-color: var(--bg-tertiary);
          transform: scale(1.02);
        }

        .quick-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .quick-login-card:hover .quick-icon {
          color: var(--accent-cyan);
        }

        .quick-info {
          display: flex;
          flex-direction: column;
        }

        .quick-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .quick-role {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 1px;
        }

        .quick-credentials {
          font-size: 9px;
          color: var(--accent-cyan);
          margin-top: 2px;
          font-family: monospace;
          letter-spacing: -0.02em;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 32px 20px;
          }
          .quick-login-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
