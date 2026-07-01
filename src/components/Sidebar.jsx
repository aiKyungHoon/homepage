import React from "react";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  Lock, 
  History, 
  LogOut,
  Sparkles,
  HeartHandshake
} from "lucide-react";

export default function Sidebar({ activePage, setActivePage }) {
  const { currentUser, logout, isMockMode } = useAuth();
  
  if (!currentUser) return null;

  const role = currentUser.role;

  // Define navigation tabs based on user role
  const menuItems = [
    { id: "dashboard", label: "대시보드", icon: LayoutDashboard, roles: ["admin", "team"] },
    { id: "attendance", label: "출결 관리", icon: CalendarCheck, roles: ["admin", "team", "leader"] },
    { id: "visit_manage", label: "심방 관리", icon: HeartHandshake, roles: ["admin", "team", "leader"] },
    { id: "org", label: "조직/성도 관리", icon: Users, roles: ["admin", "team"] },
    { id: "month", label: "월 마감 설정", icon: Lock, roles: ["admin"] },
    { id: "history", label: "수정 이력", icon: History, roles: ["admin"] }
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar glass-panel">
        <div className="sidebar-logo">
          <Sparkles size={24} className="logo-icon" />
          <h2>교구 관리 시스템</h2>
        </div>
        
        <nav className="sidebar-nav">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-info">
            <p className="profile-name">{currentUser.name}</p>
            <p className="profile-role">
              {role === "admin" && "임원"}
              {role === "team" && "팀장"}
              {role === "leader" && "구역장"}
            </p>
          </div>
          <button onClick={logout} className="btn-logout" title="로그아웃">
            <LogOut size={18} />
            <span>로그아웃</span>
          </button>
          
          {isMockMode && (
            <div className="mock-badge">
              <span>LOCAL MOCK MODE</span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav-bar glass-panel">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`mobile-nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={20} />
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
        <button onClick={logout} className="mobile-nav-item logout-btn">
          <LogOut size={20} />
          <span className="mobile-nav-label">로그아웃</span>
        </button>
      </nav>

      {/* Sidebar specific CSS styles */}
      <style>{`
        .desktop-sidebar {
          width: 260px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          border-radius: 0;
          border-top: none;
          border-bottom: none;
          border-left: none;
          padding: 24px;
          z-index: 10;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          padding: 8px 4px;
        }

        .logo-icon {
          color: var(--accent-cyan);
          filter: drop-shadow(0 0 8px hsla(185, 90%, 48%, 0.4));
        }

        .sidebar-logo h2 {
          font-size: 18px;
          background: linear-gradient(135deg, var(--text-primary), var(--text-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          width: 100%;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
          text-align: left;
        }

        .nav-item:hover {
          background-color: var(--glass-border);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: linear-gradient(135deg, hsla(185, 90%, 48%, 0.15), hsla(210, 100%, 55%, 0.1));
          color: var(--accent-cyan);
          border: 1px solid hsla(185, 90%, 48%, 0.15);
          font-weight: 600;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .user-profile-info {
          padding: 4px;
        }

        .profile-name {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary);
        }

        .profile-role {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .btn-logout {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 13px;
          color: var(--accent-red);
          background: hsla(355, 80%, 60%, 0.08);
          border: 1px solid hsla(355, 80%, 60%, 0.15);
          width: 100%;
        }

        .btn-logout:hover {
          background: var(--accent-red);
          color: white;
        }

        .mock-badge {
          background-color: var(--accent-gold);
          color: black;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
          padding: 4px;
          border-radius: var(--radius-sm);
          letter-spacing: 0.05em;
          margin-top: 4px;
        }

        /* Mobile Bottom Nav CSS */
        .mobile-nav-bar {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          border-radius: 0;
          border-left: none;
          border-right: none;
          border-bottom: none;
          justify-content: space-around;
          align-items: center;
          padding: 0 8px;
          z-index: 100;
          box-shadow: 0 -8px 24px 0 rgba(0, 0, 0, 0.2);
        }

        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary);
          flex: 1;
          height: 100%;
          justify-content: center;
        }

        .mobile-nav-item.active {
          color: var(--accent-cyan);
        }

        .mobile-nav-label {
          font-size: 10px;
          font-weight: 500;
        }

        .logout-btn {
          color: var(--accent-red);
        }

        @media (max-width: 1024px) {
          .desktop-sidebar {
            display: none;
          }
          .mobile-nav-bar {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}
