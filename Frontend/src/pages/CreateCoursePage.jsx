import React, { useState } from 'react';
import { WizardHeader } from '../components/instructor/wizard/WizardHeader';
import { WizardFooter } from '../components/instructor/wizard/WizardFooter';
import { Step1BasicInfo } from '../components/instructor/wizard/Step1BasicInfo';
import { Step2Curriculum } from '../components/instructor/wizard/Step2Curriculum';
import { Step3Pricing } from '../components/instructor/wizard/Step3Pricing';
import { Step4Publish } from '../components/instructor/wizard/Step4Publish';
import { useNavigate } from 'react-router-dom';

export default function CreateCoursePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate('/instructor/courses'); // Discard/back to courses
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1BasicInfo />;
      case 2: return <Step2Curriculum />;
      case 3: return <Step3Pricing />;
      case 4: return <Step4Publish />;
      default: return <Step1BasicInfo />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f9] font-sans overflow-hidden">
      <WizardHeader currentStep={currentStep} />
      
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {renderStep()}
      </div>

      <WizardFooter 
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        onSaveDraft={() => console.log('Saving draft...')}
      />
    </div>
  );
}
