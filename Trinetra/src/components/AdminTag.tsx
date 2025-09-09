import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface AdminTagProps {
  className?: string;
  variant?: 'default' | 'compact';
}

const AdminTag = ({ className = "", variant = 'default' }: AdminTagProps) => {
  const isCompact = variant === 'compact';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`inline-flex items-center ${className}`}
    >
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg border border-red-400">
        <div className="flex items-center space-x-1">
          <Shield size={isCompact ? 10 : 12} />
          <span>{isCompact ? 'ADMIN' : 'ADMIN ACCESS'}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminTag;
