import React from 'react';
import { BookOpen, Scale, CheckCircle } from 'lucide-react';

const CriteriaCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Grading Criteria</h3>
      <div className="space-y-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-1">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">Understanding</h4>
              <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">40%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Demonstration of a clear grasp of core concepts and definitions.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600 mt-1">
            <Scale size={20} />
          </div>
          <div>
             <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">Logic & Structure</h4>
              <span className="text-xs font-bold px-2 py-1 bg-purple-100 text-purple-700 rounded-full">30%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Coherence of arguments and logical flow of the solution.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="p-2 bg-green-50 rounded-lg text-green-600 mt-1">
            <CheckCircle size={20} />
          </div>
          <div>
             <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">Completeness</h4>
              <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">30%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Addressing all parts of the prompt comprehensively.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriteriaCard;
