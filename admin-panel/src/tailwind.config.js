module.exports = {
  darkMode: 'class', // <--- Эта строчка обязательна!
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': '0.875rem',   // Было 0.75rem  (теперь как старый sm)
        'sm': '1rem',       // Было 0.875rem (теперь как старый base)
        'base': '1.125rem', // Было 1rem     (теперь как старый lg)
        'lg': '1.25rem',    // Было 1.125rem (теперь как старый xl)
        'xl': '1.5rem',     // Было 1.25rem
        '2xl': '1.875rem',  // Было 1.5rem
        '3xl': '2.25rem',
      }
    },
  },
  plugins: [],
}