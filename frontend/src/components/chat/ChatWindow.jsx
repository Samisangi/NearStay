import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectAccessToken, selectCurrentUser } from '../../redux/authSlice';
import api from '../../api/axiosInstance';
import { Send } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ChatWindow = ({ inquiryId }) => {
  const accessToken = useSelector(selectAccessToken);
  const currentUser = useSelector(selectCurrentUser);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Load history
    api.get(`/messages/${inquiryId}`).then((res) => setMessages(res.data.messages || []));

    // Connect socket
    const socket = io(API_URL, { auth: { token: accessToken } });
    socketRef.current = socket;
    socket.emit('join_inquiry', inquiryId);
    socket.on('new_message', (msg) => setMessages((prev) => [...prev, msg]));

    return () => socket.disconnect();
  }, [inquiryId, accessToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;
    socketRef.current?.emit('send_message', { inquiryId, text });
    setText('');
  };

  return (
    <div className="flex flex-col h-96 bg-paper-50 border border-paper-200 rounded-card overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const isMine = m.senderId?._id === currentUser?.id || m.senderId === currentUser?.id;
          return (
            <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm
                ${isMine ? 'bg-teal-500 text-white rounded-br-sm' : 'bg-paper-200 text-ink-900 rounded-bl-sm'}`}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-paper-200 p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 h-9 rounded-control border border-paper-300 bg-paper-50 px-3 text-sm focus-visible:outline-2 focus-visible:outline-teal-500"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="h-9 w-9 rounded-control bg-teal-500 text-white flex items-center justify-center disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;