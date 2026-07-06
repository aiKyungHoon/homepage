import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit2, Trash2, X, Users, Compass, FolderPlus, Shield, Download, Search, RefreshCw } from "lucide-react";

const REGISTRATION_TYPE_OPTIONS = ["총등", "교등", "입교"];
const DEFAULT_REGISTRATION_TYPES = {
  박어진: "교등",
  김혜주: "교등",
  허성태: "교등",
  윤명근: "교등",
  정운선: "교등",
  박진우98: "교등",
  김은주: "교등",
  김성주: "교등",
  신주영: "교등",
  최현석: "교등",
  김태건: "교등",
  이혜연: "교등",
  권보회: "교등",
  오영심: "교등",
  진성은: "교등",
  김가희: "교등",
  김소영: "교등",
  김정은: "교등",
  박상민: "교등",
  송하신: "교등",
  이미지: "교등",
  이주영: "교등",
  하헌영: "교등",
  박재은: "교등",
  조인겸: "입교",
  윤준수: "입교",
  문성현: "입교",
  윤두진: "입교",
  임상호: "입교"
};

export default function OrgManagement() {
  const { currentUser } = useAuth();
  const {
    members,
    teams,
    zones,
    users,
    addMember,
    updateMember,
    deleteMember,
    addTeam,
    updateTeam,
    addZone,
    updateZone,
    addUser,
    updateUser,
    deleteUser,
    refreshData
  } = useData();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      alert("실시간으로 최신 데이터가 반영되었습니다.");
    } catch (err) {
      console.error("데이터 동기화 실패:", err);
      alert("데이터 동기화 중 오류가 발생했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const role = currentUser?.role;

  // Tabs: members, zones, teams
  const [activeSubTab, setActiveSubTab] = useState("members");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberTeamFilter, setMemberTeamFilter] = useState("");
  const [memberZoneFilter, setMemberZoneFilter] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState("");
  const [memberRegistrationFilter, setMemberRegistrationFilter] = useState("");

  // Modals / Form toggles
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  // --- Member Form State ---
  const [memberForm, setMemberForm] = useState({
    name: "",
    rank: "청년",
    teamId: "",
    zoneId: "",
    status: "normal",
    registrationType: "총등"
  });

  // --- Zone Form State ---
  const [zoneForm, setZoneForm] = useState({
    name: "",
    teamId: "",
    leaderId: ""
  });

  // --- Team Form State ---
  const [teamForm, setTeamForm] = useState({
    name: "",
    leaderId: "",
    status: "active"
  });

  // --- User Form State ---
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "leader"
  });

  // Scope Filtering
  const getScopedMembers = () => {
    if (role === "team") {
      return members.filter(m => m.teamId === currentUser.teamId);
    }
    return members;
  };

  const getScopedZones = () => {
    if (role === "team") {
      return zones.filter(z => z.teamId === currentUser.teamId);
    }
    return zones;
  };

  const normalizeLeaderName = (name) => String(name || "").replace(/\s*\([^)]*\)\s*/g, "").trim();

  const isTeamLeaderMember = (member) => {
    if (!member) return false;
    const team = teams.find(t => t.teamId === member.teamId);
    if (!team?.leaderId) return false;
    const leaderUserName = users.find(u => u.userId === team.leaderId)?.name;
    return team.leaderId === member.memberId || normalizeLeaderName(team.leaderId) === member.name || normalizeLeaderName(leaderUserName) === member.name;
  };

  const isLeadershipMember = (member) => {
    if (!member) return false;
    const leadershipRefs = [
      ...teams.map(t => t.leaderId).filter(Boolean),
      ...zones.map(z => z.leaderId).filter(Boolean)
    ];
    const leadershipUserIds = new Set(leadershipRefs);
    const leadershipUserNames = new Set(
      [...teams, ...zones]
        .map(item => users.find(u => u.userId === item.leaderId)?.name)
        .map(normalizeLeaderName)
        .filter(Boolean)
    );
    const leadershipRawNames = leadershipRefs.map(normalizeLeaderName);

    return leadershipUserIds.has(member.memberId) || leadershipUserNames.has(member.name) || leadershipRawNames.includes(member.name);
  };

  const getZoneSortValue = (zone) => {
    if (!zone) return Number.MAX_SAFE_INTEGER;
    const teamName = getTeamName(zone.teamId);
    const searchableName = `${teamName} ${zone.name || ""}`;
    const zoneNumberMatch = searchableName.match(/(\d+)(?:-(\d+))?\s*구역/);
    let zoneNumber = Number.MAX_SAFE_INTEGER;
    if (zoneNumberMatch) {
      const major = Number(zoneNumberMatch[1]);
      const minor = zoneNumberMatch[2] ? Number(zoneNumberMatch[2]) : 0;
      zoneNumber = major + (minor / 100);
    }
    const teamOrder = [
      { keyword: "보라", order: 0 },
      { keyword: "해봄", order: 1 },
      { keyword: "이음", order: 2 },
    ].find(({ keyword }) => searchableName.includes(keyword))?.order;

    if (teamOrder !== undefined && Number.isFinite(zoneNumber)) {
      return (teamOrder * 100) + zoneNumber;
    }

    const explicitOrder = zone.sortOrder ?? zone.order ?? zone.orderNo ?? zone.displayOrder ?? zone.sequence ?? zone.sort;
    const parsedOrder = Number(explicitOrder);
    if (Number.isFinite(parsedOrder)) return 1000 + parsedOrder;

    const nameNumber = String(zone.name || "").match(/\d+/);
    return nameNumber ? 2000 + Number(nameNumber[0]) : Number.MAX_SAFE_INTEGER;
  };

  const compareZones = (a, b) => {
    const orderDiff = getZoneSortValue(a) - getZoneSortValue(b);
    if (orderDiff !== 0) return orderDiff;
    return String(a?.name || "").localeCompare(String(b?.name || ""), "ko");
  };

  const getSortedZones = (zoneList = getScopedZones()) => [...zoneList].sort(compareZones);

  const getTeamSortValue = (teamId) => {
    const teamName = getTeamName(teamId);
    const teamOrder = [
      { keyword: "보라", order: 0 },
      { keyword: "해봄", order: 1 },
      { keyword: "이음", order: 2 },
    ].find(({ keyword }) => teamName.includes(keyword))?.order;
    if (teamOrder !== undefined) return teamOrder;

    const teamZones = zones.filter(z => z.teamId === teamId);
    if (teamZones.length > 0) return Math.min(...teamZones.map(getZoneSortValue)) / 100;

    return Number.MAX_SAFE_INTEGER;
  };

  const getFilteredMembers = () => {
    let list = getScopedMembers();
    const query = memberSearchQuery.trim().toLowerCase();

    if (query) {
      const tokens = query.split(/[\s,]+/).filter(Boolean);
      list = list.filter(m => tokens.some(token => (
        String(m.name || "").toLowerCase().includes(token) ||
        getMemberRegistrationType(m).toLowerCase().includes(token)
      )));
    }

    if (role !== "team" && memberTeamFilter) {
      list = list.filter(m => m.teamId === memberTeamFilter);
    }

    if (memberZoneFilter) {
      list = list.filter(m => m.zoneId === memberZoneFilter);
    }

    if (memberStatusFilter) {
      list = list.filter(m => m.status === memberStatusFilter);
    }

    if (memberRegistrationFilter) {
      list = list.filter(m => getMemberRegistrationType(m) === memberRegistrationFilter);
    }

    return [...list].sort((a, b) => {
      const teamOrderDiff = getTeamSortValue(a.teamId) - getTeamSortValue(b.teamId);
      if (teamOrderDiff !== 0) return teamOrderDiff;

      const zoneA = zones.find(z => z.zoneId === a.zoneId);
      const zoneB = zones.find(z => z.zoneId === b.zoneId);
      const zoneDiff = compareZones(zoneA, zoneB);
      if (zoneDiff !== 0) return zoneDiff;

      const leadershipDiff = Number(isLeadershipMember(b)) - Number(isLeadershipMember(a));
      if (leadershipDiff !== 0) return leadershipDiff;

      const teamLeaderDiff = Number(isTeamLeaderMember(b)) - Number(isTeamLeaderMember(a));
      if (teamLeaderDiff !== 0) return teamLeaderDiff;

      const teamDiff = getTeamName(a.teamId).localeCompare(getTeamName(b.teamId), "ko");
      if (teamDiff !== 0) return teamDiff;
      return String(a.name || "").localeCompare(String(b.name || ""), "ko");
    });
  };

  // Open Add Member Modal
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberForm({
      name: "",
      rank: "청년",
      teamId: role === "team" ? currentUser.teamId : (teams[0]?.teamId || ""),
      zoneId: getScopedZones()[0]?.zoneId || "",
      status: "normal",
      registrationType: "총등"
    });
    setShowMemberModal(true);
  };

  // Open Edit Member Modal
  const handleOpenEditMember = (m) => {
    setEditingMember(m);
    setMemberForm({
      name: m.name,
      rank: m.rank,
      teamId: m.teamId,
      zoneId: m.zoneId,
      status: m.status,
      registrationType: getMemberRegistrationType(m)
    });
    setShowMemberModal(true);
  };

  // Submit Member Form
  const handleMemberSubmit = (e) => {
    e.preventDefault();
    if (editingMember) {
      updateMember(editingMember.memberId, memberForm);
    } else {
      addMember(memberForm);
    }
    setShowMemberModal(false);
  };

  // Delete Member
  const handleMemberDelete = (memberId, name) => {
    if (window.confirm(`${name} 성도를 정말 삭제하시겠습니까?`)) {
      deleteMember(memberId);
    }
  };

  // Open Add Zone Modal
  const handleOpenAddZone = () => {
    setEditingZone(null);
    setZoneForm({
      name: "",
      teamId: role === "team" ? currentUser.teamId : (teams[0]?.teamId || ""),
      leaderId: ""
    });
    setShowZoneModal(true);
  };

  // Open Edit Zone Modal
  const handleOpenEditZone = (z) => {
    setEditingZone(z);
    setZoneForm({
      name: z.name,
      teamId: z.teamId,
      leaderId: z.leaderId
    });
    setShowZoneModal(true);
  };

  // Submit Zone Form
  const handleZoneSubmit = (e) => {
    e.preventDefault();
    if (editingZone) {
      updateZone(editingZone.zoneId, zoneForm);
    } else {
      addZone(zoneForm.name, zoneForm.teamId, zoneForm.leaderId);
    }
    setShowZoneModal(false);
  };

  // Open Add Team Modal (Admin Only)
  const handleOpenAddTeam = () => {
    setEditingTeam(null);
    setTeamForm({
      name: "",
      leaderId: "",
      status: "active"
    });
    setShowTeamModal(true);
  };

  // Open Edit Team Modal
  const handleOpenEditTeam = (t) => {
    setEditingTeam(t);
    setTeamForm({
      name: t.name,
      leaderId: t.leaderId,
      status: t.status
    });
    setShowTeamModal(true);
  };

  // Submit Team Form
  const handleTeamSubmit = (e) => {
    e.preventDefault();
    if (editingTeam) {
      updateTeam(editingTeam.teamId, teamForm);
    } else {
      addTeam(teamForm.name, teamForm.leaderId);
    }
    setShowTeamModal(false);
  };

  // Open Add User Modal
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({
      name: "",
      username: "",
      password: "",
      role: "leader"
    });
    setShowUserModal(true);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      username: u.username,
      password: u.password || "",
      role: u.role
    });
    setShowUserModal(true);
  };

  // Submit User Form
  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.userId, userForm);
    } else {
      addUser(userForm);
    }
    setShowUserModal(false);
  };

  // Delete User
  const handleUserDelete = (userId, name) => {
    if (window.confirm(`${name} 계정을 정말 삭제하시겠습니까?\n이 사용자로 연결된 모든 리더/팀장 매핑이 해제됩니다.`)) {
      deleteUser(userId);
    }
  };

  const getRoleLabel = (userRole) => {
    if (userRole === "admin") return "임원";
    if (userRole === "visit") return "심방팀장";
    if (userRole === "team") return "팀장";
    return "구역장";
  };

  // Download Users CSV
  const handleDownloadCSV = () => {
    const headers = ["이름", "로그인 아이디", "비밀번호", "권한"];
    const rows = users.map(u => [
      u.name,
      u.username,
      u.password || "********",
      getRoleLabel(u.role)
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `교구_계정_및_리더_목록_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTeamName = (tId) => teams.find(t => t.teamId === tId)?.name || "없음";
  const getZoneName = (zId) => zones.find(z => z.zoneId === zId)?.name || "구역 없음";
  const getMemberRegistrationType = (member) => {
    const savedValue = String(member?.registrationType || "").trim();
    if (REGISTRATION_TYPE_OPTIONS.includes(savedValue)) return savedValue;
    return DEFAULT_REGISTRATION_TYPES[member?.name] || "총등";
  };
  const filteredMembers = getFilteredMembers();
  const memberFilterZones = getSortedZones(getScopedZones().filter(z => {
    if (role === "team") return true;
    if (!memberTeamFilter) return true;
    return z.teamId === memberTeamFilter;
  }));

  return (
    <div className="org-wrapper animate-fade">
      {/* Sub tabs header */}
      <div className="sub-tabs-container glass-panel" style={{ display: "flex", alignItems: "center" }}>
        <button
          onClick={() => setActiveSubTab("members")}
          className={`sub-tab-btn ${activeSubTab === "members" ? "active" : ""}`}
        >
          <Users size={16} />
          <span>성도 관리</span>
        </button>
        <button
          onClick={() => setActiveSubTab("zones")}
          className={`sub-tab-btn ${activeSubTab === "zones" ? "active" : ""}`}
        >
          <Compass size={16} />
          <span>구역 관리</span>
        </button>
        {role === "admin" && (
          <button
            onClick={() => setActiveSubTab("teams")}
            className={`sub-tab-btn ${activeSubTab === "teams" ? "active" : ""}`}
          >
            <FolderPlus size={16} />
            <span>팀(교구) 관리</span>
          </button>
        )}
        {role === "admin" && (
          <button
            onClick={() => setActiveSubTab("users")}
            className={`sub-tab-btn ${activeSubTab === "users" ? "active" : ""}`}
          >
            <Shield size={16} />
            <span>계정 관리</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleRefresh}
          className="btn btn-secondary btn-sm"
          style={{
            marginLeft: "auto",
            marginRight: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: "rgba(6, 182, 212, 0.15)",
            color: "var(--accent-cyan)",
            border: "1px solid var(--accent-cyan)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer"
          }}
        >
          <RefreshCw size={12} className={isRefreshing ? "spin" : ""} />
          <span>실시간 동기화</span>
        </button>
      </div>

      {/* TABS INNER CONTENT */}
      {activeSubTab === "members" && (
        <div className="org-tab-panel glass-panel">
          <div className="panel-header-actions">
            <h3>소속 성도 목록 ({filteredMembers.length}명 / 전체 {getScopedMembers().length}명)</h3>
            <button onClick={handleOpenAddMember} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>성도 등록</span>
            </button>
          </div>

          <div className="member-filter-bar">
            <div className="member-search-box">
              <Search size={14} className="member-search-icon" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="성도 이름 검색..."
              />
            </div>

            {role !== "team" && (
              <select
                value={memberTeamFilter}
                onChange={(e) => {
                  setMemberTeamFilter(e.target.value);
                  setMemberZoneFilter("");
                }}
              >
                <option value="">전체 팀</option>
                {teams.map(t => (
                  <option key={t.teamId} value={t.teamId}>{t.name}</option>
                ))}
              </select>
            )}

            <select
              value={memberZoneFilter}
              onChange={(e) => setMemberZoneFilter(e.target.value)}
            >
              <option value="">전체 구역</option>
              {memberFilterZones.map(z => (
                <option key={z.zoneId} value={z.zoneId}>{z.name}</option>
              ))}
            </select>

            <select
              value={memberStatusFilter}
              onChange={(e) => setMemberStatusFilter(e.target.value)}
            >
              <option value="">전체 상태</option>
              <option value="normal">정상</option>
              <option value="new">새가족</option>
              <option value="excluded">출결제외자</option>
            </select>

            <select
              value={memberRegistrationFilter}
              onChange={(e) => setMemberRegistrationFilter(e.target.value)}
            >
              <option value="">등록구분 전체</option>
              {REGISTRATION_TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {(memberSearchQuery || memberTeamFilter || memberZoneFilter || memberStatusFilter || memberRegistrationFilter) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setMemberSearchQuery("");
                  setMemberTeamFilter("");
                  setMemberZoneFilter("");
                  setMemberStatusFilter("");
                  setMemberRegistrationFilter("");
                }}
              >
                초기화
              </button>
            )}
          </div>

          <div className="table-responsive">
            <table className="org-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>등록구분</th>
                  <th>직분</th>
                  <th>소속 팀</th>
                  <th>소속 구역</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(m => (
                  <tr key={m.memberId}>
                    <td style={{fontWeight: 600}}>{m.name}</td>
                    <td>
                      <span className="badge status-normal">{getMemberRegistrationType(m)}</span>
                    </td>
                    <td>{m.rank}</td>
                    <td>{getTeamName(m.teamId)}</td>
                    <td>{getZoneName(m.zoneId)}</td>
                    <td>
                      <span className={`badge status-${m.status}`}>
                        {m.status === "normal" && "정상"}
                        {m.status === "new" && "새가족"}
                        {m.status === "excluded" && "출결제외자"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => handleOpenEditMember(m)} className="row-action-btn edit" title="수정">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleMemberDelete(m.memberId, m.name)} className="row-action-btn delete" title="삭제">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-table-cell">검색/필터 조건에 맞는 성도가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "zones" && (
        <div className="org-tab-panel glass-panel">
          <div className="panel-header-actions">
            <h3>소속 구역 목록 ({getScopedZones().length}개)</h3>
            <button onClick={handleOpenAddZone} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>구역 생성</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="org-table">
              <thead>
                <tr>
                  <th>구역명</th>
                  <th>소속 팀</th>
                  <th>구역장</th>
                  <th>인원수 (활동 중)</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {getSortedZones().map(z => {
                  const zMembersCount = members.filter(m => m.zoneId === z.zoneId && ["normal", "new"].includes(m.status)).length;
                  const leaderUser = users.find(u => u.userId === z.leaderId);
                  const leaderName = leaderUser ? leaderUser.name : (z.leaderId || "리더 미정");
                  return (
                    <tr key={z.zoneId}>
                      <td style={{fontWeight: 600}}>{z.name}</td>
                      <td>{getTeamName(z.teamId)}</td>
                      <td>
                        <span className="leader-id-badge">{leaderName}</span>
                      </td>
                      <td>{zMembersCount}명</td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => handleOpenEditZone(z)} className="row-action-btn edit">
                            <Edit2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "teams" && role === "admin" && (
        <div className="org-tab-panel glass-panel">
          <div className="panel-header-actions">
            <h3>교구(팀) 목록 ({teams.length}개)</h3>
            <button onClick={handleOpenAddTeam} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>팀 생성</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="org-table">
              <thead>
                <tr>
                  <th>팀명</th>
                  <th>생성일</th>
                  <th>팀장</th>
                  <th>구역 수</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t => {
                  const teamZonesCount = zones.filter(z => z.teamId === t.teamId).length;
                  const leaderUser = users.find(u => u.userId === t.leaderId);
                  const leaderName = leaderUser ? leaderUser.name : (t.leaderId || "팀장 미정");
                  return (
                    <tr key={t.teamId}>
                      <td style={{fontWeight: 600}}>{t.name}</td>
                      <td>{t.createdAt}</td>
                      <td>
                        <span className="leader-id-badge">{leaderName}</span>
                      </td>
                      <td>{teamZonesCount}개</td>
                      <td>
                        <span className={`badge ${t.status === "active" ? "status-normal" : "status-inactive"}`}>
                          {t.status === "active" ? "운영 중" : "비활성"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => handleOpenEditTeam(t)} className="row-action-btn edit">
                            <Edit2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "users" && role === "admin" && (
        <div className="org-tab-panel glass-panel">
          <div className="panel-header-actions">
            <h3>계정 및 리더 목록 ({users.length}명)</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleDownloadCSV} className="btn btn-secondary btn-sm">
                <Download size={14} />
                <span>CSV 다운로드</span>
              </button>
              <button onClick={handleOpenAddUser} className="btn btn-primary btn-sm">
                <Plus size={14} />
                <span>계정 등록</span>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="org-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>로그인 아이디</th>
                  <th>비밀번호</th>
                  <th>권한</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.userId}>
                    <td style={{fontWeight: 600}}>{u.name}</td>
                    <td style={{fontFamily: "monospace"}}>{u.username}</td>
                    <td style={{fontFamily: "monospace"}}>{u.password || "********"}</td>
                    <td>
                      <span className={`badge badge-${u.role}`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => handleOpenEditUser(u)} className="row-action-btn edit" title="수정">
                          <Edit2 size={13} />
                        </button>
                        {u.userId !== currentUser.userId && (
                          <button onClick={() => handleUserDelete(u.userId, u.name)} className="row-action-btn delete" title="삭제">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- MODALS ----------------- */}
      
      {/* 1. Member Modal */}
      {showMemberModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel animate-slide">
            <div className="modal-header">
              <h3>{editingMember ? "성도 정보 수정" : "신규 성도 등록"}</h3>
              <button onClick={() => setShowMemberModal(false)} className="modal-close-btn">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleMemberSubmit} className="modal-form">
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>직분</label>
                <select
                  value={memberForm.rank}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, rank: e.target.value }))}
                >
                  <option value="청년">청년</option>
                  <option value="성도">성도</option>
                  <option value="집사">집사</option>
                  <option value="권사">권사</option>
                  <option value="장로">장로</option>
                </select>
              </div>

              <div className="form-group">
                <label>등록구분</label>
                <select
                  value={memberForm.registrationType}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, registrationType: e.target.value }))}
                >
                  {REGISTRATION_TYPE_OPTIONS.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Team selection (read-only for team leaders) */}
              <div className="form-group">
                <label>소속 팀</label>
                {role === "team" ? (
                  <input type="text" value={getTeamName(currentUser.teamId)} disabled />
                ) : (
                  <select
                    value={memberForm.teamId}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, teamId: e.target.value, zoneId: "" }))}
                  >
                    {teams.map(t => (
                      <option key={t.teamId} value={t.teamId}>{t.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label>소속 구역</label>
                <select
                  value={memberForm.zoneId}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, zoneId: e.target.value }))}
                  required
                >
                  <option value="">구역 선택 필수</option>
                  {getSortedZones(zones.filter(z => z.teamId === memberForm.teamId))
                    .map(z => (
                      <option key={z.zoneId} value={z.zoneId}>{z.name}</option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>성도 상태</label>
                <select
                  value={memberForm.status}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="normal">정상</option>
                  <option value="new">새가족</option>
                  <option value="excluded">출결제외자</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary submit-btn">
                <span>{editingMember ? "저장하기" : "등록하기"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Zone Modal */}
      {showZoneModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel animate-slide">
            <div className="modal-header">
              <h3>{editingZone ? "구역 정보 수정" : "신규 구역 생성"}</h3>
              <button onClick={() => setShowZoneModal(false)} className="modal-close-btn">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleZoneSubmit} className="modal-form">
              <div className="form-group">
                <label>구역명</label>
                <input
                  type="text"
                  placeholder="예: 해봄 8구역"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>소속 팀</label>
                {role === "team" ? (
                  <input type="text" value={getTeamName(currentUser.teamId)} disabled />
                ) : (
                  <select
                    value={zoneForm.teamId}
                    onChange={(e) => setZoneForm(prev => ({ ...prev, teamId: e.target.value }))}
                  >
                    {teams.map(t => (
                      <option key={t.teamId} value={t.teamId}>{t.name}</option>
                    ))}
                  </select>
                )}
              </div>

               <div className="form-group">
                <label>리더 매핑 (리더 지정)</label>
                <select
                  value={zoneForm.leaderId}
                  onChange={(e) => setZoneForm(prev => ({ ...prev, leaderId: e.target.value }))}
                >
                  <option value="">리더 없음 (공석)</option>
                  {users.map(u => (
                    <option key={u.userId} value={u.userId}>
                      {u.name} ({u.role === "admin" ? "관리자" : u.role === "team" ? "팀장" : "리더"})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary submit-btn">
                <span>{editingZone ? "저장하기" : "생성하기"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Team Modal */}
      {showTeamModal && role === "admin" && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel animate-slide">
            <div className="modal-header">
              <h3>{editingTeam ? "팀 정보 수정" : "신규 팀 생성"}</h3>
              <button onClick={() => setShowTeamModal(false)} className="modal-close-btn">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleTeamSubmit} className="modal-form">
              <div className="form-group">
                <label>팀명</label>
                <input
                  type="text"
                  placeholder="예: 해봄팀"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

               <div className="form-group">
                <label>팀장 매핑 (팀장 지정)</label>
                <select
                  value={teamForm.leaderId}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, leaderId: e.target.value }))}
                >
                  <option value="">팀장 없음 (공석)</option>
                  {users.map(u => (
                    <option key={u.userId} value={u.userId}>
                      {u.name} ({u.role === "admin" ? "관리자" : u.role === "team" ? "팀장" : "리더"})
                    </option>
                  ))}
                </select>
              </div>

              {editingTeam && (
                <div className="form-group">
                  <label>상태</label>
                  <select
                    value={teamForm.status}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">운영 중</option>
                    <option value="inactive">비활성</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-primary submit-btn">
                <span>{editingTeam ? "저장하기" : "생성하기"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. User Account Modal */}
      {showUserModal && role === "admin" && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel animate-slide">
            <div className="modal-header">
              <h3>{editingUser ? "계정 정보 수정" : "신규 계정 등록"}</h3>
              <button onClick={() => setShowUserModal(false)} className="modal-close-btn">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleUserSubmit} className="modal-form">
              <div className="form-group">
                <label>이름(성함)</label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>로그인 아이디 (ID)</label>
                <input
                  type="text"
                  placeholder="예: leader_gildong"
                  value={userForm.username}
                  onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div className="form-group">
                <label>비밀번호 (PW)</label>
                <input
                  type="text"
                  placeholder="비밀번호 설정"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>역할 권한</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="leader">구역장</option>
                  <option value="team">팀장</option>
                  <option value="visit">심방팀장</option>
                  <option value="admin">임원</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary submit-btn">
                <span>{editingUser ? "저장하기" : "등록하기"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .org-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sub-tabs-container {
          display: flex;
          padding: 8px;
          gap: 8px;
        }

        .sub-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .sub-tab-btn:hover {
          background-color: var(--glass-border);
        }

        .sub-tab-btn.active {
          background-color: var(--bg-tertiary);
          color: var(--accent-cyan);
          border: 1px solid var(--glass-border);
        }

        .org-tab-panel {
          padding: 24px;
        }

        .panel-header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .panel-header-actions h3 {
          font-size: 15px;
          color: var(--text-primary);
        }

        .member-filter-bar {
          display: grid;
          grid-template-columns: minmax(220px, 1.3fr) minmax(140px, 0.7fr) minmax(140px, 0.7fr) minmax(140px, 0.7fr) auto;
          gap: 10px;
          align-items: center;
          margin-bottom: 16px;
          padding: 12px;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          background-color: var(--bg-secondary);
        }

        .member-search-box {
          position: relative;
          min-width: 0;
        }

        .member-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .member-search-box input,
        .member-filter-bar select {
          width: 100%;
          height: 38px;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-size: 12px;
          outline: none;
        }

        .member-search-box input {
          padding: 0 12px 0 34px;
        }

        .member-filter-bar select {
          padding: 0 10px;
        }

        .member-search-box input:focus,
        .member-filter-bar select:focus {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.12);
        }

        .btn-sm {
          padding: 8px 12px;
          font-size: 12px;
        }

        .org-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        .org-table th,
        .org-table td {
          padding: 12px;
          border-bottom: 1px solid var(--glass-border);
        }

        .org-table th {
          color: var(--text-secondary);
          font-weight: 600;
          background-color: var(--bg-secondary);
        }

        .empty-table-cell {
          text-align: center;
          color: var(--text-muted);
          padding: 28px 12px !important;
        }

        .leader-id-badge {
          background-color: var(--bg-tertiary);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          border: 1px solid var(--glass-border);
          font-size: 11px;
        }

        .row-actions {
          display: flex;
          gap: 6px;
        }

        .row-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid var(--glass-border);
        }

        .row-action-btn.edit {
          color: var(--accent-cyan);
          background-color: hsla(185, 90%, 48%, 0.08);
        }

        .row-action-btn.edit:hover {
          background-color: var(--accent-cyan);
          color: black;
        }

        .row-action-btn.delete {
          color: var(--accent-red);
          background-color: hsla(355, 80%, 60%, 0.08);
        }

        .row-action-btn.delete:hover {
          background-color: var(--accent-red);
          color: white;
        }

        @media (max-width: 900px) {
          .member-filter-bar {
            grid-template-columns: 1fr 1fr;
          }

          .member-search-box {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 560px) {
          .panel-header-actions {
            align-items: stretch;
            flex-direction: column;
            gap: 10px;
          }

          .member-filter-bar {
            grid-template-columns: 1fr;
          }
        }

        /* Modals style */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          width: 100%;
          max-width: 460px;
          padding: 24px;
          background-color: var(--bg-secondary) !important;
          border-color: var(--accent-cyan) !important;
          border-radius: var(--radius-lg);
          box-shadow: 0 15px 40px 0 rgba(0,0,0,0.4);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 14px;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          font-size: 16px;
          color: var(--text-primary);
        }

        .modal-close-btn {
          color: var(--text-muted);
        }

        .modal-close-btn:hover {
          color: var(--text-primary);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          background-color: var(--bg-primary);
        }

        .submit-btn {
          margin-top: 10px;
          padding: 12px;
        }

        @keyframes rotate-refresh {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spin {
          animation: rotate-refresh 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
