import React from 'react';
import { MOCK_REFLECTIONS } from '../../constants';
import { Calendar, PenTool, Hash, Lock } from 'lucide-react';

export const ReflectionsLab: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-[#Fdfbf7] p-8"> {/* Paper color */}
        <div className="max-w-4xl mx-auto flex gap-8">
            
            {/* Sidebar / Timeline */}
            <div className="w-64 hidden lg:block">
                <div className="sticky top-8 space-y-8">
                    <button className="w-full bg-stone-900 text-amber-50 py-3 rounded-lg font-serif italic text-lg hover:bg-stone-800 transition-colors shadow-sm flex items-center justify-center space-x-2">
                        <PenTool className="w-4 h-4" />
                        <span>New Entry</span>
                    </button>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Timeline</h3>
                        <div className="border-l-2 border-stone-200 pl-4 space-y-4">
                            <div className="text-sm font-medium text-stone-800 cursor-pointer">Today</div>
                            <div className="text-sm text-stone-500 cursor-pointer hover:text-stone-800">Yesterday</div>
                            <div className="text-sm text-stone-500 cursor-pointer hover:text-stone-800">Last Week</div>
                            <div className="text-sm text-stone-500 cursor-pointer hover:text-stone-800">October 2025</div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Pattern Surface</h3>
                        <p className="text-xs text-stone-600 leading-relaxed italic">
                            "JADE has noticed a recurring theme of 'Systems Thinking' appearing in your entries whenever you engage with the HIVE lab. Consider exploring: <span className="underline decoration-indigo-300 cursor-pointer">Feedback Loops</span>."
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-8">
                
                {/* Header */}
                <div className="border-b border-stone-200 pb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-serif text-stone-900">Reflections</h1>
                        <p className="text-stone-500 mt-2 font-mono text-sm">E.O.M.M. / Private / Local Encryption Active <Lock className="w-3 h-3 inline ml-1"/></p>
                    </div>
                    <div className="flex space-x-2">
                        <span className="px-3 py-1 bg-stone-100 rounded-full text-xs text-stone-600 font-medium">14 Day Streak</span>
                    </div>
                </div>

                {/* Entry List */}
                <div className="space-y-6">
                    {MOCK_REFLECTIONS.map((entry) => (
                        <div key={entry.id} className="group bg-white rounded-none border-l-4 border-stone-200 pl-6 py-4 hover:border-indigo-400 transition-all cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                    <span className="text-stone-400 font-mono text-xs uppercase">{entry.date}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold
                                        ${entry.mood === 'Curious' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}
                                    `}>
                                        {entry.mood}
                                    </span>
                                </div>
                            </div>
                            <p className="text-lg text-stone-800 font-serif leading-relaxed line-clamp-2 group-hover:text-black">
                                {entry.preview}
                            </p>
                            <div className="flex items-center space-x-3 mt-4">
                                {entry.tags.map(tag => (
                                    <span key={tag} className="flex items-center text-xs text-stone-400 group-hover:text-indigo-500 transition-colors">
                                        <Hash className="w-3 h-3 mr-0.5 opacity-50" /> {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Blank State / Prompt */}
                <div className="mt-12 p-8 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-center hover:border-stone-300 transition-colors cursor-pointer bg-stone-50/50">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <Calendar className="w-6 h-6 text-stone-400" />
                    </div>
                    <h3 className="text-lg font-medium text-stone-700">Daily Reflection</h3>
                    <p className="text-stone-500 max-w-sm mt-2 text-sm">
                        What was the most surprising connection you made today?
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};