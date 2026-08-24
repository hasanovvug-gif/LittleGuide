import React, { useState, useRef } from 'react';
import { DiaryEntry, UserState } from '../types';
import { Camera, Heart, Quote, Lock, Plus, Mic, Play, Pause, X, Star, Loader2, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generateMonthSummary } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface GrowthDiaryProps {
  userState: UserState;
  onUpdateUserState: (newState: UserState) => void;
}

export const GrowthDiary: React.FC<GrowthDiaryProps> = ({ userState, onUpdateUserState }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'text' | 'audio'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState<DiaryEntry['type']>('text');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryImage, setNewEntryImage] = useState<string | null>(null);

  // AI Summary State
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const entries = userState.diaryEntries || [];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const newEntry: DiaryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }),
            timestamp: Date.now(),
            type: 'audio',
            content: t('new_audio_note'),
            duration: `0:${recordingTime < 10 ? '0' + recordingTime : recordingTime}`,
            audioUrl: url
        };
        onUpdateUserState({
          ...userState,
          diaryEntries: [newEntry, ...entries]
        });
        setRecordingTime(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      (recorder as any).timerId = timer;

    } catch (err) {
      console.error("Mic access denied", err);
      alert(t('mic_access_denied'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      clearInterval((mediaRecorder as any).timerId);
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const togglePlay = (url: string, id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.onended = () => setPlayingId(null);
      audio.play();
      audioRef.current = audio;
      setPlayingId(id);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEntryImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEntry = () => {
    if (!newEntryContent.trim() && !newEntryImage) return;

    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }),
      timestamp: Date.now(),
      type: newEntryType,
      content: newEntryContent,
      imageUrl: newEntryImage || undefined
    };

    onUpdateUserState({
      ...userState,
      diaryEntries: [newEntry, ...entries]
    });

    setIsModalOpen(false);
    setNewEntryContent('');
    setNewEntryImage(null);
    setNewEntryType('text');
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    const recentEntries = entries
      .filter(e => e.type !== 'summary' && e.type !== 'audio')
      .slice(0, 10) // Take last 10 entries for context
      .map(e => e.content);

    if (recentEntries.length === 0) {
      setIsGeneratingSummary(false);
      return;
    }

    const summaryText = await generateMonthSummary(recentEntries, userState.childName, i18n.language);
    
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }),
      timestamp: Date.now(),
      type: 'summary',
      content: summaryText,
    };

    onUpdateUserState({
      ...userState,
      diaryEntries: [newEntry, ...entries]
    });
    setIsGeneratingSummary(false);
  };

  const filteredEntries = entries.filter(e => activeTab === 'audio' ? e.type === 'audio' : e.type !== 'audio');

  return (
    <div className="px-5 pt-6 pb-20 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-handwriting font-bold text-warm-900">{t('diary')}</h2>
            <p className="text-sm text-warm-500">{t('moments_unforgettable')}</p>
         </div>
         <button 
            onClick={() => setIsModalOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warm-900 text-white shadow-lg shadow-warm-900/20 transition-transform active:scale-95"
         >
            <Plus size={22} />
         </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex rounded-[22px] border border-white/50 bg-warm-100/50 p-1.5 shadow-sm backdrop-blur-md">
        <button 
            onClick={() => setActiveTab('text')}
            className={`flex-1 rounded-[18px] py-3 text-sm font-extrabold transition-all ${activeTab === 'text' ? 'bg-white/80 text-warm-900 shadow-sm backdrop-blur-sm' : 'text-warm-500'}`}
        >
            {t('notes')}
        </button>
        <button 
            onClick={() => setActiveTab('audio')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[18px] py-3 text-sm font-extrabold transition-all ${activeTab === 'audio' ? 'bg-white/80 text-primary-600 shadow-sm backdrop-blur-sm' : 'text-warm-500'}`}
        >
            <Mic size={14} />
            {t('audio_capsules')}
        </button>
      </div>

      {activeTab === 'audio' && (
         <div className="mb-8">
            <div className={`flex flex-col items-center justify-center rounded-[28px] p-6 transition-all backdrop-blur-md ${isRecording ? 'border border-red-100/50 bg-red-50/70' : 'border border-dashed border-primary-100/60 bg-primary-50/70'}`}>
                {isRecording ? (
                    <>
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-500 shadow-lg shadow-red-200 animate-pulse">
                             <Mic size={32} className="text-white" />
                        </div>
                        <h3 className="font-bold text-red-900 mb-1">{t('recording')} 0:{recordingTime < 10 ? '0' + recordingTime : recordingTime}</h3>
                        <p className="mb-4 text-sm text-red-400">{t('catching_first_sounds')}</p>
                        <button onClick={stopRecording} className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-red-500 shadow-sm">
                            {t('stop')}
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={startRecording} className="mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary-500 shadow-lg shadow-primary-200 transition-transform hover:scale-105">
                             <Mic size={32} className="text-white" />
                        </button>
                        <h3 className="font-bold text-primary-900 mb-1">{t('record_sound')}</h3>
                        <p className="max-w-[220px] text-center text-sm text-primary-400">
                            {t('first_sounds_desc')}
                        </p>
                    </>
                )}
            </div>
         </div>
      )}

      <div className="relative space-y-8">
        {/* Timeline Line */}
        <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-warm-200" />

        {filteredEntries.length === 0 && (
          <div className="pl-12 text-warm-400 text-sm italic">
            {t('no_entries_yet')}
          </div>
        )}

        {filteredEntries.map((entry) => (
            <div key={entry.id} className="group relative pl-12">
                {/* Timeline Dot */}
                <div className={`absolute left-[11px] top-6 w-3 h-3 bg-white border-2 rounded-full z-10 shadow-sm group-hover:scale-125 transition-transform ${entry.type === 'audio' ? 'border-primary-400' : entry.type === 'summary' ? 'border-purple-400' : 'border-warm-400'}`} />
                
                <span className="text-xs font-bold text-warm-400 uppercase tracking-wider mb-2 block">{entry.date}</span>
                
                <div className={`rounded-[26px] border p-5 shadow-sm transition-shadow hover:shadow-md backdrop-blur-md ${entry.type === 'summary' ? 'border-purple-200 bg-purple-50/50' : 'border-white/50 bg-white/75'}`}>
                    <div className="flex items-start gap-3 mb-2">
                        {entry.type === 'achievement' && <Star size={16} className="text-yellow-500 mt-1" />}
                        {entry.type === 'quote' && <Quote size={16} className="text-orange-400 mt-1" />}
                        {entry.type === 'photo' && <ImageIcon size={16} className="text-blue-400 mt-1" />}
                        {entry.type === 'summary' && <Star size={16} className="text-purple-500 mt-1" />}
                        {entry.type === 'audio' && (
                          <button 
                            onClick={() => entry.audioUrl && togglePlay(entry.audioUrl, entry.id)}
                            className="rounded-2xl bg-primary-100 p-2.5 transition-colors hover:bg-primary-200"
                          >
                            {playingId === entry.id ? <Pause size={16} className="text-primary-600" /> : <Play size={16} className="text-primary-600 ml-0.5" />}
                          </button>
                        )}
                        
                        <div className="flex-1">
                            {entry.imageUrl && (
                              <img src={entry.imageUrl} alt="Diary entry" className="mb-3 h-48 w-full rounded-2xl object-cover" />
                            )}
                            <p className={`${entry.type === 'summary' ? 'text-purple-900 font-medium' : 'text-warm-800 font-medium'} leading-relaxed whitespace-pre-wrap`}>
                              {entry.content}
                            </p>
                            {entry.type === 'audio' && (
                                <div className="mt-2 flex h-8 w-full items-center gap-2 rounded-full bg-warm-100 px-3">
                                     <span className="text-[10px] font-mono text-warm-500">{entry.duration}</span>
                                     <div className="flex-1 h-1 bg-warm-300 rounded-full overflow-hidden relative">
                                        {playingId === entry.id && (
                                          <motion.div 
                                            className="absolute top-0 left-0 bottom-0 bg-primary-500"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: parseInt(entry.duration?.split(':')[1] || '0') || 15, ease: "linear" }}
                                          />
                                        )}
                                     </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {entry.tags && entry.tags.length > 0 && (
                        <div className="flex gap-2 mt-3 ml-9">
                            {entry.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-warm-50 text-warm-500 text-[10px] rounded-md border border-warm-100">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        ))}
        
        {activeTab === 'text' && (
            <div className="relative pl-12 mt-8">
                <div className="rounded-[28px] border border-white/20 bg-gradient-to-r from-primary-500/90 to-primary-600/90 p-6 text-white shadow-lg shadow-primary-500/30 backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg">{t('month_summary')}</h3>
                        <Star size={20} className="text-primary-100" />
                    </div>
                    <p className="text-primary-50 text-sm mb-4">
                        {t('month_summary_desc')}
                    </p>
                    <button 
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary || entries.filter(e => e.type !== 'audio' && e.type !== 'summary').length === 0}
                      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white/20 py-2 text-sm font-semibold transition-colors backdrop-blur-sm hover:bg-white/30 disabled:opacity-50"
                    >
                        {isGeneratingSummary ? <Loader2 size={16} className="animate-spin" /> : null}
                        {isGeneratingSummary ? t('generating_summary') : t('reply')}
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-warm-900/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-[32px] bg-white p-6 pb-[calc(24px+var(--safe-bottom))] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-warm-900">{t('add_entry')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded-2xl bg-warm-100 p-2.5 text-warm-500">
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {(['text', 'quote', 'achievement', 'photo'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setNewEntryType(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                      newEntryType === type ? 'bg-warm-900 text-white' : 'bg-warm-100 text-warm-600'
                    }`}
                  >
                    {t(`entry_type_${type}`)}
                  </button>
                ))}
              </div>

              {newEntryType === 'photo' && (
                <div className="mb-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-warm-200 border-dashed rounded-2xl cursor-pointer bg-warm-50 hover:bg-warm-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-8 h-8 text-warm-400 mb-2" />
                      <p className="text-sm text-warm-500">{t('upload_photo')}</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {newEntryImage && (
                    <div className="mt-4 relative rounded-xl overflow-hidden">
                      <img src={newEntryImage} alt="Preview" className="w-full h-48 object-cover" />
                      <button 
                        onClick={() => setNewEntryImage(null)}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full backdrop-blur-sm"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <textarea
                value={newEntryContent}
                onChange={(e) => setNewEntryContent(e.target.value)}
                placeholder={t('entry_content_placeholder')}
                className="w-full h-32 p-4 bg-warm-50 rounded-2xl border-none focus:ring-2 focus:ring-warm-200 resize-none text-warm-900 placeholder-warm-400 mb-6"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-warm-600 bg-warm-100 hover:bg-warm-200 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleSaveEntry}
                  disabled={!newEntryContent.trim() && !newEntryImage}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-warm-900 hover:bg-warm-800 transition-colors disabled:opacity-50"
                >
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
