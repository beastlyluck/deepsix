type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

const sizes: Record<LogoSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-40 w-40',
};

export function DeepSixLogo({
  size = 'md',
  className = '',
  glowing = false,
}: {
  size?: LogoSize;
  className?: string;
  glowing?: boolean;
}) {
  return (
    <img
      src="/logo/logo.png"
      alt="DEEPSIX"
      className={`${sizes[size]} object-contain ${glowing ? 'drop-shadow-[0_0_18px_#FFD700]' : ''} ${className}`}
    />
  );
}
