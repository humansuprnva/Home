export default function Documents() {
  return (
    <div className="bg-indigo-50/50 rounded-xl shadow-sm border border-indigo-100 p-6 h-full flex flex-col items-center justify-center min-h-[250px]">
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-2xl">
        📁
      </div>
      <h2 className="text-xl font-bold text-indigo-900 mb-2">Document Storage</h2>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-6">
        Upload and share important home documents, manuals, and receipts. (Cloud storage integration required for full functionality).
      </p>

      <div className="flex gap-4">
        <button className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 text-sm font-medium transition-colors">
          Upload Document
        </button>
        <button className="bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded shadow-sm hover:bg-indigo-50 text-sm font-medium transition-colors">
          View Files
        </button>
      </div>
    </div>
  );
}
