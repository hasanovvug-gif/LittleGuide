import React, { useState, useRef } from 'react';
import { Palette, Upload, Wand2, Printer, Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { scribbleToArt, generateColoringPage } from '../services/geminiService';

export const ArtStudio: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'scribble' | 'coloring'>('scribble');
  
  // Scribble State
  const [scribbleImage, setScribbleImage] = useState<string | null>(null);
  const [scribblePrompt, setScribblePrompt] = useState('');
  const [artResult, setArtResult] = useState<string | null>(null);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Coloring State
  const [coloringPrompt, setColoringPrompt] = useState('');
  const [coloringResult, setColoringResult] = useState<string | null>(null);
  const [isGeneratingColoring, setIsGeneratingColoring] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScribbleImage(reader.result as string);
        setArtResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateArt = async () => {
    if (!scribbleImage) return;
    setIsGeneratingArt(true);
    try {
      const result = await scribbleToArt(scribbleImage, scribblePrompt);
      setArtResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingArt(false);
    }
  };

  const handleGenerateColoring = async () => {
    if (!coloringPrompt.trim()) return;
    setIsGeneratingColoring(true);
    try {
      const result = await generateColoringPage(coloringPrompt);
      setColoringResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingColoring(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = (url: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;">
            <img src="${url}" style="max-width:100%;max-height:100%;" onload="window.print();window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="px-6 pt-8 pb-24 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-pink-100 p-2 rounded-full text-pink-600">
          <Palette size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-warm-900">{t('art_studio', { defaultValue: 'Арт-студія' })}</h2>
          <p className="text-sm text-warm-500">{t('art_studio_desc', { defaultValue: 'Магія малювання з ШІ' })}</p>
        </div>
      </div>

      <div className="flex bg-warm-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('scribble')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'scribble' ? 'bg-white text-warm-900 shadow-sm' : 'text-warm-500 hover:text-warm-700'
          }`}
        >
          {t('scribble_to_art', { defaultValue: 'Ожилі каракулі' })}
        </button>
        <button
          onClick={() => setActiveTab('coloring')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'coloring' ? 'bg-white text-warm-900 shadow-sm' : 'text-warm-500 hover:text-warm-700'
          }`}
        >
          {t('coloring_pages', { defaultValue: 'Розмальовки' })}
        </button>
      </div>

      {activeTab === 'scribble' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/50">
            <p className="text-sm text-warm-600 mb-4">
              {t('scribble_desc', { defaultValue: 'Завантажте дитячий малюнок, і ШІ перетворить його на справжній шедевр, зберігши оригінальні форми та кольори.' })}
            </p>

            {!scribbleImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-warm-300 rounded-xl p-8 flex flex-col items-center justify-center text-warm-500 cursor-pointer hover:bg-warm-50 transition-colors"
              >
                <Upload size={32} className="mb-2" />
                <p className="text-sm font-medium">{t('upload_drawing', { defaultValue: 'Завантажити малюнок' })}</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-warm-200">
                  <img src={scribbleImage} alt="Original scribble" className="w-full h-48 object-cover" />
                  <button 
                    onClick={() => { setScribbleImage(null); setArtResult(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full text-xs backdrop-blur-sm"
                  >
                    ✕
                  </button>
                </div>

                <input 
                  type="text" 
                  value={scribblePrompt}
                  onChange={(e) => setScribblePrompt(e.target.value)}
                  placeholder={t('scribble_prompt_placeholder', { defaultValue: 'Стиль (наприклад: 3D Pixar, акварель)' })}
                  className="w-full bg-warm-50 border border-warm-200 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-400"
                />

                <button 
                  onClick={handleGenerateArt}
                  disabled={isGeneratingArt}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isGeneratingArt ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                  {isGeneratingArt ? t('creating_magic', { defaultValue: 'Творимо магію...' }) : t('transform_drawing', { defaultValue: 'Перетворити малюнок' })}
                </button>
              </div>
            )}
          </div>

          {artResult && (
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/50 animate-in fade-in">
              <h3 className="font-bold text-warm-900 mb-3">{t('result', { defaultValue: 'Результат' })}</h3>
              <div className="rounded-xl overflow-hidden border border-warm-200 mb-4">
                <img src={artResult} alt="Generated art" className="w-full h-auto" />
              </div>
              <button 
                onClick={() => handleDownload(artResult, 'masterpiece.png')}
                className="w-full py-2.5 border border-warm-200 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-50 flex items-center justify-center gap-2"
              >
                <Download size={16} /> {t('save_to_gallery', { defaultValue: 'Зберегти в галерею' })}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'coloring' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/50">
            <p className="text-sm text-warm-600 mb-4">
              {t('coloring_desc', { defaultValue: 'Опишіть, що ви хочете розфарбувати, і ШІ створить унікальну розмальовку, яку можна одразу роздрукувати.' })}
            </p>

            <div className="space-y-4">
              <textarea 
                value={coloringPrompt}
                onChange={(e) => setColoringPrompt(e.target.value)}
                placeholder={t('coloring_prompt_placeholder', { defaultValue: 'Наприклад: Динозавр п\'є чай з екскаватором у лісі' })}
                className="w-full h-24 bg-warm-50 border border-warm-200 rounded-xl p-3 text-sm focus:outline-none focus:border-pink-400 resize-none"
              />

              <button 
                onClick={handleGenerateColoring}
                disabled={isGeneratingColoring || !coloringPrompt.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {isGeneratingColoring ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                {isGeneratingColoring ? t('drawing_lines', { defaultValue: 'Малюємо контури...' }) : t('generate_coloring', { defaultValue: 'Створити розмальовку' })}
              </button>
            </div>
          </div>

          {coloringResult && (
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/50 animate-in fade-in">
              <h3 className="font-bold text-warm-900 mb-3">{t('your_coloring_page', { defaultValue: 'Ваша розмальовка' })}</h3>
              <div className="rounded-xl overflow-hidden border border-warm-200 mb-4 bg-white p-2">
                <img src={coloringResult} alt="Coloring page" className="w-full h-auto" />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handlePrint(coloringResult)}
                  className="flex-1 py-2.5 bg-warm-900 text-white rounded-xl text-sm font-semibold hover:bg-warm-800 flex items-center justify-center gap-2"
                >
                  <Printer size={16} /> {t('print', { defaultValue: 'Друк' })}
                </button>
                <button 
                  onClick={() => handleDownload(coloringResult, 'coloring-page.png')}
                  className="flex-1 py-2.5 border border-warm-200 rounded-xl text-sm font-semibold text-warm-700 hover:bg-warm-50 flex items-center justify-center gap-2"
                >
                  <Download size={16} /> {t('save', { defaultValue: 'Зберегти' })}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
