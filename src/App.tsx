import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { db } from './db';
import { useDemoStore } from './store';

type ChatLine = { from: 'cookie' | 'user'; text: string };

const styles = ['사람들과 협업', '아이디어 기획', '콘텐츠·브랜딩', '데이터 분석', '문제 해결', '꼼꼼한 실행'];
const roles = [
  { icon: '▥', title: '마케팅 기획자', tags: ['#기획', '#브랜드', '#콘텐츠'], desc: '브랜드와 제품의 매력을 전하고, 고객의 마음을 움직이는 전략을 만들어요.' },
  { icon: '▶', title: '콘텐츠 기획자', tags: ['#콘텐츠', '#기획', '#스토리텔링'], desc: '사람들이 궁금해할 콘텐츠를 기획하고 채널에 맞게 전달해요.' },
  { icon: '✦', title: '서비스 기획자', tags: ['#서비스', '#기획', '#데이터'], desc: '사용자 경험을 살피고 더 편리한 서비스를 설계해요.' },
];

function Cookie({ small = false }: { small?: boolean }) {
  return <img className={small ? 'cookie-avatar small' : 'cookie-avatar'} src={`${import.meta.env.BASE_URL}cookie.svg`} alt="쿠키 캐릭터" />;
}

function ChatBubble({ children, side = 'left' }: { children: ReactNode; side?: 'left' | 'right' }) {
  return <div className={`chat-row ${side}`}>{side === 'left' && <Cookie small />}<div className={`bubble ${side}`}>{children}</div></div>;
}

