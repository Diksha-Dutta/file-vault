import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { ReactNode } from "react";

import Header from "./components/Header";
import UploadForm from "./components/UploadForm";
import FileList from "./components/FileList";
import Login from "./components/Login";
import AdminDashboard from "./pages/AdminDashboard";


const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");
  if (!token) return <Navigate to="/login" />;
  if (!email || !email.includes("admin")) return <Navigate to="/" />;
  return children;
};

const Vault = () => {
  const [refresh, setRefresh] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto p-6">
        <UploadForm onUpload={() => setRefresh(!refresh)} />
        <FileList key={refresh ? 1 : 0} />
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
     
        <Route path="/login" element={<Login />} />

    
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Vault />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

     
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
