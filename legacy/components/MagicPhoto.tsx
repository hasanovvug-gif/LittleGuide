import React, { useState, useRef } from 'react';
import { Camera, Wand2, Upload, Download, Sparkles, X, RefreshCw } from 'lucide-react';
import { editChildPhoto } from '../services/geminiService';
import { useTranslation } from 'react-i18next';

export const MagicPhoto: React.FC = () => {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STYLES = [
    { id: 'astronaut', label: t('style_astronaut'), prompt: 'A cute baby astronaut in a colorful space nebula, digital art style, detailed spacesuit', color: 'bg-indigo-100 text-indigo-600' },
    { id: 'fairy', label: t('style_fairy'), prompt: 'Magical fairy forest, soft glowing lights, cute fantasy costume, whimsical illustration style', color: 'bg-green-100 text-green-600' },
    { id: 'pixar', label: t('style_pixar'), prompt: '3D render in the style of a high budget animated movie, cute, expressive, bright colors, soft lighting', color: 'bg-blue-100 text-blue-600' },
    { id: 'superhero', label: t('style_superhero'), prompt: 'Baby superhero with a cape flying in the city, comic book cover style, vibrant colors, heroic pose', color: 'bg-red-100 text-red-600' },
    { id: 'painting', label: t('style_painting'), prompt: 'Classic oil painting on canvas, impressionist strokes, museum quality art', color: 'bg-amber-100 text-amber-600' },
    { id: 'cyberpunk', label: t('style_cyberpunk'), prompt: 'Futuristic cyberpunk city, neon lights, cute robot companion, sci-fi style', color: 'bg-purple-100 text-purple-600' },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResultImage(null);
        setSelectedStyle(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !selectedStyle) return;

    setIsProcessing(true);
    setResultImage(null);

    try {
      const prompt = STYLES.find(s => s.id === selectedStyle)?.prompt || '';
      const result = await editChildPhoto(selectedImage, prompt);
      setResultImage(result);
    } catch (error) {
      console.error(error);
      alert(t('magic_failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResultImage(null);
    setSelectedStyle(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-full p-5 pb-20 pt-6 text-slate-900 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white shadow-lg">
            <Wand2 size={24} />
        </div>
        <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{t('magic_photo_title')}</h2>
            <p className="text-sm text-slate-500">{t('magic_photo_subtitle')}</p>
        </div>
      </div>

      {!selectedImage ? (
        <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 rounded-[32px] border-2 border-dashed border-white/60 bg-white/45 p-8 text-center shadow-sm backdrop-blur-md">
            <div className="rounded-[28px] bg-slate-100 p-6">
                <Camera size={48} className="text-slate-400" />
            </div>
            <div>
                <h3 className="text-xl font-extrabold text-slate-700">{t('magic_upload_photo')}</h3>
                <p className="mx-auto mt-1 max-w-[220px] text-sm leading-relaxed text-slate-400">
                    {t('upload_photo_desc')}
                </p>
            </div>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[56px] items-center gap-2 rounded-[22px] bg-slate-900 px-8 py-3 text-base font-extrabold text-white shadow-lg transition-transform hover:scale-105"
            >
                <Upload size={18} />
                {t('choose_from_gallery')}
            </button>
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
            />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Image Preview Area */}
            <div className="relative aspect-square overflow-hidden rounded-[28px] border border-white/50 bg-white/50 shadow-xl backdrop-blur-sm">
                {isProcessing && (
                    <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                        <Sparkles className="animate-spin mb-4 text-fuchsia-400" size={48} />
                        <p className="font-bold animate-pulse">{t('creating_magic')}</p>
                    </div>
                )}
                
                {resultImage ? (
                    <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
                ) : (
                    <img src={selectedImage} alt="Original" className="w-full h-full object-cover" />
                )}

                {!isProcessing && (
                    <button 
                        onClick={handleReset}
                        className="absolute right-4 top-4 z-30 rounded-2xl bg-white/80 p-2.5 text-slate-700 shadow-sm transition-colors hover:bg-white"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Controls */}
            {!resultImage && (
                <div className="space-y-4">
                    <h3 className="text-lg font-extrabold text-slate-800">{t('choose_style')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {STYLES.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id)}
                                className={`rounded-[22px] border p-3 text-left transition-all ${
                                    selectedStyle === style.id 
                                    ? 'border-violet-400 bg-violet-50/80 shadow-md ring-1 ring-violet-400' 
                                    : 'border-white/60 bg-white/50 hover:border-violet-300 hover:bg-white/70'
                                }`}
                            >
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${style.color}`}>
                                    {style.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!selectedStyle || isProcessing}
                        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-violet-600 to-fuchsia-600 py-4 text-base font-extrabold text-white shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:scale-95 disabled:opacity-50"
                    >
                        <Sparkles size={20} />
                        {t('create_magic_btn')}
                    </button>
                </div>
            )}

            {/* Result Actions */}
            {resultImage && (
                <div className="flex gap-3">
                    <a 
                        href={resultImage} 
                        download="magic-baby.png"
                        className="flex min-h-[54px] flex-1 items-center justify-center gap-2 rounded-[22px] bg-slate-900 py-3 text-sm font-extrabold text-white shadow-lg"
                    >
                        <Download size={18} />
                        {t('download')}
                    </a>
                    <button 
                        onClick={() => setResultImage(null)}
                        className="flex min-h-[54px] items-center justify-center gap-2 rounded-[22px] border border-white/80 bg-white/70 px-4 py-3 text-slate-700 shadow-sm transition-colors hover:bg-white/90 backdrop-blur-md"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};
