import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Icon } from './components/Icon';
import { Splash } from './components/Splash';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { Spinner } from './components/ui';
import { useClock } from './lib/hooks';
import { Home } from './screens/home/Home';
import { Schedule } from './screens/home/Schedule';
import { isOnboarded, Welcome } from './screens/home/Welcome';

// 홈·일정·닉네임만 처음에 받고, 모듈 4개는 각 묶음(screens/*/index.ts)을 그 탭으로 갈 때 받습니다.
// 첫 화면이 뜬 뒤 한가할 때 네 묶음을 미리 받아 두므로 탭 전환은 끊기지 않습니다.
const loadExplore = () => import('./screens/explore');
const loadProfile = () => import('./screens/profile');
const loadEssay = () => import('./screens/essay');
const loadMock = () => import('./screens/mock');
const lz = <M,>(load: () => Promise<M>, pick: (m: M) => ComponentType) => lazy(() => load().then((m) => ({ default: pick(m) })));

const ExploreStart = lz(loadExplore, (m) => m.ExploreStart);
const ExploreChat = lz(loadExplore, (m) => m.ExploreChat);
const ExploreAnalyzing = lz(loadExplore, (m) => m.ExploreAnalyzing);
const ExploreSummary = lz(loadExplore, (m) => m.ExploreSummary);
const ExploreJobs = lz(loadExplore, (m) => m.ExploreJobs);
const ExploreJobDetail = lz(loadExplore, (m) => m.ExploreJobDetail);
const ExploreSaved = lz(loadExplore, (m) => m.ExploreSaved);

const ProfileScreen = lz(loadProfile, (m) => m.ProfileScreen);
const BuildIntro = lz(loadProfile, (m) => m.BuildIntro);
const BuildCategories = lz(loadProfile, (m) => m.BuildCategories);
const BuildChat = lz(loadProfile, (m) => m.BuildChat);
const BuildReview = lz(loadProfile, (m) => m.BuildReview);
const BuildMore = lz(loadProfile, (m) => m.BuildMore);
const BuildAnalysis = lz(loadProfile, (m) => m.BuildAnalysis);
const BuildPreview = lz(loadProfile, (m) => m.BuildPreview);
const BuildUsage = lz(loadProfile, (m) => m.BuildUsage);
const BuildDone = lz(loadProfile, (m) => m.BuildDone);
const ExperienceDetail = lz(loadProfile, (m) => m.ExperienceDetail);

const EssayStart = lz(loadEssay, (m) => m.EssayStart);
const EssayHub = lz(loadEssay, (m) => m.EssayHub);
const EssayNew = lz(loadEssay, (m) => m.EssayNew);
const EssayDetail = lz(loadEssay, (m) => m.EssayDetail);
const EssayDone = lz(loadEssay, (m) => m.EssayDone);
const EssayQuestionScreen = lz(loadEssay, (m) => m.EssayQuestionScreen);

const MockStart = lz(loadMock, (m) => m.MockStart);
const MockSetupScreen = lz(loadMock, (m) => m.MockSetupScreen);
const MockSession = lz(loadMock, (m) => m.MockSession);
const MockHistory = lz(loadMock, (m) => m.MockHistory);
const MockResult = lz(loadMock, (m) => m.MockResult);
const MockDetail = lz(loadMock, (m) => m.MockDetail);
const Celebrate = lz(loadMock, (m) => m.Celebrate);

function usePreloadModules() {
  useEffect(() => {
    const run = () => void Promise.allSettled([loadExplore(), loadProfile(), loadEssay(), loadMock()]);
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 4000 });
    else window.setTimeout(run, 1500);
  }, []);
}

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
  usePreloadModules();
  return (
    <div className="flex min-h-dvh items-center justify-center md:py-6">
      <div className="relative flex h-dvh w-full max-w-[420px] flex-col overflow-hidden bg-canvas md:h-[min(844px,calc(100dvh-48px))] md:rounded-[40px] md:border-[10px] md:border-[#1b1830] md:shadow-pop">
        <StatusBar />
        <main key={pathname} className="page flex min-h-0 flex-1 flex-col overflow-y-auto">
          {needsWelcome ? (
            <Navigate to="/welcome" replace />
          ) : (
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center">
                  <Spinner />
                </div>
              }
            >
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
              <Route path="/profile/build" element={<BuildIntro />} />
              <Route path="/profile/build/categories" element={<BuildCategories />} />
              <Route path="/profile/build/chat" element={<BuildChat />} />
              <Route path="/profile/build/review" element={<BuildReview />} />
              <Route path="/profile/build/more" element={<BuildMore />} />
              <Route path="/profile/build/analysis" element={<BuildAnalysis />} />
              <Route path="/profile/build/preview" element={<BuildPreview />} />
              <Route path="/profile/build/usage" element={<BuildUsage />} />
              <Route path="/profile/build/done" element={<BuildDone />} />
              <Route path="/profile/experience/new" element={<Navigate to="/profile/build" replace />} />
              <Route path="/profile/experience/:id" element={<ExperienceDetail />} />

              <Route path="/essay" element={<EssayStart />} />
              <Route path="/essay/list" element={<EssayHub />} />
              <Route path="/essay/new" element={<EssayNew />} />
              <Route path="/essay/:id" element={<EssayDetail />} />
              <Route path="/essay/:id/done" element={<EssayDone />} />
              <Route path="/essay/:id/q/:qid" element={<EssayQuestionScreen />} />

              <Route path="/mock" element={<MockStart />} />
              <Route path="/mock/setup" element={<MockSetupScreen />} />
              <Route path="/mock/session" element={<MockSession />} />
              <Route path="/mock/history" element={<MockHistory />} />
              <Route path="/mock/result" element={<MockResult />} />
              <Route path="/mock/:id" element={<MockResult />} />
              <Route path="/mock/:id/detail" element={<MockDetail />} />
              <Route path="/celebrate/:appId" element={<Celebrate />} />

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
            </Suspense>
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
