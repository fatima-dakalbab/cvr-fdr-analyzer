import React from 'react';
import NewCaseWizard from '../components/NewCaseWizard';

const NewCase = ({ onComplete }) => (
  <div className="max-w-5xl mx-auto">
    <NewCaseWizard onComplete={onComplete} />
  </div>
);

export default NewCase;