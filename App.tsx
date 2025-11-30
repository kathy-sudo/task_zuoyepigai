import React, { useState, useEffect, useRef } from 'react';
import { gradeHomework } from './services/geminiService';
import { GradingResult, HistoryItem, SubmissionContent, QueueItem } from './types';
import ResultDisplay from './components/ResultDisplay';
import CriteriaCard from './components/CriteriaCard';
import { GraduationCap, History, ChevronRight, UploadCloud, Sparkles, FileText, X, Trash2, Users, FileCheck, AlertCircle, Loader2 } from 'lucide-react';
import mammoth from 'mammoth';

const App: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Filename Parsing Logic
  const parseStudentInfo = (filename: string) => {
    // Remove extension
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    
    // Heuristic: Look for ID (sequence of digits, usually > 3)
    const idMatch = nameWithoutExt.match(/(\d{4,})/);
    const studentId = idMatch ? idMatch[0] : '';
    
    // The rest is the name (replace ID and separators with spaces)
    let studentName = nameWithoutExt
      .replace(studentId, '')
      .replace(/[_\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
      
    // Fallback if no specific ID found or name is empty
    if (!studentId && !studentName) {
        studentName = nameWithoutExt;
    }
    if (!studentName && studentId) {
        studentName = "Unknown Student";
    }

    return { 
      id: studentId || 'N/A', 
      name: studentName || 'Unknown' 
    };
  };

  // Helper to read file content (DOCX -> Text, PDF -> Base64)
  const readFileContent = async (file: File): Promise<SubmissionContent> => {
    if (file.name.endsWith('.docx')) {
      // Use mammoth to extract raw text from DOCX
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return {
          type: 'text',
          mimeType: 'text/plain',
          data: result.value,
        };
      } catch (err) {
        console.error("Error reading DOCX", err);
        throw new Error("Failed to read DOCX file.");
      }
    } else if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      // Base64 for PDF/Images
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const data = base64String.split(',')[1];
          resolve({
            type: 'file',
            data: data,
            mimeType: file.type,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } else {
      // Default to plain text for others (.txt, .md, .js, etc.)
      const text = await file.text();
      return {
        type: 'text',
        mimeType: 'text/plain',
        data: text,
      };
    }
  };

  const processQueue = async (currentQueue: QueueItem[]) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const newQueue = [...currentQueue];
    
    for (let i = 0; i < newQueue.length; i++) {
      if (newQueue[i].status === 'pending') {
        // Update status to processing
        newQueue[i].status = 'processing';
        setQueue([...newQueue]);

        try {
          // 1. Read File
          const content = await readFileContent(newQueue[i].file);
          
          // 2. Grade
          const result = await gradeHomework(content);
          
          // 3. Update Result
          newQueue[i].status = 'completed';
          newQueue[i].result = result;
          
          // Add to History
          const historyItem: HistoryItem = {
            ...result,
            id: Date.now().toString() + Math.random(),
            timestamp: Date.now(),
            snippet: newQueue[i].studentName,
            fileName: newQueue[i].file.name,
            studentName: newQueue[i].studentName,
            studentId: newQueue[i].studentId
          };
          setHistory(prev => {
             const updated = [historyItem, ...prev];
             localStorage.setItem('grading_history', JSON.stringify(updated));
             return updated;
          });

        } catch (error: any) {
          console.error(error);
          newQueue[i].status = 'error';
          newQueue[i].error = error.message || "Grading failed";
        }
        
        // Update state after each file
        setQueue([...newQueue]);
        
        // Small delay to be gentle on rate limits if needed (optional)
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setIsProcessing(false);
  };

  const handleGradeStart = () => {
    processQueue(queue);
  };

  const handleClear = () => {
    setQueue([]);
    setSelectedQueueId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: QueueItem[] = Array.from(files).map(file => {
      const { id, name } = parseStudentInfo(file.name);
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: 'pending',
        studentId: id,
        studentName: name,
      };
    });

    setQueue(prev => [...prev, ...newItems]);
    // Reset file input to allow selecting same files again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadFromHistory = (item: HistoryItem) => {
    // When loading history, we mock a queue item to display it
    const mockItem: QueueItem = {
      id: item.id,
      file: new File([], item.fileName || 'History Item'),
      status: 'completed',
      studentName: item.studentName || 'Unknown',
      studentId: item.studentId || 'N/A',
      result: item
    };
    setQueue([mockItem]);
    setSelectedQueueId(mockItem.id);
    setShowHistoryMobile(false);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Derived state
  const completedCount = queue.filter(q => q.status === 'completed').length;
  const isBatch = queue.length > 1;
  const activeItem = queue.find(q => q.id === selectedQueueId) || (queue.length === 1 ? queue[0] : null);

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
        
        {/* Left Column: Input and Batch List */}
        <div className={`flex flex-col gap-6 ${isBatch ? 'lg:col-span-5' : 'lg:col-span-4'}`}>
          {/* File Upload Area */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-[500px]">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                 <Users size={20} className="text-indigo-500"/> 
                 {queue.length > 0 ? `Students (${queue.length})` : 'Student Submission'}
               </h2>
               {queue.length > 0 && !isProcessing && (
                 <button 
                   onClick={handleClear}
                   className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-medium"
                   title="Clear all"
                 >
                   <Trash2 size={16} /> Clear
                 </button>
               )}
             </div>

             <div className="flex-grow flex flex-col overflow-hidden">
               {queue.length === 0 ? (
                 <div 
                   className={`flex-grow border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer text-center
                     ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                   onClick={() => fileInputRef.current?.click()}
                 >
                   <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                     <UploadCloud size={48} />
                   </div>
                   <h3 className="text-lg font-medium text-gray-900">
                     {isDragging ? 'Drop files here' : 'Click or drag to upload'}
                   </h3>
                   <p className="text-sm text-gray-500 mt-2 max-w-xs">
                     Upload individual files or a whole folder.
                     <br/>
                     Supports .docx, .pdf, .txt, .md
                   </p>
                   {/* Input for multiple files */}
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={(e) => handleFileSelect(e.target.files)} 
                     className="hidden" 
                     multiple
                     accept=".pdf,.txt,.md,.doc,.docx,image/*"
                   />
                 </div>
               ) : (
                 <div className="flex-grow overflow-y-auto custom-scrollbar border rounded-xl border-gray-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2 font-medium text-gray-500">Name</th>
                          <th className="px-4 py-2 font-medium text-gray-500">ID</th>
                          <th className="px-4 py-2 font-medium text-gray-500 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {queue.map((item) => (
                          <tr 
                            key={item.id} 
                            onClick={() => setSelectedQueueId(item.id)}
                            className={`cursor-pointer transition-colors hover:bg-gray-50 
                              ${selectedQueueId === item.id ? 'bg-indigo-50 hover:bg-indigo-50' : ''}`}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[120px]" title={item.studentName}>
                              {item.studentName}
                            </td>
                            <td className="px-4 py-3 text-gray-500">{item.studentId}</td>
                            <td className="px-4 py-3 text-right">
                               {item.status === 'pending' && <span className="text-gray-400">Pending</span>}
                               {item.status === 'processing' && <Loader2 size={16} className="animate-spin inline text-indigo-600" />}
                               {item.status === 'error' && <AlertCircle size={16} className="inline text-red-500" />}
                               {item.status === 'completed' && (
                                 <span className={`font-bold ${item.result && item.result.score >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                                   {item.result?.score}
                                 </span>
                               )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               )}
             </div>
             
             <div className="mt-6 space-y-3">
                {queue.length > 0 && (
                   <div className="flex justify-between text-sm text-gray-500 mb-2">
                     <span>Progress</span>
                     <span>{completedCount} / {queue.length}</span>
                   </div>
                )}
                {/* Progress Bar */}
                {queue.length > 0 && (
                   <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                     <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(completedCount / queue.length) * 100}%` }}
                     ></div>
                   </div>
                )}

                <button
                  onClick={handleGradeStart}
                  disabled={isProcessing || queue.length === 0 || queue.every(i => i.status === 'completed')}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white shadow-md transition-all flex items-center justify-center gap-2
                    ${isProcessing || queue.length === 0 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:transform active:scale-95'
                    }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Grading {queue.length} files...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> {queue.some(i => i.status === 'completed') && !queue.every(i => i.status === 'completed') ? 'Resume Grading' : 'Start Grading'}
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>

        {/* Middle Column: Results (Expanded on Desktop if Batch) */}
        <div className={`${isBatch ? 'lg:col-span-7' : 'lg:col-span-5'} h-[600px] lg:h-auto`}>
          {queue.length > 0 ? (
             activeItem ? (
                <div className="h-full flex flex-col">
                  {/* Student Header for Result */}
                  <div className="bg-white border-b border-gray-200 p-4 rounded-t-xl flex justify-between items-center shadow-sm z-10">
                     <div>
                       <h3 className="text-lg font-bold text-gray-900">{activeItem.studentName}</h3>
                       <p className="text-sm text-gray-500">ID: {activeItem.studentId} • {activeItem.file.name}</p>
                     </div>
                     {activeItem.status === 'completed' && activeItem.result && (
                       <div className="text-2xl font-bold text-indigo-600">{activeItem.result.score} <span className="text-sm text-gray-400 font-normal">/ 100</span></div>
                     )}
                  </div>
                  <div className="flex-grow bg-white rounded-b-xl border-x border-b border-gray-200 shadow-sm overflow-hidden">
                     <ResultDisplay result={activeItem.result || null} loading={activeItem.status === 'processing'} />
                  </div>
                </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
                  <div className="bg-indigo-50 p-4 rounded-full mb-4">
                    <FileCheck size={48} className="text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700">Select a student</h3>
                  <p className="text-gray-500 mt-2">
                    Click on a student from the list to view their detailed grading report.
                  </p>
               </div>
             )
          ) : (
            /* Placeholder when no files */
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 text-center opacity-75">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <GraduationCap size={48} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700">Waiting for submissions</h3>
              <p className="text-gray-500 mt-2 max-w-xs">
                Upload homework files to begin the grading process.
              </p>
            </div>
          )}
        </div>

        {/* Far Right: Criteria or History (Only visible if not in massive batch mode or enough space) */}
        {!isBatch && (
          <div className="lg:col-span-3 hidden lg:flex flex-col gap-6">
              <div className="h-64">
                <CriteriaCard />
              </div>
              {/* Desktop History Mini View */}
              <div className="flex-grow bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden max-h-[400px]">
                <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                  <History size={18} className="text-gray-500" />
                  <h3 className="font-semibold text-gray-700">Recent</h3>
                </div>
                <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left p-2 rounded hover:bg-indigo-50 transition-colors text-xs group"
                    >
                      <div className="flex justify-between font-bold text-gray-700">
                         <span>{item.studentName || 'Student'}</span>
                         <span className={item.score >= 70 ? 'text-green-600' : 'text-orange-500'}>{item.score}</span>
                      </div>
                      <div className="text-gray-400 truncate">{item.fileName}</div>
                    </button>
                  ))}
                </div>
              </div>
          </div>
        )}

        {/* Mobile History Overlay */}
        {showHistoryMobile && (
          <div className="fixed inset-0 z-50 bg-white p-4 overflow-y-auto lg:hidden">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold">Grading History</h2>
                 <button onClick={() => setShowHistoryMobile(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
             </div>
             <div className="space-y-3">
               {history.map((item) => (
                  <div key={item.id} onClick={() => loadFromHistory(item)} className="p-4 border rounded-lg active:bg-gray-50">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">{item.studentName || 'Unknown'}</span>
                      <span className="font-bold text-indigo-600">{item.score}</span>
                    </div>
                    <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</p>
                  </div>
               ))}
             </div>
          </div>
        )}

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