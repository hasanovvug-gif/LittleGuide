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
    <div className="min-h-full text-slate-900 p-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-2 rounded-full text-white shadow-lg">
            <Wand2 size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-900">{t('magic_photo_title')}</h2>
            <p className="text-xs text-slate-500">{t('magic_photo_subtitle')}</p>
        </div>
      </div>

      {!selectedImage ? (
        <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-white/60 rounded-3xl bg-white/40 backdrop-blur-md p-8 text-center space-y-4 shadow-sm">
            <div className="bg-slate-100 p-6 rounded-full">
                <Camera size={48} className="text-slate-400" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-700">{t('magic_upload_photo')}</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-[200px] mx-auto">
                    {t('upload_photo_desc')}
                </p>
            </div>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
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
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white/50 backdrop-blur-sm border border-white/50 aspect-square">
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
                        className="absolute top-4 right-4 bg-white/80 p-2 rounded-full text-slate-700 shadow-sm hover:bg-white transition-colors z-30"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Controls */}
            {!resultImage && (
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800">{t('choose_style')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {STYLES.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id)}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                    selectedStyle === style.id 
                                    ? 'border-violet-400 bg-violet-50/80 shadow-md ring-1 ring-violet-400' 
                                    : 'border-white/60 bg-white/50 hover:border-violet-300 hover:bg-white/70'
                                }`}
                            >
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.color}`}>
                                    {style.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!selectedStyle || isProcessing}
                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold shadow-lg shadow-violet-200 disabled:opacity-50 disabled:scale-95 active:scale-95 transition-all flex items-center justify-center gap-2"
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
                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Download size={18} />
                        {t('download')}
                    </a>
                    <button 
                        onClick={() => setResultImage(null)}
                        className="px-4 py-3 bg-white/70 backdrop-blur-md border border-white/80 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-white/90 transition-colors"
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