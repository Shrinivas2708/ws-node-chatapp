import {  WebSocketServer, WebSocket  } from "ws"

const ws = new WebSocketServer({port:8080},()=>{console.log("Socket server running on 8080");})
let sockets : WebSocket[] = []
ws.on("connection",(s)=>{
    sockets.push(s)
    
    
    console.log("Client connected");
    s.on("message",(e)=>{
       sockets.forEach(s => s.send(e.toString()))
    })
    s.on("close",(e)=>{
        sockets = sockets.filter((ss)=> ss!=s)
    })
})