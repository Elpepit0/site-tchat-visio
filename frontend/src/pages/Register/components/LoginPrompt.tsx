import '../../../index.css';

function LoginPrompt() {
  return (
    <p className="text-center mt-8 text-gray-400">
      Déjà un compte ?{' '}
      <a
        href="/login"
        className="inline-flex items-center gap-1 text-indigo-400 hover:underline hover:text-indigo-300 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
        </svg>
        Se connecter
      </a>
    </p>
  );
}

export default LoginPrompt;