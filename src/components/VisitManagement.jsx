import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { 
  HeartHandshake, 
  Plus, 
  Trash2, 
  Edit2,
  Save,
  X,
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
    activeMonthId,
    activeWeekNo,
    visitationRecords, 
    addVisitationRecord, 
    deleteVisitationRecord,
    updateVisitationRecord,
    updateVisitationFeedback
  } = useData();

  const role = currentUser?.role;
  const canManageAllVisits = role === "admin" || role === "visit";

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
  const [editingRecordId, setEditingRecordId] = useState("");
  const [editForm, setEditForm] = useState({
    memberId: "",
    date: "",
    visitor: "구역장",
    type: "전화심방",
    notes: "",
    leaderFeedback: ""
  });

  // UI state
  const [activeTab, setActiveTab] = useState("timeline"); // "timeline" | "reflection"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMemberId, setFilterMemberId] = useState("");
  const [filterZoneId, setFilterZoneId] = useState("");
  const [filterTeamId, setFilterTeamId] = useState("");
  const [periodFilter, setPeriodFilter] = useState("week"); // "week" | "month" | "all"
  const [selectedRecordId, setSelectedRecordId] = useState("");

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
  const getRecordWeekNo = (date) => {
    const day = Number(String(date || "").split("-")[2]);
    if (!Number.isFinite(day) || day <= 0) return 1;
    return Math.min(5, Math.max(1, Math.ceil(day / 7)));
  };
  const getRecordMonthId = (date) => String(date || "").slice(0, 7);
  const getWeekGroupLabel = (record) => {
    const monthId = getRecordMonthId(record.date);
    const [year, month] = monthId.split("-");
    return `${year}년 ${Number(month)}월 ${getRecordWeekNo(record.date)}주차`;
  };

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

  const startEditRecord = (record) => {
    setEditingRecordId(record.id);
    setEditForm({
      memberId: record.memberId || "",
      date: record.date || new Date().toISOString().split("T")[0],
      visitor: record.visitor || "구역장",
      type: record.type || "전화심방",
      notes: record.notes || "",
      leaderFeedback: record.leaderFeedback || record.feedback || ""
    });
  };

  const cancelEditRecord = () => {
    setEditingRecordId("");
  };

  const handleSaveRecordEdit = async (recordId) => {
    if (!editForm.memberId) {
      alert("심방 대상 성도를 선택해 주세요.");
      return;
    }
    if (!editForm.notes.trim()) {
      alert("심방 상세 내용을 입력해 주세요.");
      return;
    }

    const memberObj = members.find(m => m.memberId === editForm.memberId);
    const updatedFields = {
      memberId: editForm.memberId,
      memberName: memberObj?.name || "",
      teamId: memberObj?.teamId || "",
      zoneId: memberObj?.zoneId || "",
      date: editForm.date,
      visitor: editForm.visitor,
      type: editForm.type,
      notes: editForm.notes.trim(),
      leaderFeedback: editForm.leaderFeedback.trim()
    };

    try {
      await updateVisitationRecord(recordId, updatedFields);
      setEditingRecordId("");
      alert("심방 상세내역이 수정되었습니다.");
    } catch (err) {
      alert("심방 상세내역 수정에 실패했습니다.");
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

    // Keep records accumulated, but default the view to the active week.
    if (periodFilter !== "all") {
      const currentMonthStr = activeMonthId || new Date().toISOString().slice(0, 7);
      list = list.filter(r => getRecordMonthId(r.date) === currentMonthStr);
      if (periodFilter === "week") {
        list = list.filter(r => getRecordWeekNo(r.date) === (activeWeekNo || 1));
      }
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
  const hasLeaderFeedback = (record) => Boolean((record?.leaderFeedback || record?.feedback || "").trim());
  const hasTeamFeedback = (record) => Boolean((record?.teamFeedback || "").trim());
  const hasAdminFeedback = (record) => Boolean((record?.adminFeedback || "").trim());
  const visibleRecords = activeTab === "reflection" ? filteredRecords.filter(hasLeaderFeedback) : filteredRecords;
  const selectedRecord = visibleRecords.find(r => r.id === selectedRecordId) || visibleRecords[0] || null;
  const groupedVisibleRecords = visibleRecords.reduce((groups, record) => {
    const key = `${getRecordMonthId(record.date)}-${getRecordWeekNo(record.date)}`;
    const existing = groups.find(group => group.key === key);
    if (existing) {
      existing.records.push(record);
    } else {
      groups.push({
        key,
        label: getWeekGroupLabel(record),
        records: [record]
      });
    }
    return groups;
  }, []);
  const getSummaryPreview = (record) => {
    const source = activeTab === "reflection"
      ? (record.leaderFeedback || record.feedback || "")
      : (record.notes || "");
    return source.replace(/\s+/g, " ").slice(0, 86);
  };

  // Stats Calculations
  const getStats = () => {
    // Filter records by active scope first
    let scopeList = [...visitationRecords];
    if (role === "team") {
      scopeList = scopeList.filter(r => r.teamId === currentUser.teamId);
    } else if (role === "leader") {
      scopeList = scopeList.filter(r => r.teamId === currentUser.teamId && r.zoneId === currentUser.zoneId);
    }

    const todayMonth = new Date().toISOString().slice(0, 7);
    const currentMonthStr = activeMonthId || todayMonth; // YYYY-MM

    // Month filter follows the selected active month in the app.
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
    const withLeaderFeedback = monthVisits.filter(r => 
      (r.leaderFeedback && r.leaderFeedback.trim() !== "") ||
      (r.feedback && r.feedback.trim() !== "")
    );

    return {
      monthTotal: monthVisits.length,
      topType: topType + (maxCount > 0 ? ` (${maxCount}회)` : ""),
      feedbackTotal: withLeaderFeedback.length
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
          <p className="section-subtitle">구역장 성찰 일기와 구역 성도와의 심방 내역을 체계적으로 누적 관리합니다.</p>
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
          <div className="form-mode-guide">
            <span>구역장성찰 일기</span>
            <p>아래 성찰 일기를 작성해 등록하면 오른쪽 구역장 성찰 일기 탭에 자동으로 모입니다.</p>
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
              <label>구역장 성찰 일기</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="심방을 진행하며 느낀 점, 구역장으로서의 다짐, 구역원님을 향한 기도제목을 적어주세요..."
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
                className={`tab-btn ${activeTab === "reflection" ? "active" : ""}`}
                onClick={() => setActiveTab("reflection")}
              >
                <BookOpen size={14} />
                <span>구역장 성찰 일기</span>
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

            <div className="visit-period-switch">
              {[
                { id: "week", label: "이번 주" },
                { id: "month", label: "이번 달" },
                { id: "all", label: "전체" }
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`period-switch-btn ${periodFilter === option.id ? "active" : ""}`}
                  onClick={() => setPeriodFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="filters-selectors">
              {canManageAllVisits && (
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
          <div className="visit-history-layout">
            <div className="timeline-container">
              {visibleRecords.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={36} className="empty-icon" />
                  <p>{activeTab === "reflection" ? "일치하는 구역장 성찰 일기가 없습니다." : "일치하는 심방 기록이 없습니다."}</p>
                </div>
              ) : (
                groupedVisibleRecords.map((group) => (
                  <div key={group.key} className="timeline-week-group">
                    <div className="timeline-week-heading">
                      <span>{group.label}</span>
                      <strong>{group.records.length}건</strong>
                    </div>

                    {group.records.map((r) => {
                      const isSelected = selectedRecord?.id === r.id;
                      const feedbackCount = [hasLeaderFeedback(r), hasTeamFeedback(r), hasAdminFeedback(r)].filter(Boolean).length;
                      const notePreview = getSummaryPreview(r);
                      const sourceText = activeTab === "reflection" ? (r.leaderFeedback || r.feedback || "") : (r.notes || "");
                      return (
                        <button
                          key={r.id}
                          type="button"
                          className={`timeline-summary-card glass-panel ${isSelected ? "active" : ""}`}
                          onClick={() => setSelectedRecordId(r.id)}
                        >
                          <div className="timeline-date-block">
                            <strong>{String(r.date || "").slice(5).replace("-", ".")}</strong>
                            <span>{new Date(r.date).toLocaleDateString("ko-KR", { weekday: "short" })}</span>
                          </div>

                          <div className="timeline-summary-main">
                            <div className="summary-title-row">
                              <span className="summary-member">{r.memberName} 성도</span>
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
                            <div className="summary-meta-row">
                              <span>{r.visitor}</span>
                              <span>{getZoneName(r.zoneId)}</span>
                            </div>
                            <p className="summary-preview">{notePreview}{sourceText.length > 86 ? "..." : ""}</p>
                            <div className="summary-chip-row">
                              {hasLeaderFeedback(r) && <span>자가성찰</span>}
                              {activeTab !== "reflection" && hasTeamFeedback(r) && <span>팀장피드백</span>}
                              {activeTab !== "reflection" && hasAdminFeedback(r) && <span>임원피드백</span>}
                              {activeTab !== "reflection" && <span>피드백 {feedbackCount}건</span>}
                            </div>
                          </div>

                          <span className="summary-detail-link">상세보기</span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <aside className="visit-detail-panel glass-panel">
              {selectedRecord ? (
                <>
                  <div className="visit-detail-header">
                    <div>
                      <div className="member-meta">
                        <span className="member-badge">{selectedRecord.memberName} 성도</span>
                        <span
                          className="type-badge"
                          style={{
                            backgroundColor: getVisitTypeColor(selectedRecord.type),
                            color: getVisitTypeTextColor(selectedRecord.type)
                          }}
                        >
                          {selectedRecord.type}
                        </span>
                      </div>
                      <p className="detail-subtitle">{getTeamName(selectedRecord.teamId)} · {getZoneName(selectedRecord.zoneId)}</p>
                    </div>
                    <div className="detail-header-actions">
                      {editingRecordId === selectedRecord.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveRecordEdit(selectedRecord.id)}
                            className="detail-action-icon-btn save"
                            title="저장"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditRecord}
                            className="detail-action-icon-btn"
                            title="취소"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditRecord(selectedRecord)}
                            className="detail-action-icon-btn"
                            title="수정"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(selectedRecord.id)}
                            className="detail-action-icon-btn delete"
                            title="삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingRecordId === selectedRecord.id ? (
                    <div className="detail-edit-form">
                      <div className="form-group">
                        <label>심방 대상 성도</label>
                        <select
                          value={editForm.memberId}
                          onChange={(e) => setEditForm(prev => ({ ...prev, memberId: e.target.value }))}
                        >
                          {scopedMembers.map(m => (
                            <option key={m.memberId} value={m.memberId}>
                              {m.name} ({m.rank} / {getZoneName(m.zoneId)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>심방 날짜</label>
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>

                      <div className="form-group">
                        <label>심방자</label>
                        <div className="btn-selector-group">
                          {["구역장", "팀장", "임원"].map(v => (
                            <button
                              key={v}
                              type="button"
                              className={`selector-btn ${editForm.visitor === v ? "active" : ""}`}
                              onClick={() => setEditForm(prev => ({ ...prev, visitor: v }))}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>심방 형태</label>
                        <div className="btn-selector-grid">
                          {["전화심방", "대면심방"].map(t => (
                            <button
                              key={t}
                              type="button"
                              className={`selector-btn ${editForm.type === t ? "active" : ""}`}
                              onClick={() => setEditForm(prev => ({ ...prev, type: t }))}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>심방 상세 내용</label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                          rows={5}
                        />
                      </div>

                      <div className="form-group">
                        <label>구역장 성찰 일기</label>
                        <textarea
                          value={editForm.leaderFeedback}
                          onChange={(e) => setEditForm(prev => ({ ...prev, leaderFeedback: e.target.value }))}
                          rows={4}
                        />
                      </div>

                      <div className="detail-edit-actions">
                        <button
                          type="button"
                          onClick={() => handleSaveRecordEdit(selectedRecord.id)}
                          className="save-feedback-btn"
                        >
                          수정 저장
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditRecord}
                          className="cancel-feedback-btn"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="detail-info-grid">
                        <span>심방일</span>
                        <strong>{selectedRecord.date}</strong>
                        <span>심방자</span>
                        <strong>{selectedRecord.visitor}</strong>
                        <span>심방형태</span>
                        <strong>{selectedRecord.type}</strong>
                        <span>작성자</span>
                        <strong>{selectedRecord.createdBy || "System"}</strong>
                      </div>

                      <div className="notes-box visit-detail-scroll-box">
                        <p className="box-title">심방 상세 내용</p>
                        <p className="box-content">{selectedRecord.notes}</p>
                      </div>

                      {hasLeaderFeedback(selectedRecord) && (
                        <div className="feedback-box visit-detail-scroll-box" style={{ borderLeft: "3px solid var(--accent-amber)" }}>
                          <p className="box-title" style={{ color: "var(--accent-amber)" }}>구역장 자가성찰 및 기도제목</p>
                          <p className="box-content" style={{ fontStyle: "italic" }}>{selectedRecord.leaderFeedback || selectedRecord.feedback}</p>
                        </div>
                      )}
                    </>
                  )}

                  {hasTeamFeedback(selectedRecord) && (
                    <div className="feedback-box visit-detail-scroll-box" style={{ borderLeft: "3px solid var(--accent-cyan)" }}>
                      <div className="detail-feedback-title-row">
                        <p className="box-title" style={{ color: "var(--accent-cyan)", margin: 0 }}>팀장 격려 피드백</p>
                        <span>작성: {selectedRecord.teamFeedbackBy}</span>
                      </div>
                      <p className="box-content">{selectedRecord.teamFeedback}</p>
                    </div>
                  )}

                  {hasAdminFeedback(selectedRecord) && (
                    <div className="feedback-box visit-detail-scroll-box" style={{ borderLeft: "3px solid #c084fc" }}>
                      <div className="detail-feedback-title-row">
                        <p className="box-title" style={{ color: "#c084fc", margin: 0 }}>임원 사역 피드백</p>
                        <span>작성: {selectedRecord.adminFeedbackBy}</span>
                      </div>
                      <p className="box-content">{selectedRecord.adminFeedback}</p>
                    </div>
                  )}

                  {(role === "team" || canManageAllVisits) && (
                    <div className="timeline-feedback-action">
                      <p className="feedback-action-title">타임라인 피드백</p>
                      {editingFeedbackId === selectedRecord.id ? (
                        <div className="feedback-edit-form">
                          <textarea
                            value={tempFeedbackText}
                            onChange={(e) => setTempFeedbackText(e.target.value)}
                            placeholder={role === "team" ? "구역장님을 격려하고 피드백을 남겨주세요..." : "사역 피드백 및 코멘트를 남겨주세요..."}
                            rows={4}
                          />
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleSaveFeedback(selectedRecord.id, role === "team" ? "team" : "admin")}
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
                            setEditingFeedbackId(selectedRecord.id);
                            setTempFeedbackText(role === "team" ? (selectedRecord.teamFeedback || "") : (selectedRecord.adminFeedback || ""));
                          }}
                          className="write-feedback-trigger-btn"
                        >
                          {role === "team"
                            ? (hasTeamFeedback(selectedRecord) ? "팀장 피드백 수정" : "팀장 피드백 남기기")
                            : (hasAdminFeedback(selectedRecord) ? "임원 피드백 수정" : "임원 피드백 남기기")}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state detail-empty-state">
                  <MessageSquare size={36} className="empty-icon" />
                  <p>상세보기 할 심방 이력을 선택해 주세요.</p>
                </div>
              )}
            </aside>
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
          grid-template-columns: minmax(300px, 0.7fr) minmax(680px, 1.6fr);
          gap: 20px;
        }

        @media (max-width: 1180px) {
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
          min-height: 0;
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

        .form-mode-guide {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 12px;
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: var(--radius-sm);
          background-color: rgba(245, 158, 11, 0.08);
        }

        .form-mode-guide span {
          font-size: 12px;
          font-weight: 800;
          color: var(--accent-amber);
        }

        .form-mode-guide p {
          margin: 0;
          font-size: 11px;
          line-height: 1.45;
          color: var(--text-secondary);
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

        .visit-period-switch {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
          padding: 4px;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
        }

        .period-switch-btn {
          min-height: 30px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 800;
        }

        .period-switch-btn:hover {
          color: var(--text-primary);
        }

        .period-switch-btn.active {
          background-color: var(--bg-primary);
          color: var(--accent-cyan);
          box-shadow: var(--shadow-sm);
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
        .visit-history-layout {
          display: grid;
          grid-template-columns: minmax(360px, 1fr) minmax(320px, 0.78fr);
          gap: 14px;
          min-height: 0;
          overflow: hidden;
        }

        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          overscroll-behavior: contain;
          max-height: calc(100vh - 360px);
          min-height: 260px;
          padding-right: 4px;
        }

        .timeline-container::-webkit-scrollbar {
          width: 7px;
        }

        .timeline-container::-webkit-scrollbar-thumb {
          background-color: var(--glass-border);
          border-radius: 999px;
        }

        .timeline-week-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .timeline-week-heading {
          position: sticky;
          top: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 10px;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          background-color: var(--bg-primary);
          color: var(--text-secondary);
          box-shadow: var(--shadow-sm);
        }

        .timeline-week-heading span {
          font-size: 12px;
          font-weight: 900;
        }

        .timeline-week-heading strong {
          font-size: 11px;
          color: var(--accent-cyan);
        }

        .timeline-summary-card {
          width: 100%;
          display: grid;
          grid-template-columns: 56px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: start;
          padding: 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--glass-border);
          background-color: rgba(255, 255, 255, 0.02);
          color: var(--text-primary);
          text-align: left;
          cursor: pointer;
        }

        .timeline-summary-card:hover,
        .timeline-summary-card.active {
          border-color: var(--accent-cyan);
          background-color: rgba(6, 182, 212, 0.06);
        }

        .timeline-date-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          color: var(--text-secondary);
          border-right: 1px solid var(--glass-border);
          padding-right: 10px;
          min-height: 78px;
        }

        .timeline-date-block strong {
          font-size: 13px;
          color: var(--text-primary);
        }

        .timeline-date-block span {
          font-size: 10px;
          color: var(--text-muted);
        }

        .timeline-summary-main {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .summary-title-row,
        .summary-meta-row,
        .summary-chip-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .summary-member {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .summary-meta-row {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .summary-preview {
          margin: 0;
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.5;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .summary-chip-row span {
          font-size: 10px;
          color: var(--text-muted);
          background-color: var(--bg-primary);
          border: 1px solid var(--glass-border);
          border-radius: 999px;
          padding: 2px 7px;
        }

        .summary-detail-link {
          color: var(--accent-cyan);
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          align-self: center;
        }

        .visit-detail-panel {
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: calc(100vh - 360px);
          overflow-y: auto;
        }

        .visit-detail-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--glass-border);
        }

        .detail-subtitle {
          margin: 6px 0 0;
          color: var(--text-muted);
          font-size: 11px;
        }

        .detail-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .detail-action-icon-btn {
          border: 1px solid var(--glass-border);
          border-radius: 6px;
          padding: 6px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .detail-action-icon-btn:hover {
          color: var(--accent-cyan);
          border-color: var(--accent-cyan);
          background-color: rgba(6, 182, 212, 0.08);
        }

        .detail-action-icon-btn.save {
          color: var(--accent-emerald);
          border-color: rgba(16, 185, 129, 0.35);
        }

        .detail-action-icon-btn.delete:hover {
          color: var(--accent-red);
          border-color: var(--accent-red);
          background-color: rgba(239, 68, 68, 0.08);
        }

        .detail-info-grid {
          display: grid;
          grid-template-columns: 88px minmax(0, 1fr);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          overflow: hidden;
          font-size: 12px;
        }

        .detail-info-grid span,
        .detail-info-grid strong {
          padding: 9px 10px;
          border-bottom: 1px solid var(--glass-border);
        }

        .detail-info-grid span {
          color: var(--text-muted);
          background-color: var(--bg-primary);
          font-weight: 700;
        }

        .detail-info-grid strong {
          color: var(--text-primary);
          font-weight: 700;
        }

        .detail-info-grid span:nth-last-child(-n + 2),
        .detail-info-grid strong:nth-last-child(-n + 2) {
          border-bottom: 0;
        }

        .visit-detail-scroll-box {
          max-height: 240px;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding-right: 12px;
        }

        .detail-edit-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          background-color: rgba(255, 255, 255, 0.02);
        }

        .detail-edit-form textarea,
        .detail-edit-form input,
        .detail-edit-form select {
          width: 100%;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
        }

        .detail-edit-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .detail-feedback-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .detail-feedback-title-row span {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 700;
        }

        .detail-empty-state {
          min-height: 240px;
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

        .visit-text-scroll-box {
          max-height: 220px;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding-right: 12px;
        }

        .visit-text-scroll-box::-webkit-scrollbar {
          width: 6px;
        }

        .visit-text-scroll-box::-webkit-scrollbar-thumb {
          background-color: var(--glass-border);
          border-radius: 999px;
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

        .timeline-feedback-action {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--glass-border);
        }

        .feedback-action-title {
          margin: 0 0 6px;
          font-size: 10px;
          font-weight: 800;
          color: var(--text-muted);
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

        @media (max-width: 980px) {
          .visit-history-layout {
            grid-template-columns: 1fr;
            overflow: visible;
          }

          .timeline-container {
            max-height: min(62vh, 560px);
          }

          .visit-detail-panel {
            max-height: none;
          }
        }

        @media (max-width: 640px) {
          .timeline-container {
            max-height: min(58vh, 460px);
          }

          .timeline-summary-card {
            grid-template-columns: 48px minmax(0, 1fr);
          }

          .summary-detail-link {
            grid-column: 2;
            justify-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
