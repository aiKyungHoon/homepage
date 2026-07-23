import React, { useState, useEffect, useCallback } from "react";
import { Play, Pause, ChevronRight, ChevronLeft, X } from "lucide-react";

/* ------------------------------------------------------------------ *
 * 출결관리 자동 시연 투어
 * ------------------------------------------------------------------ */
const STEPS = [
  { 
    selector: '[data-tour="attendance-filters"]', 
    title: "성도 검색 및 필터", 
    text: "이름, 팀, 구역, 등록구분별로 성도를 검색할 수 있어요. 시연을 위해 검색창에 이름의 첫 글자를 쳐 봅니다.",
    action: (el) => {
      const input = el.querySelector("input");
      if (input) {
        input.value = "이";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    },
    cleanup: () => {
      const el = document.querySelector('[data-tour="attendance-filters"]');
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
    selector: '[data-tour="attendance-unreported"]', 
    title: "미보고자만 따로 보기", 
    text: "이 항목을 켜면 이번 주 예배 결과 보고가 누락되었거나 아직 입력하지 않은 미보고 성도들만 추려볼 수 있어요.",
    action: (el) => {
      const checkbox = el.querySelector("input[type='checkbox']");
      if (checkbox) {
        checkbox.click();
      }
    },
    cleanup: () => {
      const el = document.querySelector('[data-tour="attendance-unreported"]');
      if (el) {
        const checkbox = el.querySelector("input[type='checkbox']");
        if (checkbox && checkbox.checked) {
          checkbox.click();
        }
      }
    }
  },
  { 
    selector: '[data-tour="attendance-notes-btn"]', 
    title: "개인별 특이사항 기록", 
    text: "이름 옆에 있는 말풍선 단추를 누르면 예배 중 특이점이나 기도제목을 삼일/주일예배 별로 남길 수 있어요.",
    action: (el) => {
      el.click();
    },
    cleanup: () => {
      const closeBtn = document.querySelector(".note-modal-header button") || document.querySelector(".icon-button");
      if (closeBtn) closeBtn.click();
    }
  },
  { 
    selector: '[data-tour="attendance-cell"]', 
    title: "예배 출결 입력", 
    text: "예배 셀을 마우스로 클릭하면 대면, 비대면, 결석, 미보고 등 출결 상태를 신속히 전환하여 저장할 수 있습니다.",
    action: (el) => {
      el.click();
    },
    cleanup: () => {
      const event = new MouseEvent("mousedown", { bubbles: true });
      document.body.dispatchEvent(event);
    }
  },
  { 
    selector: '[data-tour="attendance-report-btn"]', 
    title: "결과 텍스트 자동 복사", 
    text: "출결 취합을 마치면 [결과텍스트 복사] 버튼으로 총 등반 인원, 예배별 대면/비대면 수치 및 미보고자 명단이 포함된 양식을 1초 만에 생성해 클립보드에 복사할 수 있습니다.",
    action: (el) => {
      el.click();
    },
    cleanup: () => {
      const closeBtn = document.querySelector(".note-modal-header button") || document.querySelector(".icon-button");
      if (closeBtn) closeBtn.click();
    }
  },
  { 
    selector: '[data-tour="attendance-sync"]', 
    title: "실시간 데이터 동기화", 
    text: "여러 구역장과 팀장들이 동시에 출결을 기입하므로, 이 버튼을 눌러 언제든 최신 입력 현황을 당겨올 수 있어요.",
    action: (el) => {
      // Highlight only, do not click to avoid repeating heavy sync requests
    }
  },
];

const STEP_MS = 3800;

export default function AttendanceTour({ onClose }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [rect, setRect] = useState(null);

  const step = STEPS[idx];
  const next = useCallback(() => {
    if (idx === STEPS.length - 1) {
      onClose();
      window.dispatchEvent(new CustomEvent("change-page", { detail: { page: "visit_manage", autoStartTour: true } }));
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
