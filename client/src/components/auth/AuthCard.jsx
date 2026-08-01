import { motion } from 'framer-motion';
import LoginForm from './LoginForm.jsx';

export const AuthCard = () => {
  return (
    <div className="w-full max-w-[440px] relative z-10 mx-auto">
      {/* Top Header Logo & Brand */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent inline-block select-none">
          Aurex AI
        </h1>
      </motion.div>

      {/* Main Glassmorphic Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="bg-[#141B2D] border border-[#2A3247] rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        {/* Card Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
            Welcome back
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-[320px] mx-auto">
            Enter your credentials to access your developer dashboard
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />
      </motion.div>
    </div>
  );
};

export default AuthCard;
