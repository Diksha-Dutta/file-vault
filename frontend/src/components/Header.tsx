import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="bg-gradient-to-r from-purple-500 to-blue-400 text-white p-6 shadow-md flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">FileVault</h1>
        <p className="text-sm opacity-90">Securely upload, view, and manage your files</p>
      </div>

      {token && (
        <button
          onClick={handleLogout}
          className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      )}
    </header>
  );
};

export default Header;
