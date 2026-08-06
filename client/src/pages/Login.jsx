import AuthCard from '../components/auth/AuthCard.jsx';
import LoginForm from '../components/auth/LoginForm.jsx';

export const Login = () => {
  return (
    <div className="min-h-screen w-full bg-[#0B1120] text-slate-100 flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden font-sans select-none">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Spacer for Vertically Centered Card */}
      <div className="w-full flex-1 flex items-center justify-center py-6">
        <AuthCard
          brandName="Aurex"
          brandSubtitle="Developer Intelligence Platform"
          title="Welcome back"
          subtitle="Enter your credentials to access your developer dashboard"
        >
          <LoginForm />
        </AuthCard>
      </div>

      {/* Footer Navigation & Copyright */}
      <footer className="w-full max-w-5xl mx-auto pt-6 border-t border-[#2A3247]/40 flex flex-col sm:flex-row items-center justify-between text-xs text-[#94A3B8] gap-4 relative z-10">
        <div>© 2026 Aurex. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <a
            href="#privacy"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-200 transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#terms"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-200 transition-colors"
          >
            Terms of Service
          </a>
          <a
            href="#security"
            onClick={(e) => e.preventDefault()}
            className="hover:text-slate-200 transition-colors"
          >
            Security
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
