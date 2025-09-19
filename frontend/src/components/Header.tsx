// src/components/Header.tsx
const Header = () => {
  return (
    <header className="bg-gradient-to-r from-purple-500 to-blue-400 text-white p-6 shadow-md">
      <h1 className="text-3xl font-bold text-center">FileVault</h1>
      <p className="text-center mt-1 text-sm opacity-90">Securely upload, view, and manage your files</p>
    </header>
  );
};

export default Header;
