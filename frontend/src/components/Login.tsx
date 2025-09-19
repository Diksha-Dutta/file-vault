import { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleAuth = async () => {
    try {
      const endpoint = isSignup ? "signup" : "login";
      const res = await fetch(`http://localhost:8080/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = email.includes("admin") ? "/admin" : "/";
      } else {
        alert(data.error || "Authentication failed");
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert("Request failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-100 via-blue-100 to-purple-200">
      <h1 className="text-5xl font-bold mb-4">Welcome to FileVault</h1>
      <p className="text-gray-700 mb-6">
        Your secure space for file storage and management.
      </p>
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700"
      >
        Login / Signup
      </button>

    
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-semibold mb-4 text-center">
              {isSignup ? "Create an Account" : "Login to FileVault"}
            </h2>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="border w-full px-3 py-2 rounded mb-3"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="border w-full px-3 py-2 rounded mb-4"
            />
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAuth}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isSignup ? "Signup" : "Login"}
              </button>
            </div>
            <p className="text-sm text-center mt-4">
              {isSignup ? "Already have an account?" : "New here?"}{" "}
              <span
                onClick={() => setIsSignup(!isSignup)}
                className="text-blue-600 cursor-pointer hover:underline"
              >
                {isSignup ? "Login instead" : "Create account"}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
