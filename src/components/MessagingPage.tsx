import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Paperclip, Search, User, FileText, Image as ImageIcon, 
  File, Loader2, Check, CheckCheck, MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  type: 'text' | 'file';
  file_url?: string;
  file_name?: string;
  created_at: string;
  is_read: number;
}

interface Conversation {
  id: number;
  other_user_id: number;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

export default function MessagingPage({ currentUser, refreshCounter }: { currentUser: any, refreshCounter?: number }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchUsers();

    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', userId: currentUser.id }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        const msg = data.message;
        if (selectedConv && msg.conversation_id === selectedConv.id) {
          setMessages(prev => [...prev, msg]);
          markAsRead(selectedConv.id);
        }
        fetchConversations();
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, [currentUser.id, selectedConv?.id, refreshCounter]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    const res = await fetch(`/api/conversations/${currentUser.id}`, {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setConversations(data);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users', {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setUsers(data.filter((u: User) => u.id !== currentUser.id));
  };

  const fetchMessages = async (convId: number) => {
    setLoadingMessages(true);
    const res = await fetch(`/api/messages/${convId}?userId=${currentUser.id}`, {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setMessages(data);
    setLoadingMessages(false);
    fetchConversations(); // Update unread counts
  };

  const markAsRead = async (convId: number) => {
    await fetch(`/api/messages/${convId}?userId=${currentUser.id}`, {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
  };

  const handleSendMessage = async (e?: React.FormEvent, file?: File) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !file && !selectedConv) return;

    const formData = new FormData();
    if (selectedConv) formData.append('conversation_id', selectedConv.id.toString());
    formData.append('sender_id', currentUser.id.toString());
    formData.append('receiver_id', selectedConv?.other_user_id.toString() || '');
    formData.append('content', newMessage);
    if (file) {
      formData.append('file', file);
      formData.append('type', 'file');
    } else {
      formData.append('type', 'text');
    }

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' },
      body: formData
    });

    const msg = await res.json();
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    fetchConversations();
  };

  const startNewConversation = async (otherUser: User) => {
    const existing = conversations.find(c => c.other_user_id === otherUser.id);
    if (existing) {
      setSelectedConv(existing);
      fetchMessages(existing.id);
    } else {
      const tempConv: any = {
        id: 0, // 0 means new
        other_user_id: otherUser.id,
        other_user_name: otherUser.full_name,
        last_message: '',
        unread_count: 0
      };
      setSelectedConv(tempConv);
      setMessages([]);
    }
    setShowUserList(false);
  };

  const filteredConversations = conversations.filter(c => 
    c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-l border-slate-100 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث في المحادثات..." 
              className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowUserList(!showUserList)}
            className="w-full mt-4 btn-primary flex items-center justify-center gap-2"
          >
            <MessageSquare size={18} /> محادثة جديدة
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {showUserList ? (
            <div className="p-2 space-y-1">
              <h4 className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">المستخدمين</h4>
              {users.map(user => (
                <button 
                  key={user.id}
                  onClick={() => startNewConversation(user)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-right"
                >
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{user.full_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{user.role === 'super_admin' ? 'مدير عام' : user.role === 'admin' ? 'مدير' : 'موظف'}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-sm">لا توجد محادثات</div>
              ) : filteredConversations.map(conv => (
                <button 
                  key={conv.id}
                  onClick={() => {
                    setSelectedConv(conv);
                    fetchMessages(conv.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors text-right ${selectedConv?.id === conv.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                    {conv.other_user_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{conv.other_user_name}</div>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(conv.last_message_at), 'HH:mm', { locale: ar })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{conv.last_message || 'محادثة جديدة'}</div>
                      {conv.unread_count > 0 && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                  {selectedConv.other_user_name[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{selectedConv.other_user_name}</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> متصل الآن
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {loadingMessages ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-800'}`}>
                        {msg.type === 'file' ? (
                          <a 
                            href={msg.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-2 rounded-xl ${isMe ? 'bg-emerald-700' : 'bg-slate-50 dark:bg-slate-800'}`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMe ? 'bg-emerald-600' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700'}`}>
                              {msg.file_name?.match(/\.(jpg|jpeg|png|gif)$/i) ? <ImageIcon size={20} /> : <FileText size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold truncate">{msg.file_name}</div>
                              <div className="text-[10px] opacity-70">ملف مرفق</div>
                            </div>
                          </a>
                        ) : (
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        )}
                        <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {format(new Date(msg.created_at), 'HH:mm', { locale: ar })}
                          {isMe && (msg.is_read ? <CheckCheck size={12} /> : <Check size={12} />)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleSendMessage(undefined, file);
                  }}
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <Paperclip size={20} />
                </button>
                <input 
                  type="text" 
                  placeholder="اكتب رسالتك هنا..." 
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-white"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-200 dark:shadow-none"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">مرحباً بك في نظام المراسلة</h3>
            <p className="text-sm mt-2">اختر محادثة من القائمة الجانبية للبدء</p>
          </div>
        )}
      </div>
    </div>
  );
}
