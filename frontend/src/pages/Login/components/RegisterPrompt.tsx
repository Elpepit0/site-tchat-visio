import '../../../index.css';
function RegisterPrompt() {
  return (
    <p className="text-center mt-8 text-gray-400">
      Pas encore inscrit ?{' '}
      <a
        href="/register"
        className="inline-flex items-center gap-1 text-indigo-400 hover:underline hover:text-indigo-300 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        S'inscrire
      </a>
    </p>
  );
}

export default RegisterPrompt;