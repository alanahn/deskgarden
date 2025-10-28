/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,contexts,hooks,screens,services,utils,App,index}.tsx", // 모든 폴더와 파일을 포함하도록 경로 수정
    "./src/**/*.{js,ts,jsx,tsx}", // 만약 src 폴더가 있다면 이 경로도 포함
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

