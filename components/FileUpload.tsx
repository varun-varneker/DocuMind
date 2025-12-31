
import React from 'react';
import { Upload, CheckCircle2, ShieldCheck } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  status: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, status }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div 
        className={`relative border-2 border-dashed rounded-[2rem] p-8 md:p-14 transition-all flex flex-col items-center justify-center space-y-6
          ${isLoading ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer shadow-xl shadow-indigo-50/50'}`}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleChange}
          accept=".pdf"
          disabled={isLoading}
        />
        
        <div className={`p-5 rounded-[1.5rem] shadow-2xl transition-all duration-500 transform ${isLoading ? 'bg-slate-100 animate-pulse scale-95' : 'bg-indigo-600 scale-110 shadow-indigo-200'}`}>
          <Upload className={`w-8 h-8 md:w-10 md:h-10 ${isLoading ? 'text-slate-400' : 'text-white'}`} />
        </div>
        
        <div className="text-center px-4">
          <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter mb-1">
            {isLoading ? 'Processing...' : 'Select Subject'}
          </p>
          <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
            {status || 'Tap to browse local storage'}
          </p>
        </div>

        {isLoading && (
          <div className="w-full max-w-[240px] bg-slate-100 rounded-full h-1.5 overflow-hidden mt-6 relative">
            <div className="bg-indigo-600 h-full w-full absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Benefit icon={<ShieldCheck className="w-4 h-4 text-indigo-500" />} label="Closed-Loop" />
        <Benefit icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} label="Verified" />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

const Benefit = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="flex items-center justify-center space-x-2.5 bg-white py-4 px-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
    {icon}
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
  </div>
);

export default FileUpload;
