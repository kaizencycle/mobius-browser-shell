import React from 'react';
import { MOCK_THREADS } from '../../constants';
import { Map, Compass, Play, Plus, Share2 } from 'lucide-react';

export const OAALab: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-8 bg-stone-50">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Welcome Section */}
        <div className="space-y-4">
          <h1 className="text-4xl font-serif text-stone-900 leading-tight">
            Good morning, Sentinel. <br/>
            <span className="text-stone-400">Where shall we trace curiosity today?</span>
          </h1>
        </div>

        {/* Discovery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Active Thread Card */}
            <div className="col-span-2 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                        Current Focus
                    </div>
                    <button className="text-stone-400 hover:text-indigo-600 transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
                <h3 className="text-2xl font-serif text-stone-800 mb-2">Thermodynamics & Information Theory</h3>
                <p className="text-stone-500 mb-6 line-clamp-2">Exploring the connection between entropy in physical systems and Shannon entropy in communication channels.</p>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="h-2 w-32 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[45%]" />
                        </div>
                        <span className="text-xs text-stone-500 font-mono">45% Depth</span>
                    </div>
                    <button className="flex items-center space-x-2 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium group-hover:bg-indigo-600 transition-colors">
                        <Play className="w-4 h-4 fill-current" />
                        <span>Continue Trail</span>
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 cursor-pointer hover:border-amber-200 transition-colors">
                    <Map className="w-8 h-8 text-amber-600 mb-4" />
                    <h4 className="font-semibold text-stone-800">Open Concept Map</h4>
                    <p className="text-sm text-stone-500 mt-1">Visualize connections between your active threads.</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-stone-200 cursor-pointer hover:border-stone-300 transition-colors flex items-center justify-between group">
                    <div>
                        <h4 className="font-semibold text-stone-800">New Sandbox</h4>
                        <p className="text-sm text-stone-500 mt-1">Build a model to learn.</p>
                    </div>
                    <div className="bg-stone-100 p-2 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <Plus className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>

        {/* Community & Suggested */}
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-stone-900 flex items-center">
                    <Compass className="w-5 h-5 mr-2 text-stone-400" />
                    Suggested Explorations
                </h2>
                <span className="text-xs font-mono text-stone-400">Based on your reflection journal</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-stone-100 hover:border-stone-300 transition-all cursor-pointer">
                        <div className="h-32 bg-stone-200 rounded-lg mb-4 overflow-hidden relative">
                             <img src={`https://picsum.photos/400/200?random=${i + 10}`} alt="Topic" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                             <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-stone-800">
                                {i === 1 ? 'History' : i === 2 ? 'Biotech' : 'Ethics'}
                             </div>
                        </div>
                        <h4 className="font-medium text-stone-800 mb-1">
                            {i === 1 ? 'The Fall of Bronze Age Civilizations' : i === 2 ? 'CRISPR & Civic Responsibility' : 'The Philosophy of Glitch Art'}
                        </h4>
                        <div className="flex items-center text-xs text-stone-500 space-x-2 mt-3">
                            <span>12 Nodes</span>
                            <span>•</span>
                            <span>Community Pulse: High</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};