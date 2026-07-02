import React, { useState } from "react";
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
  TrendingUp,
  UserX,
  FileText,
  Clipboard,
  ChevronRight,
  X
} from "lucide-react";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { 
    members, 
    teams, 
    zones, 
    months,
    activeMonthId, 
    activeWeekNo, 
    attendanceRecords, 
    monthlyAchievements 
  } = useData();

  const role = currentUser?.role;
  const TEST_REGULAR_VALUES = ["정규시험", "대면"];
  const TEST_ONLINE_VALUES = ["비대면"];
  const TEST_UNOFFICIAL_VALUES = ["비공식(연락)", "비공식(줌예배 참석)", "비공식(텔 퀴즈 응시)"];
  const TEST_REPORTED_VALUES = [...TEST_REGULAR_VALUES, ...TEST_ONLINE_VALUES, ...TEST_UNOFFICIAL_VALUES];
  const ZONE_FACE_TO_FACE_VALUES = ["대면", "들어옴"];
  const ZONE_ZOOM_VALUES = ["줌"];
  const ZONE_INDIVIDUAL_VALUES = ["개별", "개별전달"];
  const ZONE_ABSENT_VALUES = ["불참", "미전달"];
  const ZONE_REPORTED_VALUES = [
    ...ZONE_FACE_TO_FACE_VALUES,
    ...ZONE_ZOOM_VALUES,
    ...ZONE_INDIVIDUAL_VALUES,
    ...ZONE_ABSENT_VALUES
  ];
  const WORSHIP_PRESENT_VALUES = ["대면", "비대면", "줌", "개별", "온라인", "대체", "O", "들어옴", "개별전달"];
  const WORSHIP_NOT_PRESENT_VALUES = ["미보고", "미확인", "결석", "X", "불참", "미전달", "출결제외자"];
  const getWorshipTypeValue = (value) => String(value || "미보고").split("|")[0].trim();
  const isWorshipPresentValue = (value) => {
    const type = getWorshipTypeValue(value);
    if (WORSHIP_PRESENT_VALUES.includes(type)) return true;
    if (WORSHIP_NOT_PRESENT_VALUES.includes(type)) return false;
    return Boolean(type);
  };

  // Filter members based on user role
  const getScopedMembers = () => {
    // Active members only (normal, new). Exclude excluded.
    const activeStates = ["normal", "new"];
    let filtered = members.filter(m => activeStates.includes(m.status));

    if (role === "team") {
      filtered = filtered.filter(m => m.teamId === currentUser.teamId);
    } else if (role === "leader") {
      filtered = filtered.filter(m => m.zoneId === currentUser.zoneId);
    }
    return filtered;
  };

  const getExcludedCount = () => {
    let filtered = members.filter(m => m.status === "excluded");
    if (role === "team") {
      filtered = filtered.filter(m => m.teamId === currentUser.teamId);
    } else if (role === "leader") {
      filtered = filtered.filter(m => m.zoneId === currentUser.zoneId);
    }
    return filtered.length;
  };

  const scopedMembers = getScopedMembers();
  const totalCount = scopedMembers.length;
  const excludedCount = getExcludedCount();

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

      if (val === "대면" || val === "비대면" || val === "온라인" || val === "대체" || val === "O") {
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

  const getZoneWorshipStats = () => {
    let entered = 0;      // 대면
    let delivered = 0;    // 줌/개별
    let undelivered = 0;  // 불참
    let unreported = 0;   // 미보고

    scopedMembers.forEach(m => {
      const rec = attendanceRecords.find(
        r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "zone"
      );
      const val = rec ? rec.value : "미보고";

      if (ZONE_FACE_TO_FACE_VALUES.includes(val)) {
        entered++;
      } else if ([...ZONE_ZOOM_VALUES, ...ZONE_INDIVIDUAL_VALUES].includes(val)) {
        delivered++;
      } else if (ZONE_ABSENT_VALUES.includes(val)) {
        undelivered++;
      } else if (!ZONE_REPORTED_VALUES.includes(val)) {
        unreported++;
      }
    });

    return { entered, delivered, undelivered, unreported };
  };

  const zoneWorshipStats = getZoneWorshipStats();

  const getEvangelismTeamStats = () => {
    let present = 0; // 대면
    let online = 0;  // 비대면
    let unreported = 0; // 미보고

    scopedMembers.forEach(m => {
      const rec = attendanceRecords.find(
        r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "activity"
      );
      const val = rec ? rec.value : "미보고";

      if (TEST_REGULAR_VALUES.includes(val)) {
        present++;
      } else if (TEST_ONLINE_VALUES.includes(val)) {
        online++;
      } else if (!TEST_REPORTED_VALUES.includes(val)) {
        unreported++;
      }
    });

    return { present, online, unreported };
  };

  const evTeamStats = getEvangelismTeamStats();

  const getTestStats = () => {
    let present = 0; // 대면
    let online = 0;  // 비대면
    let unreported = 0; // 미보고

    scopedMembers.forEach(m => {
      const rec = attendanceRecords.find(
        r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "test"
      );
      const val = rec ? rec.value : "미보고";

      if (val === "대면") {
        present++;
      } else if (val === "비대면") {
        online++;
      } else {
        unreported++;
      }
    });

    return { present, online, unreported };
  };

  const testStats = getTestStats();

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
        if (isWorshipPresentValue(val)) {
          totalPresent++;
        }
      });
    });

    return Math.round((totalPresent / totalPossible) * 100);
  };

  const overallRate = calculateAttendanceRate(scopedMembers);

  // Previous week comparison calculation
  const getPrevWeekStats = () => {
    let prevWeekNo = activeWeekNo - 1;
    let prevMonthId = activeMonthId;
    
    if (activeWeekNo === 1) {
      const sortedMonths = [...months].sort((a, b) => a.monthId.localeCompare(b.monthId));
      const idx = sortedMonths.findIndex(m => m.monthId === activeMonthId);
      if (idx > 0) {
        prevMonthId = sortedMonths[idx - 1].monthId;
        const monthRecs = attendanceRecords.filter(r => r.monthId === prevMonthId);
        if (monthRecs.length > 0) {
          prevWeekNo = Math.max(...monthRecs.map(r => r.weekNo));
        } else {
          prevWeekNo = 4;
        }
      } else {
        return null;
      }
    }
    
    let totalPossible = scopedMembers.length * 3;
    if (totalPossible === 0) return null;
    
    let totalPresent = 0;
    let sundayPresent = 0;
    let sundayAbsent = 0;
    let sundayUnreported = 0;
    
    let evangelism = 0;
    let tithing = 0;
    let fee = 0;
    
    scopedMembers.forEach(m => {
      ["samil", "sunday", "zone"].forEach(cat => {
        const rec = attendanceRecords.find(
          r => r.memberId === m.memberId && r.monthId === prevMonthId && r.weekNo === prevWeekNo && r.category === cat
        );
        const val = rec ? rec.value : "미보고";
        if (isWorshipPresentValue(val)) {
          totalPresent++;
        }
      });
      
      const sunRec = attendanceRecords.find(
        r => r.memberId === m.memberId && r.monthId === prevMonthId && r.weekNo === prevWeekNo && r.category === "sunday"
      );
      const sunVal = sunRec ? sunRec.value : "미보고";
      if (sunVal === "대면" || sunVal === "비대면" || sunVal === "온라인" || sunVal === "대체" || sunVal === "O") {
        sundayPresent++;
      } else if (sunVal === "결석" || sunVal === "X") {
        sundayAbsent++;
      } else {
        sundayUnreported++;
      }
      
      const evAch = monthlyAchievements.find(a => a.memberId === m.memberId && a.category === "evangelism");
      if (evAch && evAch.achieved && evAch.achievedWeekNo <= prevWeekNo) {
        evangelism++;
      }
      const tiAch = monthlyAchievements.find(a => a.memberId === m.memberId && a.category === "tithing");
      if (tiAch && tiAch.achieved && tiAch.achievedWeekNo <= prevWeekNo) {
        tithing++;
      }
      const feAch = monthlyAchievements.find(a => a.memberId === m.memberId && a.category === "fee");
      if (feAch && feAch.achieved && feAch.achievedWeekNo <= prevWeekNo) {
        fee++;
      }
    });
    
    const rate = Math.round((totalPresent / totalPossible) * 100);
    return { rate, sundayPresent, sundayAbsent, sundayUnreported, evangelism, tithing, fee };
  };

  const prevStats = getPrevWeekStats();

  // Helper: Calculate rankings
  const getTeamRankings = () => {
    const activeTeams = teams.filter(t => t.status === "active");
    const list = activeTeams.map(t => {
      const tMembers = members.filter(m => m.teamId === t.teamId && ["normal", "new"].includes(m.status));
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
      const zMembers = members.filter(m => m.zoneId === z.zoneId && ["normal", "new"].includes(m.status));
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

  const [showUnreportedModal, setShowUnreportedModal] = useState(false);
  const [showMoreRankingsModal, setShowMoreRankingsModal] = useState(false);
  const [showWeeklyReportModal, setShowWeeklyReportModal] = useState(false);
  const [clickedCardDetails, setClickedCardDetails] = useState(null);
  const [visibleLines, setVisibleLines] = useState({ worship: true, test: true, ev: true });

  const getWeeklyCount = (cat) => {
    return scopedMembers.filter(m => {
      const rec = attendanceRecords.find(
        r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === cat
      );
      return rec && isWorshipPresentValue(rec.value);
    }).length;
  };

  const handleCopyList = (title, list) => {
    const groups = {};
    list.forEach(m => {
      const zName = getZoneName(m.zoneId) || "구역 없음";
      if (!groups[zName]) groups[zName] = [];
      groups[zName].push(m.name);
    });

    let text = `[${getScopeLabel()} ${activeMonthId.split("-")[0]}년 ${parseInt(activeMonthId.split("-")[1])}월 ${activeWeekNo}주차 ${title} (총 ${list.length}명)]\n`;
    Object.keys(groups).forEach(zName => {
      text += `- ${zName}: ${groups[zName].join(", ")}\n`;
    });

    navigator.clipboard.writeText(text)
      .then(() => alert("명단이 클립보드에 복사되었습니다. 카카오톡 등 게시판에 붙여넣기 하실 수 있습니다."))
      .catch(err => alert("복사 실패: " + err));
  };

  const handleCardClick = (title, categoryOrType) => {
    let list = [];
    
    if (categoryOrType === "total") {
      list = scopedMembers;
    } else if (categoryOrType === "excluded") {
      list = members.filter(m => m.status === "excluded" && (role === "admin" || (role === "team" && m.teamId === currentUser?.teamId) || (role === "leader" && m.zoneId === currentUser?.zoneId)));
    } else if (categoryOrType === "sunday_present") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "sunday");
        const val = rec ? rec.value : "미보고";
        return isWorshipPresentValue(val);
      });
    } else if (categoryOrType === "sunday_absent") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "sunday");
        const val = rec ? rec.value : "미보고";
        return ["결석", "X"].includes(val);
      });
    } else if (categoryOrType === "sunday_unreported") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "sunday");
        const val = rec ? rec.value : "미보고";
        return !isWorshipPresentValue(val) && !["결석", "X"].includes(getWorshipTypeValue(val));
      });
    } else if (categoryOrType === "zone_entered") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "zone");
        const val = rec ? rec.value : "미보고";
        return ZONE_FACE_TO_FACE_VALUES.includes(val);
      });
    } else if (categoryOrType === "zone_delivered") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "zone");
        const val = rec ? rec.value : "미보고";
        return [...ZONE_ZOOM_VALUES, ...ZONE_INDIVIDUAL_VALUES].includes(val);
      });
    } else if (categoryOrType === "zone_undelivered") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "zone");
        const val = rec ? rec.value : "미보고";
        return ZONE_ABSENT_VALUES.includes(val);
      });
    } else if (categoryOrType === "zone_unreported") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "zone");
        const val = rec ? rec.value : "미보고";
        return !ZONE_REPORTED_VALUES.includes(val);
      });
    } else if (categoryOrType === "radio") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "radio");
        const val = rec ? rec.value : "미보고";
        return ["대면", "비대면", "온라인", "대체", "O"].includes(val);
      });
    } else if (categoryOrType === "tithing") {
      list = scopedMembers.filter(m => {
        const ach = monthlyAchievements.find(a => a.memberId === m.memberId && a.category === "tithing");
        return ach && ach.achieved;
      });
    } else if (categoryOrType === "fee") {
      list = scopedMembers.filter(m => {
        const ach = monthlyAchievements.find(a => a.memberId === m.memberId && a.category === "fee");
        return ach && ach.achieved;
      });
    } else if (categoryOrType === "evangelism") {
      list = scopedMembers.filter(m => {
        const ach = monthlyAchievements.find(a => a.memberId === m.memberId && a.category === "evangelism");
        return ach && ach.achieved;
      });
    } else if (categoryOrType === "evteam_present") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "activity");
        const val = rec ? rec.value : "미보고";
        return val === "대면";
      });
    } else if (categoryOrType === "evteam_online") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "activity");
        const val = rec ? rec.value : "미보고";
        return val === "비대면";
      });
    } else if (categoryOrType === "evteam_unreported") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "activity");
        const val = rec ? rec.value : "미보고";
        return !["대면", "비대면"].includes(val);
      });
    } else if (categoryOrType === "test_present") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "test");
        const val = rec ? rec.value : "미보고";
        return TEST_REGULAR_VALUES.includes(val);
      });
    } else if (categoryOrType === "test_online") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "test");
        const val = rec ? rec.value : "미보고";
        return TEST_ONLINE_VALUES.includes(val);
      });
    } else if (categoryOrType === "test_unreported") {
      list = scopedMembers.filter(m => {
        const rec = attendanceRecords.find(r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "test");
        const val = rec ? rec.value : "미보고";
        return !TEST_REPORTED_VALUES.includes(val);
      });
    }

    setClickedCardDetails({ title, members: list });
  };

  const getWeekDateRange = (year, month, weekNo) => {
    const startDay = (weekNo - 1) * 7 + 1;
    let endDay = weekNo * 7;
    const lastDay = new Date(year, month, 0).getDate();
    if (endDay > lastDay || weekNo === 5) {
      endDay = lastDay;
    }
    return `${month}.${startDay} ~ ${month}.${endDay}`;
  };

  const getPerfectAttendees = () => {
    return scopedMembers.filter(m => {
      for (let w = 1; w <= activeWeekNo; w++) {
        const rec = attendanceRecords.find(
          r => r.memberId === m.memberId && r.weekNo === w && r.category === "sunday"
        );
        const val = rec ? rec.value : "미보고";
        if (!isWorshipPresentValue(val)) {
          return false;
        }
      }
      return true;
    });
  };

  const getLongTermAbsentees = () => {
    return scopedMembers.filter(m => {
      let attendCount = 0;
      for (let w = 1; w <= activeWeekNo; w++) {
        const rec = attendanceRecords.find(
          r => r.memberId === m.memberId && r.weekNo === w && r.category === "sunday"
        );
        const val = rec ? rec.value : "미보고";
        if (isWorshipPresentValue(val)) {
          attendCount++;
        }
      }
      return attendCount === 0;
    });
  };

  const generateDynamicComments = () => {
    const comments = [];
    const prevRate = prevStats?.rate || 0;
    const diff = overallRate - prevRate;
    if (prevStats) {
      comments.push(
        `출석률이 전주 대비 ${diff >= 0 ? `${diff}%p 상승` : `${Math.abs(diff)}%p 하락`}하여 ${diff >= 0 ? "긍정적인 흐름을 보이고 있습니다" : "다소 주춤한 흐름을 보이고 있습니다"}.`
      );
    } else {
      comments.push(`현재 주간 평균 출석률은 ${overallRate}%를 기록하고 있습니다.`);
    }
    if (zoneRanks.length > 0) {
      comments.push(
        `${zoneRanks[0].name}이 가장 높은 출석률(${zoneRanks[0].rate}%)을 기록하여 교구의 좋은 본보기가 되고 있습니다.`
      );
    }
    const newCount = members.filter(m => m.status === "new" && (role === "admin" || m.teamId === currentUser?.teamId)).length;
    if (newCount > 0) {
      comments.push(`새가족 ${newCount}명이 교구에 등록하여 원활하게 정착 과정을 진행 중에 있습니다.`);
    } else {
      comments.push("당주 새로 등록된 신규 새가족 성도는 없습니다.");
    }
    if (attStats.unreported > 0) {
      comments.push(
        `출결 상태가 입력되지 않은 성도가 ${attStats.unreported}명 남아 있어 각 구역장님들의 마감 및 보고 협조가 필요합니다.`
      );
    } else {
      comments.push("모든 구역의 주간 출결 보고가 100% 완료되었습니다.");
    }
    if (evangelismCount > 0) {
      comments.push(`이번 주 전도 실적은 총 ${evangelismCount}명으로, 적극적인 전도 사역이 이루어지고 있습니다.`);
    }
    return comments;
  };

  const getTeamName = (tId) => teams.find(t => t.teamId === tId)?.name || "없음";
  const getZoneName = (zId) => zones.find(z => z.zoneId === zId)?.name || "구역 없음";

  const [yearStr, monthStr] = activeMonthId ? activeMonthId.split("-") : ["2026", "06"];
  const reportYear = parseInt(yearStr);
  const reportMonth = parseInt(monthStr);
  const reportDateRange = getWeekDateRange(reportYear, reportMonth, activeWeekNo);
  const perfectAttendees = getPerfectAttendees();
  const longTermAbsentees = getLongTermAbsentees();
  const dynamicComments = generateDynamicComments();

  // Calculate Unreported Members List
  const getUnreportedMembers = () => {
    return scopedMembers.filter(m => {
      const rec = attendanceRecords.find(
        r => r.memberId === m.memberId && r.monthId === activeMonthId && r.weekNo === activeWeekNo && r.category === "sunday"
      );
      const val = rec ? rec.value : "미보고";
      return !(val === "대면" || val === "비대면" || val === "온라인" || val === "대체" || val === "O" || val === "결석" || val === "X");
    });
  };

  const unreportedList = getUnreportedMembers();

  const handleCopyUnreported = () => {
    const groups = {};
    unreportedList.forEach(m => {
      const zName = getZoneName(m.zoneId);
      if (!groups[zName]) groups[zName] = [];
      groups[zName].push(m.name);
    });

    let text = `[${getScopeLabel()} ${activeMonthId.split("-")[0]}년 ${parseInt(activeMonthId.split("-")[1])}월 ${activeWeekNo}주차 미보고 성도 명단 (총 ${unreportedList.length}명)]\n`;
    Object.keys(groups).forEach(zName => {
      text += `- ${zName}: ${groups[zName].join(", ")}\n`;
    });

    navigator.clipboard.writeText(text)
      .then(() => alert("미보고 성도 명단이 클립보드에 복사되었습니다. 카카오톡 등 게시판에 붙여넣기 하실 수 있습니다."))
      .catch(err => alert("클립보드 복사 실패: " + err));
  };

  // Weekly Trend calculation
  const getWeeklyAttendanceTrend = () => {
    const trend = [];
    const totalWeeks = 5;
    
    for (let w = 1; w <= totalWeeks; w++) {
      let hasRecords = false;
      
      // Worship: sunday only
      let worshipPossible = scopedMembers.length;
      let worshipPresent = 0;
      
      // Test: test
      let testPossible = scopedMembers.length;
      let testPresent = 0;
      
      // Evangelism: activity
      let evPossible = scopedMembers.length;
      let evPresent = 0;
      
      scopedMembers.forEach(m => {
        // Worship (Sunday only)
        const rec = attendanceRecords.find(
          r => r.memberId === m.memberId && r.monthId === activeMonthId && r.weekNo === w && r.category === "sunday"
        );
        if (rec) {
          hasRecords = true;
          if (isWorshipPresentValue(rec.value)) {
            worshipPresent++;
          }
        }
        
        // Test
        const testRec = attendanceRecords.find(
          r => r.memberId === m.memberId && r.monthId === activeMonthId && r.weekNo === w && r.category === "test"
        );
        if (testRec) {
          hasRecords = true;
          if (TEST_REPORTED_VALUES.includes(testRec.value)) {
            testPresent++;
          }
        }
        
        // Evangelism / Activity
        const evRec = attendanceRecords.find(
          r => r.memberId === m.memberId && r.monthId === activeMonthId && r.weekNo === w && r.category === "activity"
        );
        if (evRec) {
          hasRecords = true;
          if (["대면", "비대면"].includes(evRec.value)) {
            evPresent++;
          }
        }
      });
      
      if (hasRecords) {
        const rawWorshipRate = worshipPossible ? Math.round((worshipPresent / worshipPossible) * 100) : 0;
        const rawTestRate = testPossible ? Math.round((testPresent / testPossible) * 100) : 0;
        const rawEvRate = evPossible ? Math.round((evPresent / evPossible) * 100) : 0;

        trend.push({
          week: w,
          worshipRate: isNaN(rawWorshipRate) ? 0 : rawWorshipRate,
          testRate: isNaN(rawTestRate) ? 0 : rawTestRate,
          evRate: isNaN(rawEvRate) ? 0 : rawEvRate
        });
      }
    }
    return trend;
  };

  const trendData = getWeeklyAttendanceTrend();

  const generateSvgElements = () => {
    if (trendData.length === 0) return {};
    
    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    const getX = (index) => {
      if (trendData.length <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + index * (chartWidth / (trendData.length - 1));
    };
    
    const getY = (rate) => {
      const safeRate = (typeof rate === "number" && !isNaN(rate)) ? rate : 0;
      return paddingTop + (100 - safeRate) * (chartHeight / 100);
    };
    
    const grids = [25, 50, 75, 100].map(val => (
      <g key={val}>
        <line 
          x1={paddingLeft} 
          y1={getY(val)} 
          x2={width - paddingRight} 
          y2={getY(val)} 
          stroke="var(--glass-border)" 
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text 
          x={paddingLeft - 10} 
          y={getY(val) + 4} 
          fill="var(--text-muted)" 
          fontSize="9" 
          textAnchor="end"
        >
          {val}%
        </text>
      </g>
    ));
    
    // 1. Worship Points & Path
    const worshipPoints = trendData.map((d, idx) => ({ x: getX(idx), y: getY(d.worshipRate), rate: d.worshipRate, week: d.week }));
    let worshipPathD = "";
    if (worshipPoints.length > 1) {
      worshipPathD = `M ${worshipPoints[0].x} ${worshipPoints[0].y} ` + worshipPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    } else if (worshipPoints.length === 1) {
      worshipPathD = `M ${worshipPoints[0].x - 20} ${worshipPoints[0].y} L ${worshipPoints[0].x + 20} ${worshipPoints[0].y}`;
    }

    // 2. Test Points & Path
    const testPoints = trendData.map((d, idx) => ({ x: getX(idx), y: getY(d.testRate), rate: d.testRate, week: d.week }));
    let testPathD = "";
    if (testPoints.length > 1) {
      testPathD = `M ${testPoints[0].x} ${testPoints[0].y} ` + testPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    } else if (testPoints.length === 1) {
      testPathD = `M ${testPoints[0].x - 20} ${testPoints[0].y} L ${testPoints[0].x + 20} ${testPoints[0].y}`;
    }

    // 3. Evangelism Points & Path
    const evPoints = trendData.map((d, idx) => ({ x: getX(idx), y: getY(d.evRate), rate: d.evRate, week: d.week }));
    let evPathD = "";
    if (evPoints.length > 1) {
      evPathD = `M ${evPoints[0].x} ${evPoints[0].y} ` + evPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    } else if (evPoints.length === 1) {
      evPathD = `M ${evPoints[0].x - 20} ${evPoints[0].y} L ${evPoints[0].x + 20} ${evPoints[0].y}`;
    }
    
    return { grids, width, height, paddingBottom, worshipPoints, worshipPathD, testPoints, testPathD, evPoints, evPathD };
  };

  const svgData = generateSvgElements();



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

  const renderWeeklyReportPages = (isPrint) => {
    const sortedMonths = [...months].sort((a, b) => a.monthId.localeCompare(b.monthId));
    const idx = sortedMonths.findIndex(m => m.monthId === activeMonthId);
    let prevWeekNo = activeWeekNo - 1;
    let prevMonthId = activeMonthId;
    if (activeWeekNo === 1) {
      if (idx > 0) {
        prevMonthId = sortedMonths[idx - 1].monthId;
        const monthRecs = attendanceRecords.filter(r => r.monthId === prevMonthId);
        if (monthRecs.length > 0) {
          prevWeekNo = Math.max(...monthRecs.map(r => r.weekNo));
        } else {
          prevWeekNo = 4;
        }
      }
    }

    const getWeeklyCountForWeek = (cat, wNo, mId = activeMonthId) => {
      return scopedMembers.filter(m => {
        const rec = attendanceRecords.find(
          r => r.memberId === m.memberId && r.monthId === mId && r.weekNo === wNo && r.category === cat
        );
        return rec && isWorshipPresentValue(rec.value);
      }).length;
    };

    const curSunday = getWeeklyCountForWeek("sunday", activeWeekNo);
    const prevSunday = prevWeekNo > 0 ? getWeeklyCountForWeek("sunday", prevWeekNo, prevMonthId) : 0;
    const diffSunday = curSunday - prevSunday;

    const curSamil = getWeeklyCountForWeek("samil", activeWeekNo);
    const prevSamil = prevWeekNo > 0 ? getWeeklyCountForWeek("samil", prevWeekNo, prevMonthId) : 0;
    const diffSamil = curSamil - prevSamil;

    const curZone = getWeeklyCountForWeek("zone", activeWeekNo);
    const prevZone = prevWeekNo > 0 ? getWeeklyCountForWeek("zone", prevWeekNo, prevMonthId) : 0;
    const diffZone = curZone - prevZone;

    const prevEv = prevStats?.evangelism || 0;
    const diffEv = evangelismCount - prevEv;
    const prevTi = prevStats?.tithing || 0;
    const diffTi = tithingCount - prevTi;
    const prevFe = prevStats?.fee || 0;
    const diffFe = feeCount - prevFe;

    const pageCountStyle = (pNum) => (
      <div className="report-page-footer">
        <span>기독교대한감리회 주안교회 청년교구</span>
        <span>Page {pNum} of 5</span>
      </div>
    );

    const pageHeader = (pTitle) => (
      <div className="report-page-header">
        <h1>{getScopeLabel()} 주간 리포트</h1>
        <p>2026년 {activeMonthId.split("-")[1]}월 {activeWeekNo}주차 ({reportDateRange})</p>
      </div>
    );

    const renderReportTrendChart = () => {
      if (trendData.length === 0) return null;
      
      const width = 500;
      const height = 140;
      const paddingLeft = 40;
      const paddingRight = 20;
      const paddingTop = 15;
      const paddingBottom = 25;
      
      const chartWidth = width - paddingLeft - paddingRight;
      const chartHeight = height - paddingTop - paddingBottom;
      
      const getX = (index) => {
        if (trendData.length <= 1) return paddingLeft + chartWidth / 2;
        return paddingLeft + index * (chartWidth / (trendData.length - 1));
      };
      
      const getY = (rate) => {
        const safeRate = (typeof rate === "number" && !isNaN(rate)) ? rate : 0;
        return paddingTop + (100 - safeRate) * (chartHeight / 100);
      };
      
      const points = trendData.map((d, idx) => ({ 
        x: getX(idx), 
        y: getY(d.worshipRate), 
        rate: d.worshipRate, 
        ...d 
      }));
      
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

    return (
      <div className={!isPrint ? "report-paper-container" : ""}>
        {/* ==================== PAGE 1 ==================== */}
        <div className="report-page">
          <div>
            {pageHeader("종합 요약 및 추이")}
            <div className="report-section-title">1. 전체 현황 요약</div>
            <div className="report-grid-summary">
              <div className="report-summary-card">
                <span className="label">총원</span>
                <span className="value">{totalCount}명</span>
                <span className="delta" style={{ color: "#666" }}>활동 가능 성도</span>
              </div>
              <div className="report-summary-card">
                <span className="label">주일예배 출석</span>
                <span className="value">{attStats.present}명</span>
                <span className="delta" style={{ color: attStats.present >= prevSunday ? "#2e7d32" : "#c62828" }}>
                  {attStats.present >= prevSunday ? `▲ ${attStats.present - prevSunday}` : `▼ ${prevSunday - attStats.present}`} (전주대비)
                </span>
              </div>
              <div className="report-summary-card">
                <span className="label">평균 출석률</span>
                <span className="value">{overallRate}%</span>
                <span className="delta" style={{ color: prevStats && overallRate >= prevStats.rate ? "#2e7d32" : "#c62828" }}>
                  {prevStats ? (overallRate >= prevStats.rate ? `▲ ${overallRate - prevStats.rate}%` : `▼ ${prevStats.rate - overallRate}%`) : "-"}
                </span>
              </div>
              <div className="report-summary-card">
                <span className="label">미보고 인원</span>
                <span className="value" style={{ color: attStats.unreported > 0 ? "#e65100" : "#111" }}>{attStats.unreported}명</span>
                <span className="delta" style={{ color: "#777" }}>미마감 구역 존재</span>
              </div>
            </div>

            <div className="report-section-title">2. 주간 출석률 추이</div>
            {renderReportTrendChart()}

            <div className="report-section-title">3. 항목별 상세 현황</div>
            <table className="report-table-modern">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>이번 주 (당주)</th>
                  <th>지난 주 (전주)</th>
                  <th>전주 대비 증감</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>주일예배 출석</td>
                  <td>{curSunday}명</td>
                  <td>{prevSunday}명</td>
                  <td style={{ color: diffSunday >= 0 ? "#2e7d32" : "#c62828", fontWeight: "700" }}>
                    {diffSunday >= 0 ? `+${diffSunday}` : diffSunday}
                  </td>
                </tr>
                <tr>
                  <td>수요예배 출석</td>
                  <td>{curSamil}명</td>
                  <td>{prevSamil}명</td>
                  <td style={{ color: diffSamil >= 0 ? "#2e7d32" : "#c62828", fontWeight: "700" }}>
                    {diffSamil >= 0 ? `+${diffSamil}` : diffSamil}
                  </td>
                </tr>
                <tr>
                  <td>구역예배 출석</td>
                  <td>{curZone}명</td>
                  <td>{prevZone}명</td>
                  <td style={{ color: diffZone >= 0 ? "#2e7d32" : "#c62828", fontWeight: "700" }}>
                    {diffZone >= 0 ? `+${diffZone}` : diffZone}
                  </td>
                </tr>
                <tr>
                  <td>전도 인원 수</td>
                  <td>{evangelismCount}명</td>
                  <td>{prevEv}명</td>
                  <td style={{ color: diffEv >= 0 ? "#2e7d32" : "#c62828", fontWeight: "700" }}>
                    {diffEv >= 0 ? `+${diffEv}` : diffEv}
                  </td>
                </tr>
                <tr>
                  <td>십일조 참여 수</td>
                  <td>{tithingCount}명</td>
                  <td>{prevTi}명</td>
                  <td style={{ color: diffTi >= 0 ? "#2e7d32" : "#c62828", fontWeight: "700" }}>
                    {diffTi >= 0 ? `+${diffTi}` : diffTi}
                  </td>
                </tr>
                <tr>
                  <td>청체비 납부 수</td>
                  <td>{feeCount}명</td>
                  <td>{prevFe}명</td>
                  <td style={{ color: diffFe >= 0 ? "#2e7d32" : "#c62828", fontWeight: "700" }}>
                    {diffFe >= 0 ? `+${diffFe}` : diffFe}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "10px" }}>
              <div>
                <div className="report-section-title">4. 출석 우수 구역 TOP 3</div>
                {zoneRanks.slice(0, 3).map((z, idx) => (
                  <div className="report-bar-row" key={z.zoneId}>
                    <span className="report-bar-label">{idx + 1}위 {z.name}</span>
                    <div className="report-bar-track">
                      <div className="report-bar-fill" style={{ width: `${z.rate}%`, backgroundColor: "#2e7d32" }}></div>
                    </div>
                    <span className="report-bar-value">{z.rate}%</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="report-section-title">5. 출석 저조 구역</div>
                {[...zoneRanks].reverse().slice(0, 2).map((z, idx) => (
                  <div className="report-bar-row" key={z.zoneId}>
                    <span className="report-bar-label">{idx + 1}위 {z.name}</span>
                    <div className="report-bar-track">
                      <div className="report-bar-fill" style={{ width: `${z.rate}%`, backgroundColor: "#c62828" }}></div>
                    </div>
                    <span className="report-bar-value">{z.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {pageCountStyle(1)}
        </div>

        {/* ==================== PAGE 2 ==================== */}
        <div className="report-page">
          <div>
            {pageHeader("팀 및 구역 현황 분석")}
            <div className="report-section-title">1. 공동체(팀)별 현황</div>
            <table className="report-table-modern">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>팀명</th>
                  <th>출석률</th>
                  <th>주일 출석</th>
                  <th>결석</th>
                  <th>미보고</th>
                  <th>재적</th>
                </tr>
              </thead>
              <tbody>
                {teamRanks.map((t, idx) => {
                  const tMembers = members.filter(m => m.teamId === t.teamId && ["normal", "new"].includes(m.status));
                  let present = 0, absent = 0, unreported = 0;
                  tMembers.forEach(m => {
                    const rec = attendanceRecords.find(
                      r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "sunday"
                    );
                    const val = rec ? rec.value : "미보고";
                    if (isWorshipPresentValue(val)) present++;
                    else if (["결석", "X"].includes(getWorshipTypeValue(val))) absent++;
                    else unreported++;
                  });
                  return (
                    <tr key={t.teamId}>
                      <td style={{ fontWeight: "700" }}>{idx + 1}위</td>
                      <td style={{ fontWeight: "600" }}>{t.name}</td>
                      <td style={{ fontWeight: "700", color: "#1a365d" }}>{t.rate}%</td>
                      <td>{present}명</td>
                      <td>{absent}명</td>
                      <td style={{ color: unreported > 0 ? "#e65100" : "#222" }}>{unreported}명</td>
                      <td>{tMembers.length}명</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="report-section-title">2. 구역별 현황</div>
            <table className="report-table-modern" style={{ fontSize: "10px" }}>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>구역명</th>
                  <th>소속 팀</th>
                  <th>출석률</th>
                  <th>출석</th>
                  <th>결석</th>
                  <th>미보고</th>
                  <th>재적</th>
                </tr>
              </thead>
              <tbody>
                {zoneRanks.slice(0, 12).map((z, idx) => {
                  const zMembers = members.filter(m => m.zoneId === z.zoneId && ["normal", "new"].includes(m.status));
                  let present = 0, absent = 0, unreported = 0;
                  zMembers.forEach(m => {
                    const rec = attendanceRecords.find(
                      r => r.memberId === m.memberId && r.weekNo === activeWeekNo && r.category === "sunday"
                    );
                    const val = rec ? rec.value : "미보고";
                    if (isWorshipPresentValue(val)) present++;
                    else if (["결석", "X"].includes(getWorshipTypeValue(val))) absent++;
                    else unreported++;
                  });
                  return (
                    <tr key={z.zoneId}>
                      <td style={{ fontWeight: "700" }}>{idx + 1}위</td>
                      <td style={{ fontWeight: "600" }}>{z.name}</td>
                      <td>{z.teamName}</td>
                      <td style={{ fontWeight: "700", color: "#006064" }}>{z.rate}%</td>
                      <td>{present}명</td>
                      <td>{absent}명</td>
                      <td style={{ color: unreported > 0 ? "#e65100" : "#222" }}>{unreported}명</td>
                      <td>{zMembers.length}명</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="report-section-title">3. 새가족 등록 및 정착</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
              <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#666", fontWeight: "600" }}>당주 신규 새가족</div>
                <div style={{ fontSize: "20px", fontWeight: "800", margin: "6px 0", color: "#006064" }}>
                  {scopedMembers.filter(m => m.status === "new").length}명
                </div>
                <div style={{ fontSize: "10px", color: "#999" }}>구역 예배 및 케어 진행</div>
              </div>
              <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#666", fontWeight: "600" }}>당월 신규 등록 누적</div>
                <div style={{ fontSize: "20px", fontWeight: "800", margin: "6px 0", color: "#006064" }}>
                  {scopedMembers.filter(m => m.status === "new").length}명
                </div>
                <div style={{ fontSize: "10px", color: "#999" }}>원활한 정착 지원 중</div>
              </div>
              <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#666", fontWeight: "600" }}>정착 성도 수</div>
                <div style={{ fontSize: "20px", fontWeight: "800", margin: "6px 0", color: "#2e7d32" }}>
                  {scopedMembers.filter(m => m.status === "normal").length}명
                </div>
                <div style={{ fontSize: "10px", color: "#999" }}>정규 구역원 편성 완료</div>
              </div>
            </div>
          </div>
          {pageCountStyle(2)}
        </div>

        {/* ==================== PAGE 3 ==================== */}
        <div className="report-page">
          <div>
            {pageHeader("장기 결석자 및 미보고 관리")}
            <div className="report-section-title">1. 장기 결석자 현황 (4주 연속 결석/미보고)</div>
            <p style={{ fontSize: "11px", color: "#555", marginBottom: "10px" }}>* 해당 성도님들은 적극적인 심방과 소통이 권장됩니다.</p>
            <table className="report-table-modern">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>구역</th>
                  <th>직급</th>
                  <th>결석 주수</th>
                  <th>최근 출석 상태</th>
                </tr>
              </thead>
              <tbody>
                {longTermAbsentees.slice(0, 10).map((m) => (
                  <tr key={m.memberId}>
                    <td style={{ fontWeight: "700" }}>{m.name}</td>
                    <td>{getZoneName(m.zoneId)}</td>
                    <td>{m.rank || "청년"}</td>
                    <td style={{ color: "#c62828", fontWeight: "700" }}>{activeWeekNo}주 연속</td>
                    <td>당월 출석 이력 없음</td>
                  </tr>
                ))}
                {longTermAbsentees.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "#666", padding: "20px" }}>당주 장기 결석자가 없습니다. 아주 훌륭합니다!</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="report-section-title">2. 구역별 미보고자 명단</div>
            <p style={{ fontSize: "11px", color: "#555", marginBottom: "10px" }}>* 주일예배 출결 미등록 대상입니다. 신속한 보고 마감이 필요합니다.</p>
            <table className="report-table-modern">
              <thead>
                <tr>
                  <th>구역명</th>
                  <th>미보고 인원</th>
                  <th>해당 성도 성명</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const groups = {};
                  unreportedList.forEach(m => {
                    const zName = getZoneName(m.zoneId);
                    if (!groups[zName]) groups[zName] = [];
                    groups[zName].push(m);
                  });
                  const keys = Object.keys(groups);
                  return keys.map(zName => (
                    <tr key={zName}>
                      <td style={{ fontWeight: "700" }}>{zName}</td>
                      <td style={{ color: "#e65100", fontWeight: "700" }}>{groups[zName].length}명</td>
                      <td>{groups[zName].map(m => m.name).join(", ")}</td>
                    </tr>
                  ));
                })()}
                {unreportedList.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center", color: "#666", padding: "20px" }}>모든 구역의 출결 보고가 100% 마감되었습니다!</td>
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
            {pageHeader("목표 달성 및 활동 점검")}
            <div className="report-section-title">1. 주간 주요 활동 점검표</div>
            <table className="report-table-modern">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>목표</th>
                  <th>실적</th>
                  <th>달성률</th>
                  <th>진행 상태</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: "700" }}>전도 인원 수</td>
                  <td>10명</td>
                  <td>{evangelismCount}명</td>
                  <td style={{ fontWeight: "700" }}>{Math.round((evangelismCount / 10) * 100)}%</td>
                  <td>
                    <div className="report-bar-track" style={{ height: "6px", width: "100px" }}>
                      <div className="report-bar-fill" style={{ width: `${Math.min(100, (evangelismCount / 10) * 100)}%`, backgroundColor: "#2b6cb0" }}></div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "700" }}>십일조 참여 수</td>
                  <td>50명</td>
                  <td>{tithingCount}명</td>
                  <td style={{ fontWeight: "700" }}>{Math.round((tithingCount / 50) * 100)}%</td>
                  <td>
                    <div className="report-bar-track" style={{ height: "6px", width: "100px" }}>
                      <div className="report-bar-fill" style={{ width: `${Math.min(100, (tithingCount / 50) * 100)}%`, backgroundColor: "#2b6cb0" }}></div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "700" }}>청체비 납부 수</td>
                  <td>40명</td>
                  <td>{feeCount}명</td>
                  <td style={{ fontWeight: "700" }}>{Math.round((feeCount / 40) * 100)}%</td>
                  <td>
                    <div className="report-bar-track" style={{ height: "6px", width: "100px" }}>
                      <div className="report-bar-fill" style={{ width: `${Math.min(100, (feeCount / 40) * 100)}%`, backgroundColor: "#2b6cb0" }}></div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "700" }}>새가족 정착률</td>
                  <td>5명</td>
                  <td>{scopedMembers.filter(m => m.status === "new").length}명</td>
                  <td style={{ fontWeight: "700" }}>{Math.round((scopedMembers.filter(m => m.status === "new").length / 5) * 100)}%</td>
                  <td>
                    <div className="report-bar-track" style={{ height: "6px", width: "100px" }}>
                      <div className="report-bar-fill" style={{ width: `${Math.min(100, (scopedMembers.filter(m => m.status === "new").length / 5) * 100)}%`, backgroundColor: "#2b6cb0" }}></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="report-section-title" style={{ marginTop: "40px" }}>2. 교구 공동 기도제목</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              <div style={{ border: "1px solid #e2e2e2", padding: "12px", borderRadius: "6px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "800", color: "#2b6cb0", fontSize: "14px" }}>1.</span>
                <p style={{ fontSize: "11px", color: "#333", margin: 0 }}>
                  교구 내 모든 성도들이 주일예배와 수요예배에 기쁨으로 참석하며, 영육 간에 강건하고 주님의 돌보심 아래 평안과 기쁨이 넘치는 가정이 되도록 기도합니다.
                </p>
              </div>
              <div style={{ border: "1px solid #e2e2e2", padding: "12px", borderRadius: "6px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "800", color: "#2b6cb0", fontSize: "14px" }}>2.</span>
                <p style={{ fontSize: "11px", color: "#333", margin: 0 }}>
                  새로 등록한 새가족들이 예수 그리스도의 사랑을 깨닫고 몸 된 제단에 원활하게 정착하며, 구역원들과 따뜻한 친교를 맺음으로 영적 성장이 이루어지길 간구합니다.
                </p>
              </div>
              <div style={{ border: "1px solid #e2e2e2", padding: "12px", borderRadius: "6px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "800", color: "#2b6cb0", fontSize: "14px" }}>3.</span>
                <p style={{ fontSize: "11px", color: "#333", margin: 0 }}>
                  구역 모임이 더욱 불타오르고, 리더(구역장)님들에게 지혜와 성령의 충만함을 주시어 구역원들을 잘 인도하고 말씀으로 굳건히 세우는 도구로 귀히 쓰이도록 기도합니다.
                </p>
              </div>
              <div style={{ border: "1px solid #e2e2e2", padding: "12px", borderRadius: "6px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontWeight: "800", color: "#2b6cb0", fontSize: "14px" }}>4.</span>
                <p style={{ fontSize: "11px", color: "#333", margin: 0 }}>
                  교회 표어에 맞춰 전도 사역에 앞장서며, 믿지 않는 이웃들과 장기 결석 중인 성도들의 마음의 문을 열어 주사 하나님께로 돌아오는 역사가 있게 하옵소서.
                </p>
              </div>
            </div>
          </div>
          {pageCountStyle(4)}
        </div>

        {/* ==================== PAGE 5 ==================== */}
        <div className="report-page">
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {pageHeader("종합 분석 및 평가")}
            <div className="report-section-title">1. 종합 분석 요약</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "10px 0" }}>
              {dynamicComments.map((comment, i) => (
                <div key={i} className="report-callout-box" style={{ borderLeftColor: i % 2 === 0 ? "#1a365d" : "#2b6cb0" }}>
                  {comment}
                </div>
              ))}
            </div>

            <div className="report-section-title" style={{ marginTop: "20px" }}>2. 교구 건강도 평가</div>
            <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "16px", backgroundColor: "#fafafa" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "12px" }}>
                <span style={{ 
                  fontSize: "24px", 
                  fontWeight: "900", 
                  color: "white", 
                  backgroundColor: overallRate >= 80 ? "#2e7d32" : (overallRate >= 70 ? "#006064" : "#e65100"),
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {overallRate >= 80 ? "S" : (overallRate >= 70 ? "A" : "B")}
                </span>
                <div>
                  <h4 style={{ fontSize: "13px", color: "#111", margin: 0, fontWeight: "700" }}>
                    영적 건강 등급: {overallRate >= 80 ? "최우수 공동체" : (overallRate >= 70 ? "우수 공동체" : "관심 관리 대상")}
                  </h4>
                  <p style={{ fontSize: "11px", color: "#666", margin: "2px 0 0 0" }}>전체 주일/수요/구역 출석 통계를 가중 분석한 평정 수치입니다.</p>
                </div>
              </div>
              <p style={{ fontSize: "11px", color: "#333", lineHeight: "1.6", margin: 0 }}>
                {overallRate >= 80 
                  ? "주일 및 주중 예배 참석률이 최상의 궤도에 올랐습니다. 성도님들 간의 깊은 성경 공부 모임을 확대하고 소그룹 연합 프로젝트를 추진하여 선한 영향력을 더 키워가십시오." 
                  : (overallRate >= 70 
                    ? "성도들의 평균 예배 참여가 양호한 궤도입니다. 다만 미보고 성도와 특정 저조 구역의 예배 공백을 메우기 위한 리더 모임 강화와 심방이 필요한 시점입니다." 
                    : "일부 예배 참여가 장기간 침체되어 구역 예배 활성화와 성도 개별 밀착 대면 심방이 반드시 시급합니다. 구역장들과 연대하여 기도 주간을 선포하시기 바랍니다."
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
      <div className="dashboard-wrapper animate-fade">
      {/* Scope Info Banner */}
      <div className="dashboard-banner glass-panel">
        <TrendingUp size={20} className="banner-icon" />
        <div>
          <h3>{getScopeLabel()} 주간 리포트</h3>
          <p>2026년 {activeMonthId.split("-")[1]}월 {activeWeekNo}주차 기준으로 자동 집계된 수치입니다.</p>
        </div>
        <button 
          onClick={() => setShowWeeklyReportModal(true)} 
          className="btn btn-secondary btn-sm no-print"
          style={{ marginLeft: "auto", marginRight: "16px" }}
        >
          <FileText size={14} />
          <span>주간 리포트 생성</span>
        </button>
        <div className="overall-rate-display">
          <span className="rate-num">{overallRate}%</span>
          <span className="rate-lbl">평균 출석률</span>
        </div>
      </div>

      {/* General Summary Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div 
          onClick={() => handleCardClick("교구 총원", "total")}
          className="stats-card glass-panel clickable-card" 
          style={{ padding: "14px 20px", cursor: "pointer" }}
          title="클릭 시 전체 명단 확인"
        >
          <div className="stats-icon-wrapper blue" style={{ width: "40px", height: "40px" }}>
            <Users size={20} />
          </div>
          <div className="stats-info">
            <p className="stats-label" style={{ fontSize: "11px" }}>교구 총원</p>
            <h2 className="stats-value" style={{ fontSize: "20px", margin: "2px 0 0 0" }}>{totalCount}명</h2>
            <p className="stats-subtext" style={{ fontSize: "10px" }}>활동 가능 성도</p>
          </div>
        </div>

        <div 
          onClick={() => handleCardClick("출결 제외 성도", "excluded")}
          className="stats-card glass-panel clickable-card" 
          style={{ padding: "14px 20px", cursor: "pointer" }}
          title="클릭 시 출결 제외자 명단 확인"
        >
          <div className="stats-icon-wrapper purple" style={{ width: "40px", height: "40px" }}>
            <UserX size={20} />
          </div>
          <div className="stats-info">
            <p className="stats-label" style={{ fontSize: "11px" }}>출결 제외</p>
            <h2 className="stats-value" style={{ fontSize: "20px", margin: "2px 0 0 0" }}>{excludedCount}명</h2>
            <p className="stats-subtext" style={{ fontSize: "10px" }}>관리 대상 제외자</p>
          </div>
        </div>
      </div>

      {/* 예배 현황 Section */}
      <div className="dashboard-section-group">
        <h3 className="section-group-title">
          <span className="title-decorator"></span> 예배 현황
        </h3>
        <div className="dashboard-grid">
          <div 
            onClick={() => handleCardClick("주일 출석", "sunday_present")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 출석자 명단 확인"
          >
            <div className="stats-icon-wrapper emerald">
              <CheckCircle size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">주일 출석</p>
              <h2 className="stats-value">{attStats.present}명</h2>
              <p className="stats-subtext">대면/비대면/대체 포함</p>
            </div>
          </div>

          <div 
            onClick={() => handleCardClick("주일 결석", "sunday_absent")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 결석자 명단 확인"
          >
            <div className="stats-icon-wrapper gold">
              <AlertCircle size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">주일 결석</p>
              <h2 className="stats-value">{attStats.absent}명</h2>
              <p className="stats-subtext">보고된 결석자</p>
            </div>
          </div>

          <div 
            onClick={() => handleCardClick("주일 미보고", "sunday_unreported")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 미보고자 명단 확인"
          >
            <div className="stats-icon-wrapper muted">
              <HelpCircle size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">주일 미보고</p>
              <h2 className="stats-value">{attStats.unreported}명</h2>
              <p className="stats-subtext">출결 입력 필요</p>
            </div>
          </div>
        </div>
      </div>

      {/* 교육 현황 Section */}
      <div className="dashboard-section-group">
        <h3 className="section-group-title">
          <span className="title-decorator"></span> 소그룹 및 교육 현황
        </h3>
        <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "16px" }}>
          <div 
            onClick={() => handleCardClick("구역예배 대면", "zone_entered")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 대면 참석자 명단 확인"
          >
            <div className="stats-icon-wrapper emerald">
              <CheckCircle size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">구역예배 대면</p>
              <h2 className="stats-value">{zoneWorshipStats.entered}명</h2>
              <p className="stats-subtext">대면 참석</p>
            </div>
          </div>

          <div 
            onClick={() => handleCardClick("구역예배 줌/개별", "zone_delivered")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 줌/개별 참석자 명단 확인"
          >
            <div className="stats-icon-wrapper blue">
              <HeartHandshake size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">구역예배 줌/개별</p>
              <h2 className="stats-value">{zoneWorshipStats.delivered}명</h2>
              <p className="stats-subtext">줌/개별 참석</p>
            </div>
          </div>

          <div 
            onClick={() => handleCardClick("구역예배 불참", "zone_undelivered")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 불참자 명단 확인"
          >
            <div className="stats-icon-wrapper gold">
              <AlertCircle size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">구역예배 불참</p>
              <h2 className="stats-value">{zoneWorshipStats.undelivered}명</h2>
              <p className="stats-subtext">불참 인원</p>
            </div>
          </div>

          <div 
            onClick={() => handleCardClick("구역예배 미보고", "zone_unreported")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 미보고자 명단 확인"
          >
            <div className="stats-icon-wrapper muted">
              <HelpCircle size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">구역예배 미보고</p>
              <h2 className="stats-value">{zoneWorshipStats.unreported}명</h2>
              <p className="stats-subtext">보고 대기 인원</p>
            </div>
          </div>

          <div 
            onClick={() => handleCardClick("심야라디오", "radio")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 라디오 동참자 명단 확인"
          >
            <div className="stats-icon-wrapper purple">
              <Award size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">심야라디오</p>
              <h2 className="stats-value">{getWeeklyCount("radio")}명</h2>
              <p className="stats-subtext">라디오 동참 인원</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div 
            onClick={() => handleCardClick("정규시험", "test_present")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 정규시험 응시자 명단 확인"
          >
            <div className="stats-icon-wrapper emerald">
              <CheckCircle size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">정규시험</p>
              <h2 className="stats-value">{testStats.present}명</h2>
              <p className="stats-subtext">정규시험 인원</p>
            </div>
          </div>

          <div 
            onClick={() => handleCardClick("시험 비대면", "test_online")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 비대면 시험 참석자 명단 확인"
          >
            <div className="stats-icon-wrapper blue">
              <HeartHandshake size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">시험 비대면</p>
              <h2 className="stats-value">{testStats.online}명</h2>
              <p className="stats-subtext">비대면 시험 인원</p>
            </div>
          </div>

          <div 
            onClick={() => handleCardClick("시험 미보고", "test_unreported")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 시험 미보고자 명단 확인"
          >
            <div className="stats-icon-wrapper muted">
              <HelpCircle size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">시험 미보고</p>
              <h2 className="stats-value">{testStats.unreported}명</h2>
              <p className="stats-subtext">보고 대기 인원</p>
            </div>
          </div>
        </div>
      </div>

      {/* 회계 현황 Section */}
      <div className="dashboard-section-group">
        <h3 className="section-group-title">
          <span className="title-decorator"></span> 회계 및 재정 현황
        </h3>
        <div className="dashboard-grid achievements-grid">
          <div 
            onClick={() => handleCardClick("십일조 인원", "tithing")}
            className="stats-card glass-panel ach-card clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 십일조 명단 확인"
          >
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

          <div 
            onClick={() => handleCardClick("청체비 납부", "fee")}
            className="stats-card glass-panel ach-card clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 청체비 납부 명단 확인"
          >
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
      </div>

      {/* 전도 현황 Section */}
      <div className="dashboard-section-group" style={{ marginBottom: "8px" }}>
        <h3 className="section-group-title">
          <span className="title-decorator"></span> 전도 및 사역 현황
        </h3>
        <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div 
            onClick={() => handleCardClick("전도 인원", "evangelism")}
            className="stats-card glass-panel ach-card clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 전도 인원 명단 확인"
          >
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

          <div 
            onClick={() => handleCardClick("전도단 대면", "evteam_present")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 대면 참석 명단 확인"
          >
            <div className="stats-icon-wrapper emerald">
              <CheckCircle size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">전도단 대면</p>
              <h2 className="stats-value">{evTeamStats.present}명</h2>
              <p className="stats-subtext">대면 참석 인원</p>
            </div>
          </div>

          <div 
            onClick={() => handleCardClick("전도단 비대면", "evteam_online")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 비대면 참석 명단 확인"
          >
            <div className="stats-icon-wrapper blue">
              <HeartHandshake size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">전도단 비대면</p>
              <h2 className="stats-value">{evTeamStats.online}명</h2>
              <p className="stats-subtext">비대면 참석 인원</p>
            </div>
          </div>

          <div 
            onClick={() => handleCardClick("전도단 미보고", "evteam_unreported")}
            className="stats-card glass-panel clickable-card"
            style={{ cursor: "pointer" }}
            title="클릭 시 미보고 명단 확인"
          >
            <div className="stats-icon-wrapper muted">
              <HelpCircle size={22} />
            </div>
            <div className="stats-info">
              <p className="stats-label">전도단 미보고</p>
              <h2 className="stats-value">{evTeamStats.unreported}명</h2>
              <p className="stats-subtext">보고 대기 인원</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Trend Section */}
      {trendData.length > 0 && (
        <div className="stats-card glass-panel trend-card-panel">
          <div className="panel-header" style={{ width: "100%", borderBottom: "1px solid var(--glass-border)", paddingBottom: "12px", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "15px", color: "var(--text-primary)" }}>출석률 및 참여율 추이</h3>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>주차별 예배 출석, 시험 제출, 전도단 참석률 변화 흐름 (당월)</span>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px", fontSize: "11px", justifyContent: "flex-end", width: "100%" }}>
            <div 
              onClick={() => setVisibleLines(prev => ({ ...prev, worship: !prev.worship }))}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "6px", 
                cursor: "pointer", 
                userSelect: "none",
                opacity: visibleLines.worship ? 1 : 0.4,
                textDecoration: visibleLines.worship ? "none" : "line-through",
                transition: "opacity 0.2s ease"
              }}
            >
              <span style={{ display: "inline-block", width: "12px", height: "3px", backgroundColor: "var(--accent-cyan)", borderRadius: "2px" }}></span>
              <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>예배 출석률</span>
            </div>
            <div 
              onClick={() => setVisibleLines(prev => ({ ...prev, test: !prev.test }))}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "6px", 
                cursor: "pointer", 
                userSelect: "none",
                opacity: visibleLines.test ? 1 : 0.4,
                textDecoration: visibleLines.test ? "none" : "line-through",
                transition: "opacity 0.2s ease"
              }}
            >
              <span style={{ display: "inline-block", width: "12px", height: "3px", backgroundColor: "var(--accent-emerald)", borderRadius: "2px" }}></span>
              <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>시험 참여율</span>
            </div>
            <div 
              onClick={() => setVisibleLines(prev => ({ ...prev, ev: !prev.ev }))}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "6px", 
                cursor: "pointer", 
                userSelect: "none",
                opacity: visibleLines.ev ? 1 : 0.4,
                textDecoration: visibleLines.ev ? "none" : "line-through",
                transition: "opacity 0.2s ease"
              }}
            >
              <span style={{ display: "inline-block", width: "12px", height: "3px", backgroundColor: "#a855f7", borderRadius: "2px" }}></span>
              <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>전도단 참석률</span>
            </div>
          </div>

          <div className="trend-chart-container" style={{ width: "100%", height: "240px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <svg viewBox={`0 0 ${svgData.width} ${svgData.height}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
              {svgData.grids}
              
              {/* Week labels (X-Axis labels) */}
              {svgData.worshipPoints && svgData.worshipPoints.map((p, idx) => (
                <text 
                  key={`week-${idx}`}
                  x={p.x} 
                  y={svgData.height - 8} 
                  fill="var(--text-secondary)" 
                  fontSize="10" 
                  textAnchor="middle"
                >
                  {p.week}주차
                </text>
              ))}

              {/* 1. Worship Line & Points (Cyan) */}
              {visibleLines.worship && svgData.worshipPathD && (
                <path 
                  d={svgData.worshipPathD} 
                  fill="none" 
                  stroke="var(--accent-cyan)" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}
              {visibleLines.worship && svgData.worshipPoints && svgData.worshipPoints.map((p, idx) => (
                <g key={`worship-${idx}`}>
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill="var(--bg-secondary)" 
                    stroke="var(--accent-cyan)" 
                    strokeWidth="2.5" 
                  />
                  <text 
                    x={p.x} 
                    y={p.y - 10} 
                    fill="var(--text-primary)" 
                    fontSize="9" 
                    fontWeight="700"
                    textAnchor="middle"
                    style={{ textShadow: "0 0 3px var(--bg-primary)" }}
                  >
                    {p.rate}%
                  </text>
                </g>
              ))}

              {/* 2. Test Line & Points (Emerald) */}
              {visibleLines.test && svgData.testPathD && (
                <path 
                  d={svgData.testPathD} 
                  fill="none" 
                  stroke="var(--accent-emerald)" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}
              {visibleLines.test && svgData.testPoints && svgData.testPoints.map((p, idx) => (
                <g key={`test-${idx}`}>
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill="var(--bg-secondary)" 
                    stroke="var(--accent-emerald)" 
                    strokeWidth="2.5" 
                  />
                  <text 
                    x={p.x} 
                    y={p.y + 14} 
                    fill="var(--text-primary)" 
                    fontSize="9" 
                    fontWeight="700"
                    textAnchor="middle"
                    style={{ textShadow: "0 0 3px var(--bg-primary)" }}
                  >
                    {p.rate}%
                  </text>
                </g>
              ))}

              {/* 3. Evangelism Line & Points (Purple) */}
              {visibleLines.ev && svgData.evPathD && (
                <path 
                  d={svgData.evPathD} 
                  fill="none" 
                  stroke="#a855f7" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}
              {visibleLines.ev && svgData.evPoints && svgData.evPoints.map((p, idx) => (
                <g key={`ev-${idx}`}>
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill="var(--bg-secondary)" 
                    stroke="#a855f7" 
                    strokeWidth="2.5" 
                  />
                  <text 
                    x={p.x} 
                    y={p.y - 10} 
                    fill="var(--text-primary)" 
                    fontSize="9" 
                    fontWeight="700"
                    textAnchor="middle"
                    style={{ textShadow: "0 0 3px var(--bg-primary)" }}
                  >
                    {p.rate}%
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

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
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>예배 종합 통계 (상위 5개)</span>
                {zoneRanks.length > 5 && (
                  <button 
                    onClick={() => setShowMoreRankingsModal(true)} 
                    className="no-print"
                    style={{ 
                      fontSize: "11px", 
                      color: "var(--accent-cyan)", 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: "2px",
                      fontWeight: 600
                    }}
                  >
                    <span>더보기</span>
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
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
    </div>

      {/* ---------------- MODALS & PRINT TARGET ---------------- */}
      
      {/* 0. Card Details Popup Modal */}
      {clickedCardDetails && (
        <div className="modal-backdrop no-print" onClick={() => setClickedCardDetails(null)}>
          <div className="modal-content glass-panel animate-slide" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{clickedCardDetails.title} ({clickedCardDetails.members.length}명)</h3>
              <button onClick={() => setClickedCardDetails(null)} className="modal-close-btn">
                <X size={16} />
              </button>
            </div>
            
            <div style={{ maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", margin: "10px 0", paddingRight: "4px" }}>
              {(() => {
                // Group members by teamId
                const groups = {};
                clickedCardDetails.members.forEach(m => {
                  const tName = getTeamName(m.teamId) || "소속 없음";
                  if (!groups[tName]) groups[tName] = [];
                  groups[tName].push(m);
                });
                
                const teamNames = Object.keys(groups).sort();
                
                if (clickedCardDetails.members.length === 0) {
                  return (
                    <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                      해당하는 인원이 없습니다.
                    </p>
                  );
                }
                
                return teamNames.map(tName => (
                  <div key={tName} style={{ 
                    border: "1px solid var(--glass-border)", 
                    borderRadius: "8px", 
                    padding: "12px", 
                    backgroundColor: "rgba(255,255,255,0.02)" 
                  }}>
                    <h4 style={{ fontSize: "14px", color: "var(--accent-cyan)", marginBottom: "8px", fontWeight: "700", display: "flex", justifyContent: "space-between" }}>
                      <span>{tName}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{groups[tName].length}명</span>
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {groups[tName].map(m => {
                        const zName = getZoneName(m.zoneId) || "구역 없음";
                        return (
                          <span key={m.memberId} style={{ 
                            fontSize: "12px", 
                            color: "var(--text-primary)", 
                            backgroundColor: "var(--bg-primary)", 
                            border: "1px solid var(--glass-border)", 
                            padding: "4px 8px", 
                            borderRadius: "4px" 
                          }}>
                            {m.name} <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>({zName})</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              {clickedCardDetails.members.length > 0 && (
                <button 
                  onClick={() => {
                    const textLines = [];
                    const groups = {};
                    clickedCardDetails.members.forEach(m => {
                      const tName = getTeamName(m.teamId) || "소속 없음";
                      if (!groups[tName]) groups[tName] = [];
                      groups[tName].push(m);
                    });
                    
                    textLines.push(`[${getScopeLabel()} ${activeMonthId.split("-")[0]}년 ${parseInt(activeMonthId.split("-")[1])}월 ${activeWeekNo}주차 - ${clickedCardDetails.title} (총 ${clickedCardDetails.members.length}명)]`);
                    
                    Object.keys(groups).sort().forEach(tName => {
                      const names = groups[tName].map(m => {
                        const zName = getZoneName(m.zoneId) || "구역 없음";
                        return `${m.name}(${zName})`;
                      }).join(", ");
                      textLines.push(`- ${tName}: ${names}`);
                    });
                    
                    navigator.clipboard.writeText(textLines.join("\n"))
                      .then(() => alert("명단이 클립보드에 복사되었습니다."))
                      .catch(err => alert("복사 실패: " + err));
                  }} 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  <Clipboard size={14} />
                  <span>명단 복사 (카톡용)</span>
                </button>
              )}
              <button onClick={() => setClickedCardDetails(null)} className="btn btn-secondary" style={{ flex: clickedCardDetails.members.length > 0 ? 0.4 : 1 }}>
                <span>닫기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Unreported Members Modal */}
      {showUnreportedModal && (
        <div className="modal-backdrop no-print" onClick={() => setShowUnreportedModal(false)}>
          <div className="modal-content glass-panel animate-slide" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{getScopeLabel()} 미보고 성도 ({unreportedList.length}명)</h3>
              <button onClick={() => setShowUnreportedModal(false)} className="modal-close-btn">
                <X size={16} />
              </button>
            </div>
            
            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", margin: "10px 0" }}>
              {(() => {
                const groups = {};
                unreportedList.forEach(m => {
                  const zName = getZoneName(m.zoneId);
                  if (!groups[zName]) groups[zName] = [];
                  groups[zName].push(m);
                });
                
                return Object.keys(groups).map(zName => (
                  <div key={zName} style={{ borderBottom: "1px solid var(--glass-border)", paddingBottom: "8px" }}>
                    <h4 style={{ fontSize: "13px", color: "var(--accent-cyan)", marginBottom: "4px" }}>{zName}</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                      {groups[zName].map(m => m.name).join(", ")}
                    </p>
                  </div>
                ));
              })()}
              {unreportedList.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>미보고 인원이 없습니다. 모두 완료되었습니다!</p>
              )}
            </div>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              {unreportedList.length > 0 && (
                <button onClick={handleCopyUnreported} className="btn btn-primary" style={{ flex: 1 }}>
                  <Clipboard size={14} />
                  <span>명단 텍스트 복사</span>
                </button>
              )}
              <button onClick={() => setShowUnreportedModal(false)} className="btn btn-secondary" style={{ flex: unreportedList.length > 0 ? 0.5 : 1 }}>
                <span>닫기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Full Zone Rankings Modal */}
      {showMoreRankingsModal && (
        <div className="modal-backdrop no-print" onClick={() => setShowMoreRankingsModal(false)}>
          <div className="modal-content glass-panel animate-slide" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>구역별 출석률 전체 순위</h3>
              <button onClick={() => setShowMoreRankingsModal(false)} className="modal-close-btn">
                <X size={16} />
              </button>
            </div>
            
            <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", margin: "10px 0", paddingRight: "4px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--glass-border)" }}>
                    <th style={{ padding: "8px", color: "var(--text-muted)" }}>순위</th>
                    <th style={{ padding: "8px", color: "var(--text-muted)" }}>구역명</th>
                    <th style={{ padding: "8px", color: "var(--text-muted)" }}>소속 교구</th>
                    <th style={{ padding: "8px", color: "var(--text-muted)" }}>인원</th>
                    <th style={{ padding: "8px", color: "var(--text-muted)", textAlign: "right" }}>출석률</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneRanks.map((zone, idx) => (
                    <tr key={zone.zoneId} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                      <td style={{ padding: "10px 8px", fontWeight: "700" }}>{idx + 1}위</td>
                      <td style={{ padding: "10px 8px", fontWeight: "600" }}>{zone.name}</td>
                      <td style={{ padding: "10px 8px", color: "var(--text-secondary)" }}>{zone.teamName}</td>
                      <td style={{ padding: "10px 8px", color: "var(--text-secondary)" }}>{zone.count}명</td>
                      <td style={{ padding: "10px 8px", fontWeight: "700", color: "var(--accent-cyan)", textAlign: "right" }}>{zone.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: "flex", marginTop: "16px" }}>
              <button onClick={() => setShowMoreRankingsModal(false)} className="btn btn-secondary" style={{ width: "100%" }}>
                <span>닫기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Weekly Report Print Preview Modal */}
      {showWeeklyReportModal && (
        <div className="modal-backdrop no-print" onClick={() => setShowWeeklyReportModal(false)}>
          <div className="modal-content glass-panel animate-slide" style={{ maxWidth: "860px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>주간 보고서 미리보기 (A4 5페이지 규격)</h3>
              <button onClick={() => setShowWeeklyReportModal(false)} className="modal-close-btn">
                <X size={16} />
              </button>
            </div>
            
            {renderWeeklyReportPages(false)}
            
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1 }}>
                <span>PDF 저장 / 인쇄하기</span>
              </button>
              <button onClick={() => setShowWeeklyReportModal(false)} className="btn btn-secondary" style={{ flex: 0.3 }}>
                <span>취소</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Weekly Report Print Layout (Visible ONLY on print) */}
      <div className="weekly-report-print-target">
        {renderWeeklyReportPages(true)}
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

        .dashboard-section-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 20px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          margin-top: 8px;
        }

        .section-group-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-secondary);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .title-decorator {
          width: 4px;
          height: 14px;
          background: linear-gradient(to bottom, var(--accent-cyan), var(--accent-blue));
          border-radius: 2px;
          display: inline-block;
        }

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

        .stats-icon-wrapper.blue { background-color: hsla(210, 100%, 55%, 0.1); color: var(--accent-blue); }
        .stats-icon-wrapper.emerald { background-color: hsla(150, 70%, 50%, 0.1); color: var(--accent-emerald); }
        .stats-icon-wrapper.gold { background-color: hsla(42, 90%, 55%, 0.1); color: var(--accent-gold); }
        .stats-icon-wrapper.muted { background-color: hsla(220, 15%, 50%, 0.1); color: var(--text-secondary); }
        .stats-icon-wrapper.cyan { background-color: hsla(185, 90%, 48%, 0.1); color: var(--accent-cyan); }
        .stats-icon-wrapper.purple { background-color: hsla(280, 80%, 60%, 0.10); color: hsl(280, 80%, 65%); }

        .stats-info { flex: 1; }
        .stats-label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
        .stats-value { font-size: 22px; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
        .stats-subtext { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

        .ach-card { flex-direction: column; align-items: stretch; gap: 12px; }
        .ach-card .stats-icon-wrapper { align-self: flex-start; }
        .progress-bar-container { height: 6px; background-color: var(--bg-primary); border-radius: var(--radius-full); overflow: hidden; margin-top: 8px; border: 1px solid var(--glass-border); }
        .progress-bar-fill { height: 100%; border-radius: var(--radius-full); }
        .progress-bar-fill.cyan { background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue)); }
        .progress-bar-fill.gold { background: linear-gradient(90deg, var(--accent-gold), hsl(35, 100%, 50%)); }
        .progress-bar-fill.blue { background: linear-gradient(90deg, var(--accent-blue), hsl(230, 90%, 60%)); }

        .rankings-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
        .ranking-panel { padding: 24px; }
        .panel-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 20px; border-bottom: 1px solid var(--glass-border); padding-bottom: 12px; }
        .panel-header h3 { font-size: 15px; color: var(--text-primary); }
        .panel-header span { font-size: 11px; color: var(--text-muted); font-weight: 500; }
        .ranking-list { display: flex; flex-direction: column; gap: 16px; }
        .ranking-item { display: flex; align-items: center; gap: 16px; }
        .rank-badge { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; font-weight: 700; font-size: 12px; background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue)); color: white; box-shadow: 0 4px 10px 0 hsla(185, 90%, 48%, 0.2); }
        .rank-badge.zone-badge { background: linear-gradient(135deg, var(--accent-blue), hsl(240, 60%, 60%)); box-shadow: 0 4px 10px 0 hsla(210, 100%, 55%, 0.2); }
        .rank-details { flex: 1; }
        .rank-name-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .rank-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .rank-percent { font-size: 13px; font-weight: 700; color: var(--accent-cyan); }
        .chart-bar-container { height: 8px; background-color: var(--bg-primary); border-radius: var(--radius-full); overflow: hidden; border: 1px solid var(--glass-border); }
        .chart-bar-fill { height: 100%; border-radius: var(--radius-full); transition: width 1s ease-in-out; }
        .chart-bar-fill.team-color { background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue)); }
        .chart-bar-fill.zone-color { background: linear-gradient(90deg, var(--accent-blue), hsl(240, 60%, 65%)); }
        .rank-sub { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
        .no-rankings { text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px; }

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

        .trend-card-panel {
          flex-direction: column;
          align-items: stretch;
        }

        .clickable-card {
          transition: transform var(--transition-fast), border-color var(--transition-fast);
        }
        .clickable-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-cyan) !important;
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

        @media print {
          .desktop-sidebar, 
          .mobile-nav-bar, 
          .header, 
          .dashboard-wrapper, 
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

          .weekly-report-print-target {
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
          .weekly-report-print-target {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
