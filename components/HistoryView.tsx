import React from 'react';
import { User, WinRecord } from '../types';
import HistoryItem from './HistoryItem';

interface HistoryViewProps {
  history: WinRecord[];
  users: User[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, users }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-10 px-4 animate-fade-in">
        <p className="text-5xl mb-4">📜</p>
        <h3 className="text-xl font-bold text-tg-text">История пуста</h3>
        <p className="text-tg-hint">
          Запустите рулетку, чтобы увидеть здесь список победителей.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {history.map(record => {
        const author = users.find(u => u.id === record.option.authorId);
        if (!author) return null;
        return <HistoryItem key={record.timestamp} record={record} author={author} />;
      })}
    </div>
  );
};

export default HistoryView;