import React from 'react';
import './option.scss';
import ConditionTableView from './components/conditionTableView';

const Options: React.FC = () => {
  return (
    <div className="optionsContainer">
      <header className="header">
        <img src={'icon-128.png'} alt={'icon'} className={'icon'} />
        <div className={'title'}>Kibana Enhancer</div>
      </header>
      <main className={'main'}>
        <ConditionTableView />
      </main>
    </div>
  );
};

export default Options;
