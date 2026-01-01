import { useEffect, useRef, useState } from "react";

 const useSocket = (url: string) => {
  const [message, setMessage] = useState<string[]>([]);
  const socket = useRef<WebSocket>(null);
  
  const [socketState,setSocketSet] = useState<number>(WebSocket.CLOSED)
  const sendMessage = (m: string) => {
    if (socket.current) {
      socket.current.send(m);
    }
  };
  useEffect(() => {
    socket.current = new WebSocket(url);
    socket.current.onopen = ()=>{
        setSocketSet(WebSocket.OPEN)
    }
    socket.current.onclose = ()=>{
        setSocketSet(WebSocket.CLOSED)
    }
    socket.current.onmessage = (ev) => {
      setMessage(prev => [...prev, ev.data]);
    };

    socket.current.onerror = (error) => {
        console.log(error)
    }

    return () => {
      socket.current?.close();
    };
  }, [url]);


  return {sendMessage,message,socketState}

};


export default useSocket