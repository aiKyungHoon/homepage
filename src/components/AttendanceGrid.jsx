import React, { useState, useRef, useEffect } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Search, Filter, Lock, Edit3, Save, Trash2, X, MessageSquare, Download } from "lucide-react";

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
    memberNotes,
    updateAttendance,
    updateMonthlyAchievement,
    saveMemberNote,
    deleteMemberNote
  } = useData();

  const role = currentUser?.role;

  // Local Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeamId, setFilterTeamId] = useState("");
  const [filterZoneId, setFilterZoneId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Cell popover/quick-select state
  const [activeCell, setActiveCell] = useState(null); // { memberId, category, x, y }
  const [visitVisitor, setVisitVisitor] = useState("구역장");
  const [visitType, setVisitType] = useState("전화심방");
  const [worshipType, setWorshipType] = useState("정규성전");
  const [worshipTime, setWorshipTime] = useState("9:00");
  const [noteModalMemberId, setNoteModalMemberId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const popoverRef = useRef(null);

  const worshipTypes = [
    "정규성전",
    "모임방",
    "협력교회(덕양)",
    "협력교회(일산)",
    "협력교회(마포)",
    "협력교회(마포구청)",
    "협력교회(그외-특이사항에 기재)",
    "줌/화면O",
    "줌/화면X",
    "1:1대체예배(수주일)",
    "만남대체예배(수주일)",
    "마이심대체예배(특이사항에 요일기재)",
    "미보고",
    "미확인",
    "대체성전",
    "대체줌",
    "대체만남예배(수주일 외)",
    "대체1:1예배(수주일 외)",
    "일회성",
    "장기관리가능",
    "장기관리불가능",
    "야외예배",
    "출결제외자",
    "지파교육대체(지복사,지구사 등)",
    "사랑예배",
    "그 외 예배(특이사항에 기재)",
    "형제교회(서대문)",
    "형제교회(파주)",
    "형제교회(남산)",
    "형제교회(불광)",
    "형제교회(영등포)",
    "형제교회(화곡)",
    "형제교회(광명)",
    "형제교회(왕십리)",
    "형제교회(수원)",
    "형제교회(서울)",
    "형제교회(동대문)",
    "형제교회(의정부)",
    "형제교회(계양)",
    "형제교회(만수)",
    "형제교회(주안)",
    "형제교회(성남)",
    "형제교회(강동)",
    "형제교회(하남)",
    "형제교회(평택)",
    "형제교회(연수)",
    "형제교회(인천)",
    "형제교회(청주)",
    "형제교회(해외)",
    "형제교회(그외-특이사항에 기재)"
  ];

  const worshipTimes = [
    "9:00",
    "12:00",
    "15:00",
    "19:30",
    "20:00",
    "22:00",
    "7:00",
    "7:30",
    "8:00",
    "8:30",
    "9:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "20:30",
    "21:00",
    "21:30",
    "22:30",
    "23:00",
    "23:30",
    "24:00",
    "5:00",
    "5:30",
    "6:00",
    "6:30"
  ];

  // Map team and zone IDs to names
  const getTeamName = (tId) => teams.find(t => t.teamId === tId)?.name || "";
  const getZoneName = (zId) => zones.find(z => z.zoneId === zId)?.name || "";

  const getZoneSortValue = (zone) => {
    if (!zone) return Number.MAX_SAFE_INTEGER;
    const teamName = getTeamName(zone.teamId);
    const searchableName = `${teamName} ${zone.name || ""}`;
    const zoneNumberMatch = searchableName.match(/(\d+)\s*구역/);
    const zoneNumber = zoneNumberMatch ? Number(zoneNumberMatch[1]) : Number.MAX_SAFE_INTEGER;
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

  const getSortedZones = (zoneList = zones) => [...zoneList].sort(compareZones);

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
    const hasSearchQuery = searchQuery.trim().length > 0;

    // Status filter
    if (filterStatus) {
      list = list.filter(m => m.status === filterStatus);
    } else if (!hasSearchQuery) {
      // Default "전체" keeps the active attendance list, but search can find excluded members.
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

    return [...list].sort((a, b) => {
      const zoneA = zones.find(z => z.zoneId === a.zoneId);
      const zoneB = zones.find(z => z.zoneId === b.zoneId);
      const zoneDiff = compareZones(zoneA, zoneB);
      if (zoneDiff !== 0) return zoneDiff;

      const teamDiff = getTeamName(a.teamId).localeCompare(getTeamName(b.teamId), "ko");
      if (teamDiff !== 0) return teamDiff;

      return String(a.name || "").localeCompare(String(b.name || ""), "ko");
    });
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

  const getMemberNote = (memberId) => {
    return memberNotes.find(n => n.memberId === memberId);
  };

  const parseWorshipValue = (value) => {
    if (!value || value === "미보고") return { type: "미보고", time: "" };
    if (typeof value !== "string") return { type: String(value), time: "" };
    const [type, time = ""] = value.split("|").map(part => part.trim());
    return { type: type || "미보고", time };
  };

  const buildWorshipValue = (type, time) => {
    if (!type || type === "미보고") return "미보고";
    return time ? `${type} | ${time}` : type;
  };

  const formatWorshipValue = (value) => {
    const { type, time } = parseWorshipValue(value);
    return time ? `${type} ${time}` : type;
  };

  const renderWorshipCell = (value) => {
    const { type, time } = parseWorshipValue(value);
    if (!time) return type;
    return (
      <span className="worship-cell-value">
        <span className="worship-cell-type">{type}</span>
        <span className="worship-cell-time">{time}</span>
      </span>
    );
  };

  const escapeCsvCell = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const formatCheckboxValue = (value) => value ? "O" : "";

  const handleDownloadExcel = () => {
    const baseHeaders = ["이름", "직분"];
    if (role === "admin") baseHeaders.push("소속 팀");
    if (role !== "leader") baseHeaders.push("소속 구역");

    const headers = [
      ...baseHeaders,
      "삼일",
      "주일",
      "구역예배",
      "특이사항",
      "시험",
      "심야라디오",
      "시몬스쿨",
      "심방",
      "전도",
      "십일조",
      "청체비",
      "전도단"
    ];

    const rows = filteredMembers.map((member) => {
      const baseCells = [member.name, member.rank];
      if (role === "admin") baseCells.push(getTeamName(member.teamId));
      if (role !== "leader") baseCells.push(getZoneName(member.zoneId));

      const note = getMemberNote(member.memberId);
      return [
        ...baseCells,
        formatWorshipValue(getWeeklyValue(member.memberId, "samil")),
        formatWorshipValue(getWeeklyValue(member.memberId, "sunday")),
        getWeeklyValue(member.memberId, "zone"),
        note?.text || "",
        getWeeklyValue(member.memberId, "test"),
        getWeeklyValue(member.memberId, "radio"),
        getWeeklyValue(member.memberId, "simon"),
        getWeeklyValue(member.memberId, "visit"),
        formatCheckboxValue(getMonthlyAchievementValue(member.memberId, "evangelism")),
        formatCheckboxValue(getMonthlyAchievementValue(member.memberId, "tithing")),
        formatCheckboxValue(getMonthlyAchievementValue(member.memberId, "fee")),
        getWeeklyValue(member.memberId, "activity")
      ];
    });

    const csvContent = "\uFEFF" + [headers, ...rows]
      .map(row => row.map(escapeCsvCell).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeMonth = activeMonthId || "month";
    const safeWeek = activeWeekNo || "week";
    link.href = url;
    link.download = `출결관리_${safeMonth}_${safeWeek}주차.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Grid Cell Config
  const cellOptions = {
    weeklyWorship: ["정식예배", "온라인예배", "대체예배", "영상예배", "심방예배", "결석", "미보고"],
    weeklyEdu: ["O", "X"],
    weeklyVisit: ["O", "X"],
    weeklyActivity: ["대면", "비대면", "미보고"],
    test: ["정규시험", "비대면", "비공식(연락)", "비공식(줌예배 참석)", "비공식(텔 퀴즈 응시)", "미보고"]
  };

  const getCategoryOptions = (cat) => {
    if (cat === "zone") return ["대면", "줌", "개별", "불참", "미보고"];
    if (["sunday", "samil"].includes(cat)) return cellOptions.weeklyWorship;
    if (cat === "test") return cellOptions.test;
    if (["radio", "simon", "visit"].includes(cat)) return cellOptions.weeklyEdu;
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
      const isWorshipCell = ["samil", "sunday"].includes(category);
      const popoverWidth = category === "visit"
        ? 240
        : isWorshipCell
          ? Math.min(880, window.innerWidth - 16)
          : Math.min(260, Math.max(rect.width, 190));
      const optionCount = category === "visit" || isWorshipCell ? 0 : getCategoryOptions(category).length;
      const estimatedPopoverHeight = category === "visit" ? 230 : isWorshipCell ? Math.min(620, window.innerHeight - 16) : Math.min(320, (optionCount * 40) + 58);
      const viewportPadding = 8;
      const nextX = Math.min(
        Math.max(rect.left, viewportPadding),
        window.innerWidth - popoverWidth - viewportPadding
      );
      const opensUpward = rect.bottom + estimatedPopoverHeight + viewportPadding > window.innerHeight;
      const nextY = opensUpward
        ? Math.max(viewportPadding, rect.top - estimatedPopoverHeight)
        : Math.min(rect.bottom, window.innerHeight - estimatedPopoverHeight - viewportPadding);
      const curVal = getWeeklyValue(memberId, category) || "";
      if (category === "visit") {
        if (curVal && curVal.includes("-")) {
          const parts = curVal.split("-");
          setVisitVisitor(parts[0] || "구역장");
          setVisitType(parts[1] || "전화심방");
        } else {
          setVisitVisitor("구역장");
          setVisitType("전화심방");
        }
      }
      if (isWorshipCell) {
        const parsed = parseWorshipValue(curVal);
        setWorshipType(worshipTypes.includes(parsed.type) ? parsed.type : "정규성전");
        setWorshipTime(parsed.time || "9:00");
      }
      setActiveCell({
        memberId,
        category,
        x: nextX,
        y: nextY,
        width: popoverWidth
      });
    }
  };

  // Handle cell selection from popover
  const selectCellValue = (value) => {
    if (!activeCell) return;
    updateAttendance(activeCell.memberId, activeCell.category, value);
    setActiveCell(null);
  };

  const selectWorshipValue = () => {
    if (!activeCell) return;
    updateAttendance(activeCell.memberId, activeCell.category, buildWorshipValue(worshipType, worshipTime));
    setActiveCell(null);
  };

  const openNoteModal = (memberId) => {
    const note = getMemberNote(memberId);
    setNoteModalMemberId(memberId);
    setNoteDraft(note?.text || "");
  };

  const closeNoteModal = () => {
    setNoteModalMemberId(null);
    setNoteDraft("");
  };

  const handleSaveNote = async () => {
    if (!noteModalMemberId) return;
    await saveMemberNote(noteModalMemberId, noteDraft);
    closeNoteModal();
  };

  const handleDeleteNote = async () => {
    if (!noteModalMemberId) return;
    const note = getMemberNote(noteModalMemberId);
    if (!note) return;
    if (!window.confirm("특이사항을 삭제하시겠습니까?")) return;
    await deleteMemberNote(noteModalMemberId);
    closeNoteModal();
  };

  // Get status color coding class
  const getCellStyle = (val, category) => {
    const worshipTypeValue = ["samil", "sunday"].includes(category) ? parseWorshipValue(val).type : val;
    const greenByCategory = {
      samil: ["정규성전", "정식예배"],
      sunday: ["정규성전", "정식예배"],
      zone: ["대면"],
      test: ["정규시험"],
      radio: ["O"],
      simon: ["O"],
      activity: ["O"]
    };

    if (greenByCategory[category]?.includes(worshipTypeValue)) return "cell-present";
    if (worshipTypeValue === "결석" || worshipTypeValue === "X") return "cell-absent";

    if (["samil", "sunday"].includes(category)) {
      if (["줌/화면O", "줌/화면X", "대체줌", "비대면", "온라인예배"].includes(worshipTypeValue)) return "cell-online";
      if (worshipTypeValue.includes("대체") || ["모임방", "야외예배", "사랑예배", "일회성"].includes(worshipTypeValue)) return "cell-substitute";
      return "cell-unreported";
    }

    if (category === "zone") {
      if (val === "줌" || val === "개별전달") return "cell-online";
      if (val === "개별") return "cell-substitute";
      if (val === "불참" || val === "미전달") return "cell-absent";
      if (val === "들어옴") return "cell-present";
      return "cell-unreported";
    }

    if (category === "test") {
      if (val === "비대면") return "cell-online";
      if (typeof val === "string" && val.startsWith("비공식(")) return "cell-substitute";
      return "cell-unreported";
    }

    if (["radio", "simon", "activity"].includes(category)) {
      if (!val || val === "미보고") return "cell-unreported";
      return "cell-substitute";
    }

    if (val === "대면" || val === "정규시험" || val === "O" || val === true || val === "들어옴") return "cell-present";
    if (val === "비대면" || val === "줌" || val === "온라인" || val === "개별전달") return "cell-online";
    if (typeof val === "string" && val.startsWith("비공식(")) return "cell-substitute";
    if (val === "대체" || val === "개별") return "cell-substitute";
    if (val === "결석" || val === "불참" || val === "X" || val === false || val === "미전달") return "cell-absent";
    if (typeof val === "string" && val.includes("-")) {
      if (val.includes("대면")) return "cell-present";
      if (val.includes("전화") || val.includes("SNS")) return "cell-online";
      if (val.includes("상담")) return "cell-substitute";
      return "cell-present";
    }
    return "cell-unreported";
  };

  // Format visitation values for display in the grid cell
  const formatVisitCell = (val) => {
    if (!val || val === "미보고") return "미보고";
    if (val === "X") return "X";
    if (val === "O") return "O";
    if (typeof val === "string" && val.includes("-")) {
      const [visitor, type] = val.split("-");
      const shortVisitor = visitor.slice(0, 1); // "구역장" -> "구"
      const shortType = type.replace("심방", "").replace("소통", ""); // "전화심방" -> "전화"
      return `${shortVisitor}-${shortType}`;
    }
    return val;
  };

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
              {getSortedZones(
                zones
                .filter(z => !filterTeamId || z.teamId === filterTeamId)
              )
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

          <button
            type="button"
            className="btn btn-secondary btn-sm attendance-download-btn"
            onClick={handleDownloadExcel}
            disabled={filteredMembers.length === 0}
          >
            <Download size={14} />
            <span>엑셀 다운로드</span>
          </button>
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
                <th className="sep-col note-header">특이사항</th>
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
                const memberNote = getMemberNote(member.memberId);

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
                      className={`cell-click sep-col ${getCellStyle(samil, "samil")}`}
                      title={formatWorshipValue(samil)}
                    >
                      {renderWorshipCell(samil)}
                    </td>
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "sunday", false)}
                      className={`cell-click ${getCellStyle(sunday, "sunday")}`}
                      title={formatWorshipValue(sunday)}
                    >
                      {renderWorshipCell(sunday)}
                    </td>
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "zone", false)}
                      className={`cell-click ${getCellStyle(zone, "zone")}`}
                    >
                      {zone}
                    </td>

                    <td className="sep-col note-cell">
                      <button
                        type="button"
                        className={`note-trigger ${memberNote ? "has-note" : ""}`}
                        onClick={() => openNoteModal(member.memberId)}
                        title={memberNote ? memberNote.text : "특이사항 입력"}
                      >
                        {memberNote ? (
                          <>
                            <MessageSquare size={13} />
                            <span>있음</span>
                          </>
                        ) : (
                          <>
                            <Edit3 size={13} />
                            <span>입력</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Weekly edu */}
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "test", false)}
                      className={`cell-click sep-col ${getCellStyle(test, "test")}`}
                    >
                      {test}
                    </td>
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "radio", false)}
                      className={`cell-click ${getCellStyle(radio, "radio")}`}
                    >
                      {radio}
                    </td>
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "simon", false)}
                      className={`cell-click ${getCellStyle(simon, "simon")}`}
                    >
                      {simon}
                    </td>

                    {/* Weekly visit */}
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "visit", false)}
                      className={`cell-click sep-col ${getCellStyle(visit, "visit")}`}
                      title={visit && visit !== "X" ? visit.replace("-", " : ") : "심방 없음"}
                    >
                      {formatVisitCell(visit)}
                    </td>

                    {/* Monthly Achievements (Toggles) */}
                    <td 
                      onClick={(e) => handleCellClick(e, member.memberId, "evangelism", true)}
                      className={`cell-click sep-col monthly-cell ${getCellStyle(evangelism, "evangelism")}`}
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
                      className={`cell-click monthly-cell ${getCellStyle(tithing, "tithing")}`}
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
                      className={`cell-click monthly-cell ${getCellStyle(fee, "fee")}`}
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
                      className={`cell-click sep-col ${getCellStyle(activity, "activity")}`}
                    >
                      {activity}
                    </td>
                  </tr>
                );
              })}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={role === "admin" ? 16 : role === "team" ? 15 : 14} className="no-members">
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

      {noteModalMemberId && (
        <div className="note-modal-backdrop" onMouseDown={closeNoteModal}>
          <div className="note-modal glass-panel" onMouseDown={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              <div>
                <p className="note-modal-eyebrow">개인별 특이사항</p>
                <h3>{members.find(m => m.memberId === noteModalMemberId)?.name || "성도"}</h3>
              </div>
              <button type="button" className="icon-button" onClick={closeNoteModal} aria-label="닫기">
                <X size={18} />
              </button>
            </div>

            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="특이사항을 입력해 주세요."
              disabled={!canEdit}
              className="note-textarea"
              rows={7}
            />

            <div className="note-modal-actions">
              <button
                type="button"
                className="note-action secondary"
                onClick={handleDeleteNote}
                disabled={!canEdit || !getMemberNote(noteModalMemberId)}
              >
                <Trash2 size={14} />
                삭제
              </button>
              <button type="button" className="note-action ghost" onClick={closeNoteModal}>
                취소
              </button>
              <button
                type="button"
                className="note-action primary"
                onClick={handleSaveNote}
                disabled={!canEdit || !noteDraft.trim()}
              >
                <Save size={14} />
                {getMemberNote(noteModalMemberId) ? "수정 저장" : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popover Selection Box */}
      {activeCell && (
        <div
          ref={popoverRef}
          className="cell-popover glass-panel animate-slide"
          style={{
            position: "fixed",
            top: `${activeCell.y}px`,
            left: `${activeCell.x}px`,
            width: `${activeCell.width}px`,
            maxWidth: ["samil", "sunday"].includes(activeCell.category) ? "calc(100vw - 16px)" : undefined,
            padding: activeCell.category === "visit" || ["samil", "sunday"].includes(activeCell.category) ? "12px" : "0",
            zIndex: 9999
          }}
        >
          {activeCell.category === "visit" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent-cyan)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "4px" }}>
                심방 주체 (누가)
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {["구역장", "팀장", "임원"].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisitVisitor(v)}
                    style={{
                      flex: 1,
                      padding: "5px 0",
                      fontSize: "11px",
                      borderRadius: "4px",
                      border: "1px solid " + (visitVisitor === v ? "var(--accent-cyan)" : "var(--glass-border)"),
                      backgroundColor: visitVisitor === v ? "rgba(6, 182, 212, 0.15)" : "transparent",
                      color: visitVisitor === v ? "var(--accent-cyan)" : "var(--text-secondary)",
                      cursor: "pointer",
                      fontWeight: visitVisitor === v ? "700" : "500"
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent-cyan)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "4px", marginTop: "4px" }}>
                심방 형태 (어떤 것)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                {["전화심방", "대면심방"].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setVisitType(t)}
                    style={{
                      padding: "5px 0",
                      fontSize: "11px",
                      borderRadius: "4px",
                      border: "1px solid " + (visitType === t ? "var(--accent-cyan)" : "var(--glass-border)"),
                      backgroundColor: visitType === t ? "rgba(6, 182, 212, 0.15)" : "transparent",
                      color: visitType === t ? "var(--accent-cyan)" : "var(--text-secondary)",
                      cursor: "pointer",
                      fontWeight: visitType === t ? "700" : "500"
                    }}
                  >
                    {t.replace("심방", "").replace("소통", "")}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "6px", marginTop: "8px", borderTop: "1px solid var(--glass-border)", paddingTop: "8px" }}>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => selectCellValue(`${visitVisitor}-${visitType}`)}
                  style={{
                    flex: 2,
                    padding: "6px 0",
                    fontSize: "11px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "var(--accent-emerald)",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  등록
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => selectCellValue("미보고")}
                  style={{
                    flex: 1.2,
                    padding: "6px 0",
                    fontSize: "11px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "var(--accent-red)",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  지우기
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCell(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    fontSize: "11px",
                    borderRadius: "4px",
                    border: "1px solid var(--glass-border)",
                    backgroundColor: "transparent",
                    color: "var(--text-secondary)",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          ) : ["samil", "sunday"].includes(activeCell.category) ? (
            <div className="worship-popover">
              <div className="worship-popover-grid">
                <div className="worship-popover-section">
                  <div className="worship-popover-title">예배분류</div>
                  <div className="worship-option-list">
                    {worshipTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => setWorshipType(type)}
                        className={`worship-option ${worshipType === type ? "active" : ""}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="worship-popover-section">
                  <div className="worship-popover-title">시간</div>
                  <div className="worship-time-grid">
                    {worshipTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => setWorshipTime(time)}
                        className={`worship-time ${worshipTime === time ? "active" : ""}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="worship-selection-summary">
                <span>{worshipType}</span>
                {worshipType !== "미보고" && <strong>{worshipTime}</strong>}
              </div>

              <div className="popover-actions worship-actions">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={selectWorshipValue}
                  className="worship-save-btn"
                >
                  등록
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => selectCellValue("미보고")}
                  className="worship-clear-btn"
                >
                  지우기
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCell(null);
                  }}
                  className="worship-close-btn"
                >
                  닫기
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="popover-options-scroll">
                {getCategoryOptions(activeCell.category).map((opt) => (
                  <button
                    key={opt}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => selectCellValue(opt)}
                    className="popover-option"
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="popover-actions">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => selectCellValue("미보고")}
                  style={{
                    flex: 1.2,
                    padding: "6px 0",
                    fontSize: "11px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "var(--accent-red)",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  지우기
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCell(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    fontSize: "11px",
                    borderRadius: "4px",
                    border: "1px solid var(--glass-border)",
                    backgroundColor: "transparent",
                    color: "var(--text-secondary)",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  닫기
                </button>
              </div>
            </>
          )}
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
          align-items: center;
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

        .attendance-download-btn {
          min-height: 34px;
          padding: 6px 12px;
          font-size: 13px;
          flex-shrink: 0;
        }

        .attendance-download-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
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

        .worship-cell-value {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          min-width: 96px;
          white-space: normal;
          line-height: 1.25;
        }

        .worship-cell-type {
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .worship-cell-time {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 700;
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

        .note-header {
          color: var(--accent-emerald) !important;
        }

        .monthly-cell {
          background-color: hsla(185, 90%, 48%, 0.02);
        }

        .note-cell {
          background-color: hsla(150, 70%, 50%, 0.03);
          min-width: 92px;
        }

        .note-trigger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-width: 58px;
          height: 28px;
          padding: 0 8px;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          background-color: var(--bg-tertiary);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .note-trigger.has-note {
          border-color: hsla(150, 70%, 50%, 0.45);
          color: var(--accent-emerald);
          background-color: hsla(150, 70%, 50%, 0.12);
        }

        .note-trigger:hover {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
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
          background-color: hsla(150, 70%, 38%, 0.32) !important;
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
          background-color: hsla(355, 82%, 55%, 0.32) !important;
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

        .note-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background-color: rgba(0, 0, 0, 0.55);
        }

        .note-modal {
          width: min(460px, 100%);
          padding: 18px;
          background-color: var(--bg-secondary) !important;
          border-radius: var(--radius-md);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
        }

        .note-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .note-modal-eyebrow {
          margin: 0 0 4px;
          color: var(--accent-cyan);
          font-size: 11px;
          font-weight: 700;
        }

        .note-modal-header h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 18px;
        }

        .icon-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          background-color: transparent;
          cursor: pointer;
        }

        .icon-button:hover {
          color: var(--text-primary);
          border-color: var(--accent-cyan);
        }

        .note-textarea {
          width: 100%;
          resize: vertical;
          min-height: 140px;
          padding: 12px;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.5;
        }

        .note-textarea:disabled {
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .note-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 14px;
        }

        .note-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          min-height: 34px;
          padding: 0 12px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .note-action.primary {
          border: 1px solid var(--accent-emerald);
          color: white;
          background-color: var(--accent-emerald);
        }

        .note-action.secondary {
          margin-right: auto;
          border: 1px solid hsla(355, 80%, 60%, 0.35);
          color: var(--accent-red);
          background-color: hsla(355, 80%, 60%, 0.08);
        }

        .note-action.ghost {
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          background-color: transparent;
        }

        .note-action:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* Popover dropdown */
        .cell-popover {
          padding: 4px;
          display: flex;
          flex-direction: column;
          min-width: 190px;
          max-width: min(260px, calc(100vw - 24px));
          max-height: calc(100vh - 16px);
          overflow: hidden;
          background-color: var(--bg-tertiary) !important;
          border-color: var(--accent-cyan) !important;
          box-shadow: 0 10px 25px 0 rgba(0,0,0,0.3);
          border-radius: var(--radius-md);
        }

        .popover-options-scroll {
          overflow-y: auto;
          max-height: min(240px, calc(100vh - 78px));
          padding: 4px;
          overscroll-behavior: contain;
        }

        .popover-option {
          padding: 8px 12px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          width: 100%;
          white-space: normal;
          word-break: keep-all;
        }

        .popover-actions {
          display: flex;
          gap: 4px;
          border-top: 1px solid var(--glass-border);
          padding: 8px 4px 4px;
          margin-top: 0;
          flex-shrink: 0;
          background-color: var(--bg-tertiary);
        }

        .worship-popover {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: calc(100vh - 24px);
        }

        .worship-popover-grid {
          display: grid;
          grid-template-columns: minmax(340px, 1.15fr) minmax(240px, 0.85fr);
          gap: 10px;
          min-height: 0;
        }

        .worship-popover-section {
          min-height: 0;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          overflow: hidden;
          background-color: var(--bg-primary);
        }

        .worship-popover-title {
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 800;
          color: var(--accent-cyan);
          border-bottom: 1px solid var(--glass-border);
          background-color: var(--bg-tertiary);
        }

        .worship-option-list,
        .worship-time-grid {
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 6px;
          max-height: min(440px, calc(100vh - 180px));
        }

        .worship-option-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 5px;
        }

        .worship-time-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 4px;
          align-content: start;
        }

        .worship-option,
        .worship-time {
          min-height: 36px;
          padding: 7px 9px;
          border: 1px solid transparent;
          border-radius: 5px;
          background-color: transparent;
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 650;
          text-align: left;
          line-height: 1.25;
          cursor: pointer;
        }

        .worship-option {
          display: flex;
          align-items: center;
          word-break: keep-all;
          overflow-wrap: anywhere;
        }

        .worship-time {
          text-align: center;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .worship-option:hover,
        .worship-time:hover,
        .worship-option.active,
        .worship-time.active {
          border-color: var(--accent-cyan);
          background-color: rgba(6, 182, 212, 0.14);
          color: var(--accent-cyan);
        }

        .worship-selection-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 10px;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
          background-color: var(--bg-primary);
        }

        .worship-selection-summary span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .worship-selection-summary strong {
          color: var(--accent-emerald);
          flex-shrink: 0;
        }

        .worship-actions {
          padding: 0;
          border-top: 0;
          background-color: transparent;
        }

        .worship-save-btn,
        .worship-clear-btn,
        .worship-close-btn {
          min-height: 34px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .worship-save-btn {
          flex: 1.3;
          border: 0;
          color: white;
          background-color: var(--accent-emerald);
        }

        .worship-clear-btn {
          flex: 1;
          border: 0;
          color: white;
          background-color: var(--accent-red);
        }

        .worship-close-btn {
          flex: 0.8;
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          background-color: transparent;
        }

        @media (max-width: 620px) {
          .worship-popover-grid {
            grid-template-columns: 1fr;
          }

          .worship-option-list,
          .worship-time-grid {
            max-height: 180px;
          }

          .worship-option-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .worship-time-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 420px) {
          .worship-option-list {
            grid-template-columns: 1fr;
          }

          .worship-time-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        .popover-option:hover {
          background-color: var(--accent-cyan);
          color: black;
        }

        .popover-option.cancel-option {
          border-top: 1px solid var(--glass-border) !important;
          color: var(--accent-red) !important;
          border-radius: 0 0 var(--radius-sm) var(--radius-sm);
        }

        .popover-option.cancel-option:hover {
          background-color: var(--accent-red) !important;
          color: white !important;
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
