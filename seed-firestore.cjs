const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'church-attendance-kh-2026',
});

const demoUsers = [
  {
    userId: "admin_user",
    username: "admin",
    password: "admin123",
    name: "김관리 (총괄 관리자)",
    role: "admin",
    teamId: "",
    zoneId: ""
  },
  {
    userId: "haebom_leader",
    username: "team_haebom",
    password: "haebom123",
    name: "이태양 (해봄 팀장)",
    role: "team",
    teamId: "team_haebom",
    zoneId: ""
  },
  {
    userId: "zone8_leader",
    username: "leader8",
    password: "leader123",
    name: "박영광 (해봄 8구역장)",
    role: "leader",
    teamId: "team_haebom",
    zoneId: "zone_haebom_8"
  },
  {
    userId: "zone9_leader",
    username: "leader9",
    password: "leader123",
    name: "최은혜 (해봄 9구역장)",
    role: "leader",
    teamId: "team_haebom",
    zoneId: "zone_haebom_9"
  }
];

const initialTeams = [
  { teamId: "team_haebom", name: "해봄팀", leaderId: "haebom_leader", createdAt: "2026-01-10", status: "active" },
  { teamId: "team_sarang", name: "사랑팀", leaderId: "", createdAt: "2026-01-15", status: "active" },
  { teamId: "team_haengbok", name: "행복팀", leaderId: "", createdAt: "2026-02-01", status: "active" },
  { teamId: "team_vision", name: "비전팀", leaderId: "", createdAt: "2026-02-15", status: "active" }
];

const initialZones = [
  { zoneId: "zone_haebom_8", teamId: "team_haebom", name: "해봄 8구역", leaderId: "zone8_leader" },
  { zoneId: "zone_haebom_9", teamId: "team_haebom", name: "해봄 9구역", leaderId: "zone9_leader" },
  { zoneId: "zone_haebom_10", teamId: "team_haebom", name: "해봄 10구역", leaderId: "" },
  { zoneId: "zone_sarang_1", teamId: "team_sarang", name: "사랑 1구역", leaderId: "" },
  { zoneId: "zone_sarang_2", teamId: "team_sarang", name: "사랑 2구역", leaderId: "" },
  { zoneId: "zone_haengbok_1", teamId: "team_haengbok", name: "행복 1구역", leaderId: "" }
];

