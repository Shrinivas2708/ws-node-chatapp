import {  Route, Routes } from "react-router-dom";
import Home from "./Home";
import ChatRoom from "./ChatRoom";
import Chat from "./Chat";
import Login from "./Login";
import SignUp from "./SignUp";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room" element={<ChatRoom />} />
      <Route path="/chat/:roomid" element={<Chat />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<SignUp />} />
    </Routes>
  );
}
