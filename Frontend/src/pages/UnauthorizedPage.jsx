import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-4 text-red-600">403 Forbidden</h1>
      <p className="text-gray-600 mb-8">You do not have permission to view this page.</p>
      <button 
        onClick={() => navigate(-1)}
        className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
      >
        Go Back
      </button>
    </div>
  );
}
