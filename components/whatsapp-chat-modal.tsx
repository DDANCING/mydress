'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { siteConfig } from '@/lib/site-config';

interface WhatsAppChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WHATSAPP_PHONE = siteConfig.whatsapp.number;
const GREETING_MESSAGE = 'Olá! Como podemos te ajudar a encontrar o vestido perfeito? ✨';

export function WhatsAppChatModal({ isOpen, onClose }: WhatsAppChatModalProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ type: 'bot' | 'user'; text: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicializa com mensagem de saudação
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ type: 'bot', text: GREETING_MESSAGE }]);
    }
  }, [isOpen, messages.length]);

  // Scroll para o final das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Adiciona mensagem do usuário
    const userMsg = message;
    setMessages((prev) => [...prev, { type: 'user', text: userMsg }]);
    setMessage('');

    // Redireciona para WhatsApp com a mensagem
    setTimeout(() => {
      const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(userMsg)}`;
      window.open(whatsappUrl, '_blank');
      onClose();
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed bottom-24 right-8 w-72 h-[500px] bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden md:bottom-24 md:right-8 sm:w-80 sm:bottom-20 sm:right-4">
        {/* Header */}
        <div className="bg-green-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <span
                aria-hidden
                className="size-6 bg-green-600"
                style={{ maskImage: "url(/logo.svg)", WebkitMaskImage: "url(/logo.svg)", maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{siteConfig.fullName}</h3>
              <p className="text-xs opacity-90">Online</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-green-600 p-1 rounded transition"
            aria-label="Fechar chat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  msg.type === 'user'
                    ? 'bg-green-500 text-white rounded-br-none'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-3 bg-white flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 border text-black border-muted-foreground rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-green-500 hover:bg-green-600  disabled:bg-muted-foreground text-white rounded-full p-2 transition"
            aria-label="Enviar mensagem"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
