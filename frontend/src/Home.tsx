import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/room");
    }
  }, [navigate]);

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-center items-center px-4">
      <div className="max-w-2xl text-center space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold text-white">
            The Chat Room
          </h1>
          <p className="text-lg sm:text-xl text-white/70">
            Connect instantly. Chat in real-time. Share ideas with ease.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-8">
          <div className="border border-white/20 rounded p-4 hover:border-white/40 transition">
            <p className="text-2xl mb-2">⚡</p>
            <p className="font-semibold">Instant</p>
            <p className="text-sm text-white/70">Create or join rooms instantly</p>
          </div>
          <div className="border border-white/20 rounded p-4 hover:border-white/40 transition">
            <p className="text-2xl mb-2">🔒</p>
            <p className="font-semibold">Private</p>
            <p className="text-sm text-white/70">Share room codes securely</p>
          </div>
          <div className="border border-white/20 rounded p-4 hover:border-white/40 transition">
            <p className="text-2xl mb-2">💬</p>
            <p className="font-semibold">Real-time</p>
            <p className="text-sm text-white/70">Messages delivered instantly</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3 border border-white/20 rounded hover:border-white/40 transition text-white font-semibold"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-8 py-3 bg-white text-black rounded font-semibold hover:bg-white/90 transition"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
