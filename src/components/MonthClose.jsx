import React, { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Lock, Unlock, Calendar, CheckCircle2, AlertCircle, FileText, X } from "lucide-react";
import { db, isMockEnabled } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const WORSHIP_PRESENT_VALUES = ["대면", "비대면", "줌", "개별", "대체", "O", "들어옴", "개별전달"];
const WORSHIP_NOT_PRESENT_VALUES = ["미보고", "미확인", "결석", "X", "불참", "미전달", "출결제외자"];

const getWorshipTypeValue = (value) => String(value || "미보고").split("|")[0].trim();

const isWorshipPresentValue = (value) => {
  const type = getWorshipTypeValue(value);
  if (WORSHIP_PRESENT_VALUES.includes(type)) return true;
  if (WORSHIP_NOT_PRESENT_VALUES.includes(type)) return false;
  return Boolean(type);
};

export default function MonthClose() {
  const { currentUser, isMockMode } = useAuth();
  const {
    months,
    closeMonth,
    seedFirebaseDatabase,
    teams,
    zones,
    members,
    appSettings,
    updateAttendanceDownloadNames
  } = useData();

  const [reportMonthId, setReportMonthId] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [downloadTargetDrafts, setDownloadTargetDrafts] = useState([]);
  const [downloadNameInput, setDownloadNameInput] = useState("");
  const [downloadNameSaving, setDownloadNameSaving] = useState(false);
  const canManageDownloadSettings = currentUser?.role === "admin";

  useEffect(() => {
    const savedTargets = Array.isArray(appSettings?.attendanceDownloadTargets)
      ? appSettings.attendanceDownloadTargets
      : [];
    const legacyNames = Array.isArray(appSettings?.attendanceDownloadNames)
      ? appSettings.attendanceDownloadNames.map(name => ({ memberId: "", name }))
      : [];
    const rawTargets = savedTargets.length > 0 ? savedTargets : legacyNames;
    const resolvedTargets = rawTargets.map(target => {
      const matchedMember = members.find(member => (
        (target.name && member.name === target.name) ||
        (!target.name && target.memberId && member.memberId === target.memberId)
      ));
      return {
        memberId: matchedMember?.memberId || target.memberId || "",
        name: matchedMember?.name || target.name || "",
        teamId: matchedMember?.teamId || "",
        zoneId: matchedMember?.zoneId || ""
      };
    });
    setDownloadTargetDrafts(resolvedTargets);
  }, [appSettings?.attendanceDownloadNames, appSettings?.attendanceDownloadTargets, members]);

  const handleCloseMonth = (monthId) => {
    const formattedMonth = `${monthId.split("-")[0]}년 ${parseInt(monthId.split("-")[1])}월`;
    if (window.confirm(`${formattedMonth} 출결 입력을 마감하시겠습니까?\n마감 후에는 리더 및 팀장의 수정이 잠금 처리되며, 다음 달 데이터베이스가 자동으로 개설됩니다.`)) {
      closeMonth(monthId);
    }
  };

  const getTeamName = (teamId) => teams.find(team => team.teamId === teamId)?.name || "";
  const getZoneName = (zoneId) => zones.find(zone => zone.zoneId === zoneId)?.name || "";

  const toDownloadTarget = (member) => ({
    memberId: member.memberId,
    name: member.name,
    teamId: member.teamId,
    zoneId: member.zoneId
  });

  const getMatchingDownloadMembers = (queryText = downloadNameInput) => {
    const query = queryText.trim().toLowerCase();
    if (!query) return [];
    const selectedNames = new Set(downloadTargetDrafts.map(target => target.name).filter(Boolean));
    return members
      .filter(member => !selectedNames.has(member.name))
      .filter(member => [
        member.name,
        member.memberId,
        getTeamName(member.teamId),
        getZoneName(member.zoneId)
      ].some(value => String(value || "").toLowerCase().includes(query)))
      .slice(0, 8);
  };

  const addDownloadTarget = (member) => {
    setDownloadTargetDrafts(prev => {
      if (prev.some(target => target.name === member.name)) return prev;
      return [...prev, toDownloadTarget(member)];
    });
    setDownloadNameInput("");
  };

  const handleAddDownloadNames = () => {
    const tokens = downloadNameInput
      .split(/[\n,]+/)
      .map(name => name.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;
    const matchedMembers = tokens
      .map(token => members.find(member => member.name === token || member.memberId === token))
      .filter(Boolean);
    setDownloadTargetDrafts(prev => {
      const existingNames = new Set(prev.map(target => target.name).filter(Boolean));
      const nextTargets = [...prev];
      matchedMembers.forEach(member => {
        if (!existingNames.has(member.name)) {
          nextTargets.push(toDownloadTarget(member));
          existingNames.add(member.name);
        }
      });
      tokens.forEach(token => {
        const matchedMember = members.find(member => member.name === token || member.memberId === token);
        const name = matchedMember?.name || token;
        if (!existingNames.has(name)) {
          nextTargets.push(matchedMember ? toDownloadTarget(matchedMember) : { memberId: "", name, teamId: "", zoneId: "" });
          existingNames.add(name);
        }
      });
      return nextTargets;
    });
    setDownloadNameInput("");
  };

  const handleUpdateDownloadName = (index, value) => {
    const matchedMember = members.find(member => member.name === value.trim() || member.memberId === value.trim());
    setDownloadTargetDrafts(prev => prev.map((target, i) => (
      i === index
        ? matchedMember
          ? toDownloadTarget(matchedMember)
          : { ...target, memberId: "", name: value }
        : target
    )));
  };

  const handleRemoveDownloadName = async (index) => {
    if (!canManageDownloadSettings) {
      alert("엑셀 다운로드 이름 설정은 관리자만 수정할 수 있습니다.");
      return;
    }
    const nextTargets = downloadTargetDrafts.filter((_, i) => i !== index);
    setDownloadTargetDrafts(nextTargets);
    setDownloadNameSaving(true);
    try {
      await updateAttendanceDownloadNames(nextTargets.map(target => ({
        memberId: "",
        name: target.name
      })));
    } catch (error) {
      console.error("엑셀 다운로드 이름 삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDownloadNameSaving(false);
    }
  };

  const handleSaveDownloadNames = async () => {
    if (!canManageDownloadSettings) {
      alert("엑셀 다운로드 이름 설정은 관리자만 수정할 수 있습니다.");
      return;
    }
    setDownloadNameSaving(true);
    try {
      await updateAttendanceDownloadNames(downloadTargetDrafts.map(target => ({
        memberId: "",
        name: target.name
      })));
      alert("엑셀 다운로드 이름 설정을 저장했습니다.");
    } catch (error) {
      console.error("엑셀 다운로드 이름 설정 저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setDownloadNameSaving(false);
    }
  };

  const getZoneRankings = (zList, mList, attRecs, totalWeeks) => {
    const list = zList.map(z => {
      const zMembers = mList.filter(m => m.zoneId === z.zoneId && ["normal", "new"].includes(m.status));
      if (zMembers.length === 0) return { ...z, rate: 0, count: 0 };
      
      let totalPossible = zMembers.length * 3 * totalWeeks;
      let totalPresent = 0;
      const memberIds = zMembers.map(m => m.memberId);
      
      attRecs.forEach(r => {
        if (memberIds.includes(r.memberId) && ["samil", "sunday", "zone"].includes(r.category) && isWorshipPresentValue(r.value)) {
          totalPresent++;
        }
      });
      
      const rate = Math.round((totalPresent / totalPossible) * 100);
      const team = teams.find(t => t.teamId === z.teamId);
      return {
        zoneId: z.zoneId,
        name: z.name,
        teamName: team ? team.name : "",
        rate,
        count: zMembers.length
      };
    });
    return list.filter(z => z.count > 0).sort((a, b) => b.rate - a.rate);
  };

  const getTeamRankings = (tList, mList, attRecs, totalWeeks) => {
    const list = tList.map(t => {
      const tMembers = mList.filter(m => m.teamId === t.teamId && ["normal", "new"].includes(m.status));
      if (tMembers.length === 0) return { ...t, rate: 0, count: 0 };
      
      let totalPossible = tMembers.length * 3 * totalWeeks;
      let totalPresent = 0;
      const memberIds = tMembers.map(m => m.memberId);
      
      attRecs.forEach(r => {
        if (memberIds.includes(r.memberId) && ["samil", "sunday", "zone"].includes(r.category) && isWorshipPresentValue(r.value)) {
          totalPresent++;
        }
      });
      
      const rate = Math.round((totalPresent / totalPossible) * 100);
      return {
        teamId: t.teamId,
        name: t.name,
        rate,
        count: tMembers.length
      };
    });
    return list.filter(t => t.count > 0).sort((a, b) => b.rate - a.rate);
  };

  const loadMonthlyReport = async (monthId) => {
    setReportMonthId(monthId);
    setReportLoading(true);
    try {
      let targetAtt = [];
      let targetAch = [];

      if (isMockEnabled) {
        const allAtt = JSON.parse(localStorage.getItem("mock_attendance")) || [];
        targetAtt = allAtt.filter(r => r.monthId === monthId);

        const allAch = JSON.parse(localStorage.getItem("mock_achievements")) || [];
        targetAch = allAch.filter(a => a.monthId === monthId);
      } else {
        const attQuery = query(collection(db, "attendanceRecords"), where("monthId", "==", monthId));
        const attSnap = await getDocs(attQuery);
        targetAtt = attSnap.docs.map(d => ({ recordId: d.id, ...d.data() }));

        const achQuery = query(collection(db, "monthlyAchievements"), where("monthId", "==", monthId));
        const achSnap = await getDocs(achQuery);
        targetAch = achSnap.docs.map(d => ({ achievementId: d.id, ...d.data() }));
      }

      const activeMembers = members.filter(m => ["normal", "new"].includes(m.status));
      const totalCount = activeMembers.length;
      
      const weeks = [...new Set(targetAtt.map(r => r.weekNo))];
      const totalWeeks = weeks.length > 0 ? Math.max(4, ...weeks) : 4;

      let totalPossible = activeMembers.length * 3 * totalWeeks;
      let totalPresent = 0;
      targetAtt.forEach(r => {
        if (["samil", "sunday", "zone"].includes(r.category) && isWorshipPresentValue(r.value)) {
          totalPresent++;
        }
      });
      const avgAttendanceRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

      const evangelismCount = targetAch.filter(a => a.category === "evangelism" && a.achieved).length;
      const tithingCount = targetAch.filter(a => a.category === "tithing" && a.achieved).length;
      const feeCount = targetAch.filter(a => a.category === "fee" && a.achieved).length;

      const zoneRankings = getZoneRankings(zones, members, targetAtt, totalWeeks);
      const teamRankings = getTeamRankings(teams, members, targetAtt, totalWeeks);

      const perfectAttendees = activeMembers.filter(m => {
        for (let w = 1; w <= totalWeeks; w++) {
          const rec = targetAtt.find(
            r => r.memberId === m.memberId && r.weekNo === w && r.category === "sunday"
          );
          const val = rec ? rec.value : "미보고";
          if (!isWorshipPresentValue(val)) {
            return false;
          }
        }
        return true;
      });

      const longTermAbsentees = activeMembers.filter(m => {
        let attendCount = 0;
        for (let w = 1; w <= totalWeeks; w++) {
          const rec = targetAtt.find(
            r => r.memberId === m.memberId && r.weekNo === w && r.category === "sunday"
          );
          const val = rec ? rec.value : "미보고";
          if (isWorshipPresentValue(val)) {
            attendCount++;
          }
        }
        return attendCount === 0;
      });

      const newFamilies = members.filter(m => m.status === "new");

      const weeklyTrend = [];
      for (let w = 1; w <= totalWeeks; w++) {
        let weekPossible = activeMembers.length * 3;
        let weekPresent = 0;
        targetAtt.forEach(r => {
          if (r.weekNo === w && ["samil", "sunday", "zone"].includes(r.category) && isWorshipPresentValue(r.value)) {
            weekPresent++;
          }
        });
        const rate = weekPossible > 0 ? Math.round((weekPresent / weekPossible) * 100) : 0;
        weeklyTrend.push({ week: w, rate });
      }

      setReportData({
        totalCount,
        totalWeeks,
        avgAttendanceRate,
        evangelismCount,
        tithingCount,
        feeCount,
        zoneRankings,
        teamRankings,
        perfectAttendees,
        longTermAbsentees,
        newFamilies,
        weeklyTrend
      });
    } catch (error) {
      console.error("Failed to load monthly report data:", error);
      alert("월간 보고서 데이터를 불러오는데 실패했습니다: " + error.message);
    } finally {
      setReportLoading(false);
    }
  };

  // Format month label: YYYY년 MM월
  const formatMonthLabel = (mId) => {
    if (!mId) return "";
    const [year, month] = mId.split("-");
    return `${year}년 ${parseInt(month)}월`;
  };

  const generateMonthlyComments = (data) => {
    const comments = [];
    if (!data) return comments;
    
    comments.push(
      `당월 평균 출석률은 ${data.avgAttendanceRate}%를 기록하였으며, 총 ${data.totalWeeks}주차 동안 교구 운영이 안정적으로 이루어졌습니다.`
    );
    if (data.zoneRankings.length > 0) {
      comments.push(
        `출석 우수 구역으로는 ${data.zoneRankings[0].name}(${data.zoneRankings[0].rate}%)이 1위를 기록하여 타 구역의 귀감이 되고 있습니다.`
      );
    }
    if (data.newFamilies.length > 0) {
      comments.push(
        `이번 달에 신규로 등록한 새가족 성도는 총 ${data.newFamilies.length}명이며, 현재 정착과 양육 과정이 순조롭게 진행 중입니다.`
      );
    } else {
      comments.push("당월 신규 등록된 새가족 성도는 없습니다.");
    }
    if (data.perfectAttendees.length > 0) {
      comments.push(
        `한 달 동안 모든 예배에 성실히 출석한 4주 연속 출석자는 총 ${data.perfectAttendees.length}명으로, 교구의 신앙적 뼈대를 이루고 있습니다.`
      );
    }
    if (data.longTermAbsentees.length > 0) {
      comments.push(
        `예배 참석이 다소 저조하거나 연락이 닿지 않는 장기 결석 성도가 ${data.longTermAbsentees.length}명 확인되어 구역장님들의 개별 심방 및 집중 기도가 요구됩니다.`
      );
    }
    return comments;
  };

  const renderMonthlyReportPages = (isPrint) => {
    if (!reportData) return null;

    const pageCountStyle = (pNum) => (
      <div className="report-page-footer">
        <span>기독교대한감리회 주안교회 청년교구</span>
        <span>Page {pNum} of 5</span>
      </div>
    );

    const pageHeader = (pTitle) => (
      <div className="report-page-header">
        <h1>해봄교구 월간 보고서</h1>
        <p>{formatMonthLabel(reportMonthId)} 마감 보고서</p>
      </div>
    );

    const renderReportTrendChart = () => {
      const trend = reportData.weeklyTrend || [];
      if (trend.length === 0) return null;
      
      const width = 500;
      const height = 140;
      const paddingLeft = 40;
      const paddingRight = 20;
      const paddingTop = 15;
      const paddingBottom = 25;
      
      const chartWidth = width - paddingLeft - paddingRight;
      const chartHeight = height - paddingTop - paddingBottom;
      
      const getX = (index) => {
        if (trend.length <= 1) return paddingLeft + chartWidth / 2;
        return paddingLeft + index * (chartWidth / (trend.length - 1));
      };
      
      const getY = (rate) => {
        const safeRate = (typeof rate === "number" && !isNaN(rate)) ? rate : 0;
        return paddingTop + (100 - safeRate) * (chartHeight / 100);
      };
      
      const points = trend.map((d, idx) => ({ x: getX(idx), y: getY(d.rate), ...d }));
      
      let pathD = "";
      if (points.length > 1) {
        pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
      } else if (points.length === 1) {
        pathD = `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`;
      }
      
      let areaD = "";
      if (points.length > 1) {
        areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
      }
      
      return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "120px", display: "block", marginTop: "10px", marginBottom: "15px" }}>
          {[25, 50, 75, 100].map(val => (
            <g key={val}>
              <line 
                x1={paddingLeft} 
                y1={getY(val)} 
                x2={width - paddingRight} 
                y2={getY(val)} 
                stroke="#e0e0e0" 
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text 
                x={paddingLeft - 8} 
                y={getY(val) + 3} 
                fill="#666666" 
                fontSize="8" 
                textAnchor="end"
              >
                {val}%
              </text>
            </g>
          ))}
          {areaD && <path d={areaD} fill="#f0f4f8" opacity="0.6" />}
          {pathD && <path d={pathD} fill="none" stroke="#2b6cb0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="4" 
                fill="#2b6cb0" 
                stroke="white" 
                strokeWidth="1.5"
              />
              <text 
                x={p.x} 
                y={p.y - 8} 
                fill="#1a202c" 
                fontSize="8" 
                fontWeight="700" 
                textAnchor="middle"
              >
                {p.rate}%
              </text>
              <text 
                x={p.x} 
                y={height - 8} 
                fill="#4a5568" 
                fontSize="8" 
                fontWeight="500" 
                textAnchor="middle"
              >
                {p.week}주차
              </text>
            </g>
          ))}
        </svg>
      );
    };

    const monthlyComments = generateMonthlyComments(reportData);

    return (
      <div className={!isPrint ? "report-paper-container" : ""}>
        {/* ==================== PAGE 1 ==================== */}
        <div className="report-page">
          <div>
            {pageHeader("월간 종합 요약")}
            <div className="report-section-title">1. 월간 지표 요약</div>
            <div className="report-grid-summary">
              <div className="report-summary-card">
                <span className="label">교구 재적</span>
                <span className="value">{reportData.totalCount}명</span>
                <span className="delta" style={{ color: "#666" }}>마감월 활동 인원</span>
              </div>
              <div className="report-summary-card">
                <span className="label">월 평균 출석률</span>
                <span className="value">{reportData.avgAttendanceRate}%</span>
                <span className="delta" style={{ color: "#2b6cb0" }}>{reportData.totalWeeks}주 전체 평균</span>
              </div>
              <div className="report-summary-card">
                <span className="label">신규 새가족 등록</span>
                <span className="value">{reportData.newFamilies.length}명</span>
                <span className="delta" style={{ color: "#006064" }}>당월 신규 입반</span>
              </div>
              <div className="report-summary-card">
                <span className="label">누적 전도 수</span>
                <span className="value">{reportData.evangelismCount}명</span>
                <span className="delta" style={{ color: "#2e7d32" }}>월간 누적 전도 성과</span>
              </div>
            </div>

            <div className="report-section-title">2. 주차별 출석 추이</div>
            {renderReportTrendChart()}

            <div className="report-section-title">3. 월간 주요 지표 실적</div>
            <table className="report-table-modern">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>목표</th>
                  <th>당월 실적</th>
                  <th>목표 달성률</th>
                  <th>종합 평가</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: "700" }}>전도 인원 수</td>
                  <td>30명</td>
                  <td>{reportData.evangelismCount}명</td>
                  <td style={{ fontWeight: "700" }}>{Math.round((reportData.evangelismCount / 30) * 100)}%</td>
                  <td style={{ color: reportData.evangelismCount >= 20 ? "#2e7d32" : "#c62828", fontWeight: "600" }}>
                    {reportData.evangelismCount >= 20 ? "우수" : "관심 필요"}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "700" }}>십일조 동참 수</td>
                  <td>80명</td>
                  <td>{reportData.tithingCount}명</td>
                  <td style={{ fontWeight: "700" }}>{Math.round((reportData.tithingCount / 80) * 100)}%</td>
                  <td style={{ color: reportData.tithingCount >= 60 ? "#2e7d32" : "#c62828", fontWeight: "600" }}>
                    {reportData.tithingCount >= 60 ? "우수" : "관심 필요"}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "700" }}>청체비 납부 수</td>
                  <td>70명</td>
                  <td>{reportData.feeCount}명</td>
                  <td style={{ fontWeight: "700" }}>{Math.round((reportData.feeCount / 70) * 100)}%</td>
                  <td style={{ color: reportData.feeCount >= 50 ? "#2e7d32" : "#c62828", fontWeight: "600" }}>
                    {reportData.feeCount >= 50 ? "우수" : "관심 필요"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {pageCountStyle(1)}
        </div>

        {/* ==================== PAGE 2 ==================== */}
        <div className="report-page">
          <div>
            {pageHeader("팀 및 구역 출석 평가")}
            <div className="report-section-title">1. 교구(팀)별 월간 종합 순위</div>
            <table className="report-table-modern">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>팀명</th>
                  <th>평균 출석률</th>
                  <th>소속 구역 수</th>
                  <th>팀 총원</th>
                </tr>
              </thead>
              <tbody>
                {reportData.teamRankings.map((t, idx) => (
                  <tr key={t.teamId}>
                    <td style={{ fontWeight: "700" }}>{idx + 1}위</td>
                    <td style={{ fontWeight: "600" }}>{t.name}</td>
                    <td style={{ fontWeight: "700", color: "#1a365d" }}>{t.rate}%</td>
                    <td>{zones.filter(z => z.teamId === t.teamId).length}개 구역</td>
                    <td>{t.count}명</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="report-section-title">2. 구역별 월간 종합 순위 (TOP 12)</div>
            <table className="report-table-modern">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>구역명</th>
                  <th>소속 팀</th>
                  <th>평균 출석률</th>
                  <th>구역 총원</th>
                </tr>
              </thead>
              <tbody>
                {reportData.zoneRankings.slice(0, 12).map((z, idx) => (
                  <tr key={z.zoneId}>
                    <td style={{ fontWeight: "700" }}>{idx + 1}위</td>
                    <td style={{ fontWeight: "600" }}>{z.name}</td>
                    <td>{z.teamName}</td>
                    <td style={{ fontWeight: "700", color: "#006064" }}>{z.rate}%</td>
                    <td>{z.count}명</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCountStyle(2)}
        </div>

        {/* ==================== PAGE 3 ==================== */}
        <div className="report-page">
          <div>
            {pageHeader("성도 관리 및 출석 우수자")}
            <div className="report-section-title">1. 월간 출석 우수 성도 ({reportData.totalWeeks}주 연속 출석)</div>
            <p style={{ fontSize: "11px", color: "#666", marginBottom: "10px" }}>* 당월의 모든 주일예배에 성실히 출석한 성도입니다. (총 {reportData.perfectAttendees.length}명)</p>
            <div style={{ 
              border: "1px solid #ddd", 
              borderRadius: "6px", 
              padding: "15px", 
              backgroundColor: "#fafafa", 
              maxHeight: "350px", 
              overflowY: "auto",
              fontSize: "12px",
              lineHeight: "1.8",
              color: "#333"
            }}>
              {reportData.perfectAttendees.length > 0 
                ? reportData.perfectAttendees.map((m, i) => (
                    <span key={m.memberId} style={{ display: "inline-block", marginRight: "12px", fontWeight: "600" }}>
                      {m.name}({zones.find(z => z.zoneId === m.zoneId)?.name || "미지정"})
                    </span>
                  ))
                : "출석 우수 성도가 없습니다."}
            </div>

            <div className="report-section-title" style={{ marginTop: "30px" }}>2. 장기 결석자 목록 (당월 결석/미보고 누적)</div>
            <p style={{ fontSize: "11px", color: "#c62828", marginBottom: "10px" }}>* 집중적인 안부 인사 and 심방이 요구되는 성도입니다. (총 {reportData.longTermAbsentees.length}명)</p>
            <table className="report-table-modern">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>구역명</th>
                  <th>소속 팀</th>
                  <th>누적 결석</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {reportData.longTermAbsentees.slice(0, 10).map((m) => (
                  <tr key={m.memberId}>
                    <td style={{ fontWeight: "700" }}>{m.name}</td>
                    <td>{zones.find(z => z.zoneId === m.zoneId)?.name || "구역 없음"}</td>
                    <td>{teams.find(t => t.teamId === m.teamId)?.name || "팀 없음"}</td>
                    <td style={{ color: "#c62828", fontWeight: "700" }}>{reportData.totalWeeks}주 연속 결석</td>
                    <td style={{ color: "#c62828", fontWeight: "600" }}>심방 대상</td>
                  </tr>
                ))}
                {reportData.longTermAbsentees.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ text_align: "center", color: "#666", padding: "20px" }}>장기 결석자가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pageCountStyle(3)}
        </div>

        {/* ==================== PAGE 4 ==================== */}
        <div className="report-page">
          <div>
            {pageHeader("새가족 현황 및 월간 관리")}
            <div className="report-section-title">1. 신규 입반 새가족 명단 ({reportData.newFamilies.length}명)</div>
            <table className="report-table-modern">
              <thead>
                <tr>
                  <th>성명</th>
                  <th>소속 팀</th>
                  <th>담당 구역</th>
                  <th>연락처</th>
                  <th>정착 상태</th>
                </tr>
              </thead>
              <tbody>
                {reportData.newFamilies.map((m) => (
                  <tr key={m.memberId}>
                    <td style={{ fontWeight: "700" }}>{m.name}</td>
                    <td>{teams.find(t => t.teamId === m.teamId)?.name || "팀 없음"}</td>
                    <td>{zones.find(z => z.zoneId === m.zoneId)?.name || "구역 없음"}</td>
                    <td>{m.phone || "연락처 없음"}</td>
                    <td style={{ color: "#006064", fontWeight: "600" }}>양육 진행 중</td>
                  </tr>
                ))}
                {reportData.newFamilies.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "#666", padding: "20px" }}>당월 신규 새가족 성도가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="report-section-title" style={{ marginTop: "40px" }}>2. 새가족 정착 행동 수칙</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              <div style={{ border: "1px solid #e2e2e2", padding: "12px", borderRadius: "6px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "800", color: "#006064", fontSize: "14px" }}>1.</span>
                <p style={{ fontSize: "11px", color: "#333", margin: 0 }}>
                  **첫 주 차 신속 연락**: 등록 확인 즉시 구역장님은 새가족 성도에게 24시간 이내 웰컴 기프티콘과 첫 환영 연락을 취해주시기 바랍니다.
                </p>
              </div>
              <div style={{ border: "1px solid #e2e2e2", padding: "12px", borderRadius: "6px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "800", color: "#006064", fontSize: "14px" }}>2.</span>
                <p style={{ fontSize: "11px", color: "#333", margin: 0 }}>
                  **구역 예배 매칭**: 새가족 성도의 연령대와 지역을 고려하여 가장 연대감이 생기기 좋은 구역에 빠른 마스터 배정을 권장합니다.
                </p>
              </div>
              <div style={{ border: "1px solid #e2e2e2", padding: "12px", borderRadius: "6px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "800", color: "#006064", fontSize: "14px" }}>3.</span>
                <p style={{ fontSize: "11px", color: "#333", margin: 0 }}>
                  **정착 동우회 활동**: 교회 적응을 위해 첫 4주간 주일예배 후 티타임 또는 소그룹 식사 모임을 지속하여 소속감을 느끼게 도웁니다.
                </p>
              </div>
            </div>
          </div>
          {pageCountStyle(4)}
        </div>

        {/* ==================== PAGE 5 ==================== */}
        <div className="report-page">
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {pageHeader("월간 종합 분석 및 마감")}
            <div className="report-section-title">1. 종합 분석 요약</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "10px 0" }}>
              {monthlyComments.map((comment, i) => (
                <div key={i} className="report-callout-box" style={{ borderLeftColor: i % 2 === 0 ? "#1a365d" : "#2b6cb0" }}>
                  {comment}
                </div>
              ))}
            </div>

            <div className="report-section-title" style={{ marginTop: "20px" }}>2. 월 마감 총평</div>
            <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "16px", backgroundColor: "#fafafa" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "12px" }}>
                <span style={{ 
                  fontSize: "24px", 
                  fontWeight: "900", 
                  color: "white", 
                  backgroundColor: reportData.avgAttendanceRate >= 80 ? "#2e7d32" : (reportData.avgAttendanceRate >= 70 ? "#006064" : "#e65100"),
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {reportData.avgAttendanceRate >= 80 ? "S" : (reportData.avgAttendanceRate >= 70 ? "A" : "B")}
                </span>
                <div>
                  <h4 style={{ fontSize: "13px", color: "#111", margin: 0, fontWeight: "700" }}>
                    월간 종합 평가: {reportData.avgAttendanceRate >= 80 ? "공동체 활성화 매우 우수" : (reportData.avgAttendanceRate >= 70 ? "점진적 성장 양호" : "특별 보수 심방 기간 필요")}
                  </h4>
                  <p style={{ fontSize: "11px", color: "#666", margin: "2px 0 0 0" }}>한 달 전체 통계를 집계하여 평가한 교구의 영적 기상도입니다.</p>
                </div>
              </div>
              <p style={{ fontSize: "11px", color: "#333", lineHeight: "1.6", margin: 0 }}>
                {reportData.avgAttendanceRate >= 80 
                  ? "이번 달 교구의 예배 참여와 활동이 대단히 고무적입니다. 헌신과 전도 사역의 성과가 탁월하며, 성도님들이 유기적으로 소통하고 있습니다. 현 기조를 이어가며 하반기 구역 연합 예배 기획을 제안합니다." 
                  : (reportData.avgAttendanceRate >= 70 
                    ? "당월 교구의 영적 분위기는 전반적으로 건전하고 양호합니다. 다만 주별 출석의 편차가 있는 구역들이 감지됩니다. 이 공백을 최소화하도록 구역장 간 소통 채널을 상시 운영하십시오." 
                    : "일부 성도들의 결석 주차가 누적되며 교구 전반의 참석률이 조정 국면을 보이고 있습니다. 이번 달을 기점으로 리더 기도 모임을 추진하시고 성도님 한 분 한 분 안부를 물어 심방을 활성화하여 주십시오."
                  )}
              </p>
            </div>

            <div className="report-ending-logo-container">
              <div className="report-ending-logo">✝</div>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#111", margin: 0 }}>기독교대한감리회 주안교회 청년교구</h3>
              <p style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>오직 여호와를 앙망하는 자는 새 힘을 얻으리라 (이사야 40:31)</p>
            </div>
          </div>
          {pageCountStyle(5)}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="month-close-wrapper animate-fade">
      <div className="month-intro-card glass-panel">
        <AlertCircle size={24} className="intro-icon" />
        <div>
          <h3>월 마감 처리 및 권한 잠금</h3>
          <p>월을 마감하면 일반 구역장 및 팀장은 해당 월의 출결 및 활동 기록을 더 이상 수정할 수 없습니다.</p>
          <p>마감 처리 즉시 다음 달 기록이 자동으로 생성됩니다. (수정은 오직 임원만 가능합니다.)</p>
        </div>
      </div>

      {canManageDownloadSettings && (
        <div className="download-settings-card glass-panel">
          <div className="card-header">
            <FileText size={18} />
            <h3>출결관리 엑셀 다운로드 이름 설정</h3>
          </div>
          <p className="download-settings-description">
            이름을 등록하면 해당 이름의 로그인 계정만 출결관리 엑셀 다운로드를 사용할 수 있습니다. 관리자는 항상 다운로드할 수 있습니다.
          </p>

          <div className="download-name-add-row">
            <textarea
              value={downloadNameInput}
              onChange={(e) => setDownloadNameInput(e.target.value)}
              placeholder="다운로드 권한을 줄 이름을 입력하세요. 여러 명은 줄바꿈 또는 쉼표로 구분"
              rows={2}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddDownloadNames}
            >
              추가
            </button>
          </div>

          {downloadNameInput.trim() && (
            <div className="download-search-results">
              {getMatchingDownloadMembers().length === 0 ? (
                <div className="download-search-empty">검색 결과가 없습니다.</div>
              ) : (
                getMatchingDownloadMembers().map(member => (
                  <button
                    key={member.memberId}
                    type="button"
                    className="download-search-result"
                    onClick={() => addDownloadTarget(member)}
                  >
                    <strong>{member.name}</strong>
                    <span>ID {member.memberId}</span>
                    <small>{getTeamName(member.teamId)} · {getZoneName(member.zoneId)}</small>
                  </button>
                ))
              )}
            </div>
          )}

          <div className="download-name-list">
            {downloadTargetDrafts.length === 0 ? (
              <div className="download-name-empty">등록된 이름이 없습니다. 관리자만 다운로드할 수 있습니다.</div>
            ) : (
              downloadTargetDrafts.map((target, index) => (
                <div key={`${target.memberId || target.name}-${index}`} className="download-name-row">
                  <div className="download-selected-member">
                    <input
                      type="text"
                      value={target.name}
                      onChange={(e) => handleUpdateDownloadName(index, e.target.value)}
                      placeholder="이름 또는 ID"
                    />
                    <div className="download-selected-meta">
                      <span>{target.memberId ? "성도 목록에서 선택됨" : "이름 기준 권한"}</span>
                      <span>{target.zoneId ? getZoneName(target.zoneId) : "로그인 이름과 일치해야 함"}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRemoveDownloadName(index)}
                    disabled={downloadNameSaving}
                  >
                    삭제
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="download-settings-actions">
            <span>{downloadTargetDrafts.filter(target => target.name?.trim()).length}명 설정됨</span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveDownloadNames}
              disabled={downloadNameSaving}
            >
              {downloadNameSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}

      <div className="month-list-card glass-panel">
        <div className="card-header">
          <Calendar size={18} />
          <h3>월별 마감 이력</h3>
        </div>

        <div className="month-list">
          {months.map((m) => (
            <div key={m.monthId} className="month-row">
              <div className="month-name-col">
                <span className="month-label">{formatMonthLabel(m.monthId)}</span>
                <span className="month-id-raw">({m.monthId})</span>
              </div>

              <div className="month-status-col">
                {m.status === "closed" ? (
                  <span className="status-indicator closed">
                    <Lock size={12} />
                    <span>마감 완료</span>
                  </span>
                ) : (
                  <span className="status-indicator open">
                    <Unlock size={12} />
                    <span>작성 중 (수정 가능)</span>
                  </span>
                )}
              </div>

              <div className="month-action-col">
                {m.status === "open" && currentUser?.role === "admin" && (
                  <button
                    onClick={() => handleCloseMonth(m.monthId)}
                    className="btn btn-danger btn-sm"
                  >
                    <span>마감 처리하기</span>
                  </button>
                )}
                {m.status === "closed" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      onClick={() => loadMonthlyReport(m.monthId)}
                      className="btn btn-secondary btn-sm"
                    >
                      <FileText size={12} style={{ marginRight: "4px" }} />
                      <span>월간 보고서 생성</span>
                    </button>
                    <span className="closed-label">관리자 수정 모드만 허용</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentUser?.role === "admin" && (
        <div className="dev-seed-card glass-panel">
          <div className="card-header">
            <AlertCircle size={18} className="text-warning" />
            <h3>시스템 초기화 (Firebase Seed)</h3>
          </div>
          <div className="dev-seed-body">
            <p>
              현재 연동 상태: <strong>{isMockMode ? "로컬 Mock 모드 (localStorage)" : "실제 Firebase 연동 모드"}</strong>
            </p>
            <p className="description">
              처음 Firebase를 연동했거나 데이터베이스가 비어있는 경우, 아래 버튼을 클릭하여 데모 데이터(교구, 구역, 성도 및 관리자 계정 등)를 Firebase Firestore에 업로드할 수 있습니다.
            </p>
            <button
              onClick={() => {
                if (window.confirm("정말로 데이터베이스 초기화 및 데모 데이터 업로드를 진행하시겠습니까?\n이 작업은 기존의 Firestore 데이터를 덮어쓸 수 있습니다.")) {
                  seedFirebaseDatabase();
                }
              }}
              className="btn btn-warning"
              disabled={isMockMode}
            >
              <span>{isMockMode ? "Mock 모드에서는 사용 불가 (Firebase 연동 필요)" : "Firebase 초기 데이터 업로드 (Seed)"}</span>
            </button>
          </div>
        </div>
      )}
    </div>

      {/* 3. Monthly Report Print Preview Modal */}
      {reportMonthId && (
        <div className="modal-backdrop no-print" onClick={() => setReportMonthId(null)}>
          <div className="modal-content glass-panel animate-slide" style={{ maxWidth: "860px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>월간 보고서 미리보기 (A4 5페이지 규격)</h3>
              <button onClick={() => setReportMonthId(null)} className="modal-close-btn">
                <X size={16} />
              </button>
            </div>
            
            {reportLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
                데이터를 불러오고 통계를 계산 중입니다...
              </div>
            ) : reportData ? (
              <>
                {renderMonthlyReportPages(false)}
                
                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1 }}>
                    <span>PDF 저장 / 인쇄하기</span>
                  </button>
                  <button onClick={() => setReportMonthId(null)} className="btn btn-secondary" style={{ flex: 0.3 }}>
                    <span>취소</span>
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* 4. Monthly Report Print Layout (Visible ONLY on print) */}
      {!reportLoading && reportData && (
        <div className="monthly-report-print-target">
          {renderMonthlyReportPages(true)}
        </div>
      )}

      <style>{`
        .btn-warning {
          background: hsla(42, 90%, 55%, 0.15);
          color: var(--accent-gold);
          border: 1px solid hsla(42, 90%, 55%, 0.2);
        }

        .btn-warning:hover:not(:disabled) {
          background: var(--accent-gold);
          color: var(--bg-primary);
        }

        .btn-warning:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dev-seed-card {
          padding: 24px;
          border-color: hsla(42, 90%, 55%, 0.15) !important;
        }

        .dev-seed-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 14px;
        }

        .dev-seed-body p {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .dev-seed-body p.description {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .download-settings-card {
          padding: 24px;
        }

        .download-settings-description {
          margin: 12px 0 16px;
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.6;
        }

        .download-name-add-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: stretch;
          margin-bottom: 14px;
        }

        .download-name-add-row textarea,
        .download-name-row input {
          width: 100%;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 13px;
        }

        .download-name-add-row textarea {
          min-height: 58px;
          padding: 10px 12px;
          resize: vertical;
        }

        .download-name-row input {
          height: 36px;
          padding: 0 10px;
        }

        .download-name-list {
          display: grid;
          gap: 8px;
          max-height: 260px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .download-search-results {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 8px;
          margin: 0 0 14px;
          padding: 10px;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
        }

        .download-search-result {
          display: grid;
          gap: 3px;
          text-align: left;
          padding: 10px 12px;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          cursor: pointer;
        }

        .download-search-result:hover {
          border-color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.08);
        }

        .download-search-result strong {
          font-size: 13px;
        }

        .download-search-result span,
        .download-search-result small,
        .download-search-empty {
          color: var(--text-secondary);
          font-size: 12px;
        }

        .download-name-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          align-items: center;
        }

        .download-selected-member {
          display: grid;
          gap: 5px;
        }

        .download-selected-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 12px;
        }

        .download-name-empty {
          padding: 14px;
          border: 1px dashed var(--glass-border);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 13px;
          text-align: center;
        }

        .download-settings-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid var(--glass-border);
        }

        .download-settings-actions span {
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
        }

        .text-warning {
          color: var(--accent-gold);
        }

        .month-close-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .month-intro-card {
          display: flex;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(135deg, hsla(355, 80%, 60%, 0.05), hsla(210, 100%, 55%, 0.03)) !important;
          border-color: hsla(355, 80%, 60%, 0.15) !important;
        }

        .intro-icon {
          color: var(--accent-red);
          flex-shrink: 0;
        }

        .month-intro-card h3 {
          font-size: 15px;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .month-intro-card p {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .month-list-card {
          padding: 24px;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 14px;
          margin-bottom: 16px;
          color: var(--text-secondary);
        }

        .card-header h3 {
          font-size: 15px;
        }

        .month-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .month-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .month-row:hover {
          border-color: var(--glass-border);
          background-color: var(--bg-tertiary);
        }

        .month-name-col {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .month-label {
          font-weight: 700;
          font-size: 15px;
          color: var(--text-primary);
        }

        .month-id-raw {
          font-size: 11px;
          color: var(--text-muted);
          font-family: monospace;
        }

        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 600;
        }

        .status-indicator.closed {
          background-color: hsla(355, 80%, 60%, 0.12);
          color: var(--accent-red);
        }

        .status-indicator.open {
          background-color: hsla(150, 70%, 50%, 0.12);
          color: var(--accent-emerald);
        }

        .closed-label {
          font-size: 12px;
          color: var(--text-muted);
        }

        @media (max-width: 600px) {
          .month-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .month-action-col {
            width: 100%;
          }
          .month-action-col button {
            width: 100%;
          }
        }

        .report-paper-theme {
          background-color: white !important;
          color: black !important;
          padding: 24px;
          border-radius: var(--radius-sm);
          border: 1px solid #ddd;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
          max-height: 420px;
          overflow-y: auto;
          text-align: left;
        }

        .report-paper-theme table {
          color: black !important;
        }

        @media print {
          .desktop-sidebar, 
          .mobile-nav-bar, 
          .header, 
          .month-close-wrapper, 
          .modal-backdrop, 
          .no-print {
            display: none !important;
          }
          
          .app-container, 
          .main-content {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            background: white !important;
          }
          
          body, html {
            background: white !important;
            color: black !important;
          }

          .monthly-report-print-target {
            display: block !important;
            width: 100% !important;
            max-width: 800px;
            margin: 0 auto;
            padding: 30px;
            box-sizing: border-box;
            background: white !important;
            color: black !important;
          }
        }

        @media screen {
          .monthly-report-print-target {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
