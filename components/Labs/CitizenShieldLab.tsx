import React from 'react';
import { MOCK_ALERTS, getLabById } from '../../constants';
import { TabId } from '../../types';
import { shouldUseLiveMode } from '../../config/env';
import { LabFrame } from '../LabFrame';
import { Shield, CheckCircle, Wifi, Lock, Eye, AlertOctagon } from 'lucide-react';

export const CitizenShieldLab: React.FC = () => {
  const lab = getLabById(TabId.SHIELD);
  
  // If live mode is enabled and URL exists, show iframe
  if (lab && shouldUseLiveMode(lab.url)) {
    return (
      <LabFrame 
        url={lab.url!} 
        title={lab.name}
        description={lab.description}
      />
    );
  }

  // Otherwise show demo UI
  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 text-slate-900">
        <div className="max-w-5xl mx-auto">
            
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-10 gap-4 sm:gap-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg text-emerald-700">
                        <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Citizen Shield</h1>
                        <p className="text-slate-500 text-xs sm:text-sm">Civic Layer Active • Secure</p>
                    </div>
                </div>
                <div className="text-left sm:text-right flex sm:block items-center gap-2">
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-600">98%</div>
                    <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">Resilience Score</div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                
                {/* Modules */}
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-md">
                            <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Digital Hygiene</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">2FA active on all accounts. VPN active.</p>
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-purple-50 text-purple-600 rounded-md">
                            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Privacy Literacy</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">3 trackers blocked today.</p>
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-orange-50 text-orange-600 rounded-md">
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                         <AlertOctagon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Civic Resilience</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Alert: Local mesh node offline.</p>
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700 text-sm sm:text-base">Active Signals</h3>
                    <button className="text-[10px] sm:text-xs font-medium text-indigo-600 hover:text-indigo-800">Scan Now</button>
                </div>
                <div className="divide-y divide-slate-100">
                    {MOCK_ALERTS.map((alert) => (
                        <div key={alert.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-slate-50 transition-colors gap-3">
                            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.level === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-slate-800 truncate">{alert.message}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-400">Source: {alert.source}</p>
                                </div>
                            </div>
                            <button className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs border border-slate-300 rounded hover:bg-white hover:border-slate-400 transition-colors flex-shrink-0">
                                Review
                            </button>
                        </div>
                    ))}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-slate-400 italic">
                        No critical threats detected. System nominal.
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};