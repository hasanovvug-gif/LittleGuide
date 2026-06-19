import React, { useState, useEffect } from 'react';
import { FoodItem, UserState } from '../types';
import { Utensils, Award, Frown, Smile, Meh, ChefHat, Sparkles, Loader2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generateRecipe, RecipeSuggestion } from '../services/geminiService';

interface FoodDiaryProps {
  userState: UserState;
  onUpdateUserState: (newState: UserState) => void;
}

export const FoodDiary: React.FC<FoodDiaryProps> = ({ userState, onUpdateUserState }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'map' | 'kitchen'>('map');

  const INITIAL_FOODS: FoodItem[] = [
    { id: '1', name: 'food_zucchini', emoji: '🥒', category: 'veg', status: 'none' },
    { id: '2', name: 'food_broccoli', emoji: '🥦', category: 'veg', status: 'none' },
    { id: '3', name: 'food_pumpkin', emoji: '🎃', category: 'veg', status: 'none' },
    { id: '4', name: 'food_apple', emoji: '🍎', category: 'fruit', status: 'none' },
    { id: '5', name: 'food_pear', emoji: '🍐', category: 'fruit', status: 'none' },
    { id: '6', name: 'food_banana', emoji: '🍌', category: 'fruit', status: 'none' },
    { id: '7', name: 'food_buckwheat', emoji: '🥣', category: 'grain', status: 'none' },
    { id: '8', name: 'food_rice', emoji: '🍙', category: 'grain', status: 'none' },
  ];

  const foodStatuses = userState.foodStatuses || {};

  const toggleStatus = (id: string) => {
    const currentStatus = foodStatuses[id] || 'none';
    const statuses: FoodItem['status'][] = ['none', 'neutral', 'liked', 'disliked'];
    const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    
    onUpdateUserState({
      ...userState,
      foodStatuses: {
        ...foodStatuses,
        [id]: statuses[nextIndex]
      }
    });
  };

  const getStatusIcon = (status: FoodItem['status']) => {
    switch (status) {
      case 'liked': return <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm"><Smile size={14} className="text-green-500 fill-green-100" /></div>;
      case 'disliked': return <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm"><Frown size={14} className="text-red-500 fill-red-100" /></div>;
      case 'neutral': return <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm"><Meh size={14} className="text-yellow-500 fill-yellow-100" /></div>;
      default: return null;
    }
  };

  const foods = INITIAL_FOODS.map(f => ({ ...f, status: foodStatuses[f.id] || 'none' }));
  const triedCount = foods.filter(f => f.status !== 'none').length;
  const progress = (triedCount / 50) * 100;

  // AI Kitchen State
  const [recipe, setRecipe] = useState<RecipeSuggestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRecipe = async () => {
    setIsGenerating(true);
    
    // Calculate age in months
    const birthDate = new Date(userState.childBirthDate);
    const today = new Date();
    let ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
    if (today.getDate() < birthDate.getDate()) ageMonths--;
    ageMonths = Math.max(0, ageMonths);

    const likedFoods = foods.filter(f => f.status === 'liked').map(f => t(f.name));
    const dislikedFoods = foods.filter(f => f.status === 'disliked').map(f => t(f.name));

    const result = await generateRecipe(ageMonths, likedFoods, dislikedFoods, i18n.language);
    setRecipe(result);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 px-5 pt-6 pb-24 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-sm">
          <Utensils size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-warm-900">{t('gastro_map', { defaultValue: 'Гастро-карта' })}</h2>
          <p className="text-sm text-warm-500">{t('first_discoveries', { defaultValue: 'Перші відкриття' })}</p>
        </div>
      </div>

      <div className="mb-6 flex rounded-[22px] bg-warm-100/90 p-1.5 shadow-inner">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 rounded-[18px] py-3 text-sm font-extrabold transition-colors ${
            activeTab === 'map' ? 'bg-white text-warm-900 shadow-sm' : 'text-warm-500 hover:text-warm-700'
          }`}
        >
          {t('ration')}
        </button>
        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-[18px] py-3 text-sm font-extrabold transition-colors ${
            activeTab === 'kitchen' ? 'bg-white text-warm-900 shadow-sm' : 'text-warm-500 hover:text-warm-700'
          }`}
        >
          <ChefHat size={16} />
          {t('ai_kitchen')}
        </button>
      </div>

      {activeTab === 'map' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          {/* Progress Card */}
          <div className="mb-8 overflow-hidden rounded-[28px] border border-white/60 bg-[linear-gradient(135deg,rgba(240,253,244,0.94),rgba(209,250,229,0.88))] p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-sm font-bold text-green-800">
                <span>{t('gourmet_novice')}</span>
                <span>{triedCount} / 50</span>
            </div>
            <div className="mb-2 h-3 rounded-full bg-white/80 shadow-inner">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${Math.max(progress, 5)}%` }} />
            </div>
            <p className="text-sm leading-relaxed text-green-700/90">{t('try_more_foods')}</p>
          </div>

          {/* Food Grid */}
          <div className="space-y-6">
            <div>
                <h3 className="mb-3 text-lg font-extrabold text-warm-800">{t('veg')}</h3>
                <div className="grid grid-cols-4 gap-4">
                    {foods.filter(f => f.category === 'veg').map(food => (
                        <button 
                            key={food.id} 
                            onClick={() => toggleStatus(food.id)}
                            className={`relative flex aspect-square min-h-[88px] flex-col items-center justify-center gap-1 rounded-[22px] px-1 transition-all ${food.status !== 'none' ? 'border border-white/60 bg-white/78 shadow-sm backdrop-blur-md' : 'border border-transparent bg-warm-100/45 opacity-80 grayscale'}`}
                        >
                            <span className="text-[28px]">{food.emoji}</span>
                            <span className="w-full truncate px-1 text-center text-[11px] font-bold text-warm-600">{t(food.name)}</span>
                            {getStatusIcon(food.status)}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-3 text-lg font-extrabold text-warm-800">{t('fruit')}</h3>
                <div className="grid grid-cols-4 gap-4">
                    {foods.filter(f => f.category === 'fruit').map(food => (
                        <button 
                            key={food.id} 
                            onClick={() => toggleStatus(food.id)}
                            className={`relative flex aspect-square min-h-[88px] flex-col items-center justify-center gap-1 rounded-[22px] px-1 transition-all ${food.status !== 'none' ? 'border border-white/60 bg-white/78 shadow-sm backdrop-blur-md' : 'border border-transparent bg-warm-100/45 opacity-80 grayscale'}`}
                        >
                            <span className="text-[28px]">{food.emoji}</span>
                            <span className="w-full truncate px-1 text-center text-[11px] font-bold text-warm-600">{t(food.name)}</span>
                            {getStatusIcon(food.status)}
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                <h3 className="mb-3 text-lg font-extrabold text-warm-800">{t('grain')}</h3>
                <div className="grid grid-cols-4 gap-4">
                    {foods.filter(f => f.category === 'grain').map(food => (
                        <button 
                            key={food.id} 
                            onClick={() => toggleStatus(food.id)}
                            className={`relative flex aspect-square min-h-[88px] flex-col items-center justify-center gap-1 rounded-[22px] px-1 transition-all ${food.status !== 'none' ? 'border border-white/60 bg-white/78 shadow-sm backdrop-blur-md' : 'border border-transparent bg-warm-100/45 opacity-80 grayscale'}`}
                        >
                            <span className="text-[28px]">{food.emoji}</span>
                            <span className="w-full truncate px-1 text-center text-[11px] font-bold text-warm-600">{t(food.name)}</span>
                            {getStatusIcon(food.status)}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'kitchen' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
          <div className="glass-card rounded-[28px] border border-white/60 p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-orange-100 text-orange-500">
              <ChefHat size={32} />
            </div>
            <h3 className="mb-2 text-2xl font-extrabold text-warm-900">{t('ai_chef')}</h3>
            <p className="mb-6 text-sm leading-relaxed text-warm-600">
              {t('ai_chef_desc')}
            </p>
            
            <button 
              onClick={handleGenerateRecipe}
              disabled={isGenerating}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-orange-400 to-rose-400 px-6 py-3 text-base font-extrabold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {isGenerating ? t('creating_recipe') : t('suggest_recipe')}
            </button>
          </div>

          {recipe && (
            <div className="animate-in fade-in slide-in-from-bottom-4 rounded-[28px] border border-orange-100 bg-white/92 p-6 shadow-lg backdrop-blur-md">
              <h3 className="mb-2 text-2xl font-extrabold text-warm-900">{recipe.title}</h3>
              <div className="mb-6 flex w-fit items-center gap-2 rounded-xl bg-orange-50 px-3 py-1.5 text-sm font-bold text-orange-600">
                <Clock size={16} /> {recipe.prepTime}
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-warm-800 mb-3 flex items-center gap-2">
                  <Utensils size={18} className="text-warm-400" />
                  {t('ingredients')}
                </h4>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-warm-700">
                      <span className="text-orange-400 mt-0.5">•</span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-warm-800 mb-3 flex items-center gap-2">
                  <ChefHat size={18} className="text-warm-400" />
                  {t('instructions')}
                </h4>
                <div className="prose prose-sm prose-warm text-warm-700">
                  {recipe.instructions.split('\n').map((step, i) => (
                    <p key={i} className="mb-2">{step}</p>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <h4 className="font-bold text-green-800 mb-1 text-sm">{t('why_its_good')}</h4>
                <p className="text-sm text-green-700">{recipe.reason}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
