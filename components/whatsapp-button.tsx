'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { WhatsAppChatModal } from './whatsapp-chat-modal';

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center justify-center z-40 transition-all duration-300 hover:scale-110"
        aria-label="Abrir chat WhatsApp"
      >
        <MessageCircle size={28} />
      </button>

      {/* Modal de Chat */}
      <WhatsAppChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