const initialMembers = [
  // 해봄 8구역원 (11명)
  { memberId: "m1", name: "강민우", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m2", name: "김지아", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m3", name: "이준호", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m4", name: "박소윤", rank: "새가족", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "new" },
  { memberId: "m5", name: "정우진", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m6", name: "최다현", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m7", name: "한지민", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m8", name: "윤성민", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m9", name: "임수빈", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m10", name: "조현우", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "excluded" },
  { memberId: "m11", name: "황보라", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },

  // 해봄 9구역원 (9명)
  { memberId: "m12", name: "배재희", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m13", name: "송지석", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m14", name: "신유진", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m15", name: "안성원", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m16", name: "오혜선", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m17", name: "유민재", rank: "새가족", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "new" },
  { memberId: "m18", name: "홍하은", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m19", name: "서도윤", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m20", name: "권나래", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },

  // 해봄 10구역원 (5명)
  { memberId: "m21", name: "백승우", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },
  { memberId: "m22", name: "서아름", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },
  { memberId: "m23", name: "손민서", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },
  { memberId: "m24", name: "양지훈", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },
  { memberId: "m25", name: "엄지안", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },

  // 사랑 1구역원 (8명)
  { memberId: "m26", name: "김철수", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m27", name: "이영희", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m28", name: "박성호", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m29", name: "최미영", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m30", name: "정다은", rank: "청년", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m31", name: "오건우", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m32", name: "유서현", rank: "청년", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "new" },
  { memberId: "m33", name: "신동엽", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" }
];

const initialMonths = [
  { monthId: "2026-05", year: 2026, month: 5, status: "closed" },
  { monthId: "2026-06", year: 2026, month: 6, status: "open" }
];

const generateInitialAttendance = () => {
  const records = [];
  const achievements = [];
  const monthId = "2026-06";
  const memberIds = initialMembers.map(m => m.memberId);

  memberIds.forEach((mId, idx) => {
    for (let w = 1; w <= 4; w++) {
      records.push({
        recordId: `${mId}_${monthId}_${w}_sunday`,
        memberId: mId,
        monthId,
        weekNo: w,
        category: "sunday",
        value: idx % 10 === 0 ? "결석" : idx % 10 === 1 ? "비대면" : idx % 10 === 9 ? "미보고" : "대면"
      });

      records.push({
        recordId: `${mId}_${monthId}_${w}_samil`,
        memberId: mId,
        monthId,
        weekNo: w,
        category: "samil",
        value: idx % 5 === 0 ? "X" : "O"
      });

      records.push({
        recordId: `${mId}_${monthId}_${w}_zone`,
        memberId: mId,
        monthId,
        weekNo: w,
        category: "zone",
        value: idx % 7 === 0 ? "X" : idx % 7 === 1 ? "대체" : "O"
      });

      records.push({
        recordId: `${mId}_${monthId}_${w}_test`,
        memberId: mId,
        monthId,
        weekNo: w,
        category: "test",
        value: idx % 4 === 0 ? "X" : "O"
      });

      records.push({
        recordId: `${mId}_${monthId}_${w}_radio`,
        memberId: mId,
        monthId,
        weekNo: w,
        category: "radio",
        value: idx % 3 === 0 ? "X" : "O"
      });

      records.push({
        recordId: `${mId}_${monthId}_${w}_simon`,
        memberId: mId,
        monthId,
        weekNo: w,
        category: "simon",
        value: idx % 6 === 0 ? "X" : "O"
      });

      records.push({
        recordId: `${mId}_${monthId}_${w}_visit`,
        memberId: mId,
        monthId,
        weekNo: w,
        category: "visit",
        value: idx % 12 === 0 ? "O" : "X"
      });

      records.push({
        recordId: `${mId}_${monthId}_${w}_activity`,
        memberId: mId,
        monthId,
        weekNo: w,
        category: "activity",
        value: idx % 8 === 0 ? "대체" : "O"
      });
    }

    achievements.push({
      achievementId: `${mId}_${monthId}_evangelism`,
      memberId: mId,
      monthId,
      category: "evangelism",
      achieved: idx % 7 === 2,
      achievedWeekNo: idx % 7 === 2 ? 1 : 0
    });

    achievements.push({
      achievementId: `${mId}_${monthId}_tithing`,
      memberId: mId,
      monthId,
      category: "tithing",
      achieved: idx % 5 !== 1,
      achievedWeekNo: idx % 5 !== 1 ? 1 : 0
    });

    achievements.push({
      achievementId: `${mId}_${monthId}_fee`,
      memberId: mId,
      monthId,
      category: "fee",
      achieved: idx % 4 !== 2,
      achievedWeekNo: idx % 4 !== 2 ? 1 : 0
    });
  });

  return { records, achievements };
};

const generatedData = generateInitialAttendance();
const initialAttendanceRecords = generatedData.records;
const initialMonthlyAchievements = generatedData.achievements;

const initialAuditLogs = [
  {
    logId: "l1",
    operatorId: "admin_user",
    operatorName: "김관리 (총괄 관리자)",
    timestamp: "2026-06-18T10:30:00Z",
    memberId: "m1",
    memberName: "강민우",
    details: "6월 1주차 주일예배 상태 변경: 미보고 -> 대면"
  },
  {
    logId: "l2",
    operatorId: "haebom_leader",
    operatorName: "이태양 (해봄 팀장)",
    timestamp: "2026-06-18T14:22:00Z",
    memberId: "m12",
    memberName: "배재희",
    details: "6월 2주차 십일조 달성 상태 추가"
  }
];

async function seed() {
  console.log("Seeding Firestore databases starting...");
  
  // 1. Seed Users
  console.log("Writing users...");
  for (const u of demoUsers) {
    const { userId, ...data } = u;
    await db.collection('users').doc(userId).set(data);
  }

  // 2. Seed Teams
  console.log("Writing teams...");
  for (const t of initialTeams) {
    const { teamId, ...data } = t;
    await db.collection('teams').doc(teamId).set(data);
  }

  // 3. Seed Zones
  console.log("Writing zones...");
  for (const z of initialZones) {
    const { zoneId, ...data } = z;
    await db.collection('zones').doc(zoneId).set(data);
  }

  // 4. Seed Members
  console.log("Writing members...");
  for (const m of initialMembers) {
    const { memberId, ...data } = m;
    await db.collection('members').doc(memberId).set(data);
  }

  // 5. Seed Months
  console.log("Writing months...");
  for (const m of initialMonths) {
    const { monthId, ...data } = m;
    await db.collection('months').doc(monthId).set(data);
  }

  // 6. Seed Attendance Records
  console.log("Writing attendance records...");
  const attBatch = db.batch();
  for (const r of initialAttendanceRecords) {
    const { recordId, ...data } = r;
    const ref = db.collection('attendanceRecords').doc(recordId);
    attBatch.set(ref, data);
  }
  await attBatch.commit();

  // 7. Seed Achievements
  console.log("Writing monthly achievements...");
  const achBatch = db.batch();
  for (const a of initialMonthlyAchievements) {
    const { achievementId, ...data } = a;
    const ref = db.collection('monthlyAchievements').doc(achievementId);
    achBatch.set(ref, data);
  }
  await achBatch.commit();

  // 8. Seed Audit Logs
  console.log("Writing audit logs...");
  for (const l of initialAuditLogs) {
    const { logId, ...data } = l;
    await db.collection('auditLogs').doc(logId).set(data);
  }

  console.log("Firestore seeding completed successfully! 🎉");
}

seed().catch(err => {
  console.error("Firestore seeding failed:", err);
  process.exit(1);
});
