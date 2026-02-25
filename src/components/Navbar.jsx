export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6 text-violet-600"
        >
            <path d="M12 2L4 5v6c0 5 3.8 9.7 8 11 4.2-1.3 8-6 8-11V5l-8-3zm-1 13l-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6z"/>
        </svg>
        <span>ReviewCheck</span>
        </div>
        <div className="hidden gap-6 text-sm opacity-80 md:flex">
          <a href="#how" className="hover:opacity-100">How it works</a>
          <a href="#model" className="hover:opacity-100">Model</a>
          <a href="#about" className="hover:opacity-100">About</a>
          <a
            href="https://github.com/your-username/reviewcheck-frontend"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:opacity-100"
            >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                >
                <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.36 6.84 9.71.5.09.66-.22.66-.48 0-.24-.01-.87-.02-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.49-1.1-1.49-.9-.63.07-.62.07-.62 1 .07 1.52 1.04 1.52 1.04.88 1.55 2.31 1.1 2.87.84.09-.66.35-1.1.63-1.35-2.22-.26-4.56-1.14-4.56-5.09 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.04A9.3 9.3 0 0112 6.8c.85.004 1.71.12 2.51.35 1.9-1.31 2.74-1.04 2.74-1.04.55 1.41.2 2.45.1 2.71.64.71 1.03 1.62 1.03 2.74 0 3.96-2.34 4.83-4.57 5.08.36.32.68.95.68 1.92 0 1.39-.01 2.51-.01 2.85 0 .27.16.58.67.48A10.02 10.02 0 0022 12.26C22 6.58 17.52 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}