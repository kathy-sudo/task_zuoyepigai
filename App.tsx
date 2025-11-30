import React, { useState, useEffect } from 'react';
import { gradeHomework } from './services/geminiService';
import { GradingResult, HistoryItem } from './types';
import ResultDisplay from './components/ResultDisplay';
import CriteriaCard from './components/CriteriaCard';
import { GraduationCap, History, ChevronRight, Eraser, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('grading_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const handleGrade = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setResult(null); // Clear previous result while loading

    try {
      const data = await gradeHomework(inputText);
      setResult(data);

      const newItem: HistoryItem = {
        ...data,
        id: Date.now().toString(),
        timestamp: Date.now(),
        snippet: inputText.substring(0, 60) + (inputText.length > 60 ? '...' : ''),
      };

      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('grading_history', JSON.stringify(updatedHistory));
    } catch (error) {
      alert("Failed to grade homework. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setResult(item);
    setShowHistoryMobile(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <GraduationCap size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">AutoGrader<span className="text-indigo-600">AI</span></h1>
          </div>
          <button 
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md"
            onClick={() => setShowHistoryMobile(!showHistoryMobile)}
          >
            <History size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input and Criteria (Desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Input Area */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-[500px]">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold text-gray-800">Student Submission</h2>
               <button 
                 onClick={handleClear}
                 className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-medium"
                 title="Clear input"
               >
                 <Eraser size={16} /> Clear
               </button>
             </div>
             <textarea
                className="flex-grow w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-700 placeholder-gray-400 text-sm leading-relaxed outline-none transition-all"
                placeholder="Paste the student's homework assignment here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
             />
             <div className="mt-6">
                <button
                  onClick={handleGrade}
                  disabled={loading || !inputText.trim()}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white shadow-md transition-all flex items-center justify-center gap-2
                    ${loading || !inputText.trim() 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:transform active:scale-95'
                    }`}
                >
                  {loading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Sparkles size={18} /> Grade Homework
                    </>
                  )}
                </button>
             </div>
          </div>

          {/* Criteria Card - Visible on Desktop */}
          <div className="hidden lg:block h-64">
            <CriteriaCard />
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-4 h-[500px] lg:h-auto">
          <ResultDisplay result={result} loading={loading} />
        </div>

        {/* Far Right / Mobile: History & Mobile Criteria */}
        <div className={`lg:col-span-3 lg:block ${showHistoryMobile ? 'fixed inset-0 z-40 bg-white p-4 overflow-y-auto' : 'hidden'}`}>
           <div className="flex flex-col h-full gap-6">
             {/* Mobile Header for History Overlay */}
             {showHistoryMobile && (
               <div className="flex justify-between items-center mb-4 lg:hidden">
                 <h2 className="text-xl font-bold">History</h2>
                 <button onClick={() => setShowHistoryMobile(false)} className="text-gray-500">Close</button>
               </div>
             )}

             {/* History List */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                  <History size={18} className="text-gray-500" />
                  <h3 className="font-semibold text-gray-700">Recent Grading</h3>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-2 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No grading history yet.
                    </div>
                  ) : (
                    history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100 group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-sm font-bold ${item.score >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                            {item.score}%
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2 group-hover:text-gray-700">
                          {item.summary}
                        </p>
                        <div className="flex items-center text-xs text-indigo-400 group-hover:text-indigo-600 font-medium">
                          View Result <ChevronRight size={12} className="ml-1" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
             </div>

             {/* Mobile Criteria (Only visible when history overlay is active on mobile) */}
             <div className="lg:hidden">
               <CriteriaCard />
             </div>
           </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} AI AutoGrader. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
