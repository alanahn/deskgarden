

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatMessage, User, Item } from '../types';
import { ArrowLeftIcon, ROUTES } from '../components/constants';
import { mockUsers } from './mockData';

export const ChatScreen: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>(); 
  const navigate = useNavigate();
  const localPlaceholder = '/images/placeholder_image.png';
  
  const otherUser = mockUsers.find(u => u.id === chatId);
  const currentUser = mockUsers.find(u => u.id === 'currentUser123'); 
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (otherUser && currentUser) {
      const initialMessages: ChatMessage[] = [
         // Generic chat initiated from a user profile
         { id: 'msg1', chatId: otherUser.id, senderId: otherUser.id, text: `안녕하세요, ${currentUser.name}님! 문의사항 있으신가요?`, timestamp: Date.now() - 60000 },
         { id: 'msg2', chatId: otherUser.id, senderId: currentUser.id, text: `네, 안녕하세요 ${otherUser.name}님! 반갑습니다.`, timestamp: Date.now() - 30000 }
      ];
      setMessages(initialMessages);
    }
  }, [chatId, otherUser, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputText.trim() === '' || !currentUser || !otherUser) return;
    const newMessage: ChatMessage = {
      id: `msg${Date.now()}`,
      chatId: otherUser.id,
      senderId: currentUser.id,
      text: inputText,
      timestamp: Date.now(),
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputText('');

    // Simulate a reply
    setTimeout(() => {
      const replyMessage: ChatMessage = {
        id: `msg${Date.now() + 1}`,
        chatId: otherUser.id,
        senderId: otherUser.id,
        text: "메시지 확인했습니다. 잠시만 기다려주시면 답변드리겠습니다!",
        timestamp: Date.now() + 1000,
      };
      setMessages(prevMessages => [...prevMessages, replyMessage]);
    }, 1500);
  };
  
  if (!otherUser || !currentUser) {
     return (
      <div className="h-screen flex flex-col bg-[var(--bg-color)]">
         <header className="p-4 bg-transparent flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 mr-2 neu-convex neu-button rounded-full" aria-label="뒤로 가기">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">채팅 오류</h1>
        </header>
        <div className="flex-grow flex items-center justify-center">
            <p className="text-center text-red-500 p-8">채팅 상대를 찾을 수 없거나 사용자 정보가 올바르지 않습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-color)]">
      <header className="p-4 bg-transparent flex items-center sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 neu-convex neu-button rounded-full" aria-label="뒤로 가기">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <img 
            src={otherUser.profileImageUrl || localPlaceholder} 
            alt={`${otherUser.name}님의 프로필 사진`}
            className="w-8 h-8 rounded-full mr-3 object-cover"
            onError={(e) => { e.currentTarget.src = localPlaceholder; }}
        />
        <h1 className="text-lg font-semibold text-gray-800">{otherUser.name}</h1>
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl neu-convex ${
                msg.senderId === currentUser.id 
                ? 'bg-[var(--accent-color)] text-white rounded-br-none' 
                : 'rounded-bl-none'
            }`}>
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-white/80' : 'text-gray-400'} text-right`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-3 bg-transparent flex items-center space-x-2 sticky bottom-0 z-20">
        <input
          type="text"
          value={inputText}
          // FIX: Corrected a typo (`e.g.value` to `e.target.value`) to properly read the value from the event object.
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="메시지를 입력하세요..."
          className="flex-grow p-3 neu-input rounded-2xl text-sm"
          aria-label="메시지 입력창"
        />
        <button
          onClick={handleSendMessage}
          className="neu-convex neu-button bg-[var(--accent-color)] text-white font-semibold py-3 px-5 rounded-2xl transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          aria-label="메시지 전송"
          disabled={!inputText.trim()}
        >
          전송
        </button>
      </footer>
    </div>
  );
};
