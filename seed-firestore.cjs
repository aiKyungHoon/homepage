const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'church-attendance-kh-2026',
});

const demoUsers = [
  {
    userId: "admin_user",
    username: "admin",
    password: "admin123",
    name: "관리자",
    role: "admin",
    teamId: "",
    zoneId: ""
  },
  {
    userId: "haebom_leader",
    username: "team_haebom",
    password: "haebom123",
    name: "해봄 팀장",
    role: "team",
    teamId: "team_haebom",
    zoneId: ""
  },
  {
    userId: "zone8_leader",
    username: "leader8",
    password: "leader123",
    name: "해봄 8구역장",
    role: "leader",
    teamId: "team_haebom",
    zoneId: "zone_haebom_8"
  },
  {
    userId: "zone9_leader",
    username: "leader9",
    password: "leader123",
    name: "해봄 9구역장",
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
  { memberId: "m1", name: "회원1", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m2", name: "회원2", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m3", name: "회원3", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m4", name: "회원4", rank: "새가족", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "new" },
  { memberId: "m5", name: "회원5", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m6", name: "회원6", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m7", name: "회원7", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m8", name: "회원8", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m9", name: "회원9", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m10", name: "회원10", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "excluded" },
  { memberId: "m11", name: "회원11", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },

  // 해봄 9구역원 (9명)
  { memberId: "m12", name: "회원12", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m13", name: "회원13", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m14", name: "회원14", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m15", name: "회원15", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m16", name: "회원16", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m17", name: "회원17", rank: "새가족", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "new" },
  { memberId: "m18", name: "회원18", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m19", name: "회원19", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m20", name: "회원20", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },

  // 해봄 10구역원 (5명)
  { memberId: "m21", name: "회원21", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },
  { memberId: "m22", name: "회원22", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },
  { memberId: "m23", name: "회원23", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },
  { memberId: "m24", name: "회원24", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },
  { memberId: "m25", name: "회원25", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },

  // 사랑 1구역원 (8명)
  { memberId: "m26", name: "회원26", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m27", name: "회원27", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m28", name: "회원28", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m29", name: "회원29", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m30", name: "회원30", rank: "청년", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m31", name: "회원31", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m32", name: "회원32", rank: "청년", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "new" },
  { memberId: "m33", name: "회원33", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" }
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
        value: idx % 7 === 0 ? "미전달" : idx % 7 === 1 ? "개별전달" : "들어옴"
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
        value: idx % 8 === 0 ? "비대면" : "대면"
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
    operatorName: "관리자",
    timestamp: "2026-06-18T10:30:00Z",
    memberId: "m1",
    memberName: "회원1",
    details: "6월 1주차 주일예배 상태 변경: 미보고 -> 대면"
  },
  {
    logId: "l2",
    operatorId: "haebom_leader",
    operatorName: "해봄 팀장",
    timestamp: "2026-06-18T14:22:00Z",
    memberId: "m12",
    memberName: "회원12",
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
