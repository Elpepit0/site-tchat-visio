import '../../../index.css'

interface VideoStreamsDisplayProps {
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  peers: { peerId: string; stream: MediaStream | null }[];
}

function VideoStreamsDisplay({ localVideoRef, peers }: VideoStreamsDisplayProps) {
  return (
    <div className="flex flex-wrap gap-6 w-full max-w-5xl justify-center items-center">
      <div className="flex flex-col items-center">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-40 h-40 sm:w-56 sm:h-56 rounded-3xl border-2 border-indigo-600 shadow-lg bg-black object-cover"
        />
        <span className="mt-2 text-indigo-300 text-xs font-semibold">Moi</span>
      </div>
      {peers.map(peer => (
        <video
          key={peer.peerId}
          ref={el => {
            if (el && peer.stream) el.srcObject = peer.stream;
          }}
          autoPlay
          playsInline
          className="w-40 h-40 sm:w-56 sm:h-56 rounded-3xl border-2 border-[#36393f] shadow-lg bg-black object-cover"
        />
      ))}
    </div>
  );
}

export default VideoStreamsDisplay;