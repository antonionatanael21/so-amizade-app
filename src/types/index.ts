export type UserRole = 'user' | 'moderator' | 'admin';
export type PlanType = 'free' | 'plus';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  photoURL?: string;
  coverURL?: string;
  bio?: string;
  city?: string;
  state?: string;
  is18Plus: boolean;
  isSuspended?: boolean;
  isBanned?: boolean;
  suspensionReason?: string;
  suspensionExpiresAt?: string;
  role: UserRole;
  plan: PlanType;
  interests?: string[];
  hobbies?: string[];
  favoriteMovies?: string;
  favoriteSeries?: string;
  favoriteMusic?: string;
  favoriteGames?: string;
  favoriteTopics?: string;
  allowFriendRequests?: boolean;
  isProfilePublic?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type ReactionType = 'love' | 'handshake' | 'cheer' | 'inspire' | 'hug';

export interface ReactionDetail {
  type: ReactionType;
  label: string;
  emoji: string;
  color: string;
}

export const REACTION_TYPES: Record<ReactionType, ReactionDetail> = {
  love: { type: 'love', label: 'Adorei', emoji: '❤️', color: 'text-rose-500' },
  handshake: { type: 'handshake', label: 'Tamo Junto', emoji: '🤝', color: 'text-teal-500' },
  cheer: { type: 'cheer', label: 'Parabéns', emoji: '👏', color: 'text-amber-500' },
  inspire: { type: 'inspire', label: 'Inspirador', emoji: '💡', color: 'text-indigo-500' },
  hug: { type: 'hug', label: 'Abraço', emoji: '🤗', color: 'text-purple-500' },
};

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhotoURL?: string;
  content: string;
  mediaUrl?: string;
  communityId?: string;
  communityName?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
  // Dynamic client fields
  userReaction?: ReactionType;
  isSaved?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhotoURL?: string;
  content: string;
  parentCommentId?: string;
  createdAt: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderPhotoURL?: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'active' | 'removed';
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageText?: string;
  lastMessageSenderId?: string;
  updatedAt: string;
  // Client populated:
  otherUser?: UserProfile;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  mediaUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  bannerUrl?: string;
  iconUrl?: string;
  rules?: string;
  creatorId: string;
  creatorName: string;
  memberCount: number;
  postCount: number;
  isVerified?: boolean;
  createdAt: string;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: string;
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accept'
  | 'comment'
  | 'reaction'
  | 'message'
  | 'community'
  | 'announcement'
  | 'warning';

export interface NotificationItem {
  id: string;
  userId: string;
  senderId?: string;
  senderName?: string;
  senderPhotoURL?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export type ReportCategory =
  | 'sexual_dating'
  | 'harassment'
  | 'underage'
  | 'hate_speech'
  | 'fake_scam'
  | 'spam'
  | 'privacy_breach';

export const REPORT_CATEGORIES: { id: ReportCategory; label: string; description: string }[] = [
  {
    id: 'sexual_dating',
    label: 'Proposta romântica / Solicitação sexual / Conteúdo inadequado',
    description: 'Violação direta do propósito estritamente amistoso e sem conotação sexual do SÓ AMIZADE.',
  },
  {
    id: 'harassment',
    label: 'Assédio, perseguição ou intimidação',
    description: 'Comportamento abusivo, insistente ou ameaçador direcionado a você ou outrem.',
  },
  {
    id: 'underage',
    label: 'Suspeita de menor de 18 anos',
    description: 'Usuário aparenta ter menos de 18 anos de idade, o que é estritamente proibido.',
  },
  {
    id: 'hate_speech',
    label: 'Discurso de ódio, racismo ou preconceito',
    description: 'Ataques a grupos, intolerância ou discriminação.',
  },
  {
    id: 'fake_scam',
    label: 'Perfil falso, golpe ou falsidade ideológica',
    description: 'Tentativa de fraude, extorsão ou utilização de fotos de terceiros.',
  },
  {
    id: 'spam',
    label: 'Spam ou publicidade não autorizada',
    description: 'Mensagens em massa repetitivas ou links maliciosos.',
  },
  {
    id: 'privacy_breach',
    label: 'Divulgação de dados pessoais sem autorização',
    description: 'Exposição de telefones, endereços ou documentos de terceiros.',
  },
];

export interface ReportItem {
  id: string;
  reporterId: string;
  reporterEmail?: string;
  targetType: 'user' | 'post' | 'comment' | 'message' | 'community';
  targetId: string;
  targetAuthorId?: string;
  targetSnapshot?: string;
  category: ReportCategory;
  reason: string;
  evidence?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'high' | 'medium' | 'low';
  reviewedBy?: string;
  resolution?: string;
  createdAt: string;
}

export interface AdminLogItem {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface OfficialAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'urgent' | 'safety';
  authorEmail: string;
  createdAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: 'plus_monthly' | 'plus_annual';
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  amount: number;
  currency: string;
  provider: 'mercadopago';
  preferenceId?: string;
  paymentId?: string;
  validUntil: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AccountAppeal {
  id: string;
  userId: string;
  userEmail: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: string;
  moderatorNotes?: string;
}
