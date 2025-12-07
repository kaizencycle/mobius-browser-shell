import React, { useState } from 'react';
import { Sparkles, ArrowRight, Command } from 'lucide-react';

export const Omnibar: React.FC = () => {
  const [focused, setFocused] = useState(false);
  const [input, setInput] = useState('');

  return (
    <div className={`relative flex items-center w-full max-w-3xl mx-auto transition-all duration-300 ease-out ${focused ? 'scale-105' : ''}`}>
      <div className={`absolute inset-0 bg-white rounded-xl shadow-sm border transition-colors duration-300 ${focused ? 'border-indigo-300 shadow-md ring-2 ring-indigo-50/50' : 'border-stone-200'}`} />
      
      <div className="relative z-10 flex items-center w-full px-4 py-3">
        <Sparkles className={`w-5 h-5 mr-3 transition-colors ${focused ? 'text-indigo-500' : 'text-stone-400'}`} />
        
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask / Explore / Build / Reflect..."
          className="flex-1 bg-transparent border-none outline-none text-stone-800 placeholder-stone-400 font-medium text-lg"
        />
        
        <div className="flex items-center space-x-2 text-stone-400">
          {!input && (
            <div className="hidden sm:flex items-center text-xs font-mono bg-stone-100 px-2 py-1 rounded border border-stone-200">
              <Command className="w-3 h-3 mr-1" /> K
            </div>
          )}
          {input && (
            <button className="p-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};