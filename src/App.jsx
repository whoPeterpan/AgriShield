import { useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import Layout from './components/Layout.jsx';
import AuthAndWelcome from './pages/AuthAndWelcome.jsx';
import FarmerDashboard from './pages/FarmerDashboard.jsx';
import FarmRegistration from './pages/FarmRegistration.jsx';
import AssessmentPage from './pages/AssessmentPage.jsx';
import ActionPlanAndPathshala from './pages/ActionPlanAndPathshala.jsx';
import ReadinessAndEvidence from './pages/ReadinessAndEvidence.jsx';
import FarmRecordsPage from './pages/FarmRecordsPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import VetCasesPage from './pages/VetCasesPage.jsx';
import AuthorityDashboard from './pages/AuthorityDashboard.jsx';

function RoleHome() {
  const { user } = useApp();
  if (user?.role === 'veterinarian') {
    return <Navigate to="/vet-support" replace />;
  }
  if (user?.role === 'authority') {
    return <Navigate to="/authority" replace />;
  }
  return <FarmerDashboard />;
}

function ProtectedWorkspace({ children }) {
  const { user } = useApp();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const prevUserIdRef = useRef(user?.id || null);

  useEffect(() => {
    const prevId = prevUserIdRef.current;
    const nextId = user?.id || null;
    prevUserIdRef.current = nextId;

    // Redirect into workspace only when transitioning from signed-out to signed-in
    if (!prevId && nextId && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<AuthAndWelcome />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedWorkspace>
            <RoleHome />
          </ProtectedWorkspace>
        }
      />
      <Route
        path="/farm-profile"
        element={
          <ProtectedWorkspace>
            <FarmRegistration />
          </ProtectedWorkspace>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedWorkspace>
            <AssessmentPage />
          </ProtectedWorkspace>
        }
      />
      <Route
        path="/action-plan"
        element={
          <ProtectedWorkspace>
            <ActionPlanAndPathshala />
          </ProtectedWorkspace>
        }
      />
      <Route
        path="/readiness"
        element={
          <ProtectedWorkspace>
            <ReadinessAndEvidence />
          </ProtectedWorkspace>
        }
      />
      <Route
        path="/records"
        element={
          <ProtectedWorkspace>
            <FarmRecordsPage />
          </ProtectedWorkspace>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedWorkspace>
            <AlertsPage />
          </ProtectedWorkspace>
        }
      />
      <Route
        path="/vet-support"
        element={
          <ProtectedWorkspace>
            <VetCasesPage />
          </ProtectedWorkspace>
        }
      />
      <Route
        path="/authority"
        element={
          <ProtectedWorkspace>
            <AuthorityDashboard />
          </ProtectedWorkspace>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </MotionConfig>
  );
}
