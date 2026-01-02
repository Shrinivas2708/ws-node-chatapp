import { useNavigate, useParams } from "react-router-dom";
import useSocket from "./hooks/useSocket";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import ExitIcon from "./assets/Exit";

function Chat() {
  const {  sendMessage, socketState ,totalMessage,setTotalMessage} = useSocket(
    "ws://localhost:8080"
  );
  const params = useParams();
  const [userMessage, setUserMessage] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null)
  const divRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useEffect(()=>{
    if(divRef.current){
        divRef.current.scrollIntoView({ behavior: "smooth" })
    }
  },[totalMessage])
  useEffect(() => {
    if (socketState != WebSocket.OPEN) return;
    sendMessage(
      JSON.stringify({
        type: "join",
        payload: `${params.roomid}`,
      })
    );
  }, [socketState]);


  const handleSend = ()=>{
    if (socketState != WebSocket.OPEN) return;
    if (userMessage === "") return
    sendMessage(
      JSON.stringify({
        type: "chat",
        payload: `${userMessage}`,
      })
    );
    setTotalMessage((prev)=>[...prev,
        
        {
         type:"client",
        message:`${userMessage}`
       }])
       if(inputRef.current) inputRef.current.value = ""
       setUserMessage("")
  }
  const handleKey = (e : KeyboardEvent<HTMLInputElement>) => {
    if (userMessage === "" || userMessage === undefined) return
    
    if(e.key === "Enter"){
        handleSend()
    }
  }
  const handleLeave = () => {
    if(socketState != WebSocket.OPEN) return
    sendMessage(JSON.stringify({
      type:"exit"
    }))
    navigate("/")
  }
  return (
    <div className="bg-black min-h-screen w-full text-white flex justify-center">
      <div className="flex flex-col w-full max-w-3xl min-h-screen px-2 sm:px-4">
        <div className="flex border border-red-400 text-red-400 fixed p-1 rounded gap-2 justify-center items-center right-5 top-3 cursor-pointer " onClick={handleLeave}>Leave <ExitIcon size={20} /> </div>
        <div className="flex-1 overflow-y-auto border-x border-white/10 py-3 px-2 " >
         {
            totalMessage.map((msg ,id)=> {
                const isSocket = msg.type === "socket"
               return <div key={id} className={`flex mt-2  ${isSocket ? "" : "justify-end "}`}>
                <p className="p-2 border border-white/30 rounded">{msg.message}</p>
                </div>
            })
         }
         <div ref={divRef} />
        </div>
        <div className="sticky bottom-0 bg-black flex gap-2 ">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 rounded-md px-3 py-2 bg-black ring-1 ring-white/20 focus:outline-none focus:ring-white/40"
            onChange={(e)=> setUserMessage(e.target.value)}
            ref={inputRef}
            onKeyDown={handleKey}
          />
          <button className="rounded-md bg-white text-black font-medium px-4"
          disabled={userMessage === "" }
          onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
