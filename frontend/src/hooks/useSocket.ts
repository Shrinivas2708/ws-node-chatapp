import { useEffect, useRef, useState } from "react";
interface MessageType {
    type:"socket" | "client",
    message: string
}
const useSocket = (url: string) => {
  const socket = useRef<WebSocket>(null);
  const [totalMessage,setTotalMessage] = useState<MessageType[]>([])
  const [socketState, setSocketSet] = useState<number>(WebSocket.CLOSED);
  const sendMessage = (m: string) => {
    if (socket.current) {
      socket.current.send(m);
    }
  };
  useEffect(() => {
    socket.current = new WebSocket(url);
    console.log("reached here");

    socket.current.onopen = () => {
      setSocketSet(WebSocket.OPEN);
    };
    socket.current.onclose = () => {
      console.log("reached onclose");
      setSocketSet(WebSocket.CLOSED);
    };
    socket.current.onmessage = (ev) => {
       setTotalMessage((prev)=>[...prev,
        
        {
        type:"socket",
        message:`${ev.data}`
       }])
    };

    socket.current.onerror = (error) => {
      console.log(error);
    };

    return () => {
      console.log("reached cleanup ");
      socket.current?.close();
    };
  }, [url]);

  return { sendMessage, totalMessage, socketState ,setTotalMessage};
};

export default useSocket;
