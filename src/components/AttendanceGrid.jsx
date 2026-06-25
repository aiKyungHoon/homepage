import React, { useState, useRef, useEffect } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Search, Filter, HelpCircle, Lock, Edit3, Save } from "lucide-react";

export default function AttendanceGrid() {
  const { currentUser } = useAuth();
  const {
    members,
    teams,
    zones,
    activeMonthId,
    activeWeekNo,
    months,
    attendanceRecords,
    monthlyAchievements,
    updateAttendance,
    updateMonthlyAchievement
  } = useData();

  const role = currentUser?.role;

  // Local Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeamId, setFilterTeamId] = useState("");
  const [filterZoneId, setFilterZoneId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Cell popover/quick-select state
  const [activeCell, setActiveCell] = useState(null); // { memberId, category, x, y }
  const popoverRef = useRef(null);

  // Set default filters based on user role
  useEffect(() => {
    if (role === "team") {
      setFilterTeamId(currentUser.teamId);
    } else if (role === "leader") {
      setFilterTeamId(currentUser.teamId);
      setFilterZoneId(currentUser.zoneId);
    }
  }, [role, currentUser]);

  // Click outside listener for cell popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setActiveCell(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeMonth = months.find(m => m.monthId === activeMonthId);
  const isClosed = activeMonth ? activeMonth.status === "closed" : false;
  // Admin can edit closed months, other roles cannot
  const canEdit = !isClosed || role === "admin";

  // Filter members list
  const getFilteredMembers = () => {
    let list = [...members];

    // Status filter
    if (filterStatus) {
      list = list.filter(m => m.status === filterStatus);
    } else {
      // By default, exclude members excluded from attendance
      list = list.filter(m => m.status !== "excluded");
    }

    // Team Filter (locked for team leaders)
    if (role === "team") {
      list = list.filter(m => m.teamId === currentUser.teamId);
    } else if (filterTeamId) {
      list = list.filter(m => m.teamId === filterTeamId);
    }

    // Zone Filter (locked for zone leaders)
    if (role === "leader") {
      list = list.filter(m => m.zoneId === currentUser.zoneId);
    } else if (filterZoneId) {
      list = list.filter(m => m.zoneId === filterZoneId);
    }

    // Search query (supports multiple names separated by comma or space)
    if (searchQuery) {
      const tokens = searchQuery.split(/[\s,]+/).map(t => t.trim().toLowerCase()).filter(t => t);
      if (tokens.length > 0) {
        list = list.filter(m => tokens.some(token => m.name.toLowerCase().includes(token)));
      }
    }

    return list;
  };

  const filteredMembers = getFilteredMembers();

  // Helper: Retrieve weekly attendance value
  const getWeeklyValue = (memberId, category) => {
    const record = attendanceRecords.find(
      r => r.memberId === memberId && r.weekNo === activeWeekNo && r.category === category
    );
    return record ? record.value : "미보고";
  };

  // Helper: Retrieve monthly cumulative value (tithing, evangelism, fee)
  const getMonthlyAchievementValue = (memberId, category) => {
    const ach = monthlyAchievements.find(
      a => a.memberId === memberId && a.category === category
    );
    return ach ? ach.achieved : false;
  };

  // Grid Cell Config
  const cellOptions = {
    weeklyWorship: ["대면", "온라인", "대체", "결석", "미보고"],
    weeklyEdu: ["O", "X"],
    weeklyVisit: ["O", "X"],
    weeklyActivity: ["대면", "비대면", "미보고"]
  };

  const getCategoryOptions = (cat) => {
    if (cat === "zone") return ["들어옴", "개별전달", "미전달"];
    if (["sunday", "samil"].includes(cat)) return cellOptions.weeklyWorship;
    if (["test", "radio", "simon", "visit"].includes(cat)) return cellOptions.weeklyEdu;
    return cellOptions.weeklyActivity;
  };

  // Handle cell click (trigger cycle or popup)
  const handleCellClick = (e, memberId, category, isMonthly) => {
    if (!canEdit) return;

    if (isMonthly) {
      // Toggle immediately for checkbox-type monthly achievements
      const curVal = getMonthlyAchievementValue(memberId, category);
      updateMonthlyAchievement(memberId, category, !curVal);
    } else {
      // Open selector popover
      const rect = e.currentTarget.getBoundingClientRect();
      setActiveCell({
        memberId,
        category,
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY,
        width: rect.width
      });
    }
  };

  // Handle cell selection from popover
  const selectCellValue = (value) => {
    if (!activeCell) return;
    updateAttendance(activeCell.memberId, activeCell.category, value);
    setActiveCell(null);
  };

  // Get status color coding class
  const getCellStyle = (val) => {
    if (val === "대면" || val === "O" || val === true || val === "들어옴") return "cell-present";
    if (val === "비대면" || val === "온라인" || val === "개별전달") return "cell-online";
    if (val === "대체") return "cell-substitute";
    if (val === "결석" || val === "X" || val === false || val === "미전달") return "cell-absent";
    return "cell-unreported";
  };

  // Map team and zone IDs to names
  const getTeamName = (tId) => teams.find(t => t.teamId === tId)?.name || "";
  const getZoneName = (zId) => zones.find(z => z.zoneId === zId)?.name || "";

  return (
    <div className="attendance-grid-wrapper animate-fade">
      {/* Filters Panel */}
      <div className="filters-panel glass-panel">
        <div className="filter-header">
          <Filter size={16} />
          <h4>필터 및 검색</h4>
        </div>
        
        <div className="filters-row">
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="성도 이름 검색 (쉼표, 공백 구분)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Team Filter - Disabled/Hidden for team and zone leaders */}
          {role === "admin" && (
            <select
              value={filterTeamId}
              onChange={(e) => {
                setFilterTeamId(e.target.value);
                setFilterZoneId(""); // reset zone
              }}
              className="filter-select"
            >
              <option value="">전체 팀</option>
              {teams.map(t => (
                <option key={t.teamId} value={t.teamId}>{t.name}</option>
              ))}
            </select>
          )}

          {/* Zone Filter - Locked for zone leaders */}
          {role !== "leader" && (
            <select
              value={filterZoneId}
              onChange={(e) => setFilterZoneId(e.target.value)}
              className="filter-select"
            >
              <option value="">전체 구역</option>
              {zones
                .filter(z => !filterTeamId || z.teamId === filterTeamId)
                .map(z => (
                  <option key={z.zoneId} value={z.zoneId}>{z.name}</option>
                ))}
            </select>
          )}

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">활동 성도 전체</option>
            <option value="normal">정상</option>
            <option value="new">새가족</option>
            <option value="excluded">출결제외자</option>
          </select>
        </div>
      </div>

      {/* Grid spreadsheet */}
      <div className="grid-container glass-panel">
        {!canEdit && (
          <div className="read-only-banner">
            <Lock size={14} />
            <span>이 월은 마감 상태이므로 조회만 가능합니다.</span>
          </div>
        )}

        <div className="table-responsive">
          <table className="attendance-table">
            <thead>
              <tr>
                <th className="sticky-col">이름</th>
                <th>직분</th>
                {role === "admin" && <th>소속 팀</th>}
                {role !== "leader" && <th>소속 구역</th>}
                <th className="sep-col">삼일</th>
                <th>주일</th>
                <th>구역예배</th>
                <th className="sep-col">시험</th>
                <th>심야라디오</th>
                <th>시몬스쿨</th>
                <th className="sep-col">심방</th>
                <th className="sep-col monthly-header" title="월간 누적 (어느 한 주라도 체크 시 해당 월 전체 자동 적용)">전도*</th>
                <th className="monthly-header" title="월간 누적 (어느 한 주라도 체크 시 해당 월 전체 자동 적용)">십일조*</th>
                <th className="monthly-header" title="월간 누적 (어느 한 주라도 체크 시 해당 월 전체 자동 적용)">청체비*</th>
                <th className="sep-col">전도단</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const samil = getWeeklyValue(member.memberId, "samil");
                const sunday = getWeeklyValue(member.memberId, "sunday");
                const zone = getWeeklyValue(member.memberId, "zone");
                const test = getWeeklyValue(member.memberId, "test");
                const radio = getWeeklyValue(member.memberId, "radio");
                const simon = getWeeklyValue(member.memberId, "simon");
                const visit = getWeeklyValue(member.memberId, "visit");
                const activity = getWeeklyValue(member.memberId, "activity");

                // Monthly Achievements
                const evangelism = getMonthlyAchievementValue(member.memberId, "evangelism");
                const tithing = getMonthlyAchievementValue(member.memberId, "tithing");
                const fee = getMonthlyAchievementValue(member.memberId, "fee");

                return (
                  <tr key={member.memberId} className="grid-row">
                    <td className="sticky-col member-name-col">
                      <div>
                        <span className="member-name">{member.name}</span>
                        <span className={`status-dot status-${member.status}`}></span>
                      </div>
                    </td>
                    <td className="member-rank">{member.rank}</td>
                    {role === "admin" && <td>{getTeamName(member.teamId)}</td>}
                    {role !== "leader" && <td>{getZoneName(member.zoneId)}</td>}
                    
                    {/* Weekly worship */}
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "samil", false)}
                      className={`cell-click sep-col ${getCellStyle(samil)}`}
                    >
                      {samil}
                    </td>
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "sunday", false)}
                      className={`cell-click ${getCellStyle(sunday)}`}
                    >
                      {sunday}
                    </td>
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "zone", false)}
                      className={`cell-click ${getCellStyle(zone)}`}
                    >
                      {zone}
                    </td>

                    {/* Weekly edu */}
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "test", false)}
                      className={`cell-click sep-col ${getCellStyle(test)}`}
                    >
                      {test}
                    </td>
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "radio", false)}
                      className={`cell-click ${getCellStyle(radio)}`}
                    >
                      {radio}
                    </td>
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "simon", false)}
                      className={`cell-click ${getCellStyle(simon)}`}
                    >
                      {simon}
                    </td>

                    {/* Weekly visit */}
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "visit", false)}
                      className={`cell-click sep-col ${getCellStyle(visit)}`}
                    >
                      {visit}
                    </td>

                    {/* Monthly Achievements (Toggles) */}
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "evangelism", true)}
                      className={`cell-click sep-col monthly-cell ${getCellStyle(evangelism)}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={evangelism} 
                        readOnly 
                        disabled={!canEdit}
                        className="grid-checkbox"
                      />
                    </td>
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "tithing", true)}
                      className={`cell-click monthly-cell ${getCellStyle(tithing)}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={tithing} 
                        readOnly 
                        disabled={!canEdit}
                        className="grid-checkbox"
                      />
                    </td>
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "fee", true)}
                      className={`cell-click monthly-cell ${getCellStyle(fee)}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={fee} 
                        readOnly 
                        disabled={!canEdit}
                        className="grid-checkbox"
                      />
                    </td>

                    {/* Weekly activity */}
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "activity", false)}
                      className={`cell-click sep-col ${getCellStyle(activity)}`}
                    >
                      {activity}
                    </td>
                  </tr>
                );
              })}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={role === "admin" ? 15 : role === "team" ? 14 : 13} className="no-members">
                    조건에 부합하는 성도가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="grid-footer-notes">
          <p>* 전도, 십일조, 청체비 항목은 월 누적 항목으로 해당 월 중 한 번 체크되면 전체 주차에 동일하게 적용됩니다.</p>
        </div>
      </div>

      {/* Popover Selection Box */}
      {activeCell && (
        <div
          ref={popoverRef}
          className="cell-popover glass-panel animate-slide"
          style={{
            position: "absolute",
            top: `${activeCell.y}px`,
            left: `${activeCell.x}px`,
            width: `${Math.max(activeCell.width, 100)}px`,
            zIndex: 9999
          }}
        >
          {getCategoryOptions(activeCell.category).map((opt) => (
            <button
              key={opt}
              onClick={() => selectCellValue(opt)}
              className="popover-option"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .attendance-grid-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .filters-panel {
          padding: 16px 20px;
        }

        .filter-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: var(--text-secondary);
        }

        .filter-header h4 {
          font-size: 13px;
        }

        .filters-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 200px;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
        }

        .search-box input {
          width: 100%;
          padding: 6px 12px 6px 32px;
          border-radius: var(--radius-sm);
          font-size: 13px;
        }

        .filter-select {
          background-color: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          padding: 6px 12px;
          font-size: 13px;
          border-radius: var(--radius-sm);
          min-width: 120px;
        }

        /* Grid spreadsheet styling */
        .grid-container {
          padding: 0;
          overflow: hidden;
        }

        .read-only-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: hsla(355, 80%, 60%, 0.1);
          color: var(--accent-red);
          padding: 10px 16px;
          font-size: 12px;
          font-weight: 500;
          border-bottom: 1px solid hsla(355, 80%, 60%, 0.15);
        }

        .table-responsive {
          overflow-x: auto;
          max-height: calc(100vh - 320px);
        }

        .attendance-table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;
          font-size: 13px;
        }

        .attendance-table th,
        .attendance-table td {
          padding: 10px 12px;
          border-right: 1px solid var(--glass-border);
          border-bottom: 1px solid var(--glass-border);
          white-space: nowrap;
        }

        .attendance-table th {
          background-color: var(--bg-secondary);
          color: var(--text-secondary);
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 2;
        }

        /* Sticky first column for names */
        .sticky-col {
          position: sticky;
          left: 0;
          background-color: var(--bg-secondary);
          z-index: 3;
          box-shadow: 2px 0 5px -2px rgba(0,0,0,0.1);
        }

        .attendance-table td.sticky-col {
          background-color: var(--bg-secondary);
          z-index: 1;
        }

        .member-name-col div {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-start;
        }

        .member-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        .status-dot.status-normal { background-color: var(--accent-emerald); }
        .status-dot.status-new { background-color: var(--accent-cyan); }
        .status-dot.status-excluded { background-color: var(--text-muted); }

        .member-rank {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .sep-col {
          border-left: 2px solid var(--glass-border) !important;
        }

        .monthly-header {
          background-color: hsla(185, 90%, 48%, 0.05) !important;
          color: var(--accent-cyan) !important;
        }

        .monthly-cell {
          background-color: hsla(185, 90%, 48%, 0.02);
        }

        .grid-checkbox {
          cursor: pointer;
          transform: scale(1.1);
        }

        /* Clickable Cells and Colors */
        .cell-click {
          cursor: pointer;
          font-weight: 600;
          transition: all var(--transition-fast);
        }

        .cell-click:hover {
          filter: brightness(1.2);
          transform: scale(1.02);
        }

        /* Color classes */
        .cell-present {
          background-color: hsla(150, 70%, 50%, 0.15) !important;
          color: var(--accent-emerald);
        }

        .cell-online {
          background-color: hsla(210, 100%, 55%, 0.15) !important;
          color: var(--accent-blue);
        }

        .cell-substitute {
          background-color: hsla(185, 90%, 48%, 0.15) !important;
          color: var(--accent-cyan);
        }

        .cell-absent {
          background-color: hsla(355, 80%, 60%, 0.15) !important;
          color: var(--accent-red);
        }

        .cell-unreported {
          color: var(--text-muted);
          background-color: var(--bg-primary);
        }

        .no-members {
          padding: 32px !important;
          color: var(--text-muted);
          font-size: 14px;
        }

        .grid-footer-notes {
          padding: 12px 20px;
          border-top: 1px solid var(--glass-border);
        }

        .grid-footer-notes p {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Popover dropdown */
        .cell-popover {
          padding: 4px;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-tertiary) !important;
          border-color: var(--accent-cyan) !important;
          box-shadow: 0 10px 25px 0 rgba(0,0,0,0.3);
          border-radius: var(--radius-md);
        }

        .popover-option {
          padding: 8px 12px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          width: 100%;
        }

        .popover-option:hover {
          background-color: var(--accent-cyan);
          color: black;
        }

        @media (max-width: 1024px) {
          .table-responsive {
            max-height: calc(100vh - 400px);
          }
        }
      `}</style>
    </div>
  );
}
