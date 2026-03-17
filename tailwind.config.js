/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
            },
            colors: {
                // Marca
                brand: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                },
                olivo: {
                    50: '#f4f5e8',
                    100: '#e1e3c8',
                    200: '#ccd1a6',
                    300: '#b2ba7d',
                    400: '#9ea963',
                    500: '#80854b',
                    600: '#64683a',
                    700: '#4d502d',
                    800: '#363820',
                    900: '#212214',
                }
            }
        },
    },
    plugins: [],
}
