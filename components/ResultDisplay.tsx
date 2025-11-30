import React from 'react';
import { GradingResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Award, AlertCircle, Check } from 'lucide-react';

interface ResultDisplayProps {
  result: GradingResult | null;
  loading: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Analyzing submission...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <Award size={48} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700">Ready to Grade</h3>
        <p className="text-gray-500 mt-2 max-w-xs">
          Submit student homework on the left to receive an instant AI evaluation.
        </p>
      </div>
    );
  }

  const { score, summary, feedback, breakdown } = result;

  // Data for charts
  const gaugeData = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];
  
  const barData = [
    { name: 'Understand', score: breakdown.understanding, fullMark: 100 },
    { name: 'Logic', score: breakdown.logic, fullMark: 100 },
    { name: 'Complete', score: breakdown.completeness, fullMark: 100 },
  ];

  const getScoreColor = (s: number) => {
    if (s >= 90) return '#10b981'; // Emerald 500
    if (s >= 75) return '#3b82f6'; // Blue 500
    if (s >= 60) return '#f59e0b'; // Amber 500
    return '#ef4444'; // Red 500
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className={`p-6 border-b ${score >= 60 ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
        <div className="flex items-center justify-between">
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Award className={score >= 60 ? "text-green-600" : "text-red-500"} />
             Evaluation Result
           </h2>
           <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">AI Grader</span>
        </div>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
        {/* Top Section: Score and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="col-span-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4 relative">
             <div className="h-32 w-32 relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={gaugeData}
                     cx="50%"
                     cy="50%"
                     innerRadius={40}
                     outerRadius={55}
                     startAngle={180}
                     endAngle={0}
                     paddingAngle={0}
                     dataKey="value"
                     stroke="none"
                   >
                     <Cell key="score" fill={getScoreColor(score)} />
                     <Cell key="rest" fill="#e5e7eb" />
                   </Pie>
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                 <span className="text-3xl font-bold text-gray-800">{score}</span>
                 <span className="text-xs text-gray-500 uppercase">Total Score</span>
               </div>
             </div>
          </div>

          <div className="col-span-1 md:col-span-2 flex flex-col justify-center space-y-3">
             <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Summary</h3>
             <p className="text-gray-800 text-lg leading-relaxed font-medium">
               {summary}
             </p>
          </div>
        </div>

        {/* Middle Section: Breakdown Chart */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Component Breakdown</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb"/>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} width={80} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Section: Feedback */}
        <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-100">
           <div className="flex items-start gap-3">
             <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 mt-1">
               {score > 70 ? <Check size={18} /> : <AlertCircle size={18} />}
             </div>
             <div>
               <h3 className="text-indigo-900 font-semibold mb-2">Instructor Feedback</h3>
               <p className="text-indigo-800 text-sm leading-relaxed">
                 {feedback}
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
