/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                black: 'rgb(var(--c-black) / <alpha-value>)',
                white: 'rgb(var(--c-white) / <alpha-value>)',
                '#050505': 'rgb(var(--c-dark-bg) / <alpha-value>)',
                '#0a0a0a': 'rgb(var(--c-dark-bg) / <alpha-value>)',
            }
        },
    },
    plugins: [],
}
