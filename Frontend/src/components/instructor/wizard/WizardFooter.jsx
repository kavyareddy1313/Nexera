import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function WizardFooter({ 
  onBack, 
  onNext, 
  onSaveDraft, 
  currentStep,
  nextDisabled = false 
}) {
  
  const getNextText = () => {
    switch (currentStep) {
      case 1: return 'Continue';
      case 2: return 'Continue to Pricing';
      case 3: return 'Continue';
      case 4: return 'Publish Course';
      default: return 'Continue';
    }
  };

  const getBackText = () => {
    switch (currentStep) {
      case 1: return 'Discard';
      case 2: return 'Back to Details';
      default: return 'Back';
    }
  };

  return (
    <div className="w-full h-[80px] bg-white border-t border-gray-100 flex items-center justify-between px-8 shrink-0 z-30">
      
      {currentStep > 1 ? (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          {getBackText()}
        </button>
      ) : (
        <button 
          onClick={onBack}
          className="text-gray-500 hover:text-gray-900 font-semibold text-sm transition-colors"
        >
          {getBackText()}
        </button>
      )}

      <div className="flex items-center gap-4">
        {currentStep === 1 || currentStep === 4 ? (
          <button 
            onClick={onSaveDraft}
            className="bg-[#f3f4f6] text-indigo-700 font-bold px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors text-sm"
          >
            Save Draft
          </button>
        ) : (
          <button 
            onClick={onSaveDraft}
            className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors px-4"
          >
            Save Draft
          </button>
        )}
        
        <button 
          onClick={onNext}
          disabled={nextDisabled}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all
            ${nextDisabled 
              ? 'bg-indigo-300 text-white cursor-not-allowed' 
              : 'bg-[#5c4ce3] text-white shadow-sm hover:bg-indigo-700 hover:shadow-md'
            }`}
        >
          {getNextText()}
          {currentStep !== 4 && <ArrowRight size={16} />}
        </button>
      </div>

    </div>
  );
}
