import { useEffect, useRef, useState } from "react";
interface MessageType {
    type:"socket" | "client",
    message: string,
    email?:string
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

    socket.current.onopen = () => {
      setSocketSet(WebSocket.OPEN);
    };
    socket.current.onclose = () => {
      setSocketSet(WebSocket.CLOSED);
    };
    socket.current.onmessage = (ev ) => {
      const data = JSON.parse(ev.data ) as {message:string,email:string}
      
       setTotalMessage((prev)=>[...prev,
        {
        type:"socket",
        message:`${data.message}`,
        email:`${data.email}`
       }
      ])
    };

    socket.current.onerror = (error) => {
      console.log(error);
    };

    return () => {
      socket.current?.close();
    };
  }, [url]);

  return { sendMessage, totalMessage, socketState ,setTotalMessage};
};

export default useSocket;
