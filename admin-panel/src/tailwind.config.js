module.exports = {
  darkMode: 'class', // <--- Эта строчка обязательна!
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': '0.9rem',  
        'sm': '1.125rem',       
        'base': '1.3rem', 
        'lg': '1.45rem',    
        'xl': '1.7rem',     
        '2xl': '1.95rem',  
        '3xl': '2.5rem',
      }
    },
  },
  plugins: [],
}