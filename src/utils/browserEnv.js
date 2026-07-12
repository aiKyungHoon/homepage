// 인앱 브라우저(네이버/카카오톡 등) 감지 및 외부 브라우저 열기 유틸
// - 인앱 브라우저는 Firestore 스트리밍 연결을 막아 로그인 후 흰/빈 화면이 나는 경우가 많음
// - 이럴 때 크롬 같은 정식 브라우저로 열도록 유도한다

export function getUA() {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

export function isAndroid() {
  return /Android/i.test(getUA());
}

export function isIOS() {
  return /iPhone|iPad|iPod/i.test(getUA());
}

// 대표적인 인앱 브라우저 UA 토큰
export function isInAppBrowser() {
  const ua = getUA();
  if (!ua) return false;
  return /NAVER|KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|Line\/|Daum|everytimeApp|Snapchat|WhatsApp|Whale|; wv\)|; wv;|\bwv\b/i.test(
    ua
  );
}

// 안드로이드: intent 스킴으로 크롬을 강제로 열기
// iOS: 인앱 브라우저에서 외부 강제 이동이 제한적 → 새 창 시도(대개 사용자가 직접 열어야 함)
export function openInExternalBrowser() {
  const url = window.location.href;
  if (isAndroid()) {
    const host = window.location.host;
    const path = window.location.pathname + window.location.search + window.location.hash;
    const intentUrl =
      `intent://${host}${path}#Intent;scheme=https;package=com.android.chrome;` +
      `S.browser_fallback_url=${encodeURIComponent(url)};end`;
    window.location.href = intentUrl;
  } else {
    window.open(url, "_blank");
  }
}
