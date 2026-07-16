import { Routes, Route } from 'react-router-dom';
import AppShell from './components/app/AppShell';
import AppIndex from './pages/app/AppIndex';
import Home from './pages/app/Home';
import Onboarding from './pages/app/Onboarding';
import Dashboard from './pages/app/Dashboard';
import Coverage from './pages/app/Coverage';
import Documents from './pages/app/Documents';
import ReferralNew from './pages/app/ReferralNew';
import SpecialistResults from './pages/app/SpecialistResults';
import SpecialistDetail from './pages/app/SpecialistDetail';
import CaseDetail from './pages/app/CaseDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<AppIndex />} />
        <Route path="home" element={<Home />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="coverage" element={<Coverage />} />
        <Route path="documents" element={<Documents />} />
        <Route path="referral/new" element={<ReferralNew />} />
        <Route path="case/:caseId" element={<CaseDetail />} />
        <Route path="case/:caseId/specialists" element={<SpecialistResults />} />
        <Route path="case/:caseId/specialist/:specialistId" element={<SpecialistDetail />} />
      </Route>
    </Routes>
  );
}