function App() {
  const { screen, setScreen, styleChoices, toggleStyle, userMessage, setUserMessage, reset } = useDemoStore();
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    void db.profiles.put({
      id: 'demo-profile', styleChoices, keywords: ['사람들과 협업', '아이디어 기획', '콘텐츠/브랜드 관심'],
      savedRole: saved ? '마케팅 기획자' : undefined, updatedAt: new Date().toISOString(),
    });
  }, [styleChoices, saved]);

  const go = (next: number) => setScreen(next);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = userMessage.trim();
    if (!value) return;
    setChat((items) => [...items, { from: 'user', text: value }, { from: 'cookie', text: '그랬구나! 그 경험에서 네가 어떤 역할을 했는지 조금 더 알려줄래? 😊' }]);
    setUserMessage('');
  };
  const saveRole = () => {
    setSaved(true);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2200);
  };
  const restart = () => { reset(); setChat([]); setSaved(false); };

  return (
    <main className="app-shell">
      <div className="demo-banner"><span className="demo-dot" /> 프로토타입 데모 · 실제 AI/API 호출 없음</div>
      <section className="phone" aria-label="KHU KEY 직무 탐색 데모">
        <div className="statusbar"><span>9:41</span><span>●●●  ▰  ▴</span></div>
        {screen === 1 ? (
          <div className="welcome screen-pad">
            <div className="welcome-orbit orbit-one" /><div className="welcome-orbit orbit-two" />
            <div className="welcome-top"><span className="brand-mark">K</span><span>KHU:KEY</span><button className="skip" onClick={() => go(2)}>건너뛰기</button></div>
            <div className="hero-mascot"><Cookie /></div>
            <div className="welcome-copy"><span className="eyebrow">YOUR CAREER MATE</span><h1>안녕! 나는 쿠키야 👋</h1><p>너와 잘 맞는 직무를<br />함께 찾아볼게.<br />편하게 이야기해줘!</p></div>
            <button className="primary-btn wide" onClick={() => go(2)}>직무 탐색 시작하기 <span>→</span></button>
          </div>
        ) : (
          <>
            <header className="app-header">
              <button className="icon-btn" onClick={() => go(Math.max(1, screen - 1))} aria-label="뒤로">‹</button>
              <div className="header-person"><Cookie small /><div><strong>쿠키</strong><small><i /> 함께 탐색 중</small></div></div>
              <button className="more-btn" onClick={restart} aria-label="다시 시작">↻</button>
            </header>
            <div className="progress"><span style={{ width: `${Math.max(10, screen * 10)}%` }} /></div>
            <div className="screen-content" key={screen}>
              {screen === 2 && <>
                <div className="step-caption">직무 탐색 · 1 / 5</div>
                <ChatBubble>안녕! 나는 쿠키야 👋<br />우선 가볍게 이야기해보자!<br />지금 취업 준비하면서<br />가장 고민되는 게 뭐야?</ChatBubble>
                <ChatBubble side="right">아직 무슨 직무가 맞는지<br />잘 모르겠어 ㅠㅠ</ChatBubble>
                <ChatBubble>그렇구나!<br />직무를 정하기 어려운 건<br />정말 자연스러운 일이야.<br />어떤 활동을 할 때 가장 신나거나<br />몰입을 잘 했던 기억이 있어?</ChatBubble>
                <div className="quick-chips"><button onClick={() => go(3)}>팀 프로젝트</button><button onClick={() => go(3)}>동아리 활동</button></div>
                <form className="composer" onSubmit={submit}><button type="button" className="plus-btn">＋</button><input value={userMessage} onChange={(e) => setUserMessage(e.target.value)} placeholder="쿠키에게 메시지 보내기..." /><button className="send-btn" aria-label="보내기">↑</button></form>
                {chat.map((line, i) => <ChatBubble key={i} side={line.from === 'cookie' ? 'left' : 'right'}>{line.text}</ChatBubble>)}
                <button className="text-next" onClick={() => go(3)}>다음 질문으로 <span>→</span></button>
              </>}
              {screen === 3 && <>
                <div className="step-caption">직무 탐색 · 2 / 5</div>
                <ChatBubble>오 흥미로운 경험이네!<br />그때 어떤 부분이 특히 좋았어?<br />사람들과 협업하는 과정과<br />결과를 분석하는 과정 중에서<br />더 즐겼던 부분이 있을까?</ChatBubble>
                <ChatBubble side="right">사람들이랑 의견 조율하면서<br />기획하는 게 더 재미있었어.<br />그리고 실제로 실행했을 때<br />좋은 반응을 보면 뿌듯했어!</ChatBubble>
                <ChatBubble>멋지다! 😊<br />그런 너는 사람들과 소통하며<br />아이디어를 구체화하고,<br />결과를 만들어내는 과정에서<br />보람을 느끼는구나.</ChatBubble>
                <div className="choice-card"><p>어떤 활동에서 이런 경험을 했어?</p><button onClick={() => go(4)}>동아리 행사 기획</button><button onClick={() => go(4)}>팀 프로젝트</button></div>
                <button className="text-next" onClick={() => go(4)}>계속 탐색하기 <span>→</span></button>
              </>}
              {screen === 4 && <>
                <div className="step-caption">직무 탐색 · 3 / 5</div>
                <ChatBubble>이런 상황은 어때?<br />만약 새로운 캠페인을 기획해야 하는데,<br />팀원들의 의견이 서로 다를 때 중요한<br />건 뭐라고 생각해?</ChatBubble>
                <ChatBubble side="right">각자 의견을 듣고 공통된 목표를 먼저<br />정한 다음에 정리해서 결정하는 게<br />필요하다고 생각해!</ChatBubble>
                <ChatBubble>좋아!<br />너는 다양한 의견을 조율하고<br />객관적인 근거로 판단하는 걸 좋아하며,<br />그런 일을 업무 스타일로 선호하는구나.</ChatBubble>
                <div className="mini-checks"><span>✓ 사람들과 의견 조율</span><span>✓ 팀 목표를 함께 정하기</span><span>✓ 근거를 바탕으로 결정하기</span></div>
                <button className="primary-btn wide dock-btn" onClick={() => go(5)}>다음 질문 <span>→</span></button>
              </>}
              {screen === 5 && <>
                <div className="step-caption">직무 탐색 · 4 / 5</div>
                <ChatBubble>좀 더 정확히 알아보기 위해<br />몇 가지 더 질문해볼게! 😊<br /><br />1) 어떤 역할을 맡았어?<br />2) 가장 어려웠던 순간은?<br />3) 결과를 확인할 수 있었어?</ChatBubble>
                <div className="numbered-answer"><span>1</span><p>기획부터 실행까지 참여했어</p></div>
                <div className="numbered-answer"><span>2</span><p>팀원들 의견을 조율하는 게 어려웠어</p></div>
                <div className="numbered-answer"><span>3</span><p>행사 만족도 설문 반응이 좋았어</p></div>
                <div className="style-picker"><strong>내가 선호하는 업무 스타일</strong><p>해당하는 항목을 골라줘 (복수 선택)</p><div className="style-grid">{styles.map((style) => <button className={styleChoices.includes(style) ? 'selected' : ''} key={style} onClick={() => toggleStyle(style)}>{styleChoices.includes(style) && '✓ '}{style}</button>)}</div></div>
                <button className="primary-btn wide" onClick={() => go(6)}>분석 시작하기 <span>→</span></button>
              </>}
              {screen === 6 && <Analysis onDone={() => go(7)} />}
              {screen === 7 && <>
                <div className="step-caption">탐색 결과 요약</div>
                <div className="summary-card"><span className="sparkle">✦</span><h2>쿠키가 발견한 너의 키워드</h2><div className="tag-cloud"><span>사람들과 협업</span><span>아이디어 기획</span><span>콘텐츠/브랜드 관심</span><span>긍정적인 영향</span><span>분석적 사고</span></div></div>
                <h3 className="section-title">이런 성향을 가진 것 같아!</h3>
                <ul className="insight-list"><li>다양한 사람들과 소통하는 것을 좋아함</li><li>아이디어를 구체화하고 실행하는 과정에서 보람을 느낌</li><li>데이터를 분석해 개선하는 일에도 흥미가 있음</li><li>사람들에게 긍정적인 영향을 주는 일을 중요하게 생각함</li></ul>
                <p className="note">※ 이 결과는 데모용 예시예요. 실제 추천 결과가 아닙니다.</p>
                <button className="primary-btn wide" onClick={() => go(8)}>추천 직무 보기 <span>→</span></button>
              </>}
              {screen === 8 && <>
                <div className="step-caption">너에게 어울리는 직무</div>
                <h2 className="page-title">쿠키의 추천 직무 <span>3</span></h2>
                {roles.map((role, i) => <article className="role-card" key={role.title} onClick={() => go(9)}><div className={`role-icon role-${i}`}>{role.icon}</div><div className="role-info"><strong>{role.title}</strong><p>{role.desc}</p><div className="role-tags">{role.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><span className="chevron">›</span></article>)}
                <p className="note">추천은 대화 내용을 바탕으로 한 탐색 제안이며, 채용 전망이나 적합성을 보장하지 않아요.</p>
                <button className="primary-btn wide" onClick={() => go(9)}>직무 상세 알아보기 <span>→</span></button>
              </>}
              {screen === 9 && <>
                <div className="step-caption">추천 직무 상세</div>
                <div className="detail-hero"><div className="detail-icon">▥</div><h2>마케팅 기획자</h2><div className="role-tags centered"><span>#기획</span><span>#브랜드</span><span>#콘텐츠</span><span>#분석</span></div></div>
                <section className="detail-section"><h3>어떤 일을 하나요?</h3><p>브랜드의 목표에 맞는 마케팅 전략을 기획하고, 고객에게 필요한 메시지를 적절한 채널로 전달해요.</p></section>
                <section className="detail-section"><h3>주요 업무</h3><ul><li>시장 조사 및 트렌드 분석</li><li>마케팅 전략 및 캠페인 기획</li><li>콘텐츠 기획 및 실행</li><li>성과 분석 및 개선안 도출</li></ul></section>
                <section className="detail-section fit"><h3>이런 사람에게 잘 맞아요</h3><p>✓ 사람들과 협업하며 아이디어를 발전시키는 걸 좋아하는 사람</p><p>✓ 데이터를 바탕으로 개선하는 과정에 흥미가 있는 사람</p></section>
                <div className="button-row"><button className="secondary-btn" onClick={saveRole}>♡ 관심 직무 저장</button><button className="primary-btn" onClick={() => go(10)}>프로필 저장 <span>→</span></button></div>
              </>}
              {screen === 10 && <div className="saved-screen"><div className="saved-art"><Cookie /><span className="heart h1">♥</span><span className="heart h2">♥</span><span className="heart h3">✦</span></div><div className="saved-copy"><span className="eyebrow">PROFILE SAVED</span><h1>탐색 결과가<br />내 프로필에 저장됐어!</h1><p>앞으로 자소서 작성, 면접 준비 등<br />취업 준비 과정에서 이 정보를 활용할게.<br />언제든지 다시 와서 업데이트해줘! 💜</p></div><button className="primary-btn wide" onClick={() => { setShowToast(true); window.setTimeout(() => setShowToast(false), 2200); }}>다음 단계로 이동하기 <span>→</span></button><button className="text-link" onClick={() => go(8)}>나중에 할게</button><button className="restart-link" onClick={restart}>데모 처음부터 보기</button></div>}
            </div>
            {screen !== 10 && <footer className="mobile-nav"><button className="active"><span>⌂</span>홈</button><button onClick={() => go(2)}><span>✦</span>직무 탐색</button><button onClick={() => go(10)}><span>▤</span>프로필</button></footer>}
          </>
        )}
        {showToast && <div className="toast">프로필에 저장했어요 💜</div>}
      </section>
      <div className="outside-hint">화면 상단의 진행 버튼으로 10단계 데모를 체험해보세요.</div>
    </main>
  );
}

function Analysis({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const labels = ['대화 내용 분석 중...', '흥미와 가치관 파악 중', '강점 키워드 도출 중', '적합 직무 분석 중'];
  useEffect(() => {
    const timer = window.setInterval(() => setStep((value) => {
      if (value >= labels.length - 1) { window.clearInterval(timer); window.setTimeout(onDone, 500); return value; }
      return value + 1;
    }), 650);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="analysis"><div className="step-caption">잠깐만 기다려줘</div><div className="analysis-mascot"><Cookie /></div><h2>지금까지의 대화를 바탕으로<br />너의 특성을 정리하고 있어!</h2><div className="analysis-card">{labels.map((label, i) => <div className={`analysis-line ${i <= step ? 'done' : ''}`} key={label}><span>{i < step ? '✓' : i === step ? <i className="loader" /> : '○'}</span>{label}</div>)}</div><button className="text-next" onClick={onDone}>결과 바로 보기 <span>→</span></button></div>;
}

export default App;
