import React from 'react';

function CustomToolbar({ onView, onNavigate, label, view }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('PREV')}
          className="p-1 text-gray-600 hover:text-gray-900"
        >
          ❮
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-1 text-gray-600 hover:text-gray-900"
        >
          ❯
        </button>
        <span className="ml-2 font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex space-x-1">
          {['month', 'week', 'day', 'list'].map((viewType) => (
            <button
              key={viewType}
              className={`px-3 py-1 text-sm rounded ${
                view === (viewType === 'list' ? 'agenda' : viewType)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => onView(viewType === 'list' ? 'agenda' : viewType)}
            >
              {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CustomToolbar;
