import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Placeholder components for pages not yet implemented (Tasks 12–15)
const ComingSoon = ({ name }) => (
  <div className="flex items-center justify-center h-screen text-neutral">
    <p className="text-lg">{name} — coming soon</p>
  </div>
);

// Resident pages (Task 12)
const ResidentDashboard    = () => <ComingSoon name="My Complaints" />;
const RaiseComplaint       = () => <ComingSoon name="Raise Complaint" />;
const ResidentComplaintDetail = () => <ComingSoon name="Complaint Detail" />;

// Admin pages (Tasks 13–15)
const AdminDashboard       = () => <ComingSoon name="Admin Dashboard" />;
const AdminAllComplaints   = () => <ComingSoon name="All Complaints" />;
const AdminComplaintManage = () => <ComingSoon name="Manage Complaint" />;
const NoticeBoardPage      = () => <ComingSoon name="Notice Board" />;
const AdminNoticeManage    = () => <ComingSoon name="Admin Notices" />;
const ConfigPage           = () => <ComingSoon name="Config" />;

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Resident routes */}
      <Route path="/complaints" element={
        <ProtectedRoute><ResidentDashboard /></ProtectedRoute>
      } />
      <Route path="/complaints/new" element={
        <ProtectedRoute><RaiseComplaint /></ProtectedRoute>
      } />
      <Route path="/complaints/:id" element={
        <ProtectedRoute><ResidentComplaintDetail /></ProtectedRoute>
      } />
      <Route path="/notices" element={
        <ProtectedRoute><NoticeBoardPage /></ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/complaints" element={
        <ProtectedRoute adminOnly><AdminAllComplaints /></ProtectedRoute>
      } />
      <Route path="/admin/complaints/:id" element={
        <ProtectedRoute adminOnly><AdminComplaintManage /></ProtectedRoute>
      } />
      <Route path="/admin/notices" element={
        <ProtectedRoute adminOnly><AdminNoticeManage /></ProtectedRoute>
      } />
      <Route path="/admin/config" element={
        <ProtectedRoute adminOnly><ConfigPage /></ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
