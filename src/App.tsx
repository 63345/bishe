/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import MarketPage from './pages/MarketPage';
import DiseaseRecognitionPage from './pages/DiseaseRecognitionPage';
import WarningPage from './pages/WarningPage';
import EncyclopediaPage from './pages/EncyclopediaPage';
import LoginPage from './pages/LoginPage';
import UserManagementPage from './pages/UserManagementPage';
import InventoryPage from './pages/InventoryPage';
import InspectionPage from './pages/InspectionPage';
import PondArchivePage from './pages/PondArchivePage';
import FarmWorkPage from './pages/FarmWorkPage';
import CrabQualityPage from './pages/CrabQualityPage';
import TraceabilityPage from './pages/TraceabilityPage';
import BigScreenPage from './pages/BigScreenPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';

function ProtectedLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return '智能咨询中心';
      case '/warning': return '预警看板';
      case '/recognition': return '智能拍照识病';
      case '/dashboard': return '生长周期看板';
      case '/market': return '行情动态监测';
      case '/encyclopedia': return '水产百科';
      case '/users': return '员工权限管理';
      case '/inventory': return '物资库存管理';
      case '/inspection': return '蟹塘日常巡视记录';
      case '/pond-archive': return '蟹塘基础档案管理';
      case '/farm-work': return '蟹塘作业记录';
      case '/crab-quality': return '商品蟹品质检测与评级';
      case '/traceability': return '商品蟹溯源与防伪管理';
      default: return '大闸蟹智能决策系统';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 md:block`}>
        <div onClick={() => setIsMobileMenuOpen(false)} className="h-full">
          <Sidebar />
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <Header title={getPageTitle()} onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/warning" element={<WarningPage />} />
            <Route path="/recognition" element={<DiseaseRecognitionPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/encyclopedia" element={<EncyclopediaPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inspection" element={<InspectionPage />} />
            <Route path="/pond-archive" element={<PondArchivePage />} />
            <Route path="/farm-work" element={<FarmWorkPage />} />
            <Route path="/crab-quality" element={<CrabQualityPage />} />
            <Route path="/traceability" element={<TraceabilityPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function LoginRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <LoginPage />;
}

function BigScreenRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <BigScreenPage />;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/big-screen" element={<BigScreenRoute />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}
