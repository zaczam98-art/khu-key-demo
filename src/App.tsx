import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { EssayScreen } from './screens/essay/EssayScreen';
import { ExploreAnalyzing } from './screens/explore/ExploreAnalyzing';
import { ExploreChat } from './screens/explore/ExploreChat';
import { ExploreJobDetail } from './screens/explore/ExploreJobDetail';
import { ExploreJobs } from './screens/explore/ExploreJobs';
import { ExploreSaved } from './screens/explore/ExploreSaved';
import { ExploreStart } from './screens/explore/ExploreStart';
import { ExploreSummary } from './screens/explore/ExploreSummary';
import { Home } from './screens/home/Home';
import { MockScreen } from './screens/mock/MockScreen';
import { ProfileScreen } from './screens/profile/ProfileScreen';

// 하단 탭은 모듈 첫 화면에서만 보입니다. 대화·결과 화면(시안 2~10번)에는 탭이 없습니다.
const TAB_ROUTES = new Set(['/', '/explore', '/profile', '/essay', '/mock']);

function Frame() {
  const { pathname } = useLocation();
  const showTabs = TAB_ROUTES.has(pathname.replace(/\/$/, '') || '/');
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col bg-canvas shadow-[0_0_40px_rgba(60,40,120,0.08)]">
      {/* 경로가 바뀔 때마다 key 가 바뀌어 화면 전환 애니메이션이 다시 재생됩니다. */}
      <main key={pathname} className="page flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<ExploreStart />} />
          <Route path="/explore/chat" element={<ExploreChat />} />
          <Route path="/explore/analyzing" element={<ExploreAnalyzing />} />
          <Route path="/explore/summary" element={<ExploreSummary />} />
          <Route path="/explore/jobs" element={<ExploreJobs />} />
          <Route path="/explore/jobs/:index" element={<ExploreJobDetail />} />
          <Route path="/explore/dictionary/:name" element={<ExploreJobDetail />} />
          <Route path="/explore/saved" element={<ExploreSaved />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/essay" element={<EssayScreen />} />
          <Route path="/mock" element={<MockScreen />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {showTabs && <TabBar />}
      <Toast />
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
