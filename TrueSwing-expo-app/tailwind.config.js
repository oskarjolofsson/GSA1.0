/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './app/**/*.{js,ts,tsx}', './features/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Defined in lib/colors.js so
      // that components needing a raw value (icon `color` props, gradients, the native
      // tab bar) read the same numbers these class tokens are built from.
      colors: require('./lib/colors'),
      fontFamily: {
        // Display = Fraunces (editorial serif); Sans = Hanken Grotesk (quiet grotesk).
        display: ['Fraunces_600SemiBold'],
        'display-bold': ['Fraunces_700Bold'],
        'display-black': ['Fraunces_900Black'],
        sans: ['HankenGrotesk_400Regular'],
        'sans-medium': ['HankenGrotesk_500Medium'],
        'sans-semibold': ['HankenGrotesk_600SemiBold'],
        'sans-bold': ['HankenGrotesk_700Bold'],
      },
    },
  },
  plugins: [],
};
