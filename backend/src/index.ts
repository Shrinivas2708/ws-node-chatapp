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
const roomToSockets = new Map<string, Set<WebSocket>>();
const socketsToRoom = new Map<WebSocket, string>();
ws.on("connection", (socket) => {
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
      if(!parsedMessage.message || typeof parsedMessage === "string") return
      roomToSockets.get(roomId)?.forEach((v) => {
        console.log(parsedMessage.type === "chat" ? parsedMessage.message : "");

        if (v != socket)
          v.send(parsedMessage.type === "chat" ? parsedMessage.message : "");
      });
    }
    if (parsedMessage.type === "exit") {
      const roomId = socketsToRoom.get(socket);
      socketsToRoom.delete(socket);
      if (!roomId) return;
      const sockets = roomToSockets.get(roomId);
      sockets?.delete(socket);
      if (sockets?.size === 0) roomToSockets.delete(roomId);
    }
  });
  socket.on("close", () => {
    const roomId = socketsToRoom.get(socket);
    socketsToRoom.delete(socket);
    if (!roomId) return;
    const sockets = roomToSockets.get(roomId);
    sockets?.delete(socket);
    if (sockets?.size === 0) roomToSockets.delete(roomId);
  });
});
