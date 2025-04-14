import "./App.css";
import Login from "./pages/login";
import AdminPage from "./pages/AdminPage";
import UserPage from "./pages/UserPage";
import InvitePage from "./pages/InvitePage"; 
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin-page" element={<AdminPage />} />
          <Route path="/user-page" element={<UserPage />} />
          <Route path="/invite" element={<InvitePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
