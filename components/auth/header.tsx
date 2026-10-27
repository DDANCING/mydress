interface HeaderProps {
  label: string;
  description?: string;
};

export const Header = ({ label, description }: HeaderProps) => {
  return (
    <div className="w-full">
      <h1 className="font-display text-4xl leading-[1.05] tracking-[-0.02em] text-balance text-foreground sm:text-5xl">
        {label}
      </h1>
      {description && (
        <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
