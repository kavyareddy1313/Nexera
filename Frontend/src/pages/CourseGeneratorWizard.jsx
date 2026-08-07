import React, { useState, useEffect } from "react";
import { 
  Sparkles, Loader2, BookOpen, Clock, FileText, CheckCircle2, 
  Wand2, AlertCircle, ChevronDown, ChevronUp, Edit3, Video, Play, FileCheck
} from "lucide-react";
import api from "../api/axios";
import { toast } from "react-hot-toast";

export default function CourseGeneratorWizard() {
  const [step, setStep] = useState(1);
  const [jobId, setJobId] = useState(null);
  
  // Step 1 State
  const [formData, setFormData] = useState({
    topic: "",
    targetAudience: "",
    difficulty: "Beginner",
    moduleCount: 4,
    lessonsPerModule: 3,
    quizCount: 3,
    language: "English",
    additionalInstructions: "",
  });
  const [referenceDoc, setReferenceDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 2 State
  const [jobStatus, setJobStatus] = useState(null);

  // Step 3 State
  const [courseDraft, setCourseDraft] = useState(null);
  const [expandedModule, setExpandedModule] = useState(0);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonEdits, setLessonEdits] = useState({});
  const [savingLesson, setSavingLesson] = useState(false);

  // Step 4 State
  const [publishing, setPublishing] = useState(false);

  // Poll for job status
  useEffect(() => {
    let intervalId;
    if (step === 2 && jobId && jobStatus?.status !== 'draft_ready' && jobStatus?.status !== 'failed') {
      intervalId = setInterval(async () => {
        try {
          const res = await api.get(`/ai/course-generator/generate/${jobId}`);
          setJobStatus(res.data.data);
          
          if (res.data.data.status === 'draft_ready') {
            clearInterval(intervalId);
            fetchDraft(res.data.data.courseId);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 2500);
    }
    return () => clearInterval(intervalId);
  }, [step, jobId, jobStatus?.status]);

  const fetchDraft = async (courseId) => {
    try {
      const res = await api.get(`/ai/course-generator/courses/${courseId}/draft`);
      setCourseDraft(res.data.data.course);
      setStep(3);
      toast.success("Course bundle ready for review!");
    } catch (err) {
      toast.error("Failed to load course draft");
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.topic) return toast.error("Topic is required");

    setLoading(true);
    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach(key => formPayload.append(key, formData[key]));
      if (referenceDoc) {
        formPayload.append('referenceDoc', referenceDoc);
      }

      const res = await api.post('/ai/course-generator/generate', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setJobId(res.data.data.jobId);
      setJobStatus({ status: 'pending', progressDetail: 'Starting pipeline...' });
      setStep(2);
      toast.success("Generation pipeline started!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRetryJob = async () => {
    try {
      await api.post(`/ai/course-generator/generate/${jobId}/retry`);
      setJobStatus({ status: 'pending', progressDetail: 'Retrying pipeline...' });
      toast.success("Retry initiated");
    } catch (err) {
      toast.error("Failed to retry job");
    }
  };

  const handleSaveLessonEdit = async (lessonId) => {
    const edits = lessonEdits[lessonId];
    if (!edits) return setEditingLessonId(null);

    setSavingLesson(true);
    try {
      await api.patch(`/ai/course-generator/courses/${courseDraft.id}/lessons/${lessonId}`, edits);
      
      // Update local state
      const updatedModules = courseDraft.modules.map(mod => ({
        ...mod,
        lessons: mod.lessons.map(l => l.id === lessonId ? { ...l, ...edits } : l)
      }));
      setCourseDraft({ ...courseDraft, modules: updatedModules });
      
      toast.success("Lesson updated");
      setEditingLessonId(null);
    } catch (err) {
      toast.error("Failed to save lesson");
    } finally {
      setSavingLesson(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await api.post(`/ai/course-generator/courses/${courseDraft.id}/publish`);
      toast.success("Course published successfully!");
      setStep(4);
    } catch (err) {
      const msgs = err.response?.data?.errors || [err.response?.data?.message || "Failed to publish course"];
      msgs.forEach(msg => toast.error(msg, { duration: 5000 }));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <Sparkles className="text-indigo-600" size={32} />
            AI Course Generator Pipeline
          </h1>
          <p className="text-gray-500 mt-2">
            Build complete, structured course curriculums with AI RAG grounding.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          {[
            { num: 1, label: "Configure" },
            { num: 2, label: "Generate" },
            { num: 3, label: "Review & Edit" },
            { num: 4, label: "Publish" }
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-2 ${step >= s.num ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s.num ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
                  {step > s.num ? <CheckCircle2 size={16} /> : s.num}
                </div>
                <span className={`font-semibold hidden sm:inline ${step === s.num ? 'text-indigo-900' : ''}`}>{s.label}</span>
              </div>
              {idx < 3 && (
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-indigo-600 transition-all ${step > s.num ? 'w-full' : 'w-0'}`} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Configuration Form */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <form onSubmit={handleGenerate} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Topic / Title Idea *</label>
                  <input 
                    type="text" 
                    value={formData.topic}
                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g. Introduction to React Native for Mobile Apps"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Target Audience</label>
                  <input 
                    type="text" 
                    value={formData.targetAudience}
                    onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                    placeholder="e.g. Web Developers"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty & Language</label>
                  <div className="flex gap-3">
                    <select 
                      value={formData.difficulty}
                      onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-1/2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                    <select 
                      value={formData.language}
                      onChange={e => setFormData({ ...formData, language: e.target.value })}
                      className="w-1/2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Hindi</option>
                    </select>
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 md:col-span-2 grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-indigo-900 mb-2">Modules ({formData.moduleCount})</label>
                    <input 
                      type="range" min="2" max="8" 
                      value={formData.moduleCount}
                      onChange={e => setFormData({ ...formData, moduleCount: e.target.value })}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-indigo-900 mb-2">Lessons/Module ({formData.lessonsPerModule})</label>
                    <input 
                      type="range" min="2" max="6" 
                      value={formData.lessonsPerModule}
                      onChange={e => setFormData({ ...formData, lessonsPerModule: e.target.value })}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-indigo-900 mb-2">Quizzes/Lesson ({formData.quizCount})</label>
                    <input 
                      type="range" min="1" max="5" 
                      value={formData.quizCount}
                      onChange={e => setFormData({ ...formData, quizCount: e.target.value })}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                    <span>Reference Document (Optional RAG Grounding)</span>
                    <span className="text-gray-400 font-normal text-xs">PDF, DOCX, TXT</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.txt,.md"
                      onChange={e => setReferenceDoc(e.target.files[0])}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Additional Instructions</label>
                  <textarea 
                    value={formData.additionalInstructions}
                    onChange={e => setFormData({ ...formData, additionalInstructions: e.target.value })}
                    placeholder="e.g. Focus heavily on Redux state management. Include practical code examples."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading || !formData.topic}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="animate-spin" size={20} /> Starting Pipeline...</>
                  ) : (
                    <><Wand2 size={20} /> Generate Course Bundle</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Generation Tracker */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center max-w-2xl mx-auto mt-12">
            
            {jobStatus?.status === 'failed' ? (
              <div>
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Generation Failed</h2>
                <p className="text-red-500 mb-8 max-w-md mx-auto font-medium">
                  {jobStatus.errorMessage}
                </p>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Back to Config
                  </button>
                  <button 
                    onClick={handleRetryJob}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex gap-2 items-center"
                  >
                    <Wand2 size={18} /> Retry Pipeline
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="text-indigo-600 animate-pulse" size={32} />
                  </div>
                </div>
                
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Building your course...</h2>
                <div className="h-8 mb-6">
                  <p className="text-indigo-600 font-medium animate-pulse">
                    {jobStatus?.progressDetail || "Initializing pipeline..."}
                  </p>
                </div>

                <div className="text-left bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  {[
                    { key: 'outline', label: 'Outline Generation' },
                    { key: 'rag_ingestion', label: 'RAG Ingestion' },
                    { key: 'content', label: 'Lesson Content' },
                    { key: 'quiz', label: 'Quizzes' },
                    { key: 'resources', label: 'Resource Linking' },
                    { key: 'assembling', label: 'Bundle Assembly' }
                  ].map((stage, i) => {
                    const stages = ['outline', 'rag_ingestion', 'content', 'quiz', 'resources', 'assembling'];
                    const currentIdx = stages.indexOf(jobStatus?.currentStage);
                    
                    let statusColor = "text-gray-400";
                    let icon = <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
                    
                    if (currentIdx > i) {
                      statusColor = "text-green-500";
                      icon = <CheckCircle2 size={20} className="text-green-500" />;
                    } else if (currentIdx === i) {
                      statusColor = "text-indigo-600 font-bold";
                      icon = <Loader2 size={20} className="animate-spin text-indigo-600" />;
                    }

                    return (
                      <div key={stage.key} className={`flex items-center gap-3 ${statusColor}`}>
                        {icon}
                        <span>{stage.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review & Edit */}
        {step === 3 && courseDraft && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{courseDraft.title}</h2>
              <p className="text-gray-600 mb-4">{courseDraft.description}</p>
              <div className="flex gap-4 text-sm font-medium text-gray-500">
                <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg"><BookOpen size={16} /> {courseDraft.category}</span>
                <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg"><Clock size={16} /> {courseDraft.duration}</span>
                <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg"><FileCheck size={16} /> {courseDraft.level}</span>
              </div>
            </div>

            <div className="space-y-4">
              {courseDraft.modules.map((mod, mIdx) => (
                <div key={mod.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setExpandedModule(expandedModule === mIdx ? null : mIdx)}
                    className="w-full px-6 py-5 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Module {mIdx + 1}: {mod.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{mod.description}</p>
                    </div>
                    {expandedModule === mIdx ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                  </button>

                  {expandedModule === mIdx && (
                    <div className="p-6 space-y-4 bg-white">
                      {mod.lessons.map((lesson, lIdx) => {
                        const isEditing = editingLessonId === lesson.id;
                        const edits = lessonEdits[lesson.id] || { 
                          contentMarkdown: lesson.contentMarkdown,
                          youtubeVideoId: lesson.youtubeVideoId
                        };

                        return (
                          <div key={lesson.id} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex gap-3">
                                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                  {lIdx + 1}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900">{lesson.title}</h4>
                                  <div className="flex gap-3 text-xs mt-1">
                                    <span className="text-green-600 font-medium flex items-center gap-1">
                                      <CheckCircle2 size={12}/> Content Generated
                                    </span>
                                    <span className="text-blue-600 font-medium flex items-center gap-1">
                                      <FileCheck size={12}/> {lesson.quizzes?.length || 0} Quizzes
                                    </span>
                                    {lesson.youtubeVideoId && (
                                      <span className="text-red-500 font-medium flex items-center gap-1">
                                        <Play size={12}/> YouTube Linked
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <button 
                                onClick={() => {
                                  if (isEditing) handleSaveLessonEdit(lesson.id);
                                  else {
                                    setEditingLessonId(lesson.id);
                                    setLessonEdits({ ...lessonEdits, [lesson.id]: { 
                                      contentMarkdown: lesson.contentMarkdown,
                                      youtubeVideoId: lesson.youtubeVideoId || ""
                                    }});
                                  }
                                }}
                                disabled={savingLesson && isEditing}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                  isEditing ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {savingLesson && isEditing ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? <CheckCircle2 size={16} /> : <Edit3 size={16} />)}
                                {isEditing ? 'Save Edits' : 'Edit Lesson'}
                              </button>
                            </div>

                            {isEditing ? (
                              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lesson Content (Markdown)</label>
                                  <textarea
                                    value={edits.contentMarkdown}
                                    onChange={(e) => setLessonEdits({...lessonEdits, [lesson.id]: {...edits, contentMarkdown: e.target.value}})}
                                    className="w-full h-64 p-4 bg-gray-50 border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">YouTube Video ID (Optional)</label>
                                  <div className="flex gap-2">
                                    <div className="relative flex-1">
                                      <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                      <input
                                        type="text"
                                        value={edits.youtubeVideoId}
                                        onChange={(e) => setLessonEdits({...lessonEdits, [lesson.id]: {...edits, youtubeVideoId: e.target.value}})}
                                        placeholder="e.g. dQw4w9WgXcQ"
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="text-sm text-gray-600 line-clamp-2 italic border-l-4 border-gray-200 pl-3">
                                  {lesson.contentMarkdown?.substring(0, 150)}...
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-8">
              <button 
                onClick={handlePublish}
                disabled={publishing || editingLessonId !== null}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none text-lg"
              >
                {publishing ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                {publishing ? 'Publishing Course...' : 'Publish Course'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-16 shadow-sm border border-gray-100 text-center mt-12">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={50} />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Course Published!</h2>
            <p className="text-gray-500 mb-10 max-w-lg mx-auto text-lg">
              Your AI-generated course has been successfully published to the catalog. Students can now enroll and start learning.
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => window.location.href = '/instructor/courses'}
                className="px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                View Dashboard
              </button>
              <button 
                onClick={() => {
                  setStep(1);
                  setCourseDraft(null);
                  setJobId(null);
                  setReferenceDoc(null);
                }}
                className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
              >
                Create Another Course
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
