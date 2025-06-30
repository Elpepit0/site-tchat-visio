import React from 'react';

interface SpinnerProps {
  message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message = "Chargement..." }) => {
  return (
    <div className="flex items-center justify-center h-screen text-xl bg-[#23272a] text-gray-200">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4">{message}</p>
      </div>
    </div>
  );
};

export default Spinner;
