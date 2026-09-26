interface ArcadeBackButtonProps {
  href?: string;
  label?: string;
}

export default function ArcadeBackButton({ href = '/', label = 'BACK TO MENU' }: ArcadeBackButtonProps) {
  return (
    <a
      href={href}
      className="arcade-back-btn"
    >
      <span className="arcade-selector">&lt;</span>
      <span>{label}</span>
    </a>
  );
}
