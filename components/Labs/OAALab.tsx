import React, { useState } from 'react';
import { getLabById } from '../../constants';
import { TabId } from '../../types';
import { shouldUseLiveMode } from '../../config/env';
import { LabFrame } from '../LabFrame';
import { Map, Compass, Plus, Atom, Calculator, Dna, Code, FlaskConical, Cpu, Globe, Rocket, ArrowRight, ArrowLeft, Send, X, BookOpen, ChevronDown } from 'lucide-react';

// Subject type definition
interface Subject {
  id: string;
  title: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  topics: string[];
}

// Message type for chat
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUBJECTS: Subject[] = [
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
  const lab = getLabById(TabId.OAA);
  
  // State for subject selection and chat
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
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

  // Handle subject selection
  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setMessages([
      {
        role: 'assistant',
        content: `Welcome to ${subject.title}! 🎓\n\nI'm your AI tutor for ${subject.title}. I'm here to help you learn through:\n• Clear explanations\n• Step-by-step problem solving\n• Answering your questions\n• Exploring concepts deeply\n\nTopics I can help with: ${subject.topics.join(', ')}.\n\nWhat would you like to learn about today?`,
      },
    ]);
    setInput('');
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || !selectedSubject) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // TODO: Replace with real API call to OAA backend
      // For now, simulate tutor response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const tutorResponse: Message = {
        role: 'assistant',
        content: `Great question about ${selectedSubject.title}!\n\nYour question: "${userMessage.content}"\n\nThis is a placeholder response. Once you connect the OAA API endpoint, real AI tutoring will happen here.\n\nThe tutor will:\n1. Understand your current level\n2. Provide clear, step-by-step explanations\n3. Ask clarifying questions to ensure understanding\n4. Guide you through problem-solving\n5. Adapt to your learning pace\n\nTo wire the real API, update the handleSendMessage function to call your OAA backend.`,
      };

      setMessages((prev) => [...prev, tutorResponse]);
    } catch {
      const errorMessage: Message = {
        role: 'assistant',
        content: '⚠️ Unable to reach the tutor service. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle going back to subject selection
  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setMessages([]);
    setInput('');
  };

  // If a subject is selected, show the tutor interface
  if (selectedSubject) {
    const Icon = selectedSubject.icon;
    
    return (
      <div className="h-full flex flex-col lg:flex-row bg-stone-50">
        {/* Mobile Header - Shows current subject with toggle */}
        <div className="lg:hidden bg-white border-b border-stone-200 px-3 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackToSubjects}
              className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`w-9 h-9 ${selectedSubject.bg} ${selectedSubject.color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">{selectedSubject.title}</h3>
              <p className="text-[10px] text-stone-500">AI Tutor</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <BookOpen className="w-5 h-5" />
          </button>
        </div>

        {/* Left Sidebar - Subject Info & Navigation (Desktop always visible, Mobile slide-down) */}
        <div className={`
          ${isMobileSidebarOpen ? 'block' : 'hidden'} lg:block
          lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-stone-200 
          flex flex-col
          lg:flex-shrink-0
          max-h-[40vh] lg:max-h-none overflow-y-auto lg:overflow-visible
        `}>
          {/* Back Button - Desktop only */}
          <div className="hidden lg:block p-4 border-b border-stone-100">
            <button
              onClick={handleBackToSubjects}
              className="flex items-center space-x-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Subjects</span>
            </button>
          </div>
          
          {/* Current Subject - Desktop only */}
          <div className="hidden lg:block p-6 border-b border-stone-100">
            <div className={`w-14 h-14 ${selectedSubject.bg} ${selectedSubject.color} rounded-xl flex items-center justify-center mb-4`}>
              <Icon className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-stone-900">{selectedSubject.title}</h2>
            <p className="text-sm text-stone-500 mt-1">AI Tutor Session</p>
          </div>
          
          {/* Topics */}
          <div className="flex-1 overflow-y-auto p-3 lg:p-4">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 lg:mb-3">Quick Topics</h3>
            <div className="flex flex-wrap lg:flex-col gap-2 lg:space-y-2 lg:gap-0">
              {selectedSubject.topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setInput(`Tell me about ${topic}`);
                    setIsMobileSidebarOpen(false);
                  }}
                  className="text-left px-3 py-2 text-xs lg:text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 rounded-lg transition-colors border border-stone-100 lg:border-0 lg:w-full"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
          
          {/* Session Info - Desktop only */}
          <div className="hidden lg:block p-4 border-t border-stone-100">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-stone-500">AI Tutor Ready</span>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Chat Interface */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Header - Desktop only */}
          <div className="hidden lg:flex bg-white border-b border-stone-200 px-6 py-4 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${selectedSubject.bg} ${selectedSubject.color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">{selectedSubject.title} Tutor</h3>
                <p className="text-xs text-stone-500">Ask anything • Learn at your pace</p>
              </div>
            </div>
            <button
              onClick={handleBackToSubjects}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              title="End Session"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 lg:space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] lg:max-w-2xl rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                    message.role === 'user'
                      ? `${selectedSubject.bg} ${selectedSubject.color.replace('text-', 'bg-').replace('-600', '-600')} text-white`
                      : 'bg-white border border-stone-200 text-stone-800'
                  }`}
                  style={message.role === 'user' ? { backgroundColor: getSubjectBgColor(selectedSubject.id) } : {}}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 rounded-2xl px-3 py-2 sm:px-4 sm:py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs sm:text-sm text-stone-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="bg-white border-t border-stone-200 p-3 sm:p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex space-x-2 sm:space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={`Ask about ${selectedSubject.title}...`}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent disabled:bg-stone-50 disabled:text-stone-400 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-medium transition-colors flex items-center space-x-1 sm:space-x-2 ${
                    input.trim() && !isLoading
                      ? 'bg-stone-900 text-white hover:bg-stone-800'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-stone-400 mt-2 text-center hidden sm:block">
                Press Enter to send • Learning is non-linear; follow curiosity
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Subject selection view (default)
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-stone-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 border-b border-stone-200 pb-6 sm:pb-8">
          <div className="space-y-2 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-stone-900 leading-tight">
              OAA Learning Hub
            </h1>
            <p className="text-stone-500 text-sm sm:text-base lg:text-lg font-light max-w-2xl">
              Click a subject to start your learning session with an AI tutor. Learning here is non-linear; follow curiosity, not a syllabus.
            </p>
          </div>
           {/* Global Actions */}
           <div className="flex space-x-2 sm:space-x-3">
             <button className="flex items-center space-x-1.5 sm:space-x-2 bg-white border border-stone-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:border-stone-300 hover:bg-stone-50 transition-colors shadow-sm text-stone-600">
                <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Knowledge Graph</span>
                <span className="sm:hidden">Graph</span>
             </button>
             <button className="flex items-center space-x-1.5 sm:space-x-2 bg-stone-900 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-stone-800 transition-colors shadow-sm">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">New Inquiry</span>
                <span className="sm:hidden">New</span>
             </button>
           </div>
        </div>

        {/* STEM Domains Grid */}
        <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-stone-900 flex items-center">
                    <Compass className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-stone-400" />
                    STEM Domains
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 hidden sm:block">Click a subject to start learning</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {SUBJECTS.map((subject) => {
                    const Icon = subject.icon;
                    return (
                        <button
                            key={subject.id}
                            onClick={() => handleSubjectSelect(subject)}
                            className={`group bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border ${subject.border} shadow-sm hover:shadow-lg transition-all cursor-pointer hover:border-opacity-100 border-opacity-60 flex flex-col h-full text-left active:scale-[0.98] sm:hover:scale-[1.02]`}
                        >
                            <div className="flex justify-between items-start mb-2 sm:mb-4">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${subject.bg} ${subject.color} rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                                    <ArrowRight className={`w-5 h-5 ${subject.color}`} />
                                </div>
                            </div>
                            
                            <h3 className="font-bold text-stone-800 text-sm sm:text-base lg:text-lg mb-1 sm:mb-3 group-hover:text-stone-900">{subject.title}</h3>
                            
                            {/* Topics - Hidden on very small screens, show 2 on mobile, all on larger */}
                            <div className="space-y-1 sm:space-y-2 mt-auto hidden sm:block">
                                {subject.topics.slice(0, 2).map(topic => (
                                    <div key={topic} className="text-xs sm:text-sm text-stone-500 group-hover:text-stone-600 flex items-center transition-colors">
                                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-stone-200 rounded-full mr-1.5 sm:mr-2 group-hover:bg-stone-400"></span>
                                        <span className="truncate">{topic}</span>
                                    </div>
                                ))}
                                {/* Show remaining topics on lg+ */}
                                {subject.topics.slice(2).map(topic => (
                                    <div key={topic} className="text-sm text-stone-500 group-hover:text-stone-600 items-center transition-colors hidden lg:flex">
                                        <span className="w-1.5 h-1.5 bg-stone-200 rounded-full mr-2 group-hover:bg-stone-400"></span>
                                        {topic}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Mobile: Show topic count */}
                            <p className="text-[10px] text-stone-400 mt-1 sm:hidden">
                              {subject.topics.length} topics
                            </p>
                            
                            {/* Hover hint - Desktop only */}
                            <div className="mt-4 pt-4 border-t border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block">
                                <span className={`text-xs font-medium ${subject.color}`}>
                                    Click to start learning →
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
        
        {/* Footer Motivation */}
        <div className="text-center py-6 sm:py-8 lg:py-10 border-t border-stone-200 mt-4 sm:mt-6 lg:mt-8">
            <p className="font-serif italic text-stone-400 text-sm sm:text-base lg:text-lg">"We heal as we walk. We learn as we build."</p>
        </div>

      </div>
    </div>
  );
};

// Helper function to get subject background color for user messages
function getSubjectBgColor(subjectId: string): string {
  const colors: Record<string, string> = {
    math: '#2563eb',      // blue-600
    physics: '#7c3aed',   // violet-600
    cs: '#059669',        // emerald-600
    bio: '#e11d48',       // rose-600
    chem: '#d97706',      // amber-600
    eng: '#475569',       // slate-600
    astro: '#4f46e5',     // indigo-600
    earth: '#0d9488',     // teal-600
  };
  return colors[subjectId] || '#1f2937';
}