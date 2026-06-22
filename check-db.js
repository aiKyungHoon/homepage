import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDggqS-h9QcPtDH9b8P1_BoI5hHgqZm98A",
  authDomain: "church-attendance-kh-2026.firebaseapp.com",
  projectId: "church-attendance-kh-2026",
  storageBucket: "church-attendance-kh-2026.firebasestorage.app",
  messagingSenderId: "895492707053",
  appId: "1:895492707053:web:0e18461b397e2cb892b2e4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDatabase() {
  console.log("Checking Firestore database...");
  try {
    const auth = getAuth(app);
    await signInWithEmailAndPassword(auth, "admin@church.com", "admin123");
    console.log("Authenticated.");

    // 1. Audit Logs
    console.log("\n--- RECENT AUDIT LOGS ---");
    const logsQuery = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(15));
    const logsSnap = await getDocs(logsQuery);
    logsSnap.forEach(d => {
      const log = d.data();
      console.log(`[${log.timestamp}] User: ${log.operatorName} | Target: ${log.memberName} | Action: ${log.details}`);
    });

    // 2. Query for 강민우 (m1) attendance records
    console.log("\n--- MONTHS COLLECTION ---");
    const monthsSnap = await getDocs(collection(db, "months"));
    console.log(`Total months found: ${monthsSnap.size}`);
    monthsSnap.forEach(d => {
      console.log(`Month Document ID: ${d.id} -> ${JSON.stringify(d.data())}`);
    });

    console.log("\n--- ATTENDANCE RECORDS FOR 강민우 (m1) ---");
    const attSnap = await getDocs(collection(db, "attendanceRecords"));
    attSnap.forEach(d => {
      const rec = d.data();
      if (rec.memberId === "m1") {
        console.log(`ID: ${d.id} | Month: ${rec.monthId} | Week: ${rec.weekNo} | Cat: ${rec.category} | Value: ${rec.value}`);
      }
    });

    // 3. Search for any document containing 'undefined' in its ID
    console.log("\n--- DOCUMENTS WITH 'undefined' IN ID OR EMPTY MONTH ---");
    let foundBad = false;
    attSnap.forEach(d => {
      if (d.id.includes("undefined") || d.id.includes("__")) {
        console.log(`BAD ID: ${d.id} -> ${JSON.stringify(d.data())}`);
        foundBad = true;
      }
    });
    if (!foundBad) console.log("No bad record IDs found.");

  } catch (err) {
    console.error(err);
  }
}

checkDatabase();

