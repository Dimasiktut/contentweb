import React from 'react';
import { User, WinRecord } from '../types';

interface HistoryItemProps {
  record: WinRecord;
  author: User;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ record, author }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-tg-secondary-bg p-4 rounded-xl shadow-md animate-slide-in-up">
      <div className="flex justify-between items-start">
        <p className="text-lg font-semibold text-tg-link break-words pr-4">
          "{record.option_text}"
        </p>
        <span className="text-xs text-tg-hint flex-shrink-0">
          {formatDate(record.timestamp)}
        </span>
      </div>
      <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-gray-700">
        <img src={author.avatarUrl} alt={author.username} className="w-8 h-8 rounded-full" />
        <div>
          <p className="text-sm text-tg-hint">Победитель:</p>
          <p className="font-bold text-sm text-tg-text">@{author.username}</p>
        </div>
      </div>
    </div>
  );
};

export default HistoryItem;