import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit2, Trash2, X, Users, Compass, FolderPlus, Shield } from "lucide-react";

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
    deleteUser
  } = useData();

  const role = currentUser?.role;

  // Tabs: members, zones, teams
  const [activeSubTab, setActiveSubTab] = useState("members");

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
    status: "normal"
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

  // Open Add Member Modal
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberForm({
      name: "",
      rank: "청년",
      teamId: role === "team" ? currentUser.teamId : (teams[0]?.teamId || ""),
      zoneId: getScopedZones()[0]?.zoneId || "",
      status: "normal"
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
      status: m.status
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

  const getTeamName = (tId) => teams.find(t => t.teamId === tId)?.name || "없음";
  const getZoneName = (zId) => zones.find(z => z.zoneId === zId)?.name || "구역 없음";

  return (
    <div className="org-wrapper animate-fade">
      {/* Sub tabs header */}
      <div className="sub-tabs-container glass-panel">
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
      </div>

      {/* TABS INNER CONTENT */}
      {activeSubTab === "members" && (
        <div className="org-tab-panel glass-panel">
          <div className="panel-header-actions">
            <h3>소속 성도 목록 ({getScopedMembers().length}명)</h3>
            <button onClick={handleOpenAddMember} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>성도 등록</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="org-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>직분</th>
                  <th>소속 팀</th>
                  <th>소속 구역</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {getScopedMembers().map(m => (
                  <tr key={m.memberId}>
                    <td style={{fontWeight: 600}}>{m.name}</td>
                    <td>{m.rank}</td>
                    <td>{getTeamName(m.teamId)}</td>
                    <td>{getZoneName(m.zoneId)}</td>
                    <td>
                      <span className={`badge status-${m.status}`}>
                        {m.status === "normal" && "정상"}
                        {m.status === "new" && "새가족"}
                        {m.status === "absent" && "장기결석"}
                        {m.status === "moved" && "이동"}
                        {m.status === "inactive" && "휴면"}
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
                {getScopedZones().map(z => {
                  const zMembersCount = members.filter(m => m.zoneId === z.zoneId && ["normal", "new", "absent"].includes(m.status)).length;
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
            <button onClick={handleOpenAddUser} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>계정 등록</span>
            </button>
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
                        {u.role === "admin" && "임원"}
                        {u.role === "team" && "팀장"}
                        {u.role === "leader" && "구역장"}
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
                  {zones
                    .filter(z => z.teamId === memberForm.teamId)
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
                  <option value="absent">장기결석</option>
                  <option value="moved">이동</option>
                  <option value="inactive">휴면</option>
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
      `}</style>
    </div>
  );
}
