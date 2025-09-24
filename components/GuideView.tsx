import React from 'react';

const InfoCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-tg-secondary-bg p-5 rounded-xl shadow-lg">
    <div className="flex items-center mb-3">
      <span className="text-3xl mr-3">{icon}</span>
      <h3 className="text-xl font-bold text-tg-text">{title}</h3>
    </div>
    <div className="space-y-2 text-tg-hint">{children}</div>
  </div>
);

const GuideView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-tg-text">Как это работает?</h2>
        <p className="text-tg-hint mt-1">Краткое руководство по игре</p>
      </div>

      <InfoCard title="Энергия" icon="⚡️">
        <p>Энергия — это ресурс для активных действий в приложении.</p>
        <h4 className="font-semibold text-tg-text pt-2">Как получить:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Ежедневный бонус:</strong> Вы получаете 10⚡️ каждый новый день.
          </li>
          <li>
            <strong>Победа в рулетке:</strong> Если предложенный вами вариант побеждает, вы получаете 5⚡️.
          </li>
        </ul>
        <h4 className="font-semibold text-tg-text pt-2">На что потратить:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Добавить вариант в рулетку:</strong> -1⚡️
          </li>
          <li>
            <strong>Запустить рулетку:</strong> -5⚡️
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Баллы" icon="🪙">
        <p>Баллы — это ваша основная валюта для развлечений и покупок.</p>
        <h4 className="font-semibold text-tg-text pt-2">Как получить:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Победа в рулетке:</strong> Когда ваш вариант выигрывает, вы получаете 25🪙.
          </li>
          <li>
            <strong>Запуск рулетки:</strong> Каждый, кто крутит рулетку, получает 5🪙.
          </li>
           <li>
            <strong>Победа в дуэли:</strong> Вы забираете ставку оппонента (10🪙).
          </li>
        </ul>
        <h4 className="font-semibold text-tg-text pt-2">На что потратить:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Дуэли:</strong> Бросить вызов другому игроку стоит 10🪙.
          </li>
          <li>
            <strong>Магазин:</strong> Покупайте уникальные награды и предметы в магазине.
          </li>
        </ul>
      </InfoCard>
    </div>
  );
};

export default GuideView;