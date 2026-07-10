import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ResidentDashboard from './pages/resident/Dashboard.jsx';
import RaiseComplaint from './pages/resident/RaiseComplaint.jsx';
import ComplaintDetail from './pages/resident/ComplaintDetail.jsx';
import AllComplaints from './pages/admin/AllComplaints.jsx';
import ComplaintManage from './pages/admin/ComplaintManage.jsx';
import NoticeBoardPage from './pages/resident/NoticeBoardPage.jsx';
import NoticeManage from './pages/admin/NoticeManage.jsx';

const ComingSoon = ({ name }) => (
  <div className="flex items-center justify-center h-screen text-neutral">
    <p className="text-lg">{name}</p>
  </div>
);

const AdminDashboard = () => <ComingSoon name="Admin Dashboard" />;
const ConfigPage     = () => <ComingSoon name="Config" />;

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/complaints" element={
        <ProtectedRoute><ResidentDashboard /></ProtectedRoute>
      } />
      <Route path="/complaints/new" element={
        <ProtectedRoute><RaiseComplaint /></ProtectedRoute>
      } />
      <Route path="/complaints/:id" element={
        <ProtectedRoute><ComplaintDetail /></ProtectedRoute>
      } />
      <Route path="/notices" element={
        <ProtectedRoute><NoticeBoardPage /></ProtectedRoute>
      } />

      <Route path="/admin/dashboard" element={
        <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/complaints" element={
        <ProtectedRoute adminOnly><AllComplaints /></ProtectedRoute>
      } />
      <Route path="/admin/complaints/:id" element={
        <ProtectedRoute adminOnly><ComplaintManage /></ProtectedRoute>
      } />
      <Route path="/admin/notices" element={
        <ProtectedRoute adminOnly><NoticeManage /></ProtectedRoute>
      } />
      <Route path="/admin/config" element={
        <ProtectedRoute adminOnly><ConfigPage /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
