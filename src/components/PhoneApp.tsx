import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  Users, 
  Clock, 
  Star, 
  Search, 
  Plus, 
  X, 
  MoreVertical,
  MinusCircle,
  UserPlus,
  Trash2,
  Ban,
  ChevronRight,
  ChevronLeft,
  Delete,
  PhoneCall
} from 'lucide-react';
import { AppState, VirtualContact } from '../types';

interface PhoneAppProps {
  onClose: () => void;
  onStartAudioCall: (data: any) => void;
  userProfile: AppState['userProfile'];
  onUpdateProfile: (profile: Partial<AppState['userProfile']>) => void;
  callHistory: AppState['callHistory'];
  apiConfig: AppState['apiConfig'];
  theme: 'light' | 'dark';
}

export default function PhoneApp({ 
  onClose, 
  onStartAudioCall, 
  userProfile, 
  onUpdateProfile, 
  callHistory,
  apiConfig,
  theme 
}: PhoneAppProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'recents' | 'contacts' | 'keypad'>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [keypadValue, setKeypadValue] = useState("");
  const [newContact, setNewContact] = useState<Partial<VirtualContact>>({
    name: '',
    phoneNumber: '',
    avatar: ""
  });

  const contacts = userProfile.virtualContacts || [];

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phoneNumber) return;
    const contact: VirtualContact = {
      id: `vcon-${Date.now()}`,
      name: newContact.name,
      phoneNumber: newContact.phoneNumber,
      avatar: newContact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newContact.name}`,
      callCount: 0,
    };
    onUpdateProfile({
      virtualContacts: [...contacts, contact]
    });
    setShowAddContact(false);
    setNewContact({ name: '', phoneNumber: '', avatar: '' });
  };

  const handleDeleteContact = (id: string) => {
    onUpdateProfile({
      virtualContacts: contacts.filter(c => c.id !== id)
    });
  };

  const handleToggleBlock = (id: string) => {
    onUpdateProfile({
      virtualContacts: contacts.map(c => c.id === id ? { ...c, isBlocked: !c.isBlocked } : c)
    });
  };

  const handleCall = (contact: VirtualContact) => {
    if (contact.isBlocked) {
        alert("通话失败：该号码已被拉黑");
        return;
    }
    
    // Update call count
    const updatedContacts = contacts.map(c => 
      c.id === contact.id ? { ...c, callCount: c.callCount + 1, lastCallTimestamp: Date.now() } : c
    );
    onUpdateProfile({ virtualContacts: updatedContacts });

    onStartAudioCall({
      partnerName: contact.name,
      partnerAvatar: contact.avatar,
      personaId: contact.id,
      isFirstCall: contact.callCount === 0
    });
  };

  const handleKeypadCall = () => {
    if (!keypadValue) return;
    
    const normalize = (num: string) => num.replace(/\D/g, '');
    const dialNum = normalize(keypadValue);

    if (dialNum.length === 0) return;

    // Helper to check if two numbers match (allowing for country code variations)
    const isMatch = (n1: string, n2: string) => {
      if (!n1 || !n2) return false;
      const norm1 = normalize(n1);
      const norm2 = normalize(n2);
      if (norm1 === norm2) return true;
      // If one is a suffix of the other and at least 7 digits (to avoid short matches)
      if (norm1.length >= 7 && norm2.endsWith(norm1)) return true;
      if (norm2.length >= 7 && norm1.endsWith(norm2)) return true;
      return false;
    };

    // 1. Check virtual contacts
    const existingContact = contacts.find(c => isMatch(c.phoneNumber, keypadValue));
    if (existingContact) {
      handleCall(existingContact);
      return;
    }

    // 2. Check AI personas
    let foundPersona = null;
    for (const group of apiConfig.characterGroups) {
      const p = group.personas.find(persona => {
        if (!persona.phoneNumber) return false;
        const fullNum = (persona.countryCode || "") + persona.phoneNumber;
        return isMatch(fullNum, keypadValue) || isMatch(persona.phoneNumber, keypadValue);
      });
      if (p) {
        foundPersona = p;
        break;
      }
    }

    if (foundPersona) {
      onStartAudioCall({
        partnerName: foundPersona.name,
        partnerAvatar: foundPersona.avatar,
        personaId: foundPersona.id,
        isFirstCall: true
      });
      return;
    }

    // 3. Not found
    alert("对不起，您拨打的电话是空号。");
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phoneNumber.includes(searchQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const TABS = [
    { id: 'favorites', icon: Star, label: '个人收藏' },
    { id: 'recents', icon: Clock, label: '最近通话' },
    { id: 'contacts', icon: Users, label: '通讯录' },
    { id: 'keypad', icon: Phone, label: '拨号键盘' },
  ];

  return (
    <div className={`flex flex-col h-full relative ${theme === 'light' ? 'bg-[#F2F2F7]' : 'bg-black text-white'}`}>
      {/* Header */}
      <div className="pt-14 px-4 pb-2">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-1 -ml-1 text-[#007AFF] active:opacity-50"
            >
              <ChevronLeft size={32} />
            </button>
            <h1 className="text-3xl font-bold">
              {activeTab === 'favorites' && '个人收藏'}
              {activeTab === 'recents' && '最近通话'}
              {activeTab === 'contacts' && '通讯录'}
              {activeTab === 'keypad' && ' '}
            </h1>
          </div>
          {activeTab === 'contacts' && (
            <button 
              onClick={() => {
                setNewContact({ ...newContact, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}` });
                setShowAddContact(true);
              }}
              className="text-[#007AFF]"
            >
              <Plus size={28} />
            </button>
          )}
        </div>

        {activeTab === 'contacts' && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 ${theme === 'light' ? 'bg-black/5' : 'bg-white/10'}`}>
            <Search size={18} className="opacity-40" />
            <input 
              type="text" 
              placeholder="搜索" 
              className="bg-transparent flex-1 outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {activeTab === 'contacts' && (
          <div className={`rounded-xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center opacity-40">
                <Users className="mx-auto mb-2" size={48} />
                <p>无联系人</p>
              </div>
            ) : (
              filteredContacts.map((contact, idx) => (
                <div 
                  key={contact.id} 
                  className={`flex items-center gap-3 p-3 relative ${idx < filteredContacts.length - 1 ? 'border-b' : ''} ${theme === 'light' ? 'border-gray-100' : 'border-gray-800'}`}
                >
                  <img src={contact.avatar} className="w-10 h-10 rounded-full border border-black/5" />
                  <div className="flex-1" onClick={() => handleCall(contact)}>
                    <div className="font-semibold flex items-center gap-2">
                       {contact.name}
                       {contact.isBlocked && <Ban size={12} className="text-red-500" />}
                    </div>
                    <div className="text-xs opacity-50">{contact.phoneNumber}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggleBlock(contact.id)}
                      className={`p-2 rounded-full ${contact.isBlocked ? 'text-red-500' : 'opacity-40'}`}
                    >
                      <Ban size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 text-red-500 opacity-40 hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                    <ChevronRight size={18} className="opacity-20" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'recents' && (
          <div className={`rounded-xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
             {callHistory.length === 0 ? (
               <div className="p-8 text-center opacity-40">
                 <Clock className="mx-auto mb-2" size={48} />
                 <p>最近通话记录为空</p>
               </div>
             ) : (
               [...callHistory].reverse().map((call, idx) => {
                 const contact = contacts.find(c => c.id === call.contactId);
                 return (
                   <div key={idx} className={`flex items-center gap-3 p-3 ${idx < callHistory.length - 1 ? 'border-b' : ''} ${theme === 'light' ? 'border-gray-100' : 'border-gray-800'}`}>
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Phone size={20} className="opacity-40" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{contact?.name || call.contactId}</div>
                        <div className="text-xs opacity-50">{call.type === 'outgoing' ? '拨出' : '接入'} • {new Date(call.timestamp).toLocaleTimeString()}</div>
                      </div>
                      <div className="text-xs opacity-40">{Math.floor(call.duration / 60)}:{String(call.duration % 60).padStart(2, '0')}</div>
                   </div>
                 );
               })
             )}
          </div>
        )}

        {activeTab === 'keypad' && (
          <div className="flex flex-col items-center justify-center h-full pt-2">
            <div className="text-4xl h-20 w-full text-center flex items-center justify-center mb-6 px-4 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide">
               {keypadValue}
            </div>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
               {[1,2,3,4,5,6,7,8,9, '*', 0, '#'].map(val => (
                 <button 
                  key={val}
                  onClick={() => setKeypadValue(prev => prev + val)}
                  className={`w-18 h-18 rounded-full flex flex-col items-center justify-center text-3xl transition-transform active:scale-90 ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-white/10'}`}
                 >
                   {val}
                 </button>
               ))}
               <div />
               <button 
                  onClick={() => {
                    console.log("[PhoneApp] Calling number:", keypadValue);
                    handleKeypadCall();
                  }}
                  className="w-18 h-18 bg-[#34C759] rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
               >
                  <Phone size={32} fill="white" />
               </button>
               <button 
                  onClick={() => setKeypadValue(prev => prev.slice(0, -1))}
                  className="w-18 h-18 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
               >
                  <Delete size={28} />
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={`absolute bottom-0 left-0 right-0 h-24 border-t px-6 flex justify-between pt-2 pb-8 ${theme === 'light' ? 'bg-white/80 border-gray-100 text-gray-400' : 'bg-black/80 border-gray-800 text-gray-500'} backdrop-blur-xl`}>
         {TABS.map(tab => (
           <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === tab.id ? 'text-[#007AFF]' : ''}`}
           >
             <tab.icon size={26} />
             <span className="text-[10px]">{tab.label}</span>
           </button>
         ))}
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContact && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-xs rounded-[32px] p-6 shadow-2xl ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">新建联系人</h2>
                <button onClick={() => setShowAddContact(false)} className="opacity-40"><X size={24} /></button>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center mb-4">
                   <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#007AFF] relative mb-2">
                      <img src={newContact.avatar} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setNewContact({ ...newContact, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}` })}
                        className="absolute inset-0 bg-black/20 flex items-center justify-center text-white"
                      >
                         换一个
                      </button>
                   </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold opacity-40 ml-2 uppercase">姓名</label>
                    <input 
                      type="text" 
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className={`w-full px-4 py-3 rounded-2xl border outline-none ${theme === 'light' ? 'bg-gray-50 border-gray-100 focus:border-[#007AFF]' : 'bg-black border-gray-800 focus:border-[#007AFF]'}`}
                      placeholder="如：张三"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold opacity-40 ml-2 uppercase">电话号码</label>
                    <input 
                      type="tel" 
                      value={newContact.phoneNumber}
                      onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                      className={`w-full px-4 py-3 rounded-2xl border outline-none ${theme === 'light' ? 'bg-gray-50 border-gray-100 focus:border-[#007AFF]' : 'bg-black border-gray-800 focus:border-[#007AFF]'}`}
                      placeholder="138 **** ****"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddContact}
                  disabled={!newContact.name || !newContact.phoneNumber}
                  className="w-full py-4 bg-[#007AFF] text-white rounded-2xl font-bold active:scale-95 transition-transform disabled:opacity-30 mt-4"
                >
                  存储
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
