// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'custom-gradient': 'linear-gradient(139deg, #eba230, #3c483d, #a7067c, #40449b, #8e7db2, #dd9ddb)',
      },
    
    },
  },
  plugins: [],
}