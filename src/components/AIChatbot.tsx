import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Paperclip, 
  User, 
  Bot, 
  Loader2,
  Plus,
  UserPlus,
  CreditCard,
  FileUp,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  action?: any;
}

import { chatWithAI } from '../services/geminiService';

export default function AIChatbot({ currentUser }: { currentUser: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'مرحباً! أنا موظفك الرقمي في مكتب "حلول". كيف أخدمك اليوم؟',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await chatWithAI(text, messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })), currentUser?.id?.toString() || 'anonymous');
      
      let botResponseText = data.message;

      // Handle Function Calls
      if (data.functionCalls && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          const res = await fetch('/api/ai/perform-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: { type: call.name, data: call.args }, 
              userId: currentUser?.id 
            })
          });
          
          if (res.ok) {
            const actionResult = await res.json();
            if (actionResult.message) {
              botResponseText = actionResult.message;
            }
          }
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date(),
        action: data.functionCalls?.[0] ? { type: data.functionCalls[0].name } : undefined
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: `جاري رفع وتحليل الملف: ${file.name}...`,
      sender: 'user',
      timestamp: new Date()
    }]);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'x-user-id': currentUser?.id?.toString() || '' },
        body: formData
      });

      if (response.ok) {
        const fileData = await response.json();
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: 'تم رفع الملف بنجاح. جاري التحليل التلقائي وتوزيع البيانات...',
          sender: 'bot',
          timestamp: new Date()
        }]);
        
        // Notify AI about the file
        handleSend(`لقد قمت برفع ملف جديد بمعرف: ${fileData.id}. يرجى تحليله.`);
      }
    } catch (error) {
      console.error('Upload Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-8 w-16 h-16 bg-[#00BFFF] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#0099CC] transition-all z-50 group shadow-[#00BFFF]/20"
      >
        <MessageSquare size={28} className="group-hover:scale-110 transition-transform" />
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-[#1a1a1a] animate-pulse" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-28 left-8 w-96 h-[600px] bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-[#00BFFF] text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold">موظف حلول الرقمي</h3>
                  <p className="text-[10px] opacity-80">متصل الآن - جاهز لتنفيذ طلباتك</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      msg.sender === 'user' ? 'bg-white/5 text-slate-400' : 'bg-[#00BFFF]/10 text-[#00BFFF]'
                    }`}>
                      {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-white/5 text-slate-200 rounded-tr-none border border-white/5' 
                        : 'bg-[#00BFFF]/10 text-white rounded-tl-none border border-[#00BFFF]/10'
                    }`}>
                      {msg.text}
                      {msg.action && (
                        <div className="mt-3 pt-3 border-t border-[#00BFFF]/20 flex items-center gap-2 text-[10px] font-bold text-[#00BFFF]">
                          <Plus size={12} />
                          تم تنفيذ: {
                            msg.action.type === 'create_client' ? 'إضافة عميل' :
                            msg.action.type === 'create_request' ? 'إنشاء طلب خدمة' :
                            msg.action.type === 'track_request' ? 'متابعة طلب' :
                            msg.action.type === 'suggest_services' ? 'اقتراح خدمات' :
                            'إجراء نظام'
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-end">
                  <div className="bg-[#00BFFF]/10 p-4 rounded-2xl rounded-tl-none">
                    <Loader2 size={16} className="animate-spin text-[#00BFFF]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => handleSend('أريد إضافة عامل جديد')}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-slate-400 rounded-full text-[10px] font-bold hover:bg-[#00BFFF]/10 hover:text-[#00BFFF] transition-all whitespace-nowrap border border-white/5"
              >
                <UserPlus size={12} /> إضافة عامل
              </button>
              <button 
                onClick={() => handleSend('أريد إصدار تأشيرة')}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-slate-400 rounded-full text-[10px] font-bold hover:bg-[#00BFFF]/10 hover:text-[#00BFFF] transition-all whitespace-nowrap border border-white/5"
              >
                <Plus size={12} /> إصدار تأشيرة
              </button>
              <button 
                onClick={() => handleSend('متابعة حالة طلب')}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-slate-400 rounded-full text-[10px] font-bold hover:bg-[#00BFFF]/10 hover:text-[#00BFFF] transition-all whitespace-nowrap border border-white/5"
              >
                <Target size={12} /> متابعة طلب
              </button>
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/5">
              <div className="flex gap-2">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-white/5 text-slate-400 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-[#00BFFF]/20 text-white text-sm"
                  />
                  <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-[#00BFFF] text-white rounded-xl disabled:opacity-50 transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
