import React, { useState } from "react";
import { LayoutDashboard, CalendarCheck, HeartHandshake, BookOpen } from "lucide-react";

// 화면 사용 설명서: 대시보드 / 출결 관리 / 심방 관리 3개 가이드를 탭으로 전환해 보여준다.
const GUIDES = [
  {
    id: "dashboard",
    label: "대시보드 보는 방법",
    icon: LayoutDashboard,
    intro: "대시보드는 우리 교구/팀의 예배·출석 현황을 한눈에 모아 보는 화면입니다. 숫자는 선택한 월·주차 기준으로 자동 집계됩니다.",
    steps: [
      "상단 오른쪽에서 보고 싶은 월(월 선택)과 주차(1주~5주)를 고릅니다. 고르면 아래 숫자들이 그 기준으로 바뀝니다.",
      "'주차별 대시보드'와 '월별 대시보드' 버튼으로 한 주 기준 / 한 달 누적 기준을 전환할 수 있습니다.",
      "상단 카드에서 교구 총원 · 활동 가능 성도 · 출결 제외자 등 전체 규모를 확인합니다.",
      "'예배 현황'에서 기준(삼일사전·삼일실제·주일사전·주일실제)을 선택하면 그 예배의 대면/비대면/결석/미보고 분류가 표시됩니다.",
      "구역 예배·십일조·전도·시험·라디오 등 항목별 참여 통계 카드를 아래로 내려가며 확인합니다.",
      "카드를 클릭하면 해당 인원의 명단을 볼 수 있고, '명단 텍스트 복사'로 단톡방 등에 붙여넣을 수 있습니다.",
    ],
    tips: [
      "숫자가 이상하면 먼저 상단의 '월·주차'가 원하는 기간으로 되어 있는지 확인하세요.",
      "'미보고' 인원이 많다면 아직 출결 입력이 안 된 것 → 출결 관리에서 입력하면 자동 반영됩니다.",
    ],
  },
  {
    id: "attendance",
    label: "출결 관리 하는 방법",
    icon: CalendarCheck,
    intro: "출결 관리는 성도별 예배 출석·인증·특이사항을 주차별로 입력하는 화면입니다. 여기서 입력한 내용이 대시보드 통계의 원본이 됩니다.",
    steps: [
      "상단에서 입력할 월과 주차를 먼저 선택합니다.",
      "'필터 및 검색'에서 팀·구역·등록구분을 좁히거나, 성도 이름으로 검색해 대상을 찾습니다. (이름은 쉼표·공백으로 여러 명 검색 가능)",
      "각 성도 줄에서 예배 항목(주일사전·주일실제·삼일사전·삼일실제·구역예배·시몬스쿨·심야라디오·시험)을 클릭해 상태(대면·비대면·결석·미보고 등)를 지정합니다.",
      "예배분류·인증분류·예배확인 값을 함께 선택해 어떤 형태로 참석했는지 표시합니다.",
      "결석·미보고인 경우 '미확인/미보고 사유'나 '특이사항'란에 이유를 적어둡니다.",
      "십일조·전도처럼 월 단위 항목은 어느 한 주라도 체크하면 그 달 전체에 자동 적용됩니다.",
      "'지난주 예배보고 불러오기'를 쓰면 지난주 값을 이번주 빈 칸에 채워 넣어 입력을 빠르게 할 수 있습니다.",
      "입력이 끝나면 '엑셀 다운로드' 또는 '결과텍스트 복사(출결관리 보고서)'로 결과를 내보낼 수 있습니다.",
    ],
    tips: [
      "여러 명이 동시에 입력해도 '실시간 동기화'로 반영됩니다. 값이 안 보이면 새로고침 해보세요.",
      "입력은 자동 저장됩니다. 저장 버튼을 따로 누르지 않아도 됩니다.",
    ],
  },
  {
    id: "visit",
    label: "심방 관리 하는 방법",
    icon: HeartHandshake,
    intro: "심방 관리는 성도를 심방한 기록을 남기고, 구역장 성찰과 팀장·임원 피드백을 주고받는 화면입니다.",
    steps: [
      "'신규 심방기록 등록'을 눌러 심방 대상 성도, 심방 날짜, 심방 형태(전화·대면 등), 심방 상세 내용을 입력하고 저장합니다.",
      "이미 정리해 둔 심방 내용이 있으면 '텍스트 분석 등록'에 형식대로 붙여넣으면 자동으로 항목이 채워집니다.",
      "등록한 기록은 '심방 이력 타임라인'에 쌓이며, 각 기록에서 상세보기·수정·삭제를 할 수 있습니다.",
      "'구역장 성찰 일기'에 심방하며 느낀 점·다짐·기도제목을 적어 남깁니다.",
      "팀장·임원은 각 기록에 '팀장 피드백'·'임원 피드백'을 달아 격려·코칭할 수 있습니다.",
      "검색창에 성도명·기록내용·피드백으로 검색하고, '목록 복사'·'상세 내역 복사'로 내용을 내보낼 수 있습니다.",
    ],
    tips: [
      "심방 상세는 구체적으로 적을수록 이후 케어에 도움이 됩니다 (어떤 대화를 나눴는지, 성도님 형편 등).",
      "이번 달 심방 건수는 상단 통계에서 바로 확인할 수 있습니다.",
    ],
  },
];

