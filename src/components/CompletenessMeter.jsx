import React from 'react';

const CompletenessMeter = ({ score }) => {
  // Determine color based on score
  // Red for < 40%, Yellow for < 80%, Green for 100% (or >= 80% per standard practice, but user said Green for 100%)
  const getProgressColor = () => {
    if (score < 40) return 'bg-red-500';
    if (score < 80) return 'bg-yellow-500';
    if (score === 100) return 'bg-green-500';
    return 'bg-green-400'; // For scores between 80 and 99
  };

  return (
    <div className="w-full max-w-xs">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Profile Completeness</span>
        <span className="text-xs font-bold text-gray-800">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
        <div 
          className={`h-full ${getProgressColor()} transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      {score < 100 && (
        <p className="text-[10px] text-gray-500 mt-1 italic">
          Complete your profile to get more matches!
        </p>
      )}
    </div>
  );
};

export default CompletenessMeter;
