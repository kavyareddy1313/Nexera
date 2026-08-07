import React, { useState } from 'react';
import { WizardHeader } from '../components/instructor/wizard/WizardHeader';
import { WizardFooter } from '../components/instructor/wizard/WizardFooter';
import { Step1BasicInfo } from '../components/instructor/wizard/Step1BasicInfo';
import { Step2Curriculum } from '../components/instructor/wizard/Step2Curriculum';
import { Step3Pricing } from '../components/instructor/wizard/Step3Pricing';
import { Step4Publish } from '../components/instructor/wizard/Step4Publish';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function CreateCoursePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const navigate = useNavigate();

  // Wizard form data (shared across steps)
  const [courseData, setCourseData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Development',
    thumbnailUrl: '',
    price: 99,
    duration: '20 Hours',
  });

  const updateCourseData = (updates) => {
    setCourseData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Step 4: Publish course
      await handlePublish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate('/instructor/courses');
    }
  };

  const handlePublish = async () => {
    if (!courseData.title.trim()) {
      toast.error('Course title is required');
      setCurrentStep(1);
      return;
    }

    setIsPublishing(true);
    try {
      const res = await api.post('/courses', {
        title: courseData.title,
        description: courseData.description || courseData.subtitle || `Learn ${courseData.title} with expert guidance.`,
        price: Number(courseData.price) || 0,
        thumbnailUrl: courseData.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
        category: courseData.category,
        duration: courseData.duration,
      });

      const { conversationId } = res.data.data;

      toast.success('Course published successfully! 🎉');

      // Redirect to chat to see the newly created community group
      setTimeout(() => {
        if (conversationId) {
          navigate(`/chat?convo=${conversationId}`);
        } else {
          navigate('/instructor/courses');
        }
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish course');
    } finally {
      setIsPublishing(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1BasicInfo courseData={courseData} updateCourseData={updateCourseData} />;
      case 2: return <Step2Curriculum />;
      case 3: return <Step3Pricing courseData={courseData} updateCourseData={updateCourseData} />;
      case 4: return <Step4Publish courseData={courseData} isPublishing={isPublishing} />;
      default: return <Step1BasicInfo courseData={courseData} updateCourseData={updateCourseData} />;
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
        onSaveDraft={() => toast.success('Draft saved!')}
        nextDisabled={isPublishing}
      />
    </div>
  );
}
