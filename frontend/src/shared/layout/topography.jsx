

export default function TopographyBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-20 -z-10"
        style={{
          backgroundImage: "url('/icons/topography.svg')",
          backgroundRepeat: 'repeat',
          backgroundPosition: 'top left',
          backgroundSize: '1200px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/10 via-black/20 to-transparent -z-10" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-t from-transparent to-black/40 -z-10" />
    </>
  );
}