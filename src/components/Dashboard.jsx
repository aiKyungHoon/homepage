import React from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  HeartHandshake, 
  Coins, 
  Award,
  TrendingUp
} from "lucide-react";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { 
    members, 
    teams, 
    zones, 
    activeMonthId, 
    activeWeekNo, 
    attendanceRecords, 
    monthlyAchievements 
  } = useData();

  const role = currentUser?.role;

  // Filter members based on user role
  const getScopedMembers = () => {
    // Active members only (normal, new, absent). Exclude moved and inactive.
    const activeStates = ["normal", "new", "absent"];
    let filtered = members.filter(m => activeStates.includes(m.status));

    if (role === "team") {
      filtered = filtered.filter(m => m.teamId === currentUser.teamId);
    } else if (role === "leader") {
      filtered = filtered.filter(m => m.zoneId === currentUser.zoneId);
    }
    return filtered;
  };

  const scopedMembers = getScopedMembers();
  const totalCount = scopedMembers.length;

  // Helper: Count attendance status for activeWeekNo
  const getAttendanceStats = () => {
    let present = 0;
    let absent = 0;
    let unreported = 0;

    scopedMembers.forEach(m => {
      const rec = attendanceRecords.find(
        r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "sunday"
      );
      const val = rec ? rec.value : "미보고";

      if (val === "대면" || val === "비대면" || val === "대체" || val === "O") {
        present++;
      } else if (val === "결석" || val === "X") {
        absent++;
      } else {
        unreported++;
      }
    });

    return { present, absent, unreported };
  };

  const attStats = getAttendanceStats();

  // Helper: Count monthly achievements (evangelism, tithing, fee)
  const getAchievementCount = (category) => {
    let count = 0;
    scopedMembers.forEach(m => {
      const ach = monthlyAchievements.find(
        a => a.memberId === m.memberId && a.category === category
      );
      if (ach && ach.achieved) {
        count++;
      }
    });
    return count;
  };

  const evangelismCount = getAchievementCount("evangelism");
  const tithingCount = getAchievementCount("tithing");
  const feeCount = getAchievementCount("fee");

  // Helper: Calculate attendance rate for a given set of members
  const calculateAttendanceRate = (mList) => {
    if (mList.length === 0) return 0;
    
    let totalPossible = mList.length * 3; // 3 services: samil, sunday, zone
    let totalPresent = 0;

    mList.forEach(m => {
      ["samil", "sunday", "zone"].forEach(cat => {
        const rec = attendanceRecords.find(
          r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === cat
        );
        const val = rec ? rec.value : "미보고";
        if (val === "대면" || val === "비대면" || val === "대체" || val === "O") {
          totalPresent++;
        }
      });
    });

    return Math.round((totalPresent / totalPossible) * 100);
  };

  const overallRate = calculateAttendanceRate(scopedMembers);

  // Helper: Calculate rankings
  const getTeamRankings = () => {
    const activeTeams = teams.filter(t => t.status === "active");
    const list = activeTeams.map(t => {
      const tMembers = members.filter(m => m.teamId === t.teamId && ["normal", "new", "absent"].includes(m.status));
      const rate = calculateAttendanceRate(tMembers);
      return { teamId: t.teamId, name: t.name, rate, count: tMembers.length };
    });
    return list.sort((a, b) => b.rate - a.rate);
  };

  const getZoneRankings = () => {
    let targetZones = zones;
    // If team leader, only rank zones within their team
    if (role === "team") {
      targetZones = zones.filter(z => z.teamId === currentUser.teamId);
    }

    const list = targetZones.map(z => {
      const zMembers = members.filter(m => m.zoneId === z.zoneId && ["normal", "new", "absent"].includes(m.status));
      const rate = calculateAttendanceRate(zMembers);
      const team = teams.find(t => t.teamId === z.teamId);
      return { 
        zoneId: z.zoneId, 
        name: z.name, 
        teamName: team ? team.name : "",
        rate, 
        count: zMembers.length 
      };
    });
    // Filter out zones with 0 members to avoid ranking empty zones
    return list.filter(z => z.count > 0).sort((a, b) => b.rate - a.rate);
  };

  const teamRanks = getTeamRankings();
  const zoneRanks = getZoneRankings();

  // Scope label for dashboard card header
  const getScopeLabel = () => {
    if (role === "admin") return "전체 교구";
    if (role === "team") {
      const t = teams.find(t => t.teamId === currentUser.teamId);
      return t ? `${t.name}` : "소속 교구";
    }
    if (role === "leader") {
      const z = zones.find(z => z.zoneId === currentUser.zoneId);
      return z ? `${z.name}` : "소속 구역";
    }
    return "조직";
  };

  return (
    <div className="dashboard-wrapper animate-fade">
      {/* Scope Info Banner */}
      <div className="dashboard-banner glass-panel">
        <TrendingUp size={20} className="banner-icon" />
        <div>
          <h3>{getScopeLabel()} 주간 리포트</h3>
          <p>2026년 {activeMonthId.split("-")[1]}월 {activeWeekNo}주차 기준으로 자동 집계된 수치입니다.</p>
        </div>
        <div className="overall-rate-display">
          <span className="rate-num">{overallRate}%</span>
          <span className="rate-lbl">평균 출석률</span>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="dashboard-grid">
        <div className="stats-card glass-panel">
          <div className="stats-icon-wrapper blue">
            <Users size={22} />
          </div>
          <div className="stats-info">
            <p className="stats-label">총원</p>
            <h2 className="stats-value">{totalCount}명</h2>
            <p className="stats-subtext">활동 가능 성도</p>
          </div>
        </div>

        <div className="stats-card glass-panel">
          <div className="stats-icon-wrapper emerald">
            <CheckCircle size={22} />
          </div>
          <div className="stats-info">
            <p className="stats-label">주일 출석</p>
            <h2 className="stats-value">{attStats.present}명</h2>
            <p className="stats-subtext">대면/비대면/대체 포함</p>
          </div>
        </div>

        <div className="stats-card glass-panel">
          <div className="stats-icon-wrapper gold">
            <AlertCircle size={22} />
          </div>
          <div className="stats-info">
            <p className="stats-label">결석</p>
            <h2 className="stats-value">{attStats.absent}명</h2>
            <p className="stats-subtext">보고된 결석자</p>
          </div>
        </div>

        <div className="stats-card glass-panel">
          <div className="stats-icon-wrapper muted">
            <HelpCircle size={22} />
          </div>
          <div className="stats-info">
            <p className="stats-label">미보고</p>
            <h2 className="stats-value">{attStats.unreported}명</h2>
            <p className="stats-subtext">출결 입력 필요</p>
          </div>
        </div>
      </div>

      {/* Monthly Achievements Summary Cards */}
      <div className="dashboard-grid achievements-grid">
        <div className="stats-card glass-panel ach-card">
          <div className="stats-icon-wrapper cyan">
            <HeartHandshake size={22} />
          </div>
          <div className="stats-info">
            <p className="stats-label">전도 인원</p>
            <h2 className="stats-value">{evangelismCount}명</h2>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill cyan" 
                style={{ width: `${totalCount ? (evangelismCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="stats-subtext">전체 인원 대비 {totalCount ? Math.round((evangelismCount / totalCount) * 100) : 0}%</p>
          </div>
        </div>

        <div className="stats-card glass-panel ach-card">
          <div className="stats-icon-wrapper gold">
            <Coins size={22} />
          </div>
          <div className="stats-info">
            <p className="stats-label">십일조 인원</p>
            <h2 className="stats-value">{tithingCount}명</h2>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill gold" 
                style={{ width: `${totalCount ? (tithingCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="stats-subtext">전체 인원 대비 {totalCount ? Math.round((tithingCount / totalCount) * 100) : 0}%</p>
          </div>
        </div>

        <div className="stats-card glass-panel ach-card">
          <div className="stats-icon-wrapper blue">
            <Award size={22} />
          </div>
          <div className="stats-info">
            <p className="stats-label">청체비 납부</p>
            <h2 className="stats-value">{feeCount}명</h2>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill blue" 
                style={{ width: `${totalCount ? (feeCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="stats-subtext">전체 인원 대비 {totalCount ? Math.round((feeCount / totalCount) * 100) : 0}%</p>
          </div>
        </div>
      </div>

      {/* Rankings Section */}
      <div className="rankings-layout">
        {/* Team Rankings (Only shown to Admin) */}
        {role === "admin" && (
          <div className="ranking-panel glass-panel">
            <div className="panel-header">
              <h3>교구(팀)별 출석률 순위</h3>
              <span>예배 종합 통계</span>
            </div>
            <div className="ranking-list">
              {teamRanks.map((team, idx) => (
                <div key={team.teamId} className="ranking-item">
                  <div className="rank-badge">{idx + 1}</div>
                  <div className="rank-details">
                    <div className="rank-name-row">
                      <span className="rank-name">{team.name}</span>
                      <span className="rank-percent">{team.rate}%</span>
                    </div>
                    <div className="chart-bar-container">
                      <div className="chart-bar-fill team-color" style={{ width: `${team.rate}%` }}></div>
                    </div>
                    <p className="rank-sub">성도 수: {team.count}명</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zone Rankings (Shown to Admin and Team Leader) */}
        {(role === "admin" || role === "team") && (
          <div className="ranking-panel glass-panel">
            <div className="panel-header">
              <h3>구역별 출석률 순위</h3>
              <span>예배 종합 통계 (상위 5개)</span>
            </div>
            <div className="ranking-list">
              {zoneRanks.slice(0, 5).map((zone, idx) => (
                <div key={zone.zoneId} className="ranking-item">
                  <div className="rank-badge zone-badge">{idx + 1}</div>
                  <div className="rank-details">
                    <div className="rank-name-row">
                      <span className="rank-name">
                        {zone.name} <small style={{color: "var(--text-muted)", fontSize: "11px"}}>({zone.teamName})</small>
                      </span>
                      <span className="rank-percent">{zone.rate}%</span>
                    </div>
                    <div className="chart-bar-container">
                      <div className="chart-bar-fill zone-color" style={{ width: `${zone.rate}%` }}></div>
                    </div>
                    <p className="rank-sub">구역 총원: {zone.count}명</p>
                  </div>
                </div>
              ))}
              {zoneRanks.length === 0 && (
                <div className="no-rankings">활동 중인 구역원이 없습니다.</div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .dashboard-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .dashboard-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          background: linear-gradient(135deg, hsla(185, 90%, 48%, 0.05), hsla(210, 100%, 55%, 0.03)) !important;
          border-color: hsla(185, 90%, 48%, 0.15) !important;
        }

        .banner-icon {
          color: var(--accent-cyan);
        }

        .dashboard-banner h3 {
          font-size: 16px;
          color: var(--text-primary);
        }

        .dashboard-banner p {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .overall-rate-display {
          margin-left: auto;
          text-align: right;
          display: flex;
          flex-direction: column;
        }

        .rate-num {
          font-size: 28px;
          font-weight: 700;
          color: var(--accent-cyan);
          font-family: var(--font-title);
          line-height: 1;
        }

        .rate-lbl {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-top: 4px;
          font-weight: 600;
        }

        /* Stats Cards Details */
        .stats-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
        }

        .stats-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
        }

        .stats-icon-wrapper.blue {
          background-color: hsla(210, 100%, 55%, 0.1);
          color: var(--accent-blue);
        }
        
        .stats-icon-wrapper.emerald {
          background-color: hsla(150, 70%, 50%, 0.1);
          color: var(--accent-emerald);
        }

        .stats-icon-wrapper.gold {
          background-color: hsla(42, 90%, 55%, 0.1);
          color: var(--accent-gold);
        }

        .stats-icon-wrapper.muted {
          background-color: hsla(220, 15%, 50%, 0.1);
          color: var(--text-secondary);
        }

        .stats-icon-wrapper.cyan {
          background-color: hsla(185, 90%, 48%, 0.1);
          color: var(--accent-cyan);
        }

        .stats-info {
          flex: 1;
        }

        .stats-label {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .stats-value {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 2px;
        }

        .stats-subtext {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        /* Achievements bar styling */
        .ach-card {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        .ach-card .stats-icon-wrapper {
          align-self: flex-start;
        }

        .progress-bar-container {
          height: 6px;
          background-color: var(--bg-primary);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-top: 8px;
          border: 1px solid var(--glass-border);
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
        }

        .progress-bar-fill.cyan {
          background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue));
        }

        .progress-bar-fill.gold {
          background: linear-gradient(90deg, var(--accent-gold), hsl(35, 100%, 50%));
        }

        .progress-bar-fill.blue {
          background: linear-gradient(90deg, var(--accent-blue), hsl(230, 90%, 60%));
        }

        /* Rankings grid */
        .rankings-layout {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }

        .ranking-panel {
          padding: 24px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 12px;
        }

        .panel-header h3 {
          font-size: 15px;
          color: var(--text-primary);
        }

        .panel-header span {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .ranking-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ranking-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .rank-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
          color: white;
          box-shadow: 0 4px 10px 0 hsla(185, 90%, 48%, 0.2);
        }

        .rank-badge.zone-badge {
          background: linear-gradient(135deg, var(--accent-blue), hsl(240, 60%, 60%));
          box-shadow: 0 4px 10px 0 hsla(210, 100%, 55%, 0.2);
        }

        .rank-details {
          flex: 1;
        }

        .rank-name-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .rank-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .rank-percent {
          font-size: 13px;
          font-weight: 700;
          color: var(--accent-cyan);
        }

        .chart-bar-container {
          height: 8px;
          background-color: var(--bg-primary);
          border-radius: var(--radius-full);
          overflow: hidden;
          border: 1px solid var(--glass-border);
        }

        .chart-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 1s ease-in-out;
        }

        .chart-bar-fill.team-color {
          background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue));
        }

        .chart-bar-fill.zone-color {
          background: linear-gradient(90deg, var(--accent-blue), hsl(240, 60%, 65%));
        }

        .rank-sub {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .no-rankings {
          text-align: center;
          padding: 20px;
          color: var(--text-muted);
          font-size: 13px;
        }

        @media (max-width: 768px) {
          .overall-rate-display {
            margin-left: 0;
            margin-top: 10px;
            width: 100%;
            text-align: left;
            border-top: 1px solid var(--glass-border);
            padding-top: 10px;
          }
          .dashboard-banner {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
