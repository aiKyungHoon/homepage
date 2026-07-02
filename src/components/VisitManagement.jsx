import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { 
  HeartHandshake, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  User, 
  MessageSquare, 
  Award,
  BookOpen,
  Filter
} from "lucide-react";

export default function VisitManagement() {
  const { currentUser } = useAuth();
  const { 
    members, 
    teams, 
    zones, 
    visitationRecords, 
    addVisitationRecord, 
    deleteVisitationRecord,
    updateVisitationFeedback
  } = useData();

  const role = currentUser?.role;

  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [visitor, setVisitor] = useState("구역장");
  const [visitType, setVisitType] = useState("전화심방");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");

  // Feedback Edit State
  const [editingFeedbackId, setEditingFeedbackId] = useState("");
  const [tempFeedbackText, setTempFeedbackText] = useState("");

  // UI state
  const [activeTab, setActiveTab] = useState("timeline"); // "timeline" | "feedback"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMemberId, setFilterMemberId] = useState("");
  const [filterZoneId, setFilterZoneId] = useState("");
  const [filterTeamId, setFilterTeamId] = useState("");

  // Default filters based on role
  useEffect(() => {
    if (role === "team") {
      setFilterTeamId(currentUser.teamId);
    } else if (role === "leader") {
      setFilterTeamId(currentUser.teamId);
      setFilterZoneId(currentUser.zoneId);
    }
  }, [role, currentUser]);

  // Scoped members lists
  const getScopedMembers = () => {
    let list = [...members];
    if (role === "team") {
      list = list.filter(m => m.teamId === currentUser.teamId);
    } else if (role === "leader") {
      list = list.filter(m => m.teamId === currentUser.teamId && m.zoneId === currentUser.zoneId);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  };

  const scopedMembers = getScopedMembers();

  // Helper to map IDs to Names
  const getMemberName = (id) => members.find(m => m.memberId === id)?.name || "알수없음";
  const getTeamName = (id) => teams.find(t => t.teamId === id)?.name || "";
  const getZoneName = (id) => zones.find(z => z.zoneId === id)?.name || "";

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      alert("심방 대상 성도를 선택해 주세요.");
      return;
    }
    if (!notes.trim()) {
      alert("심방 내용을 입력해 주세요.");
      return;
    }

    const memberObj = members.find(m => m.memberId === selectedMemberId);
    const newRecord = {
      memberId: selectedMemberId,
      memberName: memberObj?.name || "",
      teamId: memberObj?.teamId || "",
      zoneId: memberObj?.zoneId || "",
      date: visitDate,
      visitor,
      type: visitType,
      notes: notes.trim(),
      leaderFeedback: feedback.trim(),
      teamFeedback: "",
      teamFeedbackBy: "",
      adminFeedback: "",
      adminFeedbackBy: ""
    };

    try {
      await addVisitationRecord(newRecord);
      // Reset form fields except date
      setSelectedMemberId("");
      setNotes("");
      setFeedback("");
      alert("심방 기록이 성공적으로 등록되었습니다.");
    } catch (err) {
      alert("심방 기록 등록에 실패했습니다.");
    }
  };

  // Handle Delete
  const handleDelete = async (recordId) => {
    if (window.confirm("정말로 이 심방 기록을 삭제하시겠습니까?")) {
      try {
        await deleteVisitationRecord(recordId);
        alert("기록이 삭제되었습니다.");
      } catch (err) {
        alert("기록 삭제에 실패했습니다.");
      }
    }
  };

  // Handle Save Feedback
  const handleSaveFeedback = async (recordId, type) => {
    try {
      await updateVisitationFeedback(recordId, type, tempFeedbackText.trim());
      setEditingFeedbackId("");
      setTempFeedbackText("");
      alert("피드백이 성공적으로 등록되었습니다.");
    } catch (err) {
      alert("피드백 등록에 실패했습니다.");
    }
  };

  // Filtered Visitation Records
  const getFilteredRecords = () => {
    let list = [...visitationRecords];

    // Filter by scope
    if (role === "team") {
      list = list.filter(r => r.teamId === currentUser.teamId);
    } else if (role === "leader") {
      list = list.filter(r => r.teamId === currentUser.teamId && r.zoneId === currentUser.zoneId);
    }

    // Apply active filters
    if (filterTeamId) list = list.filter(r => r.teamId === filterTeamId);
    if (filterZoneId) list = list.filter(r => r.zoneId === filterZoneId);
    if (filterMemberId) list = list.filter(r => r.memberId === filterMemberId);

    // Apply search query (search inside notes or feedback or memberName)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        (r.notes || "").toLowerCase().includes(q) || 
        (r.leaderFeedback || "").toLowerCase().includes(q) || 
        (r.feedback || "").toLowerCase().includes(q) || 
        (r.teamFeedback || "").toLowerCase().includes(q) || 
        (r.adminFeedback || "").toLowerCase().includes(q) || 
        (r.memberName || "").toLowerCase().includes(q)
      );
    }

    // Sort by date (newest first)
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  };

  const filteredRecords = getFilteredRecords();

  // Stats Calculations
  const getStats = () => {
    // Filter records by active scope first
    let scopeList = [...visitationRecords];
    if (role === "team") {
      scopeList = scopeList.filter(r => r.teamId === currentUser.teamId);
    } else if (role === "leader") {
      scopeList = scopeList.filter(r => r.teamId === currentUser.teamId && r.zoneId === currentUser.zoneId);
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = String(now.getMonth() + 1).padStart(2, "0");
    const currentMonthStr = `${currentYear}-${currentMonthNum}`; // YYYY-MM

    // Month filter
    const monthVisits = scopeList.filter(r => r.date.startsWith(currentMonthStr));
    
    // Type breakdown
    const types = {};
    monthVisits.forEach(r => {
      types[r.type] = (types[r.type] || 0) + 1;
    });

    let topType = "-";
    let maxCount = 0;
    Object.entries(types).forEach(([t, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topType = t;
      }
    });

    // Feedback counts
    const withFeedback = monthVisits.filter(r => 
      (r.leaderFeedback && r.leaderFeedback.trim() !== "") ||
      (r.feedback && r.feedback.trim() !== "") ||
      (r.teamFeedback && r.teamFeedback.trim() !== "") ||
      (r.adminFeedback && r.adminFeedback.trim() !== "")
    );

    return {
      monthTotal: monthVisits.length,
      topType: topType + (maxCount > 0 ? ` (${maxCount}회)` : ""),
      feedbackTotal: withFeedback.length
    };
  };

  const stats = getStats();

  // Helper to color visit tags
  const getVisitTypeColor = (type) => {
    if (type.includes("대면")) return "hsla(142, 70%, 45%, 0.15)";
    if (type.includes("전화") || type.includes("SNS")) return "hsla(199, 89%, 48%, 0.15)";
    if (type.includes("상담")) return "hsla(35, 92%, 50%, 0.15)";
    return "hsla(280, 80%, 60%, 0.15)";
  };

  const getVisitTypeTextColor = (type) => {
    if (type.includes("대면")) return "var(--accent-emerald)";
    if (type.includes("전화") || type.includes("SNS")) return "var(--accent-cyan)";
    if (type.includes("상담")) return "var(--accent-amber)";
    return "#c084fc";
  };

  return (
    <div className="visit-management-container animate-fade">
      {/* 1. Header & Summary Stats */}
      <div className="visit-header-row">
        <div>
          <h3 className="section-title">심방기록 및 피드백 관리</h3>
          <p className="section-subtitle">구역장 자가 피드백과 구역 성도와의 심방 내역을 체계적으로 누적 관리합니다.</p>
        </div>
      </div>

      <div className="stats-cards-grid">
        <div className="stats-card glass-panel">
          <div className="stats-card-icon" style={{ backgroundColor: "rgba(6, 182, 212, 0.1)" }}>
            <HeartHandshake size={20} style={{ color: "var(--accent-cyan)" }} />
          </div>
          <div>
            <p className="stats-card-label">이번 달 심방 건수</p>
            <h4 className="stats-card-value" style={{ color: "var(--accent-cyan)" }}>{stats.monthTotal}건</h4>
          </div>
        </div>

        <div className="stats-card glass-panel">
          <div className="stats-card-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
            <Award size={20} style={{ color: "var(--accent-emerald)" }} />
          </div>
          <div>
            <p className="stats-card-label">가장 활발한 심방 구분</p>
            <h4 className="stats-card-value" style={{ color: "var(--accent-emerald)", fontSize: "14px", marginTop: "4px" }}>
              {stats.topType}
            </h4>
          </div>
        </div>

        <div className="stats-card glass-panel">
          <div className="stats-card-icon" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
            <BookOpen size={20} style={{ color: "var(--accent-amber)" }} />
          </div>
          <div>
            <p className="stats-card-label">이번 달 자가성찰 피드백</p>
            <h4 className="stats-card-value" style={{ color: "var(--accent-amber)" }}>{stats.feedbackTotal}건</h4>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="visit-main-grid">
        {/* Left Column: Register Form */}
        <div className="visit-form-panel glass-panel">
          <div className="panel-header">
            <Plus size={16} style={{ color: "var(--accent-cyan)" }} />
            <h4>신규 심방기록 등록</h4>
          </div>

          <form onSubmit={handleSubmit} className="visit-form">
            <div className="form-group">
              <label>심방 대상 성도</label>
              <select 
                value={selectedMemberId} 
                onChange={(e) => setSelectedMemberId(e.target.value)}
                required
              >
                <option value="">성도를 선택하세요...</option>
                {scopedMembers.map(m => (
                  <option key={m.memberId} value={m.memberId}>
                    {m.name} ({m.rank} / {getZoneName(m.zoneId)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>심방 날짜</label>
                <input 
                  type="date" 
                  value={visitDate} 
                  onChange={(e) => setVisitDate(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>심방자 (누가)</label>
              <div className="btn-selector-group">
                {["구역장", "팀장", "임원"].map(v => (
                  <button
                    key={v}
                    type="button"
                    className={`selector-btn ${visitor === v ? "active" : ""}`}
                    onClick={() => setVisitor(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>심방 형태 (어떤 것)</label>
              <div className="btn-selector-grid">
                {["전화심방", "대면심방"].map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`selector-btn ${visitType === t ? "active" : ""}`}
                    onClick={() => setVisitType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>심방 상세 내용 (대화 요약 등)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="어떤 대화를 나누었고 성도님의 형편은 어떠한지 구체적으로 기록해 주세요..."
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label>자가 피드백 및 기도제목 (구역장의 성찰)</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="심방을 진행하며 스스로 느낀 점이나 구역장으로서의 다짐, 또는 구역원님을 향한 구체적인 기도제목을 적어보세요..."
                rows={3}
              />
            </div>

            <button type="submit" className="submit-btn">
              <Plus size={16} />
              <span>심방기록 등록</span>
            </button>
          </form>
        </div>

        {/* Right Column: Search, Filter, History Timeline */}
        <div className="visit-list-panel glass-panel">
          <div className="panel-tab-header">
            <div className="tabs">
              <button 
                className={`tab-btn ${activeTab === "timeline" ? "active" : ""}`}
                onClick={() => setActiveTab("timeline")}
              >
                <Calendar size={14} />
                <span>심방 이력 타임라인</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === "feedback" ? "active" : ""}`}
                onClick={() => setActiveTab("feedback")}
              >
                <BookOpen size={14} />
                <span>구역장 성찰 일기장</span>
              </button>
            </div>
          </div>

          {/* Filters & Search Sub-bar */}
          <div className="filter-sub-bar">
            <div className="search-box">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="성도명, 기록내용, 피드백 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filters-selectors">
              {role === "admin" && (
                <select 
                  value={filterTeamId} 
                  onChange={(e) => {
                    setFilterTeamId(e.target.value);
                    setFilterZoneId("");
                    setFilterMemberId("");
                  }}
                  className="sub-select"
                >
                  <option value="">팀 전체</option>
                  {teams.map(t => (
                    <option key={t.teamId} value={t.teamId}>{t.name}</option>
                  ))}
                </select>
              )}

              {role !== "leader" && (
                <select 
                  value={filterZoneId} 
                  onChange={(e) => {
                    setFilterZoneId(e.target.value);
                    setFilterMemberId("");
                  }}
                  className="sub-select"
                >
                  <option value="">구역 전체</option>
                  {zones
                    .filter(z => !filterTeamId || z.teamId === filterTeamId)
                    .map(z => (
                      <option key={z.zoneId} value={z.zoneId}>{z.name}</option>
                    ))}
                </select>
              )}

              <select 
                value={filterMemberId} 
                onChange={(e) => setFilterMemberId(e.target.value)}
                className="sub-select"
              >
                <option value="">성도 선택...</option>
                {scopedMembers
                  .filter(m => !filterZoneId || m.zoneId === filterZoneId)
                  .map(m => (
                    <option key={m.memberId} value={m.memberId}>{m.name}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="timeline-container">
            {filteredRecords.length === 0 ? (
              <div className="empty-state">
                <MessageSquare size={36} className="empty-icon" />
                <p>일치하는 심방 기록이 없습니다.</p>
              </div>
            ) : (
              filteredRecords.map((r) => {
                const isFeedbackTab = activeTab === "feedback";
                const hasLeaderFeedback = (r.leaderFeedback && r.leaderFeedback.trim() !== "") || (r.feedback && r.feedback.trim() !== "");
                const hasTeamFeedback = r.teamFeedback && r.teamFeedback.trim() !== "";
                const hasAdminFeedback = r.adminFeedback && r.adminFeedback.trim() !== "";

                // If it is feedback tab, check if there is ANY feedback. If not, don't show it.
                if (isFeedbackTab && !hasLeaderFeedback && !hasTeamFeedback && !hasAdminFeedback) return null;

                return (
                  <div key={r.id} className="timeline-card glass-panel">
                    <div className="card-header">
                      <div className="member-meta">
                        <span className="member-badge">{r.memberName} {members.find(m=>m.memberId === r.memberId)?.rank || ""}</span>
                        <span className="zone-tag">{getZoneName(r.zoneId)}</span>
                      </div>
                      <div className="date-meta">
                        <span className="date-text">{r.date}</span>
                        <button 
                          onClick={() => handleDelete(r.id)} 
                          className="delete-icon-btn" 
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="card-sub-header">
                      <span className="visitor-badge">심방자: {r.visitor}</span>
                      <span 
                        className="type-badge" 
                        style={{ 
                          backgroundColor: getVisitTypeColor(r.type),
                          color: getVisitTypeTextColor(r.type)
                        }}
                      >
                        {r.type}
                      </span>
                    </div>

                    {/* Show Notes */}
                    {!isFeedbackTab && (
                      <div className="notes-box">
                        <p className="box-title">심방 상세 내용</p>
                        <p className="box-content">{r.notes}</p>
                      </div>
                    )}

                    {/* Show Leader Feedback */}
                    {(hasLeaderFeedback) && (
                      <div className="feedback-box" style={{ borderLeft: "3px solid var(--accent-amber)", marginTop: "8px" }}>
                        <p className="box-title" style={{ color: "var(--accent-amber)" }}>구역장 자가성찰 및 기도제목</p>
                        <p className="box-content" style={{ fontStyle: "italic" }}>
                          {r.leaderFeedback || r.feedback}
                        </p>
                      </div>
                    )}

                    {/* Show Team Feedback */}
                    {(hasTeamFeedback) && (
                      <div className="feedback-box" style={{ borderLeft: "3px solid var(--accent-cyan)", marginTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <p className="box-title" style={{ color: "var(--accent-cyan)", margin: 0 }}>팀장 격려 피드백</p>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600" }}>작성: {r.teamFeedbackBy}</span>
                        </div>
                        <p className="box-content">
                          {r.teamFeedback}
                        </p>
                      </div>
                    )}

                    {/* Show Admin Feedback */}
                    {(hasAdminFeedback) && (
                      <div className="feedback-box" style={{ borderLeft: "3px solid #c084fc", marginTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <p className="box-title" style={{ color: "#c084fc", margin: 0 }}>임원 사역 피드백</p>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600" }}>작성: {r.adminFeedbackBy}</span>
                        </div>
                        <p className="box-content">
                          {r.adminFeedback}
                        </p>
                      </div>
                    )}

                    {/* Team Leader edit buttons */}
                    {role === "team" && (
                      <div style={{ marginTop: "8px" }}>
                        {editingFeedbackId === r.id ? (
                          <div className="feedback-edit-form">
                            <textarea
                              value={tempFeedbackText}
                              onChange={(e) => setTempFeedbackText(e.target.value)}
                              placeholder="구역장님을 격려하고 피드백을 남겨주세요..."
                              rows={3}
                            />
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button 
                                type="button" 
                                onClick={() => handleSaveFeedback(r.id, "team")}
                                className="save-feedback-btn"
                              >
                                저장
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setEditingFeedbackId("")}
                                className="cancel-feedback-btn"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFeedbackId(r.id);
                              setTempFeedbackText(r.teamFeedback || "");
                            }}
                            className="write-feedback-trigger-btn"
                          >
                            {hasTeamFeedback ? "팀장 피드백 수정" : "💬 팀장 피드백 남기기"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Admin edit buttons */}
                    {role === "admin" && (
                      <div style={{ marginTop: "8px" }}>
                        {editingFeedbackId === r.id ? (
                          <div className="feedback-edit-form">
                            <textarea
                              value={tempFeedbackText}
                              onChange={(e) => setTempFeedbackText(e.target.value)}
                              placeholder="사역 피드백 및 코멘트를 남겨주세요..."
                              rows={3}
                            />
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button 
                                type="button" 
                                onClick={() => handleSaveFeedback(r.id, "admin")}
                                className="save-feedback-btn"
                              >
                                저장
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setEditingFeedbackId("")}
                                className="cancel-feedback-btn"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFeedbackId(r.id);
                              setTempFeedbackText(r.adminFeedback || "");
                            }}
                            className="write-feedback-trigger-btn"
                          >
                            {hasAdminFeedback ? "임원 피드백 수정" : "💬 임원 피드백 남기기"}
                          </button>
                        )}
                      </div>
                    )}
                    
                    <div className="card-footer-meta" style={{ marginTop: "8px" }}>
                      <span>작성자: {r.createdBy || "System"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style>{`
        .visit-management-container {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          color: var(--text-primary);
        }

        .visit-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stats-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .stats-card {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-radius: var(--radius-md);
        }

        .stats-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stats-card-label {
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 2px;
        }

        .stats-card-value {
          font-size: 18px;
          font-weight: 700;
        }

        .visit-main-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 20px;
        }

        @media (max-width: 1024px) {
          .visit-main-grid {
            grid-template-columns: 1fr;
          }
        }

        .visit-form-panel, .visit-list-panel {
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 10px;
          color: var(--text-secondary);
        }

        .panel-header h4 {
          font-size: 14px;
          font-weight: 700;
        }

        .visit-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .form-group select, 
        .form-group input[type="date"], 
        .form-group textarea {
          background-color: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
        }

        .form-group select:focus, 
        .form-group input[type="date"]:focus, 
        .form-group textarea:focus {
          border-color: var(--accent-cyan);
        }

        .form-row {
          display: flex;
          gap: 12px;
        }

        .flex-1 {
          flex: 1;
        }

        .btn-selector-group {
          display: flex;
          gap: 6px;
        }

        .btn-selector-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 6px;
        }

        .selector-btn {
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          border: 1px solid var(--glass-border);
          background-color: transparent;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .selector-btn:hover {
          border-color: var(--accent-cyan);
          color: var(--text-primary);
        }

        .selector-btn.active {
          background-color: rgba(6, 182, 212, 0.15);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
        }

        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          background-color: var(--accent-emerald);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 10px;
        }

        .submit-btn:hover {
          background-color: hsla(142, 70%, 40%, 1);
        }

        /* Right Panel Tab List styling */
        .panel-tab-header {
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 8px;
        }

        .tabs {
          display: flex;
          gap: 8px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background-color: transparent;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          background-color: var(--bg-primary);
          color: var(--accent-cyan);
          border-bottom: 2px solid var(--accent-cyan);
        }

        /* Filter Sub Bar */
        .filter-sub-bar {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 12px;
        }

        .filter-sub-bar .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .filter-sub-bar .search-box input {
          width: 100%;
          padding: 6px 12px 6px 30px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          outline: none;
        }

        .filter-sub-bar .search-icon {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
        }

        .filters-selectors {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .sub-select {
          padding: 4px 8px;
          font-size: 12px;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          outline: none;
          min-width: 100px;
          flex: 1;
        }

        /* Timeline Card styling */
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          max-height: calc(100vh - 350px);
          padding-right: 4px;
        }

        .timeline-card {
          padding: 14px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .member-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .member-badge {
          font-size: 13px;
          font-weight: 700;
        }

        .zone-tag {
          font-size: 10px;
          padding: 2px 6px;
          background-color: var(--bg-primary);
          border-radius: 10px;
          color: var(--text-muted);
        }

        .date-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date-text {
          font-size: 11px;
          color: var(--text-muted);
        }

        .delete-icon-btn {
          background-color: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
        }

        .delete-icon-btn:hover {
          color: var(--accent-red);
        }

        .card-sub-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }

        .visitor-badge {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .type-badge {
          font-size: 9px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .notes-box, .feedback-box {
          background-color: rgba(0, 0, 0, 0.15);
          border-radius: var(--radius-sm);
          padding: 10px;
        }

        .box-title {
          font-size: 10px;
          font-weight: 700;
          color: var(--accent-cyan);
          margin-bottom: 4px;
        }

        .box-content {
          font-size: 12px;
          line-height: 1.5;
          color: var(--text-primary);
          white-space: pre-wrap;
        }

        .card-footer-meta {
          font-size: 10px;
          color: var(--text-muted);
          text-align: right;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--text-muted);
          gap: 12px;
        }

        .empty-icon {
          color: var(--text-muted);
          opacity: 0.5;
        }

        .feedback-edit-form {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .feedback-edit-form textarea {
          width: 100%;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          padding: 8px;
          font-size: 12px;
          color: var(--text-primary);
          outline: none;
        }

        .feedback-edit-form textarea:focus {
          border-color: var(--accent-cyan);
        }

        .save-feedback-btn {
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 700;
          background-color: var(--accent-cyan);
          color: black;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .cancel-feedback-btn {
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 600;
          background-color: transparent;
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .write-feedback-trigger-btn {
          margin-top: 8px;
          align-self: flex-start;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          background-color: rgba(6, 182, 212, 0.1);
          color: var(--accent-cyan);
          border: 1px solid var(--accent-cyan);
          border-radius: var(--radius-sm);
          padding: 4px 8px;
          cursor: pointer;
        }

        .write-feedback-trigger-btn:hover {
          background-color: var(--accent-cyan);
          color: black;
        }
      `}</style>
    </div>
  );
}
