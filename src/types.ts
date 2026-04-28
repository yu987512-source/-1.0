export interface Persona {
  id: string;
  name: string;
  avatar: string;
  description?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  phoneNumber?: string;
  countryCode?: string;
  personaDescription?: string;
}

export interface PersonaGroup {
  id: string;
  name: string;
  personas: Persona[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Base64 string for multimodal support
  type?: 'text' | 'voice' | 'sticker' | 'system' | 'transfer' | 'red-packet' | 'image';
  duration?: number;
  timestamp: number;
  isWithdrawn?: boolean;
  quoteId?: string;
  quoteSender?: string;
  quoteContent?: string;
  personaId?: string; // ID of the AI persona who sent the message
}

export interface ApiPreset {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
}

export interface ApiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  selectedCharacterId: string;
  characterGroups: PersonaGroup[];
  presets: ApiPreset[];
  availableModels: string[];
  minimaxApiKey?: string;
  minimaxUrl?: string;
  minimaxGroupId?: string;
  ttsEnabled?: boolean;
  minAiReplies?: number;
}

export interface StickerGroup {
  id: string;
  name: string;
  stickers: string[];
}

export interface VirtualContact {
  id: string;
  name: string;
  avatar: string;
  phoneNumber: string;
  description?: string;
  isBlocked?: boolean;
  callCount: number;
  lastCallTimestamp?: number;
}

export interface UserProfile {
  selectedPersonaId: string;
  personaGroups: PersonaGroup[];
  wechatId: string;
  signature: string;
  momentsCover: string;
  balance: number;
  stickerGroups: StickerGroup[];
  virtualContacts: VirtualContact[];
}

export interface GroupChat {
  id: string;
  name: string;
  avatar?: string;
  announcement?: string;
  memberIds: string[]; // List of Persona IDs (AIs)
}

export interface AppState {
  isLocked: boolean;
  currentApp: string | null;
  battery: number;
  time: string;
  date: string;
  theme: 'light' | 'dark';
  lockScreenWallpaper: string;
  homeScreenWallpaper: string;
  notificationsEnabled: boolean;
  activeNotification: Message | null;
  isVideoCallActive: boolean;
  isAudioCallActive: boolean;
  videoCallData: any;
  lastCallResult: { mode: 'audio' | 'video'; duration: number; timestamp: number } | null;
  ttsEnabled: boolean;
  intenseReminder: boolean;
  reminderFrequency?: 'always' | 'once';
  intenseReminderRingtone?: string;
  chatBackground: string | null;
  persistentContext: string;
  lockPassword?: string;
  appIcons?: Record<string, string>;
  customCss?: string;
  apiConfig: ApiConfig;
  userProfile: UserProfile;
  forwardToAiContent: string | null;
  callHistory: { contactId: string; type: 'incoming' | 'outgoing'; timestamp: number; duration: number }[];
}
