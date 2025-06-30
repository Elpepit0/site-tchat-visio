import '../../../index.css'
interface CallControlsProps {
  inCall: boolean;
  startCall: () => void;
  endCall: () => void;
}

function CallControls({ inCall, startCall, endCall }: CallControlsProps) {
  return (
    <div className="pt-8 flex gap-4">
      {!inCall ? (
        <button
          onClick={startCall}
          className="bg-green-600 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-green-700 shadow-md transition text-base"
        >
          Démarrer l'appel
        </button>
      ) : (
        <button
          onClick={endCall}
          className="bg-red-600 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-red-700 shadow-md transition text-base"
        >
          Terminer l'appel
        </button>
      )}
    </div>
  );
}

export default CallControls;