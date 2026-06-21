/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './app/**/*.{js,ts,tsx}', './features/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Home screen palette — deep navy field, raised card, sand ink, warm gold.
        ink: '#0A0F1A',
        'ink-raised': '#141F30',
        sand: '#EADFC8',
        'sand-dim': '#8A8676',
        gold: '#E4C892',
        'gold-deep': '#D2B271',
        'grid-low': '#39705A',
        'grid-high': '#6FA98A',
      },
      fontFamily: {
        // Display = Fraunces (editorial serif); Sans = Hanken Grotesk (quiet grotesk).
        display: ['Fraunces_600SemiBold'],
        'display-bold': ['Fraunces_700Bold'],
        'display-black': ['Fraunces_900Black'],
        sans: ['HankenGrotesk_400Regular'],
        'sans-medium': ['HankenGrotesk_500Medium'],
        'sans-semibold': ['HankenGrotesk_600SemiBold'],
      },
    },
  },
  plugins: [],
};
