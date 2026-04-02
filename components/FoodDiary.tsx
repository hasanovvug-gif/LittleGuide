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
    <div className="px-6 pt-8 pb-24 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-orange-100 p-2 rounded-full text-orange-600">
          <Utensils size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-warm-900">{t('gastro_map', { defaultValue: 'Гастро-карта' })}</h2>
          <p className="text-sm text-warm-500">{t('first_discoveries', { defaultValue: 'Перші відкриття' })}</p>
        </div>
      </div>

      <div className="flex bg-warm-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'map' ? 'bg-white text-warm-900 shadow-sm' : 'text-warm-500 hover:text-warm-700'
          }`}
        >
          {t('ration')}
        </button>
        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
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
          <div className="bg-gradient-to-r from-green-50/70 to-emerald-50/70 backdrop-blur-md rounded-2xl p-5 border border-white/50 mb-8 shadow-sm">
            <div className="flex justify-between text-sm font-semibold text-green-800 mb-2">
                <span>{t('gourmet_novice')}</span>
                <span>{triedCount} / 50</span>
            </div>
            <div className="h-3 bg-white/80 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${Math.max(progress, 5)}%` }} />
            </div>
            <p className="text-xs text-green-700 mt-2 opacity-80">{t('try_more_foods')}</p>
          </div>

          {/* Food Grid */}
          <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-warm-800 mb-3">{t('veg')}</h3>
                <div className="grid grid-cols-4 gap-4">
                    {foods.filter(f => f.category === 'veg').map(food => (
                        <button 
                            key={food.id} 
                            onClick={() => toggleStatus(food.id)}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all relative ${food.status !== 'none' ? 'bg-white/70 backdrop-blur-md shadow-sm border border-white/50' : 'bg-warm-100/40 backdrop-blur-sm border border-transparent opacity-70 grayscale'}`}
                        >
                            <span className="text-2xl">{food.emoji}</span>
                            <span className="text-[10px] font-medium text-warm-600 truncate w-full text-center px-1">{t(food.name)}</span>
                            {getStatusIcon(food.status)}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-warm-800 mb-3">{t('fruit')}</h3>
                <div className="grid grid-cols-4 gap-4">
                    {foods.filter(f => f.category === 'fruit').map(food => (
                        <button 
                            key={food.id} 
                            onClick={() => toggleStatus(food.id)}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all relative ${food.status !== 'none' ? 'bg-white/70 backdrop-blur-md shadow-sm border border-white/50' : 'bg-warm-100/40 backdrop-blur-sm border border-transparent opacity-70 grayscale'}`}
                        >
                            <span className="text-2xl">{food.emoji}</span>
                            <span className="text-[10px] font-medium text-warm-600 truncate w-full text-center px-1">{t(food.name)}</span>
                            {getStatusIcon(food.status)}
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-bold text-warm-800 mb-3">{t('grain')}</h3>
                <div className="grid grid-cols-4 gap-4">
                    {foods.filter(f => f.category === 'grain').map(food => (
                        <button 
                            key={food.id} 
                            onClick={() => toggleStatus(food.id)}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all relative ${food.status !== 'none' ? 'bg-white/70 backdrop-blur-md shadow-sm border border-white/50' : 'bg-warm-100/40 backdrop-blur-sm border border-transparent opacity-70 grayscale'}`}
                        >
                            <span className="text-2xl">{food.emoji}</span>
                            <span className="text-[10px] font-medium text-warm-600 truncate w-full text-center px-1">{t(food.name)}</span>
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
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/50 text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
              <ChefHat size={32} />
            </div>
            <h3 className="text-xl font-bold text-warm-900 mb-2">{t('ai_chef')}</h3>
            <p className="text-sm text-warm-600 mb-6">
              {t('ai_chef_desc')}
            </p>
            
            <button 
              onClick={handleGenerateRecipe}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-orange-400 to-rose-400 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {isGenerating ? t('creating_recipe') : t('suggest_recipe')}
            </button>
          </div>

          {recipe && (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-orange-100 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-2xl font-bold text-warm-900 mb-2">{recipe.title}</h3>
              <div className="flex items-center gap-2 text-sm text-orange-600 font-medium mb-6 bg-orange-50 w-fit px-3 py-1 rounded-lg">
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