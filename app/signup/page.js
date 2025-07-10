import SignupForm from '@/components/SignupForm';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 relative overflow-hidden font-sans">
      {/* Chic floating elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-emerald-300/40 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-cyan-300/30 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-1 h-1 bg-white/20 rounded-full animate-pulse delay-300"></div>
      </div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <SignupForm />
      </div>
    </div>
  );
}
