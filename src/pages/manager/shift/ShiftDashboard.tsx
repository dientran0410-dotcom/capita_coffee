import React, { useEffect, useState } from 'react';
import {
    Users, CalendarCheck, Clock, AlertCircle, Building2, TrendingUp,
    Percent, UserCheck, AlertTriangle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { http } from '../../../utils/axiosClient';
import { getLoggedInBranchId } from '../../../utils/branch';

async function getDashboardOverview(date) {
    return http(`/attendance-reports/dashboard?date=${date}`);
}

const CURRENT_BRANCH_ID = getLoggedInBranchId() || "N/A";
const CURRENT_BRANCH_NAME = "Manager Branch";

const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function ShiftDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [dashboardData, setDashboardData] = useState({
        totalShifts: 0,
        staffOnDuty: 0,
        coverageRate: "0%",
        pendingCheckIns: 0,
        absentStaff: 0,
        timeline: []
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const today = getTodayDate();
            const data = await getDashboardOverview(today);
            setDashboardData(data);
        } catch (error) {
            console.error("Error loading Dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const kpiStats = [
        { title: "Total Shifts", value: dashboardData.totalShifts, icon: <CalendarCheck size={24} className="text-blue-600" />, bg: "bg-blue-50", text: "text-blue-700" },
        { title: "Staff on Duty", value: dashboardData.staffOnDuty, icon: <UserCheck size={24} className="text-emerald-600" />, bg: "bg-emerald-50", text: "text-emerald-700" },
        { title: "Coverage Rate", value: dashboardData.coverageRate, icon: <Percent size={24} className="text-indigo-600" />, bg: "bg-indigo-50", text: "text-indigo-700" },
        { title: "Pending Check-ins", value: dashboardData.pendingCheckIns, icon: <Clock size={24} className="text-amber-600" />, bg: "bg-amber-50", text: "text-amber-700" },
        { title: "Absent Staff", value: dashboardData.absentStaff, icon: <AlertTriangle size={24} className="text-red-600" />, bg: "bg-red-50", text: "text-red-700" },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                <RefreshCw size={40} className="animate-spin text-amber-500" />
                <p className="text-gray-500 font-medium">Synchronizing branch data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* WELCOME BANNER */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            Dashboard <span className="text-slate-400 text-xl font-medium">| Franchise Manager</span>
                        </h1>
                        <p className="text-slate-300 flex items-center gap-2">
                            <Building2 size={16} className="text-amber-500"/>
                            Current Branch: <strong className="text-white bg-slate-700/50 px-3 py-1 rounded text-sm tracking-wide">{CURRENT_BRANCH_NAME} ({CURRENT_BRANCH_ID})</strong>
                        </p>
                    </div>
                    <div>
                        <button onClick={() => navigate('/manager/shifts/create')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-lg transition-all shadow-md flex items-center gap-2">
                            <CalendarCheck size={20}/>
                            Plan New Shift
                        </button>
                    </div>
                </div>
                <TrendingUp size={160} className="absolute -right-10 -bottom-10 text-white opacity-5" />
            </div>

            {/* LAYER 1: KPI */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600"/> Today's Overview
                    </h2>
                    <button onClick={loadData} className="text-sm font-bold text-gray-500 flex items-center gap-1.5 hover:text-amber-600 transition-colors">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {kpiStats.map((stat, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                            <div className={`p-3 rounded-full mb-3 ${stat.bg}`}>
                                {stat.icon}
                            </div>
                            <h3 className={`text-2xl font-extrabold ${stat.text}`}>{stat.value}</h3>
                            <p className="text-xs font-semibold text-gray-500 uppercase mt-1 tracking-wider">{stat.title}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* LAYER 2: TIMELINE */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Clock size={20} className="text-amber-500"/> Interactive Shift Timeline
                </h2>

                <div className="relative border-l-2 border-gray-100 ml-3 md:ml-6 space-y-8">
                    {dashboardData.timeline.length === 0 ? (
                        <div className="pl-6 md:pl-10 text-gray-400 font-medium py-10 flex flex-col items-center">
                            <AlertCircle size={40} className="mb-2 opacity-50"/>
                            No shifts scheduled for today.
                        </div>
                    ) : (
                        dashboardData.timeline.map((shift, idx) => (
                            <div key={shift.id || idx} className="relative pl-6 md:pl-10">
                                <span className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full ring-4 ring-white ${shift.status === 'FULL' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                                    <div className="w-40 shrink-0">
                                        <span className="text-lg font-bold text-slate-800 tracking-tight">{shift.time}</span>
                                        <p className="text-sm font-medium text-gray-500">{shift.shiftName}</p>
                                    </div>
                                    <div
                                        className={`flex-1 flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${shift.status === 'FULL' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-amber-50/30 border-amber-100'}`}
                                        onClick={() => navigate(`/manager/attendance/${shift.id}`)}
                                        title="Click to go to attendance page"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${shift.status === 'FULL' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{shift.branchId}</p>
                                                <p className="text-sm text-gray-600 mt-0.5">
                                                    Present / Assigned: <strong className={shift.status === 'FULL' ? 'text-emerald-700' : 'text-amber-700'}>
                                                    {shift.presentStaff} / {shift.assignedStaff}
                                                </strong>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {shift.status === 'FULL' ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full text-sm font-bold">
                                                    <CheckCircle2 size={16} /> Fully Staffed
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full text-sm font-bold">
                                                    <AlertCircle size={16} /> Short {shift.assignedStaff - shift.presentStaff}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

