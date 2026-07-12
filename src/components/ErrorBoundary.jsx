import React from "react";

// 렌더링 중 예외를 잡아 흰/빈 화면 대신 에러 메시지와 새로고침 버튼을 보여준다.
// (인앱 브라우저 등 특정 환경에서만 나는 오류를 파악하는 데도 도움됨)
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        <div style={{ fontSize: "44px" }}>⚠️</div>
        <h2 style={{ margin: 0, fontSize: "18px" }}>화면을 표시하는 중 문제가 발생했습니다</h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", maxWidth: "320px" }}>
          네트워크 상태가 원활하지 않거나 일시적인 오류일 수 있습니다.
          아래 버튼으로 새로고침 해주세요.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 22px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#06b6d4",
            color: "#00131a",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          새로고침
        </button>
        {this.state.message && (
          <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#64748b", maxWidth: "320px", wordBreak: "break-word" }}>
            ({this.state.message})
          </p>
        )}
      </div>
    );
  }
}
