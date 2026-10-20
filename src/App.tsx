import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Icon } from './components/Icon';
import { Splash } from './components/Splash';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { useClock } from './lib/hooks';
import { EssayDetail } from './screens/essay/EssayDetail';
import { EssayHub } from './screens/essay/EssayHub';
import { EssayNew } from './screens/essay/EssayNew';
import { EssayQuestionScreen } from './screens/essay/EssayQuestion';
import { ExploreAnalyzing } from './screens/explore/ExploreAnalyzing';
import { ExploreChat } from './screens/explore/ExploreChat';
import { ExploreJobDetail } from './screens/explore/ExploreJobDetail';
import { ExploreJobs } from './screens/explore/ExploreJobs';
import { ExploreSaved } from './screens/explore/ExploreSaved';
import { ExploreStart } from './screens/explore/ExploreStart';
import { ExploreSummary } from './screens/explore/ExploreSummary';
import { Home } from './screens/home/Home';
import { Schedule } from './screens/home/Schedule';
import { isOnboarded, Welcome } from './screens/home/Welcome';
import { MockHub } from './screens/mock/MockHub';
import { MockResult } from './screens/mock/MockResult';
import { MockSession } from './screens/mock/MockSession';
import { ExperienceCategory } from './screens/profile/ExperienceCategory';
import { ExperienceChat } from './screens/profile/ExperienceChat';
import { ExperienceDetail } from './screens/profile/ExperienceDetail';
import { ExperienceReview } from './screens/profile/ExperienceReview';
import { ProfileScreen } from './screens/profile/ProfileScreen';

// 하단 탭은 모듈 첫 화면에서만 보입니다. 대화·결과 화면에는 탭이 없습니다.
const TAB_ROUTES = new Set(['/', '/explore', '/profile', '/essay', '/mock']);

// 데스크톱에서는 390px 폰 프레임 안에 보입니다. (CLAUDE.md 7절) 실제 폰에서는 프레임 없이 꽉 찹니다.
function StatusBar() {
  const time = useClock();
  return (
    <div className="hidden h-9 shrink-0 items-center justify-between px-6 text-caption font-semibold text-ink md:flex">
      <span className="tabular-nums">{time}</span>
      <span className="flex items-center gap-1.5 text-muted">
        <span className="flex items-end gap-0.5" aria-hidden="true">
          <i className="block h-1.5 w-0.5 rounded-sm bg-ink" />
          <i className="block h-2 w-0.5 rounded-sm bg-ink" />
          <i className="block h-2.5 w-0.5 rounded-sm bg-ink" />
          <i className="block h-3 w-0.5 rounded-sm bg-ink/30" />
        </span>
        <span className="h-3 w-6 rounded-sm border border-ink/60 p-px">
          <span className="block h-full w-4/5 rounded-[1px] bg-ink" />
        </span>
      </span>
    </div>
  );
}

function Frame() {
  const { pathname } = useLocation();
  const showTabs = TAB_ROUTES.has(pathname.replace(/\/$/, '') || '/');
  const needsWelcome = !isOnboarded() && pathname !== '/welcome';
  return (
    <div className="flex min-h-dvh items-center justify-center md:py-6">
      <div className="relative flex h-dvh w-full max-w-[420px] flex-col overflow-hidden bg-canvas md:h-[min(844px,calc(100dvh-48px))] md:rounded-[40px] md:border-[10px] md:border-[#1b1830] md:shadow-pop">
        <StatusBar />
        <main key={pathname} className="page flex min-h-0 flex-1 flex-col overflow-y-auto">
          {needsWelcome ? (
            <Navigate to="/welcome" replace />
          ) : (
            <Routes>
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/" element={<Home />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/explore" element={<ExploreStart />} />
              <Route path="/explore/chat" element={<ExploreChat />} />
              <Route path="/explore/analyzing" element={<ExploreAnalyzing />} />
              <Route path="/explore/summary" element={<ExploreSummary />} />
              <Route path="/explore/jobs" element={<ExploreJobs />} />
              <Route path="/explore/jobs/:index" element={<ExploreJobDetail />} />
              <Route path="/explore/dictionary/:name" element={<ExploreJobDetail />} />
              <Route path="/explore/saved" element={<ExploreSaved />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/profile/experience/new" element={<ExperienceCategory />} />
              <Route path="/profile/experience/chat" element={<ExperienceChat />} />
              <Route path="/profile/experience/review" element={<ExperienceReview />} />
              <Route path="/profile/experience/:id" element={<ExperienceDetail />} />
              <Route path="/essay" element={<EssayHub />} />
              <Route path="/essay/new" element={<EssayNew />} />
              <Route path="/essay/:id" element={<EssayDetail />} />
              <Route path="/essay/:id/q/:qid" element={<EssayQuestionScreen />} />
              <Route path="/mock" element={<MockHub />} />
              <Route path="/mock/session" element={<MockSession />} />
              <Route path="/mock/result" element={<MockResult />} />
              <Route path="/mock/:id" element={<MockResult />} />
              <Route
                path="*"
                element={
                  <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                    <Icon name="compass" size={40} className="text-primary/60" />
                    <p className="mt-3 text-heading text-ink">여기는 아직 길이 없어</p>
                    <Navigate to="/" replace />
                  </div>
                }
              />
            </Routes>
          )}
        </main>
        {showTabs && <TabBar />}
        <Toast />
        <Splash />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Frame />
    </BrowserRouter>
  );
}
