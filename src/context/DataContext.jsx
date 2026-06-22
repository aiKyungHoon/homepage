import React, { createContext, useContext, useState, useEffect } from "react";
import { isMockEnabled, db, auth } from "../firebase";
import { useAuth } from "./AuthContext";
import { 
  collection, getDocs, doc, setDoc, updateDoc, addDoc, 
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
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [activeMonthId, setActiveMonthId] = useState("");
  const [activeWeekNo, setActiveWeekNo] = useState(1);
  const [loading, setLoading] = useState(true);

  // 1. Initial Data Loading
  useEffect(() => {
    async function loadData() {
      console.log("loadData() triggered. currentUser:", currentUser?.uid);
      if (!isMockEnabled && !currentUser) {
        setTeams([]);
        setZones([]);
        setMembers([]);
        setMonths([]);
        setAttendanceRecords([]);
        setMonthlyAchievements([]);
        setAuditLogs([]);
        setUsers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      if (isMockEnabled) {
        // --- LOCAL STORAGE MOCK MODE ---
        // Initialize if not present
        if (!localStorage.getItem("mock_teams")) {
          localStorage.setItem("mock_teams", JSON.stringify(mockInitData.initialTeams));
          localStorage.setItem("mock_zones", JSON.stringify(mockInitData.initialZones));
          localStorage.setItem("mock_members", JSON.stringify(mockInitData.initialMembers));
          localStorage.setItem("mock_months", JSON.stringify(mockInitData.initialMonths));
          localStorage.setItem("mock_attendance", JSON.stringify(mockInitData.initialAttendanceRecords));
          localStorage.setItem("mock_achievements", JSON.stringify(mockInitData.initialMonthlyAchievements));
          localStorage.setItem("mock_audit_logs", JSON.stringify(mockInitData.initialAuditLogs));
        }

        setTeams(JSON.parse(localStorage.getItem("mock_teams")));
        setZones(JSON.parse(localStorage.getItem("mock_zones")));
        setMembers(JSON.parse(localStorage.getItem("mock_members")));
        
        const loadedMonths = JSON.parse(localStorage.getItem("mock_months"));
        setMonths(loadedMonths);
        
        // Find active open month or default to latest
        const openMonth = loadedMonths.find(m => m.status === "open") || loadedMonths[loadedMonths.length - 1];
        if (openMonth) {
          setActiveMonthId(openMonth.monthId);
        }

        setAttendanceRecords(JSON.parse(localStorage.getItem("mock_attendance")));
        setMonthlyAchievements(JSON.parse(localStorage.getItem("mock_achievements")));
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
        if (parsedMockUsers.length === 0 || !parsedMockUsers.some(u => u.username === "kkh9172")) {
          localStorage.setItem("mock_users", JSON.stringify(mockInitData.demoUsers));
        }
        setUsers(JSON.parse(localStorage.getItem("mock_users")));
        
        setLoading(false);
      } else {
        // --- REAL FIREBASE MODE ---
        try {
          // Fetch static tables: teams, zones, members, months
          const teamsSnap = await getDocs(collection(db, "teams"));
          const loadedTeams = teamsSnap.docs.map(d => ({ teamId: d.id, ...d.data() }));
          setTeams(loadedTeams);

          const zonesSnap = await getDocs(collection(db, "zones"));
          const loadedZones = zonesSnap.docs.map(d => ({ zoneId: d.id, ...d.data() }));
          setZones(loadedZones);

          const membersSnap = await getDocs(collection(db, "members"));
          const loadedMembers = membersSnap.docs.map(d => ({ memberId: d.id, ...d.data() }));
          setMembers(loadedMembers);

          const monthsSnap = await getDocs(query(collection(db, "months"), orderBy("monthId", "asc")));
          const loadedMonths = monthsSnap.docs.map(d => ({ monthId: d.id, ...d.data() }));
          setMonths(loadedMonths);

          // Find active open month
          const openMonth = loadedMonths.find(m => m.status === "open") || loadedMonths[loadedMonths.length - 1];
          if (openMonth) {
            setActiveMonthId(openMonth.monthId);
          }

          // Load logs
          const logsSnap = await getDocs(query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(100)));
          const loadedLogs = logsSnap.docs.map(d => ({ logId: d.id, ...d.data() }));
          setAuditLogs(loadedLogs);

          // Load users
          const usersSnap = await getDocs(collection(db, "users"));
          const loadedUsers = usersSnap.docs.map(d => ({ userId: d.id, ...d.data() }));
          setUsers(loadedUsers);
          
          setLoading(false);
        } catch (error) {
          console.error("Error loading Firestore collections:", error);
          setLoading(false);
        }
      }
    }
    loadData();
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
        } catch (error) {
          console.error("Error fetching month records:", error);
        }
      }
    }

    loadMonthRecords();
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
      samil: "삼일예배", sunday: "주일예배", zone: "구역예배",
      test: "시험", radio: "심야라디오", simon: "시몬스쿨",
      visit: "심방", activity: "활동현황"
    };
    const catLabel = categoryNames[category] || category;
    logChange(memberId, memberName, `${activeMonthId.split("-")[1]}월 ${activeWeekNo}주차 ${catLabel}: ${oldValue} -> ${value}`);
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

  // 5. Members CRUD
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

  // 6. Teams CRUD
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

  // 7. Zones CRUD
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

  // 7.5 Users CRUD
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

  // 7.8 Seeding Firebase database with initial structures
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

  // 8. Close Month Routine
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

  const value = {
    teams,
    zones,
    members,
    months,
    attendanceRecords,
    monthlyAchievements,
    auditLogs,
    users,
    activeMonthId,
    setActiveMonthId,
    activeWeekNo,
    setActiveWeekNo,
    loading,
    updateAttendance,
    updateMonthlyAchievement,
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
    logChange
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
