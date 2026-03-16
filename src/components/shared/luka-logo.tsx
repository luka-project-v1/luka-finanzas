import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface LukaLogoProps {
  className?: string;
  size?: number;
}

export function LukaLogo({ className, size = 40 }: LukaLogoProps) {
  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <Image
        src="/logo.svg"
        alt="Luka Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}

interface LukaBrandProps {
  className?: string;
}

export function LukaBrand({ className }: LukaBrandProps) {
  return (
    <div className={cn('flex items-center gap-0.5 text-3xl font-bold tracking-tight text-white/90 font-sora', className)}>
      <span className="leading-none">Lu</span>
      <div className="relative w-[0.85em] h-[0.85em] mt-[5px]">
        <Image
          src="/k-logo.svg"
          alt="k"
          fill
          className="object-contain"
          priority
        />
      </div>
      <span className="leading-none">a</span>
    </div>
  );
}
