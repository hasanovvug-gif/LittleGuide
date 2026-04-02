import React from 'react';
import { UserState } from '../types';
import { useTranslation } from 'react-i18next';
import { Target, Flame, Calendar, CloudLightning, Sun } from 'lucide-react';

export const DashboardSummary: React.FC<{ userState: UserState }> = ({ userState }) => {
  const { t } = useTranslation();
  
  // Calculate exact age
  const birthDate = new Date(userState.childBirthDate);
  const today = new Date();
  
  let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months -= birthDate.getMonth();
  months += today.getMonth();
  
  let days = today.getDate() - birthDate.getDate();
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  months = Math.max(0, months);
  
  // Determine leap status (mock logic based on weeks)
  const ageInWeeks = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
  const isStormy = [5, 8, 12, 19, 26, 37, 46, 55, 64, 75].includes(ageInWeeks); // Typical leap weeks

  // Milestone logic
  let milestone = { title: '', desc: '' };
  if (months < 1) {
    milestone = { title: t('ms_1_month_title'), desc: t('ms_1_month_desc') };
  } else if (months < 6) {
    milestone = { title: t('ms_6_months_title'), desc: t('ms_6_months_desc') };
  } else if (months < 12) {
    milestone = { title: t('ms_12_months_title'), desc: t('ms_12_months_desc') };
  } else {
    milestone = { title: t('ms_toddler_title'), desc: t('ms_toddler_desc') };
  }

  return (
    <div className="px-6 mt-4 space-y-4">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center justify-center border border-white/50 shadow-sm text-center">
              <Calendar size={20} className="text-blue-500 mb-1" />
              <span className="text-[10px] font-bold text-warm-900 leading-tight">
                  {months > 0 ? `${months} ${t('months_short')} ` : ''}{days} {t('days_short')}
              </span>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center justify-center border border-white/50 shadow-sm text-center">
              <Flame size={20} className="text-orange-500 mb-1" />
              <span className="text-[10px] font-bold text-warm-900 leading-tight">
                  {userState.streakCount || 0} {t('days_streak')}
              </span>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center justify-center border border-white/50 shadow-sm text-center">
              {isStormy ? <CloudLightning size={20} className="text-indigo-500 mb-1" /> : <Sun size={20} className="text-yellow-500 mb-1" />}
              <span className="text-[10px] font-bold text-warm-900 leading-tight">
                  {isStormy ? t('leap_storm') : t('leap_sunny')}
              </span>
          </div>
      </div>

      {/* Milestone Alert */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-4 border border-white/50 shadow-sm flex items-start gap-3">
          <div className="bg-white/80 p-2 rounded-full text-orange-500 shrink-0">
              <Target size={20} />
          </div>
          <div>
              <h4 className="font-bold text-orange-900 text-sm">{milestone.title}</h4>
              <p className="text-xs text-orange-800 mt-1 leading-relaxed">{milestone.desc}</p>
          </div>
      </div>
    </div>
  );
};
