import { motion } from 'framer-motion';
import omLogo from '../assets/image.png';

interface OmSymbolProps {
  size?: number;
  className?: string;
  animated?: boolean;
  variant?: 'default' | 'glowing' | 'floating' | 'spinning' | 'mandala' | 'divine';
}

const OmSymbol = ({ 
  size = 40, 
  className = "", 
  animated = false,
  variant = 'default'
}: OmSymbolProps) => {
  const getAnimationProps = () => {
    switch (variant) {
      case 'glowing':
        return {
          animate: { 
            filter: ['drop-shadow(0 0 15px rgba(249, 115, 22, 0.6))', 'drop-shadow(0 0 25px rgba(249, 115, 22, 0.9))', 'drop-shadow(0 0 15px rgba(249, 115, 22, 0.6))'],
            scale: [1, 1.05, 1]
          },
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const }
        };
      case 'floating':
        return {
          animate: { y: [-8, 8, -8] },
          transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const }
        };
      case 'spinning':
        return {
          animate: { rotate: 360 },
          transition: { duration: 12, repeat: Infinity, ease: "linear" as const }
        };
      case 'mandala':
        return {
          animate: { 
            rotate: [0, 360],
            scale: [1, 1.03, 1]
          },
          transition: { 
            rotate: { duration: 30, repeat: Infinity, ease: "linear" as const },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" as const }
          }
        };
      case 'divine':
        return {
          animate: { 
            rotate: [0, 360],
            scale: [1, 1.05, 1],
            filter: ['drop-shadow(0 0 20px rgba(249, 115, 22, 0.7))', 'drop-shadow(0 0 30px rgba(249, 115, 22, 1))', 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.7))']
          },
          transition: { 
            rotate: { duration: 25, repeat: Infinity, ease: "linear" as const },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
            filter: { duration: 2, repeat: Infinity, ease: "easeInOut" as const }
          }
        };
      default:
        return {};
    }
  };

  const OmImage = () => (
    <img
      src={omLogo}
      alt="Om Symbol"
      width={size}
      height={size}
      className={`${className} object-contain`}
      style={{
        filter: 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.3))'
      }}
    />
  );

  if (animated) {
    return (
      <motion.div
        {...getAnimationProps()}
        className="inline-block"
        style={{ display: 'inline-block' }}
      >
        <OmImage />
      </motion.div>
    );
  }

  return <OmImage />;
};

export default OmSymbol;