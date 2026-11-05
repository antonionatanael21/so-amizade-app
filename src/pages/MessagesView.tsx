import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Conversation, Message, UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  limit,
} from 'firebase/firestore';
import {
  Send,
  Image as ImageIcon,
  Search,
  ShieldAlert,
  Ban,
  Flag,
  User,
  ArrowLeft,
  X,
  Lock,
} from 'lucide-react';

interface MessagesViewProps {
  initialChatUserId?: string | null;
  onNavigateToProfile: (userId: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  initialChatUserId,
  onNavigateToProfile,
}) => {
  const { currentUser, profile } = useAuth();
  const { showToast, openReportModal } = useUI();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations list for currentUser
  useEffect(() => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', currentUser.uid)
      );

      const unsub = onSnapshot(q, async (snapshot) => {
        const list: Conversation[] = [];
        for (const d of snapshot.docs) {
          const conv = d.data() as Conversation;
          const otherUserId = conv.participantIds.find((id) => id !== currentUser.uid);

          if (otherUserId) {
            const userSnap = await getDoc(doc(db, 'users', otherUserId));
            if (userSnap.exists()) {
              conv.otherUser = userSnap.data() as UserProfile;
            }
          }
          list.push(conv);
        }
        // Sort by updatedAt descending
        list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        setConversations(list);

        // If initialChatUserId was passed, select or create that conversation
        if (initialChatUserId && !activeConversation) {
          const existing = list.find((c) => c.participantIds.includes(initialChatUserId));
          if (existing) {
            setActiveConversation(existing);
          } else {
            // Verify friendship before creating conversation
            startNewConversationWithFriend(initialChatUserId);
          }
        }
      });

      return () => unsub();
    } catch (e) {
      console.warn('Erro ao carregar conversas:', e);
    }
  }, [currentUser, initialChatUserId]);

  // Start new conversation with friend
  const startNewConversationWithFriend = async (friendId: string) => {
    if (!currentUser || !profile) return;
    try {
      // Check friendship
      const f1 = await getDoc(doc(db, 'friendships', `${currentUser.uid}_${friendId}`));
      const f2 = await getDoc(doc(db, 'friendships', `${friendId}_${currentUser.uid}`));

      if (!f1.exists() && !f2.exists()) {
        showToast('Você só pode iniciar conversas privadas com amigos aceitos.', 'error');
        return;
      }

      // Consistent conversation ID
      const convId =
        currentUser.uid < friendId
          ? `conv_${currentUser.uid}_${friendId}`
          : `conv_${friendId}_${currentUser.uid}`;

      const userSnap = await getDoc(doc(db, 'users', friendId));
      const otherUser = userSnap.exists() ? (userSnap.data() as UserProfile) : undefined;

      const newConv: Conversation = {
        id: convId,
        participantIds: [currentUser.uid, friendId],
        lastMessageText: 'Conversa iniciada',
        lastMessageSenderId: currentUser.uid,
        updatedAt: new Date().toISOString(),
        otherUser,
      };

      await setDoc(doc(db, 'conversations', convId), newConv);
      setActiveConversation(newConv);
    } catch (e) {
      showToast('Não foi possível iniciar a conversa.', 'error');
    }
  };

  // Listen to messages of active conversation
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'conversations', activeConversation.id, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(100)
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((d) => msgs.push(d.data() as Message));
        setMessages(msgs);
      });

      return () => unsub();
    } catch (e) {
      console.warn('Erro ao escutar mensagens:', e);
    }
  }, [activeConversation]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile || !activeConversation) return;
    if (!textInput.trim() && !mediaUrl.trim()) return;

    setIsSending(true);
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newMsg: Message = {
        id: messageId,
        conversationId: activeConversation.id,
        senderId: currentUser.uid,
        senderName: profile.displayName,
        text: textInput.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
        read: false,
        createdAt: new Date().toISOString(),
      };

      // 1. Add message to conversation subcollection
      await setDoc(
        doc(db, 'conversations', activeConversation.id, 'messages', messageId),
        newMsg
      );

      // 2. Update conversation summary
      await updateDoc(doc(db, 'conversations', activeConversation.id), {
        lastMessageText: textInput.trim() || 'Foto compartilhada',
        lastMessageSenderId: currentUser.uid,
        updatedAt: new Date().toISOString(),
      });

      // 3. Notify other user if applicable
      const otherUserId = activeConversation.participantIds.find((id) => id !== currentUser.uid);
      if (otherUserId) {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        try {
          await setDoc(doc(db, 'notifications', notifId), {
            id: notifId,
            userId: otherUserId,
            senderId: currentUser.uid,
            senderName: profile.displayName,
            senderPhotoURL: profile.photoURL,
            type: 'message',
            title: 'Nova mensagem',
            message: `${profile.displayName}: "${textInput.slice(0, 50)}..."`,
            link: '/mensagens',
            read: false,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {}
      }

      setTextInput('');
      setMediaUrl('');
      setShowImageInput(false);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `conversations/${activeConversation.id}/messages`
      );
      showToast('Falha ao enviar mensagem.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter.trim()) return true;
    const name = c.otherUser?.displayName?.toLowerCase() || '';
    const user = c.otherUser?.username?.toLowerCase() || '';
    return (
      name.includes(searchFilter.toLowerCase()) || user.includes(searchFilter.toLowerCase())
    );
  });

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] min-h-[500px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row mb-16 md:mb-6">
      {/* LEFT: Conversations List Sidebar */}
      <div
        className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold tracking-tight">Mensagens</h2>
            <div className="flex items-center space-x-1 text-[11px] font-semibold text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
              <Lock className="w-3 h-3" />
              <span>Apenas Amigos</span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar conversas..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <p>Nenhuma conversa ativa.</p>
              <p className="text-[11px]">
                Adicione amigos e clique em "Mensagem" no perfil deles para conversar!
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.otherUser;
              const isSelected = activeConversation?.id === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`p-3.5 flex items-center space-x-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <img
                    src={
                      other?.photoURL ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.id || conv.id}`
                    }
                    alt={other?.displayName || 'Amigo'}
                    className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                        {other?.displayName || 'Amigo'}
                      </h4>
                      <time className="text-[10px] text-slate-400">
                        {new Date(conv.updatedAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {conv.lastMessageText || 'Conversa iniciada'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Active Chat View */}
      <div
        className={`flex-1 flex flex-col ${
          !activeConversation ? 'hidden md:flex items-center justify-center' : 'flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Top Header */}
            <div className="p-3.5 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200"
                  aria-label="Voltar para conversas"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img
                  src={
                    activeConversation.otherUser?.photoURL ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeConversation.otherUser?.id}`
                  }
                  alt={activeConversation.otherUser?.displayName}
                  onClick={() =>
                    activeConversation.otherUser &&
                    onNavigateToProfile(activeConversation.otherUser.id)
                  }
                  className="w-10 h-10 rounded-full object-cover cursor-pointer ring-1 ring-indigo-500/20"
                />
                <div>
                  <h3
                    onClick={() =>
                      activeConversation.otherUser &&
                      onNavigateToProfile(activeConversation.otherUser.id)
                    }
                    className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:underline cursor-pointer"
                  >
                    {activeConversation.otherUser?.displayName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    @{activeConversation.otherUser?.username} • Amigo Verificado
                  </p>
                </div>
              </div>

              {/* Chat safety actions */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() =>
                    activeConversation.otherUser &&
                    openReportModal(
                      'message',
                      activeConversation.id,
                      activeConversation.otherUser.id,
                      `Conversa com @${activeConversation.otherUser.username}`
                    )
                  }
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                  title="Denunciar conversa"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/40 dark:bg-slate-950/40">
              {messages.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 mx-auto flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-sm">Início de uma conversa amiga!</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Diga olá, pergunte sobre hobbies ou comente sobre os interesses que vocês têm em comum.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUser?.uid;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm shadow-sm leading-relaxed ${
                          isMine
                            ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white rounded-br-none'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}
                        {msg.mediaUrl && (
                          <img
                            src={msg.mediaUrl}
                            alt="Mídia"
                            className="rounded-xl mt-2 max-h-60 w-full object-cover"
                          />
                        )}
                      </div>
                      <time className="text-[10px] text-slate-400 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
            >
              {showImageInput && (
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="URL direta da foto (https://...)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMediaUrl('');
                      setShowImageInput(false);
                    }}
                    className="p-1 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowImageInput(!showImageInput)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Anexar imagem"
                >
                  <ImageIcon className="w-5 h-5 text-teal-500" />
                </button>

                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Escreva uma mensagem amigável..."
                  maxLength={2000}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  type="submit"
                  disabled={isSending || (!textInput.trim() && !mediaUrl.trim())}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white disabled:opacity-40 transition shadow-sm"
                  aria-label="Enviar mensagem"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center p-8 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base">Selecione uma conversa ao lado</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Converse com seus amigos aceitos em tempo real com total privacidade e respeito.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
