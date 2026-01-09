import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/sidebar/Sidebar';
import Header from './components/header/Header';
import Auth from './components/auth/Auth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import FlowCanvas from './components/canvas/FlowCanvas';
import ERCanvas from './components/canvas/ERCanvas';
import OutputCanvas from './components/canvas/OutputCanvas';
import FlowsList from './components/flows/FlowsList';
import ProjectsList from './components/projects/ProjectsList';
import ProjectFlowsList from './components/projects/ProjectFlowsList';
import CredentialsList from './components/credentials/CredentialsList';
import RunsList from './components/runs/RunsList';
import RunDetail from './components/runs/RunDetail';
import './App.css';

function AppContent() {
  const location = useLocation();
  // El Header solo debe aparecer en la ruta de workflows
  const showHeader = location.pathname.startsWith('/workflow/');

  return (
    <div className="App">
      <Sidebar />
      <div className="app-content">
        {showHeader && <Header />}
        <div className={`app-main-content ${!showHeader ? 'app-main-content-no-header' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/flows" element={<FlowsList />} />
            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/projects/:projectId/flows" element={<ProjectFlowsList />} />
            <Route path="/credentials" element={<CredentialsList />} />
            <Route path="/database" element={<ERCanvas />} />
            <Route path="/output" element={<OutputCanvas />} />
            <Route path="/workflow/:workflowId" element={<FlowCanvas />} />
            <Route path="/runs" element={<RunsList />} />
            <Route path="/runs/flow/:flowId" element={<RunsList />} />
            <Route path="/runs/:runId" element={<RunDetail />} />
            <Route path="*" element={<Navigate to="/flows" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
