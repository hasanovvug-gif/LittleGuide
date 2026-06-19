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
    <div className="mt-4 space-y-4 px-5 sm:px-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-[24px] border border-white/60 p-3.5 text-center shadow-sm">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                <Calendar size={18} />
              </div>
              <span className="block text-[11px] font-extrabold leading-tight text-warm-900">
                  {months > 0 ? `${months} ${t('months_short')} ` : ''}{days} {t('days_short')}
              </span>
          </div>
          <div className="glass-card rounded-[24px] border border-white/60 p-3.5 text-center shadow-sm">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <Flame size={18} />
              </div>
              <span className="block text-[11px] font-extrabold leading-tight text-warm-900">
                  {userState.streakCount || 0} {t('days_streak')}
              </span>
          </div>
          <div className="glass-card rounded-[24px] border border-white/60 p-3.5 text-center shadow-sm">
              <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl ${isStormy ? 'bg-indigo-50 text-indigo-500' : 'bg-yellow-50 text-yellow-500'}`}>
                {isStormy ? <CloudLightning size={18} /> : <Sun size={18} />}
              </div>
              <span className="block text-[11px] font-extrabold leading-tight text-warm-900">
                  {isStormy ? t('leap_storm') : t('leap_sunny')}
              </span>
          </div>
      </div>

      {/* Milestone Alert */}
      <div className="overflow-hidden rounded-[28px] border border-white/60 bg-[linear-gradient(135deg,rgba(254,243,199,0.92),rgba(255,237,213,0.92))] p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-orange-500 shadow-sm">
              <Target size={20} />
          </div>
          <div className="min-w-0">
              <div className="mb-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-500">Фокус дня</div>
              <h4 className="text-base font-extrabold text-orange-900">{milestone.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-orange-800">{milestone.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
