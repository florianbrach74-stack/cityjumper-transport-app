import React from 'react';

const CompactStats = ({ stats, columns = 2 }) => {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }[columns] || 'grid-cols-2';

  return (
    <div className={`grid ${gridClass} gap-3`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              {Icon && <Icon className={`h-5 w-5 ${stat.iconColor || 'text-blue-600'}`} />}
              <span className={`text-2xl font-bold ${stat.valueColor || 'text-gray-900'}`}>
                {stat.value}
              </span>
            </div>
            <p className="text-xs text-gray-600 truncate">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export default CompactStats;
