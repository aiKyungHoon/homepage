import React, { useState, useEffect, useCallback } from "react";
import { Play, Pause, ChevronRight, ChevronLeft, X } from "lucide-react";

/* ------------------------------------------------------------------ *
 * 대시보드 자동 시연 투어
 * 실제 대시보드의 요소([data-tour="..."])를 스포트라이트로 짚으며
 * 자막과 함께 자동으로 다음 단계로 넘어간다. (반복 재생)
 * ------------------------------------------------------------------ */
const STEPS = [
  { selector: '[data-tour="banner"]', title: "대시보드 한눈에 보기", text: "우리 교구의 예배·출석 현황이 모이는 화면이에요. 오른쪽에 평균 출석률이 표시됩니다." },
  { selector: '[data-tour="tabswitch"]', title: "주차별 · 월별 전환", text: "한 주 기준(주차별)과 한 달 누적(월별) 대시보드를 여기서 전환해요." },
  { selector: '[data-tour="cards"]', title: "핵심 숫자 카드", text: "교구 총원·출결 제외 등 핵심 숫자예요. 카드를 클릭하면 해당 명단이 나옵니다." },
  { selector: '[data-tour="worship"]', title: "예배 현황", text: "기준(주일실제·삼일 등)을 골라 대면·비대면·결석·미보고 분류를 확인해요." },
  { selector: '[data-tour="report"]', title: "주간 리포트 생성", text: "한 주 요약 보고서를 만들어 단톡방 등에 공유할 수 있어요." },
  { selector: '[data-tour="sync"]', title: "실시간 동기화", text: "다른 사람이 입력한 최신 내용은 이 버튼으로 새로고침해요." },
];

const STEP_MS = 3800;

export default function DashboardTour({ onClose }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [rect, setRect] = useState(null);

  const step = STEPS[idx];
  const next = useCallback(() => setIdx(i => (i + 1) % STEPS.length), []);
  const prev = useCallback(() => setIdx(i => (i - 1 + STEPS.length) % STEPS.length), []);

  // 현재 단계 대상 요소를 화면 중앙으로 스크롤
  useEffect(() => {
    const el = document.querySelector(STEPS[idx].selector);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [idx]);

  // 매 프레임 대상 위치를 추적해 스포트라이트를 붙여둔다(스크롤/리사이즈에도 정렬 유지)
  useEffect(() => {
    let raf;
    const track = () => {
      const el = document.querySelector(STEPS[idx].selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect(prev =>
          prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height }
        );
      }
      raf = requestAnimationFrame(track);
    };
    raf = requestAnimationFrame(track);
    return () => cancelAnimationFrame(raf);
  }, [idx]);

  // 자동 진행
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(next, STEP_MS);
    return () => clearTimeout(t);
  }, [idx, playing, next]);

  // ESC 로 닫기
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  const pad = 8;
  const spot = rect && {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };

  // 툴팁 위치: 대상이 화면 아래쪽이면 위로, 아니면 아래로
  const tipBelow = rect ? rect.top + rect.height < window.innerHeight - 200 : true;
  const tipStyle = rect && {
    top: tipBelow ? rect.top + rect.height + 16 : undefined,
    bottom: tipBelow ? undefined : window.innerHeight - rect.top + 16,
    left: Math.max(12, Math.min(rect.left, window.innerWidth - 340)),
  };

  return (
    <div className="tour-root">
      {/* 클릭 캐처: 배경 클릭 시 다음 단계 (실제 UI 오작동 방지) */}
      <div className="tour-catcher" onClick={next} />

      {spot && <div className="tour-spot" style={spot} />}

      {rect && (
        <div className="tour-tip" style={tipStyle} onClick={(e) => e.stopPropagation()}>
          <div className="tour-tip-head">
            <span className="tour-badge">{idx + 1} / {STEPS.length}</span>
            <span className="tour-title">{step.title}</span>
            <button className="tour-x" onClick={onClose} aria-label="닫기"><X size={16} /></button>
          </div>
          <p className="tour-text">{step.text}</p>
          <div className="tour-ctrls">
            <button className="tour-btn" onClick={prev}><ChevronLeft size={15} /></button>
            <button className="tour-btn" onClick={() => setPlaying(p => !p)}>
              {playing ? <Pause size={14} /> : <Play size={14} />}
              <span>{playing ? "일시정지" : "재생"}</span>
            </button>
            <button className="tour-btn" onClick={next}><ChevronRight size={15} /></button>
            <div className="tour-dots">
              {STEPS.map((_, i) => (
                <button key={i} className={`tour-dot ${i === idx ? "on" : ""}`} onClick={() => setIdx(i)} aria-label={`${i + 1}단계`} />
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tour-root { position: fixed; inset: 0; z-index: 9998; pointer-events: none; }
        .tour-catcher { position: fixed; inset: 0; pointer-events: auto; background: transparent; }
        .tour-spot {
          position: fixed; border-radius: 12px; pointer-events: none;
          box-shadow: 0 0 0 9999px rgba(3, 8, 14, 0.68), 0 0 0 2px var(--accent-cyan, #06b6d4);
          outline: 2px solid var(--accent-cyan, #06b6d4); outline-offset: 0;
        }
        .tour-spot::after {
          content: ""; position: absolute; inset: -2px; border-radius: 12px;
          box-shadow: 0 0 0 2px var(--accent-cyan, #06b6d4); animation: tour-pulse 1.6s ease-out infinite;
        }
        @keyframes tour-pulse { 0% { opacity: .9; } 70% { opacity: 0; box-shadow: 0 0 0 10px rgba(6,182,212,0); } 100% { opacity: 0; } }
        .tour-tip {
          position: fixed; width: 320px; max-width: calc(100vw - 24px); pointer-events: auto;
          background: var(--bg-secondary, #12161c); border: 1px solid var(--glass-border, rgba(255,255,255,.1));
          border-radius: 14px; padding: 16px; box-shadow: 0 16px 40px rgba(0,0,0,.5);
          animation: tour-in .25s ease-out;
        }
        @keyframes tour-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .tour-tip-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .tour-badge { flex: 0 0 auto; font-size: 11px; font-weight: 700; color: var(--accent-cyan, #06b6d4);
          background: rgba(6,182,212,.12); padding: 3px 8px; border-radius: 20px; }
        .tour-title { font-size: 14px; font-weight: 700; color: var(--text-primary, #fff); }
        .tour-x { margin-left: auto; color: var(--text-muted, #8b95a1); display: flex; }
        .tour-x:hover { color: var(--text-primary, #fff); }
        .tour-text { font-size: 13px; line-height: 1.6; color: var(--text-secondary, #c2cad3); margin: 0 0 14px; }
        .tour-ctrls { display: flex; align-items: center; gap: 6px; }
        .tour-btn { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-secondary, #c2cad3);
          background: var(--glass-border, rgba(255,255,255,.08)); padding: 6px 10px; border-radius: 8px; }
        .tour-btn:hover { color: var(--text-primary, #fff); }
        .tour-dots { display: flex; gap: 5px; margin-left: auto; }
        .tour-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--glass-border, rgba(255,255,255,.18)); padding: 0; }
        .tour-dot.on { background: var(--accent-cyan, #06b6d4); }
      `}</style>
    </div>
  );
}
