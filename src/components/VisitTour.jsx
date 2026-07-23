import React, { useState, useEffect, useCallback } from "react";
import { Play, Pause, ChevronRight, ChevronLeft, X } from "lucide-react";

/* ------------------------------------------------------------------ *
 * 심방관리 자동 시연 투어
 * ------------------------------------------------------------------ */
const STEPS = [
  { 
    selector: '[data-tour="visit-filters"]', 
    title: "심방 검색 및 범위 필터", 
    text: "이번 주, 이번 달, 전체 범위로 기간을 설정하고 특정 팀/구역/성도별 심방 내역만 필터링하여 찾아볼 수 있습니다. 시연을 위해 기간 필터를 '전체'로 임시 변경합니다.",
    action: (el) => {
      const periodSwitch = document.querySelector(".visit-period-switch");
      if (periodSwitch) {
        const btns = periodSwitch.querySelectorAll("button");
        if (btns.length > 2) btns[2].click();
      }
    },
    cleanup: () => {
      const periodSwitch = document.querySelector(".visit-period-switch");
      if (periodSwitch) {
        const btns = periodSwitch.querySelectorAll("button");
        if (btns.length > 0) btns[0].click();
      }
    }
  },
  { 
    selector: '[data-tour="visit-list"]', 
    title: "심방 타임라인 피드", 
    text: "등록된 모든 심방 내역과 구역장 성찰 일기가 최신 날짜 순으로 카드 형태로 정렬됩니다. 시연을 위해 첫 번째 심방 카드를 클릭해 상세 내역을 불러옵니다.",
    action: (el) => {
      const cards = el.querySelectorAll(".timeline-summary-card");
      if (cards.length > 0) {
        cards[0].click();
      }
    }
  },
  { 
    selector: '[data-tour="visit-detail"]', 
    title: "상세 내용 조회 및 피드백", 
    text: "선택한 심방 카드의 면담 기록을 상세히 확인하고, 복사 버튼으로 단톡방 공유 양식을 생성합니다. 또한 팀장과 임원은 이곳에 격려와 기도의 피드백을 실시간으로 달아줄 수 있어요.",
    action: (el) => {
      const editBtn = el.querySelector(".detail-header-actions button[title='수정']");
      if (editBtn) editBtn.click();
    },
    cleanup: () => {
      const cancelBtn = document.querySelector(".detail-edit-form button[type='button']") || document.querySelector(".detail-action-icon-btn.delete");
      if (cancelBtn) cancelBtn.click();
    }
  },
  { 
    selector: '[data-tour="visit-form-member"]', 
    title: "심방 대상 성도 선택", 
    text: "새로운 심방 내용을 기입할 때 대상 성도를 이름 또는 팀/구역 명으로 간편히 검색하여 매핑할 수 있어요.",
    action: (el) => {
      const input = el.querySelector("input");
      if (input) {
        input.value = "이";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    },
    cleanup: () => {
      const el = document.querySelector('[data-tour="visit-form-member"]');
      if (el) {
        const input = el.querySelector("input");
        if (input) {
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }
  },
  { 
    selector: '[data-tour="visit-form-visitor"]', 
    title: "심방 자격 구분", 
    text: "심방을 직접 다녀온 사람이 구역장, 팀장, 임원인지 버튼을 눌러 지정합니다. 시연을 위해 '팀장'으로 변경해 봅니다.",
    action: (el) => {
      const btns = el.querySelectorAll("button");
      if (btns.length > 1) btns[1].click();
    },
    cleanup: () => {
      const el = document.querySelector('[data-tour="visit-form-visitor"]');
      if (el) {
        const btns = el.querySelectorAll("button");
        if (btns.length > 0) btns[0].click();
      }
    }
  },
  { 
    selector: '[data-tour="visit-form-notes"]', 
    title: "심방 요약 대화 내용", 
    text: "기도 제목, 나누었던 고민, 건강 상태 등을 꼼꼼하게 텍스트로 적어 영구히 기도로 누적 보존합니다.",
    action: (el) => {
      el.value = "새로운 심방 내용을 자동으로 타이핑하는 데모입니다.";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    cleanup: () => {
      const textarea = document.querySelector('[data-tour="visit-form-notes"]');
      if (textarea) {
        textarea.value = "";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  },
  { 
    selector: '[data-tour="visit-import-btn"]', 
    title: "카톡 대화 복사글로 일괄 등록", 
    text: "[텍스트 붙여넣기 등록] 팝업창을 통하면, 단톡방에 보냈던 여러 명의 심방 보고 텍스트를 한 번에 복사-붙여넣기하여 여러 건을 일괄 추출·등록할 수 있는 스마트 추출 엔진을 시연합니다.",
    action: (el) => {
      el.click();
    },
    cleanup: () => {
      const closeBtn = document.querySelector(".note-modal-header button") || document.querySelector(".icon-button");
      if (closeBtn) closeBtn.click();
    }
  },
];

const STEP_MS = 3800;

export default function VisitTour({ onClose }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [rect, setRect] = useState(null);

  const step = STEPS[idx];
  const next = useCallback(() => {
    if (idx === STEPS.length - 1) {
      onClose();
      window.dispatchEvent(new CustomEvent("change-page", { detail: { page: "dashboard", autoStartTour: false } }));
    } else {
      setIdx(idx + 1);
    }
  }, [idx, onClose]);
  const prev = useCallback(() => setIdx(i => (i - 1 + STEPS.length) % STEPS.length), []);

  useEffect(() => {
    const currentStep = STEPS[idx];
    const el = document.querySelector(currentStep.selector);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });

    let timer;
    if (currentStep.action) {
      timer = setTimeout(() => {
        const targetEl = document.querySelector(currentStep.selector);
        if (targetEl) currentStep.action(targetEl);
      }, 600);
    }

    return () => {
      clearTimeout(timer);
      if (currentStep.cleanup) {
        currentStep.cleanup();
      }
    };
  }, [idx]);

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

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(next, STEP_MS);
    return () => clearTimeout(t);
  }, [idx, playing, next]);

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

  const tipBelow = rect ? rect.top + rect.height < window.innerHeight - 200 : true;
  const tipStyle = rect && {
    top: tipBelow ? rect.top + rect.height + 16 : undefined,
    bottom: tipBelow ? undefined : window.innerHeight - rect.top + 16,
    left: Math.max(12, Math.min(rect.left, window.innerWidth - 340)),
  };

  return (
    <div className="tour-root">
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
