import { useEffect, useRef } from "react"

function App() {
  const socketRef = useRef<WebSocket>(null)
  socketRef.current.onmessage = (ev)=>{

  }
  useEffect(()=>{
    const ws = new WebSocket("ws://localhost:8080")
    socketRef.current = ws
    return ()=>{
      socketRef.current?.close()
    }
  },[])
  return (
    <div className="w-full h-full">

    </div>
  )
}

export default App
