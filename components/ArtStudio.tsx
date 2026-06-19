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
    <div className="space-y-6 px-5 pt-6 pb-24 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 shadow-sm">
          <Palette size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-warm-900">{t('art_studio', { defaultValue: 'Арт-студія' })}</h2>
          <p className="text-sm text-warm-500">{t('art_studio_desc', { defaultValue: 'Магія малювання з ШІ' })}</p>
        </div>
      </div>

      <div className="mb-6 flex rounded-[22px] bg-warm-100 p-1.5 shadow-inner">
        <button
          onClick={() => setActiveTab('scribble')}
          className={`flex-1 rounded-[18px] py-3 text-sm font-extrabold transition-colors ${
            activeTab === 'scribble' ? 'bg-white text-warm-900 shadow-sm' : 'text-warm-500 hover:text-warm-700'
          }`}
        >
          {t('scribble_to_art', { defaultValue: 'Ожилі каракулі' })}
        </button>
        <button
          onClick={() => setActiveTab('coloring')}
          className={`flex-1 rounded-[18px] py-3 text-sm font-extrabold transition-colors ${
            activeTab === 'coloring' ? 'bg-white text-warm-900 shadow-sm' : 'text-warm-500 hover:text-warm-700'
          }`}
        >
          {t('coloring_pages', { defaultValue: 'Розмальовки' })}
        </button>
      </div>

      {activeTab === 'scribble' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="glass-card rounded-[28px] border border-white/60 p-5 shadow-sm">
            <p className="mb-4 text-sm leading-relaxed text-warm-600">
              {t('scribble_desc', { defaultValue: 'Завантажте дитячий малюнок, і ШІ перетворить його на справжній шедевр, зберігши оригінальні форми та кольори.' })}
            </p>

            {!scribbleImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-warm-300 p-8 text-warm-500 transition-colors hover:bg-warm-50"
              >
                <Upload size={32} className="mb-2" />
                <p className="text-sm font-bold">{t('upload_drawing', { defaultValue: 'Завантажити малюнок' })}</p>
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
                <div className="relative overflow-hidden rounded-[22px] border border-warm-200">
                  <img src={scribbleImage} alt="Original scribble" className="w-full h-48 object-cover" />
                  <button 
                    onClick={() => { setScribbleImage(null); setArtResult(null); }}
                    className="absolute right-2 top-2 rounded-2xl bg-black/50 p-1.5 text-xs text-white backdrop-blur-sm"
                  >
                    ✕
                  </button>
                </div>

                <input 
                  type="text" 
                  value={scribblePrompt}
                  onChange={(e) => setScribblePrompt(e.target.value)}
                  placeholder={t('scribble_prompt_placeholder', { defaultValue: 'Стиль (наприклад: 3D Pixar, акварель)' })}
                  className="w-full rounded-[22px] border border-warm-200 bg-warm-50 p-4 text-[15px] focus:border-pink-400 focus:outline-none"
                />

                <button 
                  onClick={handleGenerateArt}
                  disabled={isGeneratingArt}
                  className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-pink-500 to-rose-500 py-3 text-base font-extrabold text-white shadow-md disabled:opacity-50"
                >
                  {isGeneratingArt ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                  {isGeneratingArt ? t('creating_magic', { defaultValue: 'Творимо магію...' }) : t('transform_drawing', { defaultValue: 'Перетворити малюнок' })}
                </button>
              </div>
            )}
          </div>

          {artResult && (
            <div className="animate-in fade-in rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-sm backdrop-blur-md">
              <h3 className="mb-3 text-lg font-extrabold text-warm-900">{t('result', { defaultValue: 'Результат' })}</h3>
              <div className="mb-4 overflow-hidden rounded-[22px] border border-warm-200">
                <img src={artResult} alt="Generated art" className="w-full h-auto" />
              </div>
              <button 
                onClick={() => handleDownload(artResult, 'masterpiece.png')}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[22px] border border-warm-200 py-2.5 text-sm font-bold text-warm-700 hover:bg-warm-50"
              >
                <Download size={16} /> {t('save_to_gallery', { defaultValue: 'Зберегти в галерею' })}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'coloring' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="glass-card rounded-[28px] border border-white/60 p-5 shadow-sm">
            <p className="mb-4 text-sm leading-relaxed text-warm-600">
              {t('coloring_desc', { defaultValue: 'Опишіть, що ви хочете розфарбувати, і ШІ створить унікальну розмальовку, яку можна одразу роздрукувати.' })}
            </p>

            <div className="space-y-4">
              <textarea 
                value={coloringPrompt}
                onChange={(e) => setColoringPrompt(e.target.value)}
                placeholder={t('coloring_prompt_placeholder', { defaultValue: 'Наприклад: Динозавр п\'є чай з екскаватором у лісі' })}
                className="h-28 w-full resize-none rounded-[22px] border border-warm-200 bg-warm-50 p-4 text-[15px] focus:border-pink-400 focus:outline-none"
              />

              <button 
                onClick={handleGenerateColoring}
                disabled={isGeneratingColoring || !coloringPrompt.trim()}
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-blue-500 to-indigo-500 py-3 text-base font-extrabold text-white shadow-md disabled:opacity-50"
              >
                {isGeneratingColoring ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                {isGeneratingColoring ? t('drawing_lines', { defaultValue: 'Малюємо контури...' }) : t('generate_coloring', { defaultValue: 'Створити розмальовку' })}
              </button>
            </div>
          </div>

          {coloringResult && (
            <div className="animate-in fade-in rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-sm backdrop-blur-md">
              <h3 className="mb-3 text-lg font-extrabold text-warm-900">{t('your_coloring_page', { defaultValue: 'Ваша розмальовка' })}</h3>
              <div className="mb-4 overflow-hidden rounded-[22px] border border-warm-200 bg-white p-2">
                <img src={coloringResult} alt="Coloring page" className="w-full h-auto" />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handlePrint(coloringResult)}
                  className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-[22px] bg-warm-900 py-2.5 text-sm font-bold text-white hover:bg-warm-800"
                >
                  <Printer size={16} /> {t('print', { defaultValue: 'Друк' })}
                </button>
                <button 
                  onClick={() => handleDownload(coloringResult, 'coloring-page.png')}
                  className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-[22px] border border-warm-200 py-2.5 text-sm font-bold text-warm-700 hover:bg-warm-50"
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
