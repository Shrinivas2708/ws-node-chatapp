    import { WebSocketServer, WebSocket } from "ws";
    interface SocketData {
    type: "join" | "chat" | "exit";
    payload: string;
    }
    const ws = new WebSocketServer({ port: 8080 }, () => {
    console.log("Socket server running on 8080");
    });
    const roomToSockets = new Map<string, Set<WebSocket>>();
    const socketsToRoom = new Map<WebSocket, string>();
    ws.on("connection", (socket) => {
    socket.on("message", (event) => {
        let parsedMessage: SocketData;
        try {
        parsedMessage = JSON.parse(event.toString());
        } catch (error) {
        return;
        }
        if (parsedMessage.type === "join") {
        const prevRoom = socketsToRoom.get(socket);
        if (prevRoom) {
            const prevSocket = roomToSockets.get(prevRoom);
            prevSocket?.delete(socket);
        }

        if (!roomToSockets.has(parsedMessage.payload)) {
            roomToSockets.set(parsedMessage.payload, new Set());
        }
        roomToSockets.get(parsedMessage.payload)?.add(socket);
        socketsToRoom.set(socket, parsedMessage.payload);
        }
        if (parsedMessage.type === "chat") {
        const roomId = socketsToRoom.get(socket);
        roomToSockets.get(roomId!)?.forEach((v) => {
            console.log(parsedMessage.payload);

            if(v!=socket) v.send(parsedMessage.payload);
        });
        }
        if (parsedMessage.type === "exit") {
        const roomId = socketsToRoom.get(socket);
        socketsToRoom.delete(socket);
        const sockets = roomToSockets.get(roomId!);
        sockets?.delete(socket);
        if (sockets?.size === 0) roomToSockets.delete(roomId!);
        }
    });
    socket.on("close", () => {
        const roomId = socketsToRoom.get(socket);
        socketsToRoom.delete(socket);
        const sockets = roomToSockets.get(roomId!);
        sockets?.delete(socket);
        if (sockets?.size === 0) roomToSockets.delete(roomId!);
    });
    });

