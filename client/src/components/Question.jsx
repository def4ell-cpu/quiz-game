import { motion } from 'framer-motion';

export default function Question({ text, category, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto px-4"
    >
      {category && (
        <p className="text-center text-spark-accent uppercase tracking-widest text-xs mb-2">
          {category}
        </p>
      )}
      <div className="rounded-3xl bg-gradient-to-br from-spark-primary/25 to-indigo-500/15 border border-white/10 p-6 shadow-2xl">
        <p className="text-2xl sm:text-3xl font-extrabold text-center leading-snug">
          {text}
        </p>
        {subtitle && (
          <p className="text-center text-white/60 mt-4 text-sm">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}