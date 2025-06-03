module.exports = {
  theme: {
    extend: {
      keyframes: {
        'spin-ccw': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(-360deg)' },
        }
      },
      animation: {
        'spin-ccw': 'spin-ccw 1s linear infinite', // Adjust duration and timing function as needed
      }
    },
  },
  plugins: [],
}