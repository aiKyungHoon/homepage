import React, { createContext, useContext, useState, useEffect } from "react";
import { isMockEnabled, db, auth } from "../firebase";
import { useAuth } from "./AuthContext";
import {
  collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc,
  query, where, deleteDoc, writeBatch, orderBy, limit
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import * as mockInitData from "../utils/mockData";

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const { currentUser } = useAuth();

  // App-wide state
  const [teams, setTeams] = useState([]);
  const [zones, setZones] = useState([]);
  const [members, setMembers] = useState([]);
  const [months, setMonths] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [monthlyAchievements, setMonthlyAchievements] = useState([]);
  const [memberNotes, setMemberNotes] = useState([]);
  const [visitationRecords, setVisitationRecords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [appSettings, setAppSettings] = useState({
    attendanceDownloadNames: [],
    attendanceDownloadTargets: []
  });

  const [activeMonthId, setActiveMonthId] = useState("");
  const [activeWeekNo, setActiveWeekNo] = useState(1);
  const [loading, setLoading] = useState(true);

  // 1. Standalone Refresh Data Function
  const refreshData = async () => {
    console.log("refreshData() triggered. currentUser:", currentUser?.uid);
    if (!isMockEnabled && !currentUser) {
      setTeams([]);
      setZones([]);
      setMembers([]);
      setMonths([]);
      setAttendanceRecords([]);
      setMonthlyAchievements([]);
      setMemberNotes([]);
      setVisitationRecords([]);
      setAuditLogs([]);
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (isMockEnabled) {
      // --- LOCAL STORAGE MOCK MODE ---
      if (!localStorage.getItem("mock_teams")) {
        localStorage.setItem("mock_teams", JSON.stringify(mockInitData.initialTeams));
        localStorage.setItem("mock_zones", JSON.stringify(mockInitData.initialZones));
        localStorage.setItem("mock_members", JSON.stringify(mockInitData.initialMembers));
        localStorage.setItem("mock_months", JSON.stringify(mockInitData.initialMonths));
        localStorage.setItem("mock_attendance", JSON.stringify(mockInitData.initialAttendanceRecords));
        localStorage.setItem("mock_achievements", JSON.stringify(mockInitData.initialMonthlyAchievements));
        localStorage.setItem("mock_member_notes", JSON.stringify([]));
        localStorage.setItem("mock_audit_logs", JSON.stringify(mockInitData.initialAuditLogs));
      }
      if (!localStorage.getItem("mock_member_notes")) {
        localStorage.setItem("mock_member_notes", JSON.stringify([]));
      }
      if (!localStorage.getItem("mock_app_settings")) {
        localStorage.setItem("mock_app_settings", JSON.stringify({ attendanceDownloadNames: [], attendanceDownloadTargets: [] }));
      }

      setTeams(JSON.parse(localStorage.getItem("mock_teams")));
      setZones(JSON.parse(localStorage.getItem("mock_zones")));
      setMembers(JSON.parse(localStorage.getItem("mock_members")));

      const loadedMonths = JSON.parse(localStorage.getItem("mock_months"));
      setMonths(loadedMonths);

      const openMonth = loadedMonths.find(m => m.status === "open") || loadedMonths[loadedMonths.length - 1];
      if (openMonth && !activeMonthId) {
        setActiveMonthId(openMonth.monthId);
      }

      const allAtt = JSON.parse(localStorage.getItem("mock_attendance")) || [];
      setAttendanceRecords(allAtt.filter(r => r.monthId === (activeMonthId || openMonth?.monthId)));

      const allAch = JSON.parse(localStorage.getItem("mock_achievements")) || [];
      setMonthlyAchievements(allAch.filter(a => a.monthId === (activeMonthId || openMonth?.monthId)));

      const allNotes = JSON.parse(localStorage.getItem("mock_member_notes")) || [];
      setMemberNotes(allNotes.filter(n => n.monthId === (activeMonthId || openMonth?.monthId)));

      setAuditLogs(JSON.parse(localStorage.getItem("mock_audit_logs")));

      const storedMockUsers = localStorage.getItem("mock_users");
      let parsedMockUsers = [];
      if (storedMockUsers) {
        try {
          parsedMockUsers = JSON.parse(storedMockUsers);
        } catch (e) {
          parsedMockUsers = [];
        }
      }
      if (parsedMockUsers.length === 0 || !parsedMockUsers.some(u => u.username === "admin3")) {
        localStorage.setItem("mock_users", JSON.stringify(mockInitData.demoUsers));
      }
      setUsers(JSON.parse(localStorage.getItem("mock_users")));

      const mockVisits = JSON.parse(localStorage.getItem("mock_visitation_records")) || [];
      setVisitationRecords(mockVisits);
      const mockSettings = JSON.parse(localStorage.getItem("mock_app_settings")) || {};
      setAppSettings({
        attendanceDownloadNames: mockSettings.attendanceDownloadNames || [],
        attendanceDownloadTargets: mockSettings.attendanceDownloadTargets || []
      });

      setLoading(false);
    } else {
      // --- REAL FIREBASE MODE ---
      try {
        const monthsQuery = query(collection(db, "months"), orderBy("monthId", "asc"));
        const logsQuery = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(200));

        const [
          teamsSnap,
          zonesSnap,
          membersSnap,
          monthsSnap,
          usersSnap,
          settingsSnap,
          visitsSnap,
          logsSnap
        ] = await Promise.all([
          getDocs(collection(db, "teams")),
          getDocs(collection(db, "zones")),
          getDocs(collection(db, "members")),
          getDocs(monthsQuery),
          getDocs(collection(db, "users")),
          getDoc(doc(db, "appSettings", "attendanceDownload")),
          getDocs(collection(db, "visitationRecords")),
          getDocs(logsQuery).catch(e => {
            console.error("Failed to fetch audit logs:", e);
            return { docs: [] };
          })
        ]);

        setTeams(teamsSnap.docs.map(d => ({ teamId: d.id, ...d.data() })));
        setZones(zonesSnap.docs.map(d => ({ zoneId: d.id, ...d.data() })));
        setMembers(membersSnap.docs.map(d => ({ memberId: d.id, ...d.data() })));

        const loadedMonths = monthsSnap.docs.map(d => ({ monthId: d.id, ...d.data() }));
        setMonths(loadedMonths);

        const openMonth = loadedMonths.find(m => m.status === "open") || loadedMonths[loadedMonths.length - 1];
        const targetMonthId = activeMonthId || openMonth?.monthId;
        if (openMonth && !activeMonthId) {
          setActiveMonthId(openMonth.monthId);
        }

        setUsers(usersSnap.docs.map(d => ({ userId: d.id, ...d.data() })));

        const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
        setAppSettings({
          attendanceDownloadNames: Array.isArray(settingsData.names) ? settingsData.names : [],
          attendanceDownloadTargets: Array.isArray(settingsData.targets) ? settingsData.targets : []
        });

        setVisitationRecords(visitsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setAuditLogs(logsSnap.docs.map(d => ({ logId: d.id, ...d.data() })));

        if (targetMonthId) {
          const attQuery = query(collection(db, "attendanceRecords"), where("monthId", "==", targetMonthId));
          const achQuery = query(collection(db, "monthlyAchievements"), where("monthId", "==", targetMonthId));
          const samilQuery = query(collection(db, "samilMemberNotes"), where("monthId", "==", targetMonthId));
          const sundayQuery = query(collection(db, "sundayMemberNotes"), where("monthId", "==", targetMonthId));
          const legacyQuery = query(collection(db, "memberNotes"), where("monthId", "==", targetMonthId));

          const [attSnap, achSnap, samilSnap, sundaySnap, legacySnap] = await Promise.all([
            getDocs(attQuery),
            getDocs(achQuery),
            getDocs(samilQuery),
            getDocs(sundayQuery),
            getDocs(legacyQuery)
          ]);

          setAttendanceRecords(attSnap.docs.map(d => ({ recordId: d.id, ...d.data() })));
          setMonthlyAchievements(achSnap.docs.map(d => ({ achievementId: d.id, ...d.data() })));

          const samilNotes = samilSnap.docs.map(d => ({ noteId: d.id, ...d.data(), type: "samil" }));
          const sundayNotes = sundaySnap.docs.map(d => ({ noteId: d.id, ...d.data(), type: "sunday" }));
          const legacyNotes = legacySnap.docs.map(d => ({ noteId: d.id, ...d.data(), type: "sunday" }));
          setMemberNotes([...samilNotes, ...sundayNotes, ...legacyNotes]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error refreshing Firestore data:", error);
        setLoading(false);
      }
    }
  };

  const normalizeAttendanceDownloadTargets = (items) => {
    const seen = new Set();
    return items
      .map(item => {
        if (typeof item === "string") {
          const name = item.trim();
          return name ? { userId: "", memberId: "", name } : null;
        }
        const userId = String(item?.userId || "").trim();
        const memberId = String(item?.memberId || "").trim();
        const name = String(item?.name || "").trim();
        if (!userId || !name) return null;
        return { userId, memberId, name };
      })
      .filter(Boolean)
      .filter(item => {
        const key = item.userId;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const updateAttendanceDownloadNames = async (targets) => {
    if (currentUser?.role !== "admin") {
      throw new Error("엑셀 다운로드 이름 설정은 관리자만 수정할 수 있습니다.");
    }
    const normalizedTargets = normalizeAttendanceDownloadTargets(targets);
    const normalizedNames = normalizedTargets.map(item => item.name).filter(Boolean);

    if (isMockEnabled) {
      const nextSettings = {
        ...appSettings,
        attendanceDownloadNames: normalizedNames,
        attendanceDownloadTargets: normalizedTargets
      };
      localStorage.setItem("mock_app_settings", JSON.stringify(nextSettings));
      setAppSettings(nextSettings);
      logChange("settings", "system", "출결관리 엑셀 다운로드 이름 설정 수정");
      return;
    }

    await setDoc(doc(db, "appSettings", "attendanceDownload"), {
      names: normalizedNames,
      targets: normalizedTargets,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.uid || currentUser?.username || "unknown"
    }, { merge: true });
    setAppSettings(prev => ({
      ...prev,
      attendanceDownloadNames: normalizedNames,
      attendanceDownloadTargets: normalizedTargets
    }));
    logChange("settings", "system", "출결관리 엑셀 다운로드 이름 설정 수정");
  };

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  // 2. Load month-specific records when activeMonthId changes
  useEffect(() => {
    if (!activeMonthId) return;

    async function loadMonthRecords() {
      console.log("loadMonthRecords() triggered. activeMonthId:", activeMonthId);
      if (isMockEnabled) {
        const allAtt = JSON.parse(localStorage.getItem("mock_attendance")) || [];
        const monthAtt = allAtt.filter(r => r.monthId === activeMonthId);
        setAttendanceRecords(monthAtt);

        const allAch = JSON.parse(localStorage.getItem("mock_achievements")) || [];
        const monthAch = allAch.filter(a => a.monthId === activeMonthId);
        setMonthlyAchievements(monthAch);

        const allNotes = JSON.parse(localStorage.getItem("mock_member_notes")) || [];
        const monthNotes = allNotes.filter(n => n.monthId === activeMonthId);
        setMemberNotes(monthNotes);
      } else {
        try {
          // Fetch attendance records for this month
          const attQuery = query(collection(db, "attendanceRecords"), where("monthId", "==", activeMonthId));
          const attSnap = await getDocs(attQuery);
          console.log(`Loaded ${attSnap.size} attendance records from Firestore for ${activeMonthId}`);
          setAttendanceRecords(attSnap.docs.map(d => ({ recordId: d.id, ...d.data() })));

          // Fetch achievements for this month
          const achQuery = query(collection(db, "monthlyAchievements"), where("monthId", "==", activeMonthId));
          const achSnap = await getDocs(achQuery);
          console.log(`Loaded ${achSnap.size} monthly achievements from Firestore for ${activeMonthId}`);
          setMonthlyAchievements(achSnap.docs.map(d => ({ achievementId: d.id, ...d.data() })));

          const samilQuery = query(collection(db, "samilMemberNotes"), where("monthId", "==", activeMonthId));
          const sundayQuery = query(collection(db, "sundayMemberNotes"), where("monthId", "==", activeMonthId));
          const legacyQuery = query(collection(db, "memberNotes"), where("monthId", "==", activeMonthId));
          const [samilSnap, sundaySnap, legacySnap] = await Promise.all([
            getDocs(samilQuery),
            getDocs(sundayQuery),
            getDocs(legacyQuery)
          ]);
          console.log(`Loaded ${samilSnap.size} samil and ${sundaySnap.size} sunday member notes from Firestore for ${activeMonthId}`);
          const samilNotes = samilSnap.docs.map(d => ({ noteId: d.id, ...d.data(), type: "samil" }));
          const sundayNotes = sundaySnap.docs.map(d => ({ noteId: d.id, ...d.data(), type: "sunday" }));
          const legacyNotes = legacySnap.docs.map(d => ({ noteId: d.id, ...d.data(), type: "sunday" }));
          setMemberNotes([...samilNotes, ...sundayNotes, ...legacyNotes]);
        } catch (error) {
          console.error("Error fetching month records:", error);
        }
      }
    }

    loadMonthRecords();
  }, [activeMonthId]);

  // Automatically calculate activeWeekNo when activeMonthId changes or app mounts
  useEffect(() => {
    if (!activeMonthId) return;

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1; // 1-indexed
    const todayMonthStr = `${todayYear}-${String(todayMonth).padStart(2, "0")}`;

    if (activeMonthId === todayMonthStr) {
      // It matches today's month! Calculate calendar week of today (Sunday-based).
      const day = today.getDate();
      const firstDay = new Date(todayYear, today.getMonth(), 1);
      const firstDayOfWeek = firstDay.getDay(); // 0: Sunday, 1: Monday, ...
      const weekNo = Math.ceil((day + firstDayOfWeek) / 7);
      setActiveWeekNo(Math.min(5, Math.max(1, weekNo)));
    } else {
      // Default to 1 for other months
      setActiveWeekNo(1);
    }
  }, [activeMonthId]);

  // Helper: Log modification history
  const logChange = async (memberId, memberName, details) => {
    const operatorName = currentUser ? currentUser.name : "System";
    const operatorId = currentUser ? currentUser.userId : "system";
    const newLog = {
      operatorId,
      operatorName,
      timestamp: new Date().toISOString(),
      memberId,
      memberName,
      details
    };

    if (isMockEnabled) {
      const logs = JSON.parse(localStorage.getItem("mock_audit_logs")) || [];
      const updatedLogs = [{ logId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, ...newLog }, ...logs];
      localStorage.setItem("mock_audit_logs", JSON.stringify(updatedLogs));
      setAuditLogs(updatedLogs);
    } else {
      try {
        const docRef = await addDoc(collection(db, "auditLogs"), newLog);
        setAuditLogs(prev => [{ logId: docRef.id, ...newLog }, ...prev]);
      } catch (err) {
        console.error("Audit log failed:", err);
      }
    }
  };

  // 3. Attendance CRUD
  const updateAttendance = async (memberId, category, value) => {
    const member = members.find(m => m.memberId === memberId);
    const memberName = member ? member.name : "성도";
    const recordId = `${memberId}_${activeMonthId}_${activeWeekNo}_${category}`;

    // Check if month is closed
    const activeMonth = months.find(m => m.monthId === activeMonthId);
    const isClosed = activeMonth && activeMonth.status === "closed";
    if (isClosed && currentUser?.role !== "admin") {
      alert("마감된 월의 데이터는 팀장/리더 권한으로 수정할 수 없습니다.");
      return;
    }

    // Get old value
    const existing = attendanceRecords.find(r => r.recordId === recordId);
    const oldValue = existing ? existing.value : "미보고";

    if (oldValue === value) return;

    const newRecord = {
      recordId,
      memberId,
      monthId: activeMonthId,
      weekNo: activeWeekNo,
      category,
      value
    };

    if (isMockEnabled) {
      // Get all records from storage
      const allAtt = JSON.parse(localStorage.getItem("mock_attendance")) || [];
      const index = allAtt.findIndex(r => r.recordId === recordId);

      if (index >= 0) {
        allAtt[index] = newRecord;
      } else {
        allAtt.push(newRecord);
      }

      localStorage.setItem("mock_attendance", JSON.stringify(allAtt));
      // Update state
      setAttendanceRecords(prev => {
        const idx = prev.findIndex(r => r.recordId === recordId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = newRecord;
          return next;
        } else {
          return [...prev, newRecord];
        }
      });
    } else {
      try {
        console.log(`Saving attendance record to Firestore: ${recordId} = ${value}`);
        await setDoc(doc(db, "attendanceRecords", recordId), {
          memberId,
          monthId: activeMonthId,
          weekNo: activeWeekNo,
          category,
          value
        });
        console.log(`Saved attendance record ${recordId} successfully.`);
        setAttendanceRecords(prev => {
          const idx = prev.findIndex(r => r.recordId === recordId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = newRecord;
            return next;
          } else {
            return [...prev, newRecord];
          }
        });
      } catch (error) {
        console.error("Firestore update failed:", error);
        return;
      }
    }

    // Log the change
    const categoryNames = {
      samil: "삼일예배",
      sunday: "주일예배",
      samil_pre: "삼일사전",
      samil_actual: "삼일실제",
      sunday_pre: "주일사전",
      sunday_actual: "주일실제",
      zone: "구역예배",
      test: "시험", radio: "심야라디오", simon: "시몬스쿨",
      visit: "심방", activity: "활동현황"
    };
    const catLabel = categoryNames[category] || category;
    logChange(memberId, memberName, `${activeMonthId.split("-")[1]}월 ${activeWeekNo}주차 ${catLabel}: ${oldValue} -> ${value}`);
  };

  // 3-b. Bulk fill attendance (e.g. "지난주 예배보고 불러오기")
  // updates: [{ memberId, category, value }] — 대상 주차는 현재 활성 주차(activeWeekNo)
  const bulkFillAttendance = async (updates) => {
    if (!Array.isArray(updates) || updates.length === 0) return 0;

    // Check if month is closed
    const activeMonth = months.find(m => m.monthId === activeMonthId);
    const isClosed = activeMonth && activeMonth.status === "closed";
    if (isClosed && currentUser?.role !== "admin") {
      alert("마감된 월의 데이터는 팀장/리더 권한으로 수정할 수 없습니다.");
      return 0;
    }

    const newRecords = updates.map(({ memberId, category, value }) => ({
      recordId: `${memberId}_${activeMonthId}_${activeWeekNo}_${category}`,
      memberId,
      monthId: activeMonthId,
      weekNo: activeWeekNo,
      category,
      value
    }));

    if (isMockEnabled) {
      const allAtt = JSON.parse(localStorage.getItem("mock_attendance")) || [];
      newRecords.forEach(rec => {
        const idx = allAtt.findIndex(r => r.recordId === rec.recordId);
        if (idx >= 0) allAtt[idx] = rec;
        else allAtt.push(rec);
      });
      localStorage.setItem("mock_attendance", JSON.stringify(allAtt));
    } else {
      try {
        // Firestore writeBatch limit is 500; chunk to be safe
        for (let i = 0; i < newRecords.length; i += 400) {
          const batch = writeBatch(db);
          newRecords.slice(i, i + 400).forEach(rec => {
            batch.set(doc(db, "attendanceRecords", rec.recordId), {
              memberId: rec.memberId,
              monthId: rec.monthId,
              weekNo: rec.weekNo,
              category: rec.category,
              value: rec.value
            });
          });
          await batch.commit();
        }
      } catch (error) {
        console.error("Bulk attendance update failed:", error);
        return 0;
      }
    }

    // Merge into state in one pass
    setAttendanceRecords(prev => {
      const map = new Map(prev.map(r => [r.recordId, r]));
      newRecords.forEach(rec => map.set(rec.recordId, rec));
      return Array.from(map.values());
    });

    logChange(
      "attendance",
      "출결관리",
      `${activeMonthId.split("-")[1]}월 ${activeWeekNo}주차 지난주 예배보고 불러오기 (${newRecords.length}건 채움)`
    );

    return newRecords.length;
  };

  // 4. Monthly Achievements CRUD (전도, 십일조, 청체비)
  const updateMonthlyAchievement = async (memberId, category, achieved) => {
    const member = members.find(m => m.memberId === memberId);
    const memberName = member ? member.name : "성도";
    const achievementId = `${memberId}_${activeMonthId}_${category}`;

    const activeMonth = months.find(m => m.monthId === activeMonthId);
    const isClosed = activeMonth && activeMonth.status === "closed";
    if (isClosed && currentUser?.role !== "admin") {
      alert("마감된 월의 데이터는 팀장/리더 권한으로 수정할 수 없습니다.");
      return;
    }

    const existing = monthlyAchievements.find(a => a.achievementId === achievementId);
    const oldAchieved = existing ? existing.achieved : false;

    if (oldAchieved === achieved) return;

    const newAch = {
      achievementId,
      memberId,
      monthId: activeMonthId,
      category,
      achieved,
      achievedWeekNo: achieved ? activeWeekNo : 0
    };

    if (isMockEnabled) {
      const allAch = JSON.parse(localStorage.getItem("mock_achievements")) || [];
      const index = allAch.findIndex(a => a.achievementId === achievementId);

      if (index >= 0) {
        allAch[index] = newAch;
      } else {
        allAch.push(newAch);
      }

      localStorage.setItem("mock_achievements", JSON.stringify(allAch));
      setMonthlyAchievements(prev => {
        const idx = prev.findIndex(a => a.achievementId === achievementId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = newAch;
          return next;
        } else {
          return [...prev, newAch];
        }
      });
    } else {
      try {
        console.log(`Saving monthly achievement to Firestore: ${achievementId} = ${achieved}`);
        await setDoc(doc(db, "monthlyAchievements", achievementId), {
          memberId,
          monthId: activeMonthId,
          category,
          achieved,
          achievedWeekNo: achieved ? activeWeekNo : 0
        });
        console.log(`Saved monthly achievement ${achievementId} successfully.`);
        setMonthlyAchievements(prev => {
          const idx = prev.findIndex(a => a.achievementId === achievementId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = newAch;
            return next;
          } else {
            return [...prev, newAch];
          }
        });
      } catch (error) {
        console.error("Firestore achievement update failed:", error);
        return;
      }
    }

    const catLabels = { evangelism: "전도", tithing: "십일조", fee: "청체비" };
    const label = catLabels[category] || category;
    logChange(memberId, memberName, `${activeMonthId.split("-")[1]}월 누적 ${label}: ${oldAchieved ? "체크" : "해제"} -> ${achieved ? "체크" : "해제"}`);
  };

  // 5. Member Notes CRUD
  const saveMemberNote = async (memberId, text, type = "sunday") => {
    const member = members.find(m => m.memberId === memberId);
    const memberName = member ? member.name : "성도";
    const noteText = text.trim();
    const suffix = type ? `_${type}` : "";
    let noteId = `${memberId}_${activeMonthId}_${activeWeekNo}${suffix}`;

    const activeMonth = months.find(m => m.monthId === activeMonthId);
    const isClosed = activeMonth && activeMonth.status === "closed";
    if (isClosed && currentUser?.role !== "admin") {
      alert("마감된 월의 데이터는 팀장/리더 권한으로 수정할 수 없습니다.");
      return;
    }

    let existing = memberNotes.find(n => n.noteId === noteId);
    let isLegacyNote = false;
    let legacyNoteId = `${memberId}_${activeMonthId}_${activeWeekNo}`;
    if (!existing && type === "sunday") {
      const legacyExisting = memberNotes.find(n => n.noteId === legacyNoteId);
      if (legacyExisting) {
        existing = legacyExisting;
        isLegacyNote = true;
      }
    }

    if (!noteText) {
      if (existing || isLegacyNote) {
        await deleteMemberNote(memberId, type);
      }
      return;
    }
    const oldText = existing ? existing.text : "";
    if (oldText === noteText) return;

    const now = new Date().toISOString();
    const newNote = {
      noteId,
      memberId,
      monthId: activeMonthId,
      weekNo: activeWeekNo,
      text: noteText,
      createdAt: existing?.createdAt || now,
      createdBy: existing?.createdBy || (currentUser?.name || "System"),
      updatedAt: now,
      updatedBy: currentUser?.name || "System"
    };

    if (isMockEnabled) {
      const allNotes = JSON.parse(localStorage.getItem("mock_member_notes")) || [];
      const index = allNotes.findIndex(n => n.noteId === noteId || (type === "sunday" && n.noteId === legacyNoteId));

      if (index >= 0) {
        allNotes[index] = { ...newNote, noteId };
      } else {
        allNotes.push(newNote);
      }

      localStorage.setItem("mock_member_notes", JSON.stringify(allNotes));
      setMemberNotes(prev => {
        const cleaned = prev.filter(n => n.noteId !== noteId && n.noteId !== legacyNoteId);
        return [...cleaned, newNote];
      });
    } else {
      try {
        const targetCollection = type === "samil" ? "samilMemberNotes" : "sundayMemberNotes";

        await setDoc(doc(db, targetCollection, noteId), {
          memberId,
          monthId: activeMonthId,
          weekNo: activeWeekNo,
          text: noteText,
          createdAt: newNote.createdAt,
          createdBy: newNote.createdBy,
          updatedAt: newNote.updatedAt,
          updatedBy: newNote.updatedBy
        });

        if (type === "sunday" || isLegacyNote) {
          try {
            await deleteDoc(doc(db, "memberNotes", legacyNoteId));
          } catch (e) {
            console.warn("Could not delete legacy memberNotes doc:", e);
          }
        }

        setMemberNotes(prev => {
          const cleaned = prev.filter(n => n.noteId !== noteId && n.noteId !== legacyNoteId);
          return [...cleaned, newNote];
        });
      } catch (error) {
        console.error("Firestore member note save failed:", error);
        return;
      }
    }

    logChange(memberId, memberName, `${activeMonthId.split("-")[1]}월 ${activeWeekNo}주차 특이사항 ${existing ? "수정" : "저장"}: ${noteText}`);
  };

  const deleteMemberNote = async (memberId, type = "sunday") => {
    const member = members.find(m => m.memberId === memberId);
    const memberName = member ? member.name : "성도";
    const suffix = type ? `_${type}` : "";
    let noteId = `${memberId}_${activeMonthId}_${activeWeekNo}${suffix}`;
    let legacyNoteId = `${memberId}_${activeMonthId}_${activeWeekNo}`;
    let existing = memberNotes.find(n => n.noteId === noteId);
    let hasLegacy = false;
    if (type === "sunday") {
      const legacyExisting = memberNotes.find(n => n.noteId === legacyNoteId);
      if (legacyExisting) {
        hasLegacy = true;
      }
    }
    if (!existing && !hasLegacy) return;

    const activeMonth = months.find(m => m.monthId === activeMonthId);
    const isClosed = activeMonth && activeMonth.status === "closed";
    if (isClosed && currentUser?.role !== "admin") {
      alert("마감된 월의 데이터는 팀장/리더 권한으로 수정할 수 없습니다.");
      return;
    }

    if (isMockEnabled) {
      const allNotes = JSON.parse(localStorage.getItem("mock_member_notes")) || [];
      const nextNotes = allNotes.filter(n => n.noteId !== noteId && n.noteId !== legacyNoteId);
      localStorage.setItem("mock_member_notes", JSON.stringify(nextNotes));
      setMemberNotes(prev => prev.filter(n => n.noteId !== noteId && n.noteId !== legacyNoteId));
    } else {
      try {
        const targetCollection = type === "samil" ? "samilMemberNotes" : "sundayMemberNotes";

        await deleteDoc(doc(db, targetCollection, noteId));

        if (type === "sunday" || hasLegacy) {
          try {
            await deleteDoc(doc(db, "memberNotes", legacyNoteId));
          } catch (e) {
            console.warn("Could not delete legacy memberNotes doc:", e);
          }
        }

        setMemberNotes(prev => prev.filter(n => n.noteId !== noteId && n.noteId !== legacyNoteId));
      } catch (error) {
        console.error("Firestore member note delete failed:", error);
        return;
      }
    }

    logChange(memberId, memberName, `${activeMonthId.split("-")[1]}월 ${activeWeekNo}주차 특이사항 삭제`);
  };

  // 6. Members CRUD
  const addMember = async (memberData) => {
    const newId = `m_${Date.now()}`;
    const newMember = { memberId: newId, ...memberData };

    if (isMockEnabled) {
      const list = JSON.parse(localStorage.getItem("mock_members")) || [];
      list.push(newMember);
      localStorage.setItem("mock_members", JSON.stringify(list));
      setMembers(list);
    } else {
      try {
        await setDoc(doc(db, "members", newId), memberData);
        setMembers(prev => [...prev, newMember]);
      } catch (err) {
        console.error("Firestore add member failed:", err);
      }
    }
    logChange(newId, memberData.name, `신규 성도 등록 (팀: ${memberData.teamId}, 구역: ${memberData.zoneId})`);
  };

  const updateMember = async (memberId, updatedFields) => {
    const member = members.find(m => m.memberId === memberId);
    const memberName = member ? member.name : "성도";

    if (isMockEnabled) {
      const list = JSON.parse(localStorage.getItem("mock_members")) || [];
      const idx = list.findIndex(m => m.memberId === memberId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updatedFields };
        localStorage.setItem("mock_members", JSON.stringify(list));
        setMembers(list);
      }
    } else {
      try {
        await updateDoc(doc(db, "members", memberId), updatedFields);
        setMembers(prev => prev.map(m => m.memberId === memberId ? { ...m, ...updatedFields } : m));
      } catch (err) {
        console.error("Firestore update member failed:", err);
      }
    }
    logChange(memberId, memberName, `성도 정보 수정: ${JSON.stringify(updatedFields)}`);
  };

  const deleteMember = async (memberId) => {
    const member = members.find(m => m.memberId === memberId);
    const memberName = member ? member.name : "성도";

    if (isMockEnabled) {
      const list = JSON.parse(localStorage.getItem("mock_members")) || [];
      const updated = list.filter(m => m.memberId !== memberId);
      localStorage.setItem("mock_members", JSON.stringify(updated));
      setMembers(updated);
    } else {
      try {
        await deleteDoc(doc(db, "members", memberId));
        setMembers(prev => prev.filter(m => m.memberId !== memberId));
      } catch (err) {
        console.error("Firestore delete member failed:", err);
      }
    }
    logChange(memberId, memberName, "성도 삭제 처리");
  };

  // 7. Teams CRUD
  const addTeam = async (name, leaderId) => {
    const teamId = `team_${Date.now()}`;
    const newTeam = { teamId, name, leaderId, createdAt: new Date().toISOString().split("T")[0], status: "active" };

    if (isMockEnabled) {
      const list = JSON.parse(localStorage.getItem("mock_teams")) || [];
      list.push(newTeam);
      localStorage.setItem("mock_teams", JSON.stringify(list));
      setTeams(list);
    } else {
      try {
        await setDoc(doc(db, "teams", teamId), { name, leaderId, createdAt: newTeam.createdAt, status: "active" });
        setTeams(prev => [...prev, newTeam]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateTeam = async (teamId, fields) => {
    if (isMockEnabled) {
      const list = JSON.parse(localStorage.getItem("mock_teams")) || [];
      const idx = list.findIndex(t => t.teamId === teamId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...fields };
        localStorage.setItem("mock_teams", JSON.stringify(list));
        setTeams(list);
      }
    } else {
      try {
        await updateDoc(doc(db, "teams", teamId), fields);
        setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, ...fields } : t));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 8. Zones CRUD
  const addZone = async (name, teamId, leaderId) => {
    const zoneId = `zone_${Date.now()}`;
    const newZone = { zoneId, teamId, name, leaderId };

    if (isMockEnabled) {
      const list = JSON.parse(localStorage.getItem("mock_zones")) || [];
      list.push(newZone);
      localStorage.setItem("mock_zones", JSON.stringify(list));
      setZones(list);
    } else {
      try {
        await setDoc(doc(db, "zones", zoneId), { name, teamId, leaderId });
        setZones(prev => [...prev, newZone]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateZone = async (zoneId, fields) => {
    if (isMockEnabled) {
      const list = JSON.parse(localStorage.getItem("mock_zones")) || [];
      const idx = list.findIndex(z => z.zoneId === zoneId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...fields };
        localStorage.setItem("mock_zones", JSON.stringify(list));
        setZones(list);
      }
    } else {
      try {
        await updateDoc(doc(db, "zones", zoneId), fields);
        setZones(prev => prev.map(z => z.zoneId === zoneId ? { ...z, ...fields } : z));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 8.5 Users CRUD
  const addUser = async (userData) => {
    const userId = `user_${Date.now()}`;
    const newUser = { userId, ...userData };

    if (isMockEnabled) {
      const list = JSON.parse(localStorage.getItem("mock_users")) || [];
      list.push(newUser);
      localStorage.setItem("mock_users", JSON.stringify(list));
      setUsers(list);
    } else {
      try {
        await setDoc(doc(db, "users", userId), userData);
        setUsers(prev => [...prev, newUser]);
      } catch (err) {
        console.error("Firestore add user failed:", err);
      }
    }
  };

  const updateUser = async (userId, fields) => {
    if (isMockEnabled) {
      const list = JSON.parse(localStorage.getItem("mock_users")) || [];
      const idx = list.findIndex(u => u.userId === userId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...fields };
        localStorage.setItem("mock_users", JSON.stringify(list));
        setUsers(list);
      }
    } else {
      try {
        await updateDoc(doc(db, "users", userId), fields);
        setUsers(prev => prev.map(u => u.userId === userId ? { ...u, ...fields } : u));
      } catch (err) {
        console.error("Firestore update user failed:", err);
      }
    }
  };

  const deleteUser = async (userId) => {
    if (isMockEnabled) {
      const list = JSON.parse(localStorage.getItem("mock_users")) || [];
      const updated = list.filter(u => u.userId !== userId);
      localStorage.setItem("mock_users", JSON.stringify(updated));
      setUsers(updated);
    } else {
      try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(prev => prev.filter(u => u.userId !== userId));
      } catch (err) {
        console.error("Firestore delete user failed:", err);
      }
    }
  };

  // 8.8 Seeding Firebase database with initial structures
  const seedFirebaseDatabase = async () => {
    if (isMockEnabled) {
      alert("현재 로컬 Mock 모드입니다. Firebase가 연동되어 있지 않습니다. .env.local 파일을 구성해 주세요.");
      return;
    }

    setLoading(true);
    window.isFirebaseSeeding = true;
    try {
      const uidMap = {};

      console.log("Writing users to Auth & Firestore...");
      for (const u of mockInitData.demoUsers) {
        const email = `${u.username}@church.com`;
        let firebaseUid = u.userId; // fallback

        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, u.password);
          firebaseUid = userCredential.user.uid;
        } catch (err) {
          if (err.code === "auth/email-already-in-use") {
            try {
              const userCredential = await signInWithEmailAndPassword(auth, email, u.password);
              firebaseUid = userCredential.user.uid;
            } catch (signInErr) {
              console.error("Failed to sign in to retrieve existing UID:", signInErr);
            }
          } else {
            console.error(`Failed to create Auth user for ${email}:`, err);
          }
        }

        uidMap[u.userId] = firebaseUid;

        // Write user profile to Firestore
        await setDoc(doc(db, "users", firebaseUid), {
          name: u.name,
          role: u.role,
          teamId: u.teamId,
          zoneId: u.zoneId
        });
      }

      console.log("Writing teams to Firestore...");
      for (const t of mockInitData.initialTeams) {
        const { teamId, ...data } = t;
        if (data.leaderId && uidMap[data.leaderId]) {
          data.leaderId = uidMap[data.leaderId];
        }
        await setDoc(doc(db, "teams", teamId), data);
      }

      console.log("Writing zones to Firestore...");
      for (const z of mockInitData.initialZones) {
        const { zoneId, ...data } = z;
        if (data.leaderId && uidMap[data.leaderId]) {
          data.leaderId = uidMap[data.leaderId];
        }
        await setDoc(doc(db, "zones", zoneId), data);
      }

      console.log("Writing members to Firestore in batches...");
      const membersBatch = writeBatch(db);
      for (const m of mockInitData.initialMembers) {
        const { memberId, ...data } = m;
        membersBatch.set(doc(db, "members", memberId), data);
      }
      await membersBatch.commit();

      console.log("Writing months to Firestore...");
      const monthsBatch = writeBatch(db);
      for (const m of mockInitData.initialMonths) {
        const { monthId, ...data } = m;
        monthsBatch.set(doc(db, "months", monthId), { monthId, ...data });
      }
      await monthsBatch.commit();

      console.log("Writing attendance records to Firestore in batches...");
      const records = mockInitData.initialAttendanceRecords;
      const attBatchSize = 400;
      for (let i = 0; i < records.length; i += attBatchSize) {
        const batch = writeBatch(db);
        const chunk = records.slice(i, i + attBatchSize);
        for (const r of chunk) {
          const { recordId, ...data } = r;
          batch.set(doc(db, "attendanceRecords", recordId), data);
        }
        await batch.commit();
        console.log(`Committed batch of ${chunk.length} attendance records.`);
      }

      console.log("Writing monthly achievements to Firestore in batches...");
      const achBatch = writeBatch(db);
      for (const a of mockInitData.initialMonthlyAchievements) {
        const { achievementId, ...data } = a;
        achBatch.set(doc(db, "monthlyAchievements", achievementId), data);
      }
      await achBatch.commit();

      console.log("Writing audit logs to Firestore in batches...");
      const logsBatch = writeBatch(db);
      for (const l of mockInitData.initialAuditLogs) {
        const { logId, ...data } = l;
        if (data.operatorId && uidMap[data.operatorId]) {
          data.operatorId = uidMap[data.operatorId];
        }
        logsBatch.set(doc(db, "auditLogs", logId), data);
      }
      await logsBatch.commit();

      console.log("Seeding complete. Signing out...");
      await signOut(auth);
      window.isFirebaseSeeding = false;
      alert("Firebase 데이터베이스 초기화 및 초기 데이터 업로드가 성공적으로 완료되었습니다! 웹 페이지를 새로고침합니다.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      window.isFirebaseSeeding = false;
      alert(`초기 데이터 업로드 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 9. Close Month Routine
  const closeMonth = async (monthId) => {
    if (currentUser?.role !== "admin") {
      alert("월 마감 권한이 없습니다. (관리자만 마감할 수 있습니다.)");
      return;
    }

    const targetMonth = months.find(m => m.monthId === monthId);
    if (!targetMonth) return;

    // Determine next month details
    let nextYear = targetMonth.year;
    let nextMonthInt = targetMonth.month + 1;
    if (nextMonthInt > 12) {
      nextMonthInt = 1;
      nextYear += 1;
    }
    const nextMonthId = `${nextYear}-${String(nextMonthInt).padStart(2, "0")}`;

    if (isMockEnabled) {
      // Mark current month as closed
      const loadedMonths = JSON.parse(localStorage.getItem("mock_months")) || [];
      const updatedMonths = loadedMonths.map(m => m.monthId === monthId ? { ...m, status: "closed" } : m);

      // Check if next month already exists
      const exists = updatedMonths.some(m => m.monthId === nextMonthId);
      if (!exists) {
        updatedMonths.push({
          monthId: nextMonthId,
          year: nextYear,
          month: nextMonthInt,
          status: "open"
        });
      } else {
        // Just make sure it is open
        const idx = updatedMonths.findIndex(m => m.monthId === nextMonthId);
        updatedMonths[idx].status = "open";
      }

      localStorage.setItem("mock_months", JSON.stringify(updatedMonths));
      setMonths(updatedMonths);

      // Auto-create initial records for the next month by carrying over existing structures
      // For a new month, tithing, evangelism, and weekly attendance are defaulted to blank/false
      const allAch = JSON.parse(localStorage.getItem("mock_achievements")) || [];
      const nextMonthAchievements = [];
      const activeMembers = members.filter(m => m.status !== "excluded");

      activeMembers.forEach(m => {
        // Tithing & fee carry over if they are checked?
        // No, the specification says "monthly cumulative check is automatically applied to all weeks of that month."
        // For a new month, they start clean (unchecked)
        nextMonthAchievements.push({
          achievementId: `${m.memberId}_${nextMonthId}_evangelism`,
          memberId: m.memberId,
          monthId: nextMonthId,
          category: "evangelism",
          achieved: false,
          achievedWeekNo: 0
        });

        nextMonthAchievements.push({
          achievementId: `${m.memberId}_${nextMonthId}_tithing`,
          memberId: m.memberId,
          monthId: nextMonthId,
          category: "tithing",
          achieved: false,
          achievedWeekNo: 0
        });

        nextMonthAchievements.push({
          achievementId: `${m.memberId}_${nextMonthId}_fee`,
          memberId: m.memberId,
          monthId: nextMonthId,
          category: "fee",
          achieved: false,
          achievedWeekNo: 0
        });
      });

      const nextAllAch = [...allAch.filter(a => a.monthId !== nextMonthId), ...nextMonthAchievements];
      localStorage.setItem("mock_achievements", JSON.stringify(nextAllAch));

      // Set the active month to the newly opened month
      setActiveMonthId(nextMonthId);
      setActiveWeekNo(1);
    } else {
      // Firebase Transaction or Batch
      try {
        // Close target month
        await setDoc(doc(db, "months", monthId), {
          monthId,
          year: targetMonth.year,
          month: targetMonth.month,
          status: "closed"
        });

        // Open next month
        await setDoc(doc(db, "months", nextMonthId), {
          monthId: nextMonthId,
          year: nextYear,
          month: nextMonthInt,
          status: "open"
        });

        // Initialize accomplishments
        const batch = writeBatch(db);
        const activeMembers = members.filter(m => m.status !== "excluded");

        activeMembers.forEach(m => {
          const achCats = ["evangelism", "tithing", "fee"];
          achCats.forEach(cat => {
            const achId = `${m.memberId}_${nextMonthId}_${cat}`;
            batch.set(doc(db, "monthlyAchievements", achId), {
              memberId: m.memberId,
              monthId: nextMonthId,
              category: cat,
              achieved: false,
              achievedWeekNo: 0
            });
          });
        });
        await batch.commit();

        // Refresh months
        const monthsSnap = await getDocs(query(collection(db, "months"), orderBy("monthId", "asc")));
        setMonths(monthsSnap.docs.map(d => ({ monthId: d.id, ...d.data() })));

        setActiveMonthId(nextMonthId);
        setActiveWeekNo(1);
      } catch (err) {
        console.error("Month close failed:", err);
      }
    }
    logChange("month_close", "system", `${monthId} 월 마감 및 ${nextMonthId} 월 신규 생성`);
  };

  // 5. Visitation CRUD
  const addVisitationRecord = async (recordData) => {
    const newRecord = {
      ...recordData,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || "System"
    };

    if (isMockEnabled) {
      const allVisits = JSON.parse(localStorage.getItem("mock_visitation_records")) || [];
      const newId = `visit_${Date.now()}`;
      const recordWithId = { id: newId, ...newRecord };
      allVisits.push(recordWithId);
      localStorage.setItem("mock_visitation_records", JSON.stringify(allVisits));
      setVisitationRecords(allVisits);
      logChange(recordData.memberId, recordData.memberName, `심방 기록 등록: ${recordData.visitor} (${recordData.type})`);
      return recordWithId;
    } else {
      try {
        const docRef = await addDoc(collection(db, "visitationRecords"), newRecord);
        const recordWithId = { id: docRef.id, ...newRecord };
        setVisitationRecords(prev => [...prev, recordWithId]);
        logChange(recordData.memberId, recordData.memberName, `심방 기록 등록: ${recordData.visitor} (${recordData.type})`);
        return recordWithId;
      } catch (error) {
        console.error("Firestore addDoc failed for visitationRecord:", error);
        throw error;
      }
    }
  };

  const deleteVisitationRecord = async (recordId) => {
    const record = visitationRecords.find(r => r.id === recordId);
    if (!record) return;

    if (isMockEnabled) {
      const allVisits = JSON.parse(localStorage.getItem("mock_visitation_records")) || [];
      const filtered = allVisits.filter(r => r.id !== recordId);
      localStorage.setItem("mock_visitation_records", JSON.stringify(filtered));
      setVisitationRecords(filtered);
      logChange(record.memberId, record.memberName, `심방 기록 삭제: ${record.visitor} (${record.type})`);
    } else {
      try {
        await deleteDoc(doc(db, "visitationRecords", recordId));
        setVisitationRecords(prev => prev.filter(r => r.id !== recordId));
        logChange(record.memberId, record.memberName, `심방 기록 삭제: ${record.visitor} (${record.type})`);
      } catch (error) {
        console.error("Firestore deleteDoc failed for visitationRecord:", error);
        throw error;
      }
    }
  };

  const updateVisitationRecord = async (recordId, fields) => {
    const record = visitationRecords.find(r => r.id === recordId);
    if (!record) return;

    const updatedFields = {
      ...fields,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || "System"
    };

    if (isMockEnabled) {
      const allVisits = JSON.parse(localStorage.getItem("mock_visitation_records")) || [];
      const index = allVisits.findIndex(r => r.id === recordId);
      if (index >= 0) {
        allVisits[index] = { ...allVisits[index], ...updatedFields };
        localStorage.setItem("mock_visitation_records", JSON.stringify(allVisits));
        setVisitationRecords(allVisits);
        logChange(record.memberId, record.memberName, `심방 기록 수정: ${updatedFields.visitor || record.visitor} (${updatedFields.type || record.type})`);
      }
    } else {
      try {
        await updateDoc(doc(db, "visitationRecords", recordId), updatedFields);
        setVisitationRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...updatedFields } : r));
        logChange(record.memberId, record.memberName, `심방 기록 수정: ${updatedFields.visitor || record.visitor} (${updatedFields.type || record.type})`);
      } catch (error) {
        console.error("Firestore updateDoc failed for visitationRecord:", error);
        throw error;
      }
    }
  };

  const updateVisitationFeedback = async (recordId, feedbackType, text) => {
    const record = visitationRecords.find(r => r.id === recordId);
    if (!record) return;

    const writerName = currentUser?.name || "System";
    const updatedFields = {};
    if (feedbackType === "team") {
      updatedFields.teamFeedback = text;
      updatedFields.teamFeedbackBy = writerName;
    } else if (feedbackType === "admin") {
      updatedFields.adminFeedback = text;
      updatedFields.adminFeedbackBy = writerName;
    }

    if (isMockEnabled) {
      const allVisits = JSON.parse(localStorage.getItem("mock_visitation_records")) || [];
      const index = allVisits.findIndex(r => r.id === recordId);
      if (index >= 0) {
        allVisits[index] = { ...allVisits[index], ...updatedFields };
        localStorage.setItem("mock_visitation_records", JSON.stringify(allVisits));
        setVisitationRecords(allVisits);
        logChange(record.memberId, record.memberName, `심방 피드백 등록 (${feedbackType}): ${writerName}`);
      }
    } else {
      try {
        await updateDoc(doc(db, "visitationRecords", recordId), updatedFields);
        setVisitationRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...updatedFields } : r));
        logChange(record.memberId, record.memberName, `심방 피드백 등록 (${feedbackType}): ${writerName}`);
      } catch (error) {
        console.error("Firestore updateDoc failed for visitation feedback:", error);
        throw error;
      }
    }
  };

  const value = {
    teams,
    zones,
    members,
    months,
    attendanceRecords,
    monthlyAchievements,
    memberNotes,
    visitationRecords,
    auditLogs,
    users,
    appSettings,
    activeMonthId,
    setActiveMonthId,
    activeWeekNo,
    setActiveWeekNo,
    loading,
    updateAttendance,
    bulkFillAttendance,
    updateMonthlyAchievement,
    saveMemberNote,
    deleteMemberNote,
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
    seedFirebaseDatabase,
    closeMonth,
    logChange,
    addVisitationRecord,
    deleteVisitationRecord,
    updateVisitationRecord,
    updateVisitationFeedback,
    updateAttendanceDownloadNames,
    refreshData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
