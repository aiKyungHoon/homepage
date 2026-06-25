// Initial dummy data for local simulation and testing

export const demoUsers = [
  {
    userId: "admin_user",
    username: "admin",
    password: "admin123",
    name: "김관리 (임원)",
    role: "admin",
    teamId: "",
    zoneId: ""
  },
  {
    userId: "admin_user_1",
    username: "admin1",
    password: "admin1234!",
    name: "임원1",
    role: "admin",
    teamId: "",
    zoneId: ""
  },
  {
    userId: "admin_user_2",
    username: "admin2",
    password: "admin1234!",
    name: "임원2",
    role: "admin",
    teamId: "",
    zoneId: ""
  },
  {
    userId: "kkh9172_user",
    username: "kkh9172",
    password: "admin1234!",
    name: "김경훈 (임원)",
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

export const initialTeams = [
  { teamId: "team_haebom", name: "해봄팀", leaderId: "haebom_leader", createdAt: "2026-01-10", status: "active" },
  { teamId: "team_sarang", name: "사랑팀", leaderId: "", createdAt: "2026-01-15", status: "active" },
  { teamId: "team_haengbok", name: "행복팀", leaderId: "", createdAt: "2026-02-01", status: "active" },
  { teamId: "team_vision", name: "비전팀", leaderId: "", createdAt: "2026-02-15", status: "active" }
];

export const initialZones = [
  { zoneId: "zone_haebom_8", teamId: "team_haebom", name: "해봄 8구역", leaderId: "zone8_leader" },
  { zoneId: "zone_haebom_9", teamId: "team_haebom", name: "해봄 9구역", leaderId: "zone9_leader" },
  { zoneId: "zone_haebom_10", teamId: "team_haebom", name: "해봄 10구역", leaderId: "" },
  { zoneId: "zone_sarang_1", teamId: "team_sarang", name: "사랑 1구역", leaderId: "" },
  { zoneId: "zone_sarang_2", teamId: "team_sarang", name: "사랑 2구역", leaderId: "" },
  { zoneId: "zone_haengbok_1", teamId: "team_haengbok", name: "행복 1구역", leaderId: "" }
];

export const initialMembers = [
  // 해봄 8구역원 (11명)
  { memberId: "m1", name: "강민우", phone: "010-1234-5678", birthDate: "1994-05-12", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m2", name: "김지아", phone: "010-2345-6789", birthDate: "1996-08-22", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m3", name: "이준호", phone: "010-3456-7890", birthDate: "1992-03-15", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m4", name: "박소윤", phone: "010-4567-8901", birthDate: "1997-11-30", rank: "새가족", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "new" },
  { memberId: "m5", name: "정우진", phone: "010-5678-9012", birthDate: "1995-02-18", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m6", name: "최다현", phone: "010-6789-0123", birthDate: "1993-07-25", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m7", name: "한지민", phone: "010-7890-1234", birthDate: "1998-09-05", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m8", name: "윤성민", phone: "010-8901-2345", birthDate: "1991-12-08", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m9", name: "임수빈", phone: "010-9012-3456", birthDate: "1995-04-14", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },
  { memberId: "m10", name: "조현우", phone: "010-1111-2222", birthDate: "1993-10-10", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "excluded" },
  { memberId: "m11", name: "황보라", phone: "010-2222-3333", birthDate: "1996-01-27", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_8", status: "normal" },

  // 해봄 9구역원 (9명)
  { memberId: "m12", name: "배재희", phone: "010-3333-4444", birthDate: "1994-02-14", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m13", name: "송지석", phone: "010-4444-5555", birthDate: "1992-06-18", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m14", name: "신유진", phone: "010-5555-6666", birthDate: "1997-09-09", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m15", name: "안성원", phone: "010-6666-7777", birthDate: "1991-03-24", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m16", name: "오혜선", phone: "010-7777-8888", birthDate: "1995-10-31", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m17", name: "유민재", phone: "010-8888-9999", birthDate: "1993-05-05", rank: "새가족", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "new" },
  { memberId: "m18", name: "홍하은", phone: "010-9999-0000", birthDate: "1998-01-12", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m19", name: "서도윤", phone: "010-1234-1111", birthDate: "1994-07-29", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },
  { memberId: "m20", name: "권나래", phone: "010-2345-2222", birthDate: "1996-12-04", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_9", status: "normal" },

  // 해봄 10구역원 (5명)
  { memberId: "m21", name: "백승우", phone: "010-3456-3333", birthDate: "1992-09-17", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },
  { memberId: "m22", name: "서아름", phone: "010-4567-4444", birthDate: "1997-04-20", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },
  { memberId: "m23", name: "손민서", phone: "010-5678-5555", birthDate: "1995-11-11", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },
  { memberId: "m24", name: "양지훈", phone: "010-6789-6666", birthDate: "1993-03-03", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },
  { memberId: "m25", name: "엄지안", phone: "010-7890-7777", birthDate: "1996-06-06", rank: "청년", teamId: "team_haebom", zoneId: "zone_haebom_10", status: "normal" },

  // 사랑 1구역원 (8명)
  { memberId: "m26", name: "김철수", phone: "010-8888-1111", birthDate: "1985-05-15", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m27", name: "이영희", phone: "010-8888-2222", birthDate: "1988-06-22", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m28", name: "박성호", phone: "010-8888-3333", birthDate: "1983-02-18", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m29", name: "최미영", phone: "010-8888-4444", birthDate: "1989-11-09", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m30", name: "정다은", phone: "010-8888-5555", birthDate: "1990-10-12", rank: "청년", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m31", name: "오건우", phone: "010-8888-6666", birthDate: "1987-03-31", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" },
  { memberId: "m32", name: "유서현", phone: "010-8888-7777", birthDate: "1991-01-20", rank: "청년", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "new" },
  { memberId: "m33", name: "신동엽", phone: "010-8888-8888", birthDate: "1986-07-07", rank: "집사", teamId: "team_sarang", zoneId: "zone_sarang_1", status: "normal" }
];

export const initialMonths = [
  { monthId: "2026-05", year: 2026, month: 5, status: "closed" },
  { monthId: "2026-06", year: 2026, month: 6, status: "open" }
];

const generateInitialAttendance = () => {
  const records = [];
  const achievements = [];
  const monthId = "2026-06";
  const memberIds = initialMembers.map(m => m.memberId);

  memberIds.forEach((mId, idx) => {
    // Fill weeks 1 to 4 with some sample data
    for (let w = 1; w <= 4; w++) {
      // Services (sunday, samil, zone)
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

      // Education (test, radio, simon)
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

      // Visitation & Activity status
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

    // Monthly achievements
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

export const initialAttendanceRecords = generatedData.records;
export const initialMonthlyAchievements = generatedData.achievements;

export const initialAuditLogs = [
  {
    logId: "l1",
    operatorId: "admin_user",
    operatorName: "김관리 (임원)",
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
