import Login from "./pages/login.jsx";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminBackups from "./pages/admin/Backups";
import AdminProfile from "./pages/admin/Profile";
import UserDashboard from "./pages/user/Dashboard";
import UserBackups from "./pages/user/Backups";
import UserProfile from "./pages/user/Profile";
import InvitePage from "./pages/InvitePage";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/backups" element={<AdminBackups />} />
          <Route path="/admin/profile" element={<AdminProfile />} />

          {/* User Routes */}
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/user/backups" element={<UserBackups />} />
          <Route path="/user/profile" element={<UserProfile />} />

          <Route path="/invite" element={<InvitePage />} />

          {/* Redirect old routes to new ones */}
          <Route
            path="/admin-page"
            element={<Navigate to="/admin" replace />}
          />
          <Route path="/user-page" element={<Navigate to="/user" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
