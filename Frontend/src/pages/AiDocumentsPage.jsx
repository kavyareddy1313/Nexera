import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Search, Plus, Trash2, Folder, Sparkles, BookOpen, Clock, GraduationCap } from "lucide-react";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import { GlobalNavRail } from "../components/layout/GlobalNavRail";
import { DashboardTopNav } from "../components/dashboard/DashboardTopNav";
import useAuthStore from "../store/useAuthStore";

export default function AiDocumentsPage() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/documents');
      setDocuments(res.data?.data?.documents || []);
    } catch (err) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('strategy', 'recursive');
    
    // Add loading toast id
    const toastId = toast.loading("Uploading and analyzing document...");

    try {
      const res = await api.post('/ai/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Document analyzed and ready!", { id: toastId });
      fetchDocuments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload document", { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = null; // reset input
    }
  };

  const handleDelete = async (e, documentId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await api.delete(`/ai/documents/${documentId}`);
      toast.success("Document removed");
      setDocuments(prev => prev.filter(d => d.id !== documentId));
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.filename?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F4F5F7] dark:bg-[#0b1120] overflow-hidden font-sans">
      <GlobalNavRail activeRoute="/ai/documents" />
      
      <div className="flex flex-col flex-1 h-full min-w-0">
        <DashboardTopNav user={user} />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
              <div>
                <h1 className="text-3xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <GraduationCap size={26} />
                  </div>
                  AI Study Assistant
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
                  Upload documents, notes, or books to generate summaries, interactive flashcards, and quizzes.
                </p>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search materials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
                
                <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap text-sm">
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus size={18} />
                  )}
                  {isUploading ? "Analyzing..." : "Upload Material"}
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.txt,.md,.csv,.json"
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            {/* Document Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 border-dashed">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap size={32} />
                </div>
                <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">No study materials yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm max-w-sm mx-auto">Upload a PDF, notes, or document to start summarizing, generating flashcards, and taking quizzes.</p>
                <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-semibold inline-flex items-center gap-2 transition-colors shadow-sm text-sm">
                  <Upload size={16} /> Browse Files
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.txt,.md,.csv,.json" />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    onClick={() => navigate(`/ai/workspace/${doc.id}`, { state: { document: doc } })}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-56"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                        <FileText size={24} />
                      </div>
                      <button 
                        onClick={(e) => handleDelete(e, doc.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 leading-tight">
                      {doc.filename}
                    </h3>
                    
                    <div className="mt-auto space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md uppercase">
                          {doc.filename.split('.').pop()}
                        </span>
                        <span>•</span>
                        <span>{(doc.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                        <Clock size={12} />
                        Added {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