export default function HelpGuide() {
  const [active, setActive] = useState("dashboard");
  const guide = GUIDES.find(g => g.id === active) || GUIDES[0];

  return (
    <div className="help-guide">
      <div className="help-header">
        <div className="help-title">
          <BookOpen size={22} />
          <div>
            <h1>사용 설명서</h1>
            <p>화면별 사용 방법을 정리했어요. 궁금한 화면을 골라 확인하세요.</p>
          </div>
        </div>
      </div>

      <div className="help-tabs">
        {GUIDES.map(g => {
          const Icon = g.icon;
          return (
            <button
              key={g.id}
              onClick={() => setActive(g.id)}
              className={`help-tab ${active === g.id ? "active" : ""}`}
            >
              <Icon size={16} />
              <span>{g.label}</span>
            </button>
          );
        })}
      </div>

      <div className="help-content glass-panel">
        <p className="help-intro">{guide.intro}</p>

        <h3 className="help-section-title">이렇게 하세요</h3>
        <ol className="help-steps">
          {guide.steps.map((s, i) => (
            <li key={i}>
              <span className="step-num">{i + 1}</span>
              <span className="step-text">{s}</span>
            </li>
          ))}
        </ol>

        <div className="help-tips">
          <h3 className="help-section-title">💡 알아두면 좋아요</h3>
          <ul>
            {guide.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        .help-guide {
          padding: 24px;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }
        .help-header { margin-bottom: 20px; }
        .help-title {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: var(--accent-cyan);
        }
        .help-title h1 {
          font-size: 20px;
          color: var(--text-primary);
          margin: 0;
        }
        .help-title p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 4px 0 0;
        }
        .help-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .help-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          background-color: var(--glass-border);
          border: 1px solid transparent;
          transition: all var(--transition-fast);
        }
        .help-tab:hover { color: var(--text-primary); }
        .help-tab.active {
          background: linear-gradient(135deg, hsla(185, 90%, 48%, 0.15), hsla(210, 100%, 55%, 0.1));
          color: var(--accent-cyan);
          border-color: hsla(185, 90%, 48%, 0.25);
          font-weight: 600;
        }
        .help-content {
          padding: 24px;
          border-radius: var(--radius-md);
        }
        .help-intro {
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0 0 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--glass-border);
        }
        .help-section-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 14px;
        }
        .help-steps {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 0 0 24px;
          padding: 0;
        }
        .help-steps li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .step-num {
          flex: 0 0 auto;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: hsla(185, 90%, 48%, 0.15);
          color: var(--accent-cyan);
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }
        .step-text {
          font-size: 14px;
          line-height: 1.65;
          color: var(--text-primary);
        }
        .help-tips {
          background-color: var(--glass-border);
          border-radius: var(--radius-md);
          padding: 16px 18px;
        }
        .help-tips .help-section-title { margin-bottom: 10px; }
        .help-tips ul {
          margin: 0;
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .help-tips li {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
        }
        @media (max-width: 1024px) {
          .help-guide { padding: 16px 16px 88px; }
          .help-tab span { font-size: 12px; }
        }
      `}</style>
    </div>
  );
}
