import { motion } from 'framer-motion';

export default function Stars({ value = 0, onChange, disabled = false }) {
  return (
    <div className="flex justify-center gap-3">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <motion.button
            key={n}
            type="button"
            disabled={disabled}
            whileTap={{ scale: disabled ? 1 : 1.25 }}
            onClick={() => !disabled && onChange?.(n)}
            className={`star-btn ${disabled ? 'opacity-40' : ''}`}
            aria-label={`${n} звёзд`}
          >
            <span
              style={{
                color: active ? '#fbbf24' : 'rgba(255,255,255,0.25)',
                transition: 'color 0.15s',
              }}
            >
              ★
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}