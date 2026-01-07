import jwt from "jsonwebtoken";
import { URL } from "url";
import { WebSocketServer, WebSocket } from "ws";

type Message =
  | {
      type: "join";
      roomId: string;
    }
  | {
      type: "chat";
      message: string;
    }
  | {
      type: "exit";
    };
const ws = new WebSocketServer({ port: 8080 }, () => {
  console.log("Socket server running on 8080");
});
const heartBeat = setInterval(() => {
  ws.clients.forEach((socket) => {
    const s = socket as any;
    if (s.isAlive === false) return socket.terminate();
    s.isAlive = false;
    socket.ping();
  });
}, 30_000);

const roomToSockets = new Map<string, Set<WebSocket>>();
const socketsToRoom = new Map<WebSocket, string>();
const cleanup = (socket: WebSocket) => {
  const roomId = socketsToRoom.get(socket);
  socketsToRoom.delete(socket);
  if (!roomId) return;
  const sockets = roomToSockets.get(roomId);
  sockets?.delete(socket);
  if (sockets?.size === 0) roomToSockets.delete(roomId);
};
interface AuthedSocket extends WebSocket {
  user?: {
    userId: string;
    email: string;
  };
}
export default function socket() {
  ws.on("connection", (socket:AuthedSocket, req) => {

    try{
      const token = new URL(req.url!, `http://${req.headers.host}`).searchParams.get("token");
    if(!token){
      socket.close(401,"Not authorized!")
      return
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };
     socket.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    } catch (err) {
    // Invalid token
    socket.close(4002, "Invalid token");
    return;
  }
    (socket as any).isAlive = true;

    socket.on("pong", () => {
      (socket as any).isAlive = true;
    });

    socket.on("message", (event) => {
      let parsedMessage: Message;
      try {
        parsedMessage = JSON.parse(event.toString());
      } catch (error) {
        return;
      }
      if (parsedMessage.type === "join") {
        const prevRoom = socketsToRoom.get(socket);
        if (prevRoom) roomToSockets.get(prevRoom)?.delete(socket);

        if (!roomToSockets.has(parsedMessage.roomId)) {
          roomToSockets.set(parsedMessage.roomId, new Set());
        }
        roomToSockets.get(parsedMessage.roomId)?.add(socket);
        socketsToRoom.set(socket, parsedMessage.roomId);
      }

      if (parsedMessage.type === "chat") {
        const roomId = socketsToRoom.get(socket);
        if (!roomId) return;
        if (!parsedMessage.message || typeof parsedMessage === "string") return;
        roomToSockets.get(roomId)?.forEach((v) => {
          console.log(
            parsedMessage.type === "chat" ? parsedMessage.message : ""
          );

          if (v != socket)
            v.send(parsedMessage.type === "chat" ? parsedMessage.message : "");
        });
      }
      if (parsedMessage.type === "exit") {
        cleanup(socket);
      }
    });
    socket.on("close", () => {
      cleanup(socket);
    });
  });
  ws.on("close", () => {
    clearInterval(heartBeat);
  });
}
