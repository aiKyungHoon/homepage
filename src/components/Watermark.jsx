import { useEffect, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * 화면 전체를 덮는 반복 워터마크.
 * - 로그인한 사용자 정보(이름/ID/시간)를 화면 전체에 대각선 타일로 깔아
 *   캡쳐본 유출 시 누가·언제 봤는지 추적할 수 있게 합니다.
 * - pointer-events: none 이라 클릭/스크롤은 그대로 통과합니다.
 * - 개발자도구로 DOM을 지워도 자동 복구(MutationObserver)합니다.
 *
 * 진하기(B: 뚜렷하게)는 아래 OPACITY 값으로 조절하세요.
 */

// 워터마크 진하기 (0~1). B안 = 뚜렷하게. 은은하게 하려면 0.06 정도로 낮추세요.
// difference 블렌드로 배경을 반전시키므로 라이트/다크 어디서든 보입니다.
const OPACITY = 0.14;
// 글자 크기 / 타일 간격
const FONT_SIZE = 15;
const TILE_W = 240;
const TILE_H = 150;

function buildLabel(user) {
  const name = user?.name || "사용자";
  const id = user?.userId || user?.email || "";
  const shortId = id ? String(id).slice(0, 10) : "";
  const now = new Date();
  const stamp =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")} ` +
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return `${name}${shortId ? " · " + shortId : ""} · ${stamp}`;
}

function makeSvgDataUri(label) {
  // 대각선(-30도) 타일 하나를 SVG로 그려 background로 반복시킴
  const safe = label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // fill 은 흰색 solid, 최종 진하기는 컨테이너 opacity 로 제어(예측 가능)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W}" height="${TILE_H}">
    <text x="0" y="${TILE_H / 2}" transform="rotate(-30 ${TILE_W / 2} ${TILE_H / 2})"
      fill="#ffffff" font-size="${FONT_SIZE}"
      font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      font-weight="700" letter-spacing="0.5">${safe}</text>
  </svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export default function Watermark() {
  const { currentUser } = useAuth();
  const ref = useRef(null);

  // 1분마다 시간 갱신을 위해 label 을 memo (currentUser 변경 시 재생성)
  const label = useMemo(
    () => buildLabel(currentUser),
    // currentUser 가 바뀔 때만. 시간은 마운트 시점 기준.
    [currentUser]
  );

  const bgImage = useMemo(() => makeSvgDataUri(label), [label]);

  const style = {
    position: "fixed",
    inset: 0,
    zIndex: 2147483647, // 최상단
    pointerEvents: "none", // 클릭/스크롤 통과
    backgroundImage: bgImage,
    backgroundRepeat: "repeat",
    opacity: OPACITY,
    // difference 로 배경을 반전 → 다크/라이트 배경 모두에서 보임
    mixBlendMode: "difference",
    userSelect: "none",
    WebkitUserSelect: "none",
  };

  // DOM 삭제 방어: 워터마크 노드가 제거되면 다시 붙임
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentNode;
    if (!parent) return;

    const observer = new MutationObserver(() => {
      if (!document.body.contains(el)) {
        parent.appendChild(el);
      }
      // 인라인 스타일이 지워지면 복구
      if (el.style.display === "none" || el.style.visibility === "hidden") {
        el.style.display = "block";
        el.style.visibility = "visible";
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    return () => observer.disconnect();
  }, []);

  if (!currentUser) return null;

  return <div ref={ref} style={style} aria-hidden="true" data-wm="1" />;
}
