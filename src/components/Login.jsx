import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { User, Lock, Shield, ArrowRight } from "lucide-react";
import { demoUsers } from "../utils/mockData";

function WhiteHorseIcon({ size = 46 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="login-horse-logo"
    >
      <path
        d="M22.5 20.3c5.7-6.2 12.7-9.2 20.1-10.1-4.8 3.2-8.6 6.8-11.3 10.7 4.2-1.8 8.2-2.7 12-2.9-4.8 2.6-8.9 5.6-12.1 9.1"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22.9 21.5c4.6-2.9 9.9-5 15.8-6.2M24.6 24.9c3.7-1.5 7.7-2.2 12-2.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <path
        d="M10.3 35.4c.3-5.5 2.3-10.1 6-13.6 2.1-2 4.9-3.1 7.8-3.1h3.4c2.1 0 3.8 1.7 3.8 3.8v2.6l3.8 2.8c1 .8.8 2.4-.4 2.9l-3.1 1.4c-1.2.5-2.6.3-3.6-.5l-1.3-1-2.5 8"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 19.6c-1.2-3.5.3-7 3.9-9.8-.2 3.9.9 6.8 3.2 8.9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.9 25.3 8.4 20.9M15.2 27.4l-8.5.8M14.2 31.6l-5.8 6.1M20.5 37.9l-1.3 5.3M24.2 38.7l3 4.5M12.1 36.4l-2.8 5.2"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.9 23.9c-2.1 2.2-4.6 3.2-7.6 3.1 2.2 1.9 4.5 2.5 7 1.8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28.8" cy="24.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

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
      console.error("Login failed:", err);
      let errMsg = "로그인 중 오류가 발생했습니다.";
      if (err.code) {
        switch (err.code) {
          case "auth/invalid-credential":
            errMsg = "아이디 또는 비밀번호가 올바르지 않습니다.\n만약 Firebase에 초기 데이터를 업로드하지 않으셨다면 하단의 'Firebase 초기 데이터 업로드' 버튼을 클릭하여 DB를 먼저 생성해 주세요.";
            break;
          case "auth/user-not-found":
            errMsg = "등록되지 않은 아이디입니다. 하단의 'Firebase 초기 데이터 업로드 (Seed)' 버튼을 클릭해 계정을 먼저 생성해 주세요.";
            break;
          case "auth/wrong-password":
            errMsg = "비밀번호가 올바르지 않습니다.";
            break;
          case "auth/invalid-email":
            errMsg = "올바른 아이디/이메일 형식이 아닙니다.";
            break;
          case "auth/network-request-failed":
            errMsg = "네트워크 연결에 실패했습니다. 인터넷 연결 상태를 확인해 주세요.";
            break;
          case "auth/too-many-requests":
            errMsg = "로그인 시도가 너무 많아 계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도해 주세요.";
            break;
          default:
            errMsg = `로그인 실패 (${err.code}): ${err.message}`;
        }
      } else {
        errMsg = err.message || errMsg;
      }
      setError(errMsg);
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
            <WhiteHorseIcon />
          </div>
          <h1 style={{ letterSpacing: "1px", fontWeight: "800" }}>WHSMS</h1>
          <p className="login-subtitle">White Horse Sangam Management System</p>
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
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              autoComplete="username"
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
              autoComplete="current-password"
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
                    <span className="quick-credentials">ID: {user.username}</span>
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

        .login-horse-logo {
          filter: drop-shadow(0 0 10px hsla(185, 90%, 48%, 0.35));
        }

        .login-header h1 {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0;
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
