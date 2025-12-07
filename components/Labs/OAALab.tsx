import React from 'react';
import { MOCK_THREADS } from '../../constants';
import { Map, Compass, Play, Plus, Share2, Atom, Calculator, Dna, Code, FlaskConical, Cpu, Globe, Rocket, ArrowRight } from 'lucide-react';

const SUBJECTS = [
    { id: 'math', title: 'Mathematics', icon: Calculator, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', topics: ['Calculus', 'Linear Algebra', 'Statistics & Probability', 'Topology'] },
    { id: 'physics', title: 'Physics', icon: Atom, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', topics: ['Classical Mechanics', 'Quantum Mechanics', 'Thermodynamics', 'Relativity'] },
    { id: 'cs', title: 'Computer Science', icon: Code, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', topics: ['Algorithms & Data Structures', 'Systems Architecture', 'Artificial Intelligence', 'Cybersecurity'] },
    { id: 'bio', title: 'Biology', icon: Dna, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', topics: ['Genetics', 'Neuroscience', 'Ecology', 'Cellular Biology'] },
    { id: 'chem', title: 'Chemistry', icon: FlaskConical, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', topics: ['Organic Chemistry', 'Inorganic Chemistry', 'Material Science', 'Biochemistry'] },
    { id: 'eng', title: 'Engineering', icon: Cpu, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', topics: ['Robotics', 'Electrical Systems', 'Civil Infrastructure', 'Aerospace'] },
    { id: 'astro', title: 'Astronomy', icon: Rocket, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', topics: ['Cosmology', 'Astrophysics', 'Exoplanets', 'Space Exploration'] },
    { id: 'earth', title: 'Earth Science', icon: Globe, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', topics: ['Geology', 'Meteorology', 'Oceanography', 'Climate Science'] },
];

export const OAALab: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-8 bg-stone-50">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-serif text-stone-900 leading-tight">
              OAA Learning Hub
            </h1>
            <p className="text-stone-500 text-lg font-light max-w-2xl">
              Select a domain to begin your inquiry. Learning here is non-linear; follow curiosity, not a syllabus.
            </p>
          </div>
           {/* Global Actions */}
           <div className="flex space-x-3">
             <button className="flex items-center space-x-2 bg-white border border-stone-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:border-stone-300 hover:bg-stone-50 transition-colors shadow-sm text-stone-600">
                <Map className="w-4 h-4" />
                <span>Knowledge Graph</span>
             </button>
             <button className="flex items-center space-x-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors shadow-sm">
                <Plus className="w-4 h-4" />
                <span>New Inquiry</span>
             </button>
           </div>
        </div>

        {/* Active Context Banner */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-indigo-200 transition-colors cursor-pointer">
             <div className="flex-1">
                 <div className="flex items-center space-x-2 text-xs font-bold tracking-wider uppercase text-indigo-600 mb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                    <span>Resume Learning</span>
                 </div>
                 <h3 className="text-xl font-serif text-stone-900 font-medium group-hover:text-indigo-700 transition-colors">Thermodynamics & Information Theory</h3>
                 <div className="flex items-center space-x-4 text-sm text-stone-500 mt-1">
                     <span>Physics Module 4.2</span>
                     <span className="text-stone-300">•</span>
                     <span>Last active 2 hours ago</span>
                 </div>
                 {/* Progress Bar */}
                 <div className="h-1.5 w-full max-w-md bg-stone-100 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-indigo-500 w-[45%]" />
                 </div>
             </div>
             <button className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-6 py-3 rounded-xl font-medium hover:bg-indigo-100 transition-colors whitespace-nowrap">
                <Play className="w-4 h-4 fill-current" />
                <span>Continue</span>
             </button>
        </div>

        {/* STEM Domains Grid */}
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-stone-900 flex items-center">
                    <Compass className="w-5 h-5 mr-2 text-stone-400" />
                    STEM Domains
                </h2>
                <button className="text-sm text-stone-500 hover:text-stone-800 flex items-center">
                    View All Subjects <ArrowRight className="w-4 h-4 ml-1" />
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {SUBJECTS.map((subject) => {
                    const Icon = subject.icon;
                    return (
                        <div key={subject.id} className={`group bg-white p-6 rounded-2xl border ${subject.border} shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-opacity-100 border-opacity-60 flex flex-col h-full`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 ${subject.bg} ${subject.color} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className={`w-5 h-5 ${subject.color}`} />
                                </div>
                            </div>
                            
                            <h3 className="font-bold text-stone-800 text-lg mb-3">{subject.title}</h3>
                            
                            <div className="space-y-2 mt-auto">
                                {subject.topics.map(topic => (
                                    <div key={topic} className="text-sm text-stone-500 hover:text-stone-900 flex items-center transition-colors">
                                        <span className="w-1.5 h-1.5 bg-stone-200 rounded-full mr-2 group-hover:bg-stone-300"></span>
                                        {topic}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        
        {/* Footer Motivation */}
        <div className="text-center py-10 border-t border-stone-200 mt-8">
            <p className="font-serif italic text-stone-400 text-lg">"We heal as we walk. We learn as we build."</p>
        </div>

      </div>
    </div>
  );
};