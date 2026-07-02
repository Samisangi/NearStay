import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { Send, Loader2 } from 'lucide-react';
import { selectAccessToken, selectCurrentUser } from '../../redux/authSlice';
import api from '../../api/axiosInstance';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ChatWindow = ({ inquiryId }) => {
  const accessToken = useSelector(selectAccessToken);
  const currentUser = useSelector(selectCurrentUser);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!inquiryId) return;

    // Load message history
    setLoading(true);
    api.get(`/messages/${inquiryId}`)
      .then((res) => {
        setMessages(res.data.messages || []);
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));

    // Connect socket
    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_inquiry', inquiryId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (msg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setTimeout(scrollToBottom, 50);
    });

    return () => {
      socket.disconnect();
    };
  }, [inquiryId, accessToken, scrollToBottom]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !connected) return;
    socketRef.current?.emit('send_message', { inquiryId, text: trimmed });
    setText('');
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isOwn = (msg) => {
    const senderId = msg.senderId?._id || msg.senderId;
    return senderId?.toString() === currentUser?.id?.toString();
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-96 bg-paper-50 border border-paper-200 rounded-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-paper-200 flex items-center justify-between">
        <p className="text-sm font-medium text-ink-900">Chat</p>
        <span className={`flex items-center gap-1.5 text-xs ${connected ? 'text-success-500' : 'text-ink-400'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-success-500' : 'bg-ink-300'}`} />
          {connected ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-ink-400" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <p className="text-xs text-ink-400 text-center py-6">
            No messages yet. Send the first one!
          </p>
        )}

        {!loading && messages.map((m, i) => {
          const own = isOwn(m);
          const showName = !own && (i === 0 || isOwn(messages[i - 1]));

          return (
            <div key={m._id || i} className={`flex flex-col ${own ? 'items-end' : 'items-start'}`}>
              {showName && (
                <p className="text-xs text-ink-400 mb-1 px-1">{m.senderId?.name}</p>
              )}
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                ${own
                  ? 'bg-teal-500 text-white rounded-br-none'
                  : 'bg-paper-200 text-ink-900 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
              <p className="text-[10px] text-ink-300 mt-0.5 px-1">
                {formatTime(m.createdAt)}
              </p>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-paper-200 p-3 flex gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={connected ? 'Type a message...' : 'Connecting...'}
          disabled={!connected}
          className="flex-1 h-9 rounded-control border border-paper-300 bg-paper-50 px-3 text-sm
            focus-visible:outline-2 focus-visible:outline-teal-500 disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!text.trim() || !connected}
          className="h-9 w-9 rounded-control bg-teal-500 text-white flex items-center justify-center
            hover:bg-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;