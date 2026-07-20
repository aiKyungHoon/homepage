import React, { createContext, useContext, useState, useEffect } from "react";
import { isMockEnabled, auth, db } from "../firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { demoUsers } from "../utils/mockData";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state
  useEffect(() => {
    if (isMockEnabled) {
      // Mock Auth: Load logged-in user from localStorage if it exists
      try {
        const storedUser = localStorage.getItem("mock_auth_user");
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.warn("Failed to load mock user from localStorage:", e);
      }
      setLoading(false);
    } else {
      // Real Firebase Auth
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (window.isFirebaseSeeding) {
          console.log("Firebase seeding in progress, skipping auth state updates.");
          return;
        }
        if (firebaseUser) {
          try {
            // Fetch additional user role data from Firestore users collection
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setCurrentUser({
                userId: firebaseUser.uid,
                email: firebaseUser.email,
                name: userData.name || firebaseUser.displayName || "사용자",
                role: userData.role || "leader",
                teamId: userData.teamId || "",
                zoneId: userData.zoneId || ""
              });
            } else {
              // Fallback if user profile doesn't exist in Firestore
              setCurrentUser({
                userId: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || "미지정 리더",
                role: "leader",
                teamId: "",
                zoneId: ""
              });
            }
          } catch (error) {
            console.error("Error fetching user profile from Firestore:", error);
            // Minimal session info on fetch failure
            setCurrentUser({
              userId: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || "사용자",
              role: "leader",
              teamId: "",
              zoneId: ""
            });
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    }
  }, []);

  // 미활동 자동 로그아웃: 로그인 상태에서 30분간 아무 조작이 없으면 자동 로그아웃한다.
  // (자리를 비운 세션이 무단으로 열려 있는 것을 방지)
  useEffect(() => {
    if (!currentUser) return; // 로그인 상태에서만 동작

    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30분
    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    let lastActivity = Date.now();

    const onActivity = () => { lastActivity = Date.now(); };
    activityEvents.forEach(evt => window.addEventListener(evt, onActivity, { passive: true }));

    // 30초마다 미활동 시간을 확인
    const checkInterval = setInterval(() => {
      if (Date.now() - lastActivity >= INACTIVITY_LIMIT_MS) {
        clearInterval(checkInterval);
        activityEvents.forEach(evt => window.removeEventListener(evt, onActivity));
        try { alert("30분간 활동이 없어 자동 로그아웃되었습니다. 다시 로그인해 주세요."); } catch (e) { /* noop */ }
        logout();
      }
    }, 30 * 1000);

    return () => {
      clearInterval(checkInterval);
      activityEvents.forEach(evt => window.removeEventListener(evt, onActivity));
    };
    // logout 은 매 렌더마다 재생성되므로 deps 에서 제외(포함 시 타이머가 계속 초기화됨). currentUser 변화에만 반응.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Login
  async function login(username, password) {
    setLoading(true);
    const cleanUsername = (username || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    if (isMockEnabled) {
      // If mock mode, strip email domain if entered
      const mockUsername = cleanUsername.split("@")[0];
      // Look up user in demoUsers
      const user = demoUsers.find(u => u.username === mockUsername && u.password === cleanPassword);
      if (user) {
        setCurrentUser(user);
        try {
          localStorage.setItem("mock_auth_user", JSON.stringify(user));
        } catch (e) {
          console.warn("Failed to save mock user to localStorage:", e);
        }
        setLoading(false);
        return user;
      } else {
        setLoading(false);
        throw new Error("가입되지 않은 아이디이거나 비밀번호가 올바르지 않습니다. (로컬 테스트 아이디를 입력하거나 원클릭 로그인을 이용하세요)");
      }
    } else {
      // Map username to a standard email format for Firebase Auth compatibility (or use directly if already an email)
      const email = cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@church.com`;
      console.log(`[Auth] Attempting login. Original username: "${username}", Cleaned username: "${cleanUsername}", Derived Email: "${email}"`);
      const userCredential = await signInWithEmailAndPassword(auth, email, cleanPassword);
      // Details are fetched in onAuthStateChanged
      return userCredential.user;
    }
  }

  // Logout
  async function logout() {
    setLoading(true);
    if (isMockEnabled) {
      setCurrentUser(null);
      try {
        localStorage.removeItem("mock_auth_user");
      } catch (e) {
        console.warn("Failed to remove mock user from localStorage:", e);
      }
      setLoading(false);
    } else {
      await signOut(auth);
    }
  }

  // Quick login for testing
  function loginAsDemoUser(userId) {
    if (!isMockEnabled) return;
    const user = demoUsers.find(u => u.userId === userId);
    if (user) {
      setCurrentUser(user);
      try {
        localStorage.setItem("mock_auth_user", JSON.stringify(user));
      } catch (e) {
        console.warn("Failed to save mock user to localStorage:", e);
      }
    }
  }

  const value = {
    currentUser,
    loading,
    login,
    logout,
    loginAsDemoUser,
    isMockMode: isMockEnabled
  };

  return (
    <AuthContext.Provider value={value}>
      {/* 항상 children 을 렌더 → 로딩/타임아웃 화면은 AppContent가 authLoading 으로 처리.
          (인앱 브라우저에서 auth 단계가 멈춰도 빈 화면 대신 복구 화면이 뜨도록) */}
      {children}
    </AuthContext.Provider>
  );
}
