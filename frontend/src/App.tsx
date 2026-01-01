import {  Route, Routes } from "react-router-dom";
import Landing from "./Landing";
import Chat from "./Chat";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/chat/:roomid" element={<Chat />} />
    </Routes>
  );
}
