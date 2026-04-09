
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { MONTHS } from '../constants';

interface DateNavigatorProps {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({ currentDate, setCurrentDate }) => {
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    
    return (
      <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 p-1.5 gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
          <div className="flex flex-col items-center justify-center w-28 cursor-pointer group">
              <span className="text-sm font-extrabold text-gray-800 leading-none group-hover:text-purple-600 transition-colors">{MONTHS[currentDate.getMonth()]}</span>
              <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-purple-400 transition-colors">{currentDate.getFullYear()}</span>
                  <ChevronDown className="w-3 h-3 text-gray-300 group-hover:text-purple-400"/>
              </div>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"><ChevronRight className="w-4 h-4"/></button>
      </div>
    );
};
