module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/Analytics/Analytics.tsx",
    "./pages/Analytics/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
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