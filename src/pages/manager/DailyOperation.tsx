import { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, RefreshCw, Coffee, Thermometer, Wrench, Plus, } from 'lucide-react';
export function DailyOperations() {
    const [tasks, setTasks] = useState([
        { id: 1, title: 'Opening store checklist', category: 'Opening', done: true, priority: 'high', assignee: 'Mia J.' },
        { id: 2, title: 'Check milk & perishable stock', category: 'Inventory', done: true, priority: 'high', assignee: 'Anna N.' },
        { id: 3, title: 'Clean espresso machines', category: 'Cleaning', done: false, priority: 'high', assignee: 'James P.' },
        { id: 4, title: 'Restock cups and lids', category: 'Inventory', done: false, priority: 'medium', assignee: 'Lena T.' },
        { id: 5, title: 'Staff briefing — new seasonal menu', category: 'Training', done: false, priority: 'medium', assignee: 'Michael C.' },
        { id: 6, title: 'Deep clean counter & tables', category: 'Cleaning', done: false, priority: 'low', assignee: 'David K.' },
        { id: 7, title: 'Submit daily revenue report', category: 'Reporting', done: false, priority: 'high', assignee: 'Michael C.' },
        { id: 8, title: 'Check temperature logs', category: 'Compliance', done: true, priority: 'high', assignee: 'Mia J.' },
    ]);
    const toggleTask = (id) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    };
    const priorityColor = {
        high: 'bg-red-100 text-red-700',
        medium: 'bg-yellow-100 text-yellow-700',
        low: 'bg-green-100 text-green-700',
    };
    const equipment = [
        { name: 'Espresso Machine #1', status: 'Operational', lastCheck: '09:00 AM', temp: '92°C' },
        { name: 'Espresso Machine #2', status: 'Maintenance Due', lastCheck: '08:30 AM', temp: '91°C' },
        { name: 'Grinder #1', status: 'Operational', lastCheck: '09:00 AM', temp: '—' },
        { name: 'Refrigerator #1', status: 'Operational', lastCheck: '08:00 AM', temp: '4°C' },
        { name: 'POS Terminal', status: 'Operational', lastCheck: '09:00 AM', temp: '—' },
    ];
    const incidents = [
        {
            time: '10:32 AM',
            type: 'Spill',
            description: 'Coffee spill at counter area — cleaned immediately',
            severity: 'low',
            reporter: 'Anna N.',
        },
        {
            time: '08:45 AM',
            type: 'Equipment',
            description: 'Machine #2 showed maintenance alert on startup',
            severity: 'medium',
            reporter: 'James P.',
        },
    ];
    const completedCount = tasks.filter((t) => t.done).length;
    const progress = Math.round((completedCount / tasks.length) * 100);
    return (<div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Operations</h1>
        <p className="text-gray-600 mt-1">Riverside Brew #08 — March 9, 2026</p>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Daily Task Progress</h3>
            <span className="text-sm font-medium text-gray-600">{completedCount}/{tasks.length} completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div className="bg-amber-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}/>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-gray-500">Done</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{tasks.length - completedCount}</p>
              <p className="text-xs text-gray-500">Remaining</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{progress}%</p>
              <p className="text-xs text-gray-500">Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-600 text-white rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <Coffee className="w-8 h-8 mb-2"/>
            <h3 className="font-semibold text-lg">Store Status</h3>
            <p className="text-amber-100 text-sm mt-1">Currently Open</p>
          </div>
          <div className="mt-4 space-y-1 text-sm text-amber-100">
            <p>Opens: 07:00 AM</p>
            <p>Closes: 10:00 PM</p>
            <p>Shift: Morning</p>
          </div>
        </div>
      </div>

      {/* Task Checklist */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Task Checklist</h3>
          <button className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium">
            <Plus className="w-4 h-4"/>
            Add Task
          </button>
        </div>
        <div className="space-y-3">
          {tasks.map((task) => (<div key={task.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${task.done ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-gray-200 hover:border-amber-300'}`}>
              <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-amber-500'}`}>
                {task.done && <CheckCircle className="w-3 h-3 text-white"/>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {task.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Assigned to: {task.assignee}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {task.category}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
            </div>))}
        </div>
      </div>

      {/* Equipment Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Equipment Status</h3>
          <button className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium">
            <RefreshCw className="w-4 h-4"/>
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Equipment</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Last Check</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Temp / Info</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((eq) => (<tr key={eq.name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-gray-400"/>
                    {eq.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${eq.status === 'Operational'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'}`}>
                      {eq.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400"/>
                    {eq.lastCheck}
                  </td>
                  <td className="py-3 px-4 text-gray-600 flex items-center gap-1">
                    {eq.temp !== '—' && <Thermometer className="w-3.5 h-3.5 text-gray-400"/>}
                    {eq.temp}
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Log</h3>
        {incidents.length === 0 ? (<p className="text-sm text-gray-500 text-center py-6">No incidents reported today.</p>) : (<div className="space-y-3">
            {incidents.map((inc) => (<div key={inc.time} className={`p-4 rounded-lg border-l-4 ${inc.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-300'}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${inc.severity === 'medium' ? 'text-yellow-600' : 'text-gray-500'}`}/>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{inc.type}</span>
                      <span className="text-xs text-gray-500">{inc.time}</span>
                      <span className="text-xs text-gray-400">— {inc.reporter}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{inc.description}</p>
                  </div>
                </div>
              </div>))}
          </div>)}
      </div>
    </div>);
}
