import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DialerPage } from './pages/DialerPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { ContactsPage } from './pages/ContactsPage';
import { HistoryPage } from './pages/HistoryPage';
import { WallboardPage } from './pages/WallboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProtectedRoute } from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}>
          <Route index element={<Navigate to="dialer" replace />} />
          <Route path="dialer" element={<DialerPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="wallboard" element={<WallboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
