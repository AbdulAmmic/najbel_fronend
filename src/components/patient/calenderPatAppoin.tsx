import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function CalendarPreview() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const appointmentsByDate = {
    10: { type: "video", count: 1 },
    15: { type: "clinic", count: 2 },
    18: { type: "video", count: 1 },
    25: { type: "clinic", count: 1 },
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay, monthName: date.toLocaleString('default', { month: 'long', year: 'numeric' }) };
  };

  const { daysInMonth, startingDay, monthName } = getDaysInMonth(currentMonth);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Appointment Calendar</h2>
            <p className="text-sm text-gray-600">View your schedule at a glance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-blue-50 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900 min-w-32 text-center">
            {monthName}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-blue-50 transition"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-semibold text-gray-700 bg-gray-50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16 bg-gray-50/50 border-r border-b border-gray-200"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const hasAppointment = appointmentsByDate[day as keyof typeof appointmentsByDate];
            
            return (
              <div
                key={day}
                className={`
                  h-16 border-r border-b border-gray-200 p-2 relative
                  ${hasAppointment ? 'bg-blue-50/50' : 'hover:bg-gray-50'}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className={`
                    text-sm font-medium
                    ${hasAppointment ? 'text-blue-700' : 'text-gray-700'}
                  `}>
                    {day}
                  </span>
                  
                  {hasAppointment && (
                    <div className="flex gap-1 mt-1">
                      <div className="w-6 h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                      {hasAppointment.count > 1 && (
                        <div className="w-4 h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <span className="text-sm text-gray-600">Appointment Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"></div>
          <span className="text-sm text-gray-600">Multiple Appointments</span>
        </div>
      </div>
    </div>
  );
}