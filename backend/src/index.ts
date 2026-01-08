import http from "http";
import { config } from "dotenv";
import { URL } from "url";
import { pool } from "./db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pkg from "jsonwebtoken";
const { JsonWebTokenError } = pkg;
import { WebSocketServer, WebSocket } from "ws";
config();

// pool.query(`CREATE TABLE users(
//     id UUID PRIMARY KEY  DEFAULT gen_random_uuid(),
//     email VARCHAR(255),
//     name VARCHAR(255),
//     password_hashed VARCHAR(255)
// )`,()=>{console.log("Done");
// })
const PORT = process.env.PORT;
const JWT_SECRET = process.env.SECRET;
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  const { method, url } = req;
  const parsedURL = new URL(url!, `http://${req.headers.host}`);
  if (method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (method === "POST" && parsedURL.pathname === "/login") {
    let body = "";
    req.on("data", (chunks) => {
      body += chunks;
    });
    req.on("end", async () => {
      try {
        const { email, password } = JSON.parse(body);
        const result = await pool.query(
          "SELECT id, password_hashed name FROM users WHERE email = $1",
          [email]
        );
        if (result.rowCount === 0) {
          res.statusCode = 401;
          return res.end("Invalid credentials");
        }
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hashed);
        if (!match) {
          res.statusCode = 401;
          return res.end("Invalid credentials");
        }

        const token = jwt.sign({ userId: user.id, email,name }, JWT_SECRET!);

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ token }));
      } catch (err) {
        console.log(err);
        res.statusCode = 500;
        return res.end("Internal Server Error");
      }
    });
    return;
  }
  if (method === "POST" && parsedURL.pathname === "/register") {
    let body = "";
    req.on("data", (chunks) => {
      body += chunks;
    });
    req.on("end", async () => {
      try {
        const { email, password,name } = JSON.parse(body);
        const result = await pool.query(
          "SELECT id, password_hashed FROM users WHERE email = $1",
          [email]
        );
        if (result.rowCount !== 0) {
          res.statusCode = 409;
          return res.end("User with this email already exists");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const ress = await pool.query(
          "INSERT INTO users (email,password_hashed,name) VALUES ($1,$2,$3) RETURNING id",
          [email, hashedPassword,name]
        );

        const user = ress.rows[0];
        const token = jwt.sign({ userId: user.id, email,name }, JWT_SECRET!);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ token }));
      } catch (err) {
        console.log(err);

        res.statusCode = 500;
        return res.end("Internal Server Error");
      }
    });
    return;
  }
  res.statusCode = 404;
  res.end("Not Found");
});
server.listen(PORT, () => console.log(`Listening on ${PORT}`));

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
const ws = new WebSocketServer({ server }, () => {
  console.log("Socket server running ");
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
    name:string
  };
}

ws.on("connection", (socket: AuthedSocket, req) => {
  try {
    const token = new URL(
      req.url!,
      `http://${req.headers.host}`
    ).searchParams.get("token");
    if (!token) {
      socket.close(4001, "Not authorized!");
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET!) as {
      userId: string;
      email: string;
      name:string
    };
    socket.user = {
      userId: decoded.userId,
      email: decoded.email,
      name:decoded.name
    };
  } catch (err) {
    if (err instanceof JsonWebTokenError)
      return socket.close(4002, "Invalid token");
    socket.close();
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
      if (!parsedMessage.message || typeof parsedMessage.message !== "string")
        return;

      roomToSockets.get(roomId)?.forEach((v) => {
        console.log(parsedMessage.message);
        if (v != socket)
          v.send(
            JSON.stringify({
              message: parsedMessage.message,
              email: socket.user?.email,
              name:socket.user?.name,
              timestamp:new Date()
            })
          );
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
