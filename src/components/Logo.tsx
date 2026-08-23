interface LogoProps {
  className?: string;
}

export default function Logo({ className = 'w-5 h-5' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3c3.6 3.2 5.5 6.4 5.5 9.3a5.5 5.5 0 1 1-11 0C6.5 9.4 8.4 6.2 12 3Z" />
      <path d="M12 21v-6" />
      <path d="M12 15c-1.8 0-3-1-3-2.6" />
    </svg>
  );
}
