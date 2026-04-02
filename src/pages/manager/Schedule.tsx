import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Clock, Users } from 'lucide-react';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHIFTS = [
    { id: 'morning', label: 'Morning', time: '07:00 - 15:00', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { id: 'afternoon', label: 'Afternoon', time: '13:00 - 21:00', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'evening', label: 'Evening', time: '17:00 - 22:00', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { id: 'off', label: 'Day Off', time: '—', color: 'bg-gray-100 text-gray-500 border-gray-200' },
];
const initialSchedule = {
    'Anna N.': ['morning', 'morning', 'morning', 'off', 'morning', 'afternoon', 'off'],
    'James P.': ['afternoon', 'afternoon', 'off', 'afternoon', 'afternoon', 'morning', 'morning'],
    'Lena T.': ['off', 'morning', 'afternoon', 'morning', 'off', 'afternoon', 'afternoon'],
    'Kevin Z.': ['off', 'off', 'off', 'off', 'off', 'off', 'off'],
    'Mia J.': ['morning', 'morning', 'morning', 'morning', 'morning', 'off', 'off'],
    'David K.': ['evening', 'off', 'evening', 'evening', 'off', 'evening', 'evening'],
};
export function Schedule() {
    const [weekOffset, setWeekOffset] = useState(0);
    const [schedule] = useState(initialSchedule);
    const weekStart = new Date('2026-03-09');
    weekStart.setDate(weekStart.getDate() + weekOffset * 7);
    const weekLabel = (() => {
        const end = new Date(weekStart);
        end.setDate(end.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    })();
    const getShift = (shiftId) => { var _a; return (_a = SHIFTS.find((s) => s.id === shiftId)) !== null && _a !== void 0 ? _a : SHIFTS[0]; };
    const totalHoursPerPerson = {};
    for (const [name, shifts] of Object.entries(schedule)) {
        const hours = shifts.reduce((acc, s) => {
            if (s === 'morning' || s === 'afternoon')
                return acc + 8;
            if (s === 'evening')
                return acc + 5;
            return acc;
        }, 0);
        totalHoursPerPerson[name] = hours;
    }
    const staffPerDay = DAYS.map((_, di) => Object.values(schedule).filter((shifts) => shifts[di] !== 'off').length);
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Schedule</h1>
          <p className="text-gray-600 mt-1">Riverside Brew #08 — Weekly Roster</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm">
          <Plus className="w-4 h-4"/>
          Add Shift
        </button>
      </div>

      {/* Coverage Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
          <Users className="w-8 h-8 text-amber-600"/>
          <div>
            <p className="text-xs text-gray-500">Total Staff</p>
            <p className="text-xl font-bold text-gray-900">{Object.keys(schedule).length}</p>
          </div>
        </div>
        {SHIFTS.filter((s) => s.id !== 'off').map((shift) => {
            const count = Object.values(schedule).filter((shifts) => shifts[3] === shift.id).length;
            return (<div key={shift.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-600"/>
              <div>
                <p className="text-xs text-gray-500">{shift.label} (Thu)</p>
                <p className="text-xl font-bold text-gray-900">{count} staff</p>
              </div>
            </div>);
        })}
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-amber-600"/>
            <h3 className="text-lg font-semibold text-gray-900">Week of {weekLabel}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset((o) => o - 1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600"/>
            </button>
            <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors font-medium">
              Today
            </button>
            <button onClick={() => setWeekOffset((o) => o + 1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600"/>
            </button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-gray-600 font-medium w-28">Staff</th>
                {SHORT_DAYS.map((day, i) => (<th key={day} className="text-center py-2 px-2 text-gray-600 font-medium">
                    <div>{day}</div>
                    <div className="text-xs text-gray-400 font-normal">{staffPerDay[i]} working</div>
                  </th>))}
                <th className="text-center py-2 px-2 text-gray-600 font-medium">Hrs</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(schedule).map(([name, shifts]) => (<tr key={name} className="border-t border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">{name}</td>
                  {shifts.map((shiftId, di) => {
                const shift = getShift(shiftId);
                const dayLabel = SHORT_DAYS[di];
                return (<td key={dayLabel} className="py-2 px-1 text-center">
                        <div className={`rounded-lg border px-1 py-1.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${shift.color}`} title={shift.time}>
                          {shift.label}
                        </div>
                      </td>);
            })}
                  <td className="py-2 px-2 text-center font-semibold text-gray-700">
                    {totalHoursPerPerson[name]}h
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
          {SHIFTS.map((s) => (<div key={s.id} className="flex items-center gap-2 text-xs text-gray-600">
              <span className={`w-3 h-3 rounded border ${s.color}`}/>
              {s.label}
              {s.id !== 'off' && <span className="text-gray-400">({s.time})</span>}
            </div>))}
        </div>
      </div>
    </div>);
}
