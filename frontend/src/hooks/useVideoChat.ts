import { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

interface PeerInfo {
  peerId: string;
  peer: RTCPeerConnection;
  stream: MediaStream | null;
}

export function useGroupVideoChat(roomId: string) {
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [inCall, setInCall] = useState(false);
  const [connected, setConnected] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<any>(null);

  // Pour garder la liste des peers à jour dans les callbacks
  const peersRef = useRef<PeerInfo[]>([]);
  useEffect(() => { peersRef.current = peers; }, [peers]);

  useEffect(() => {
    socketRef.current = io(window.location.origin, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    socketRef.current.on('all-users', (users: string[]) => {
      users.forEach(peerId => {
        if (!peersRef.current.find(p => p.peerId === peerId)) {
          createPeer(peerId, true);
        }
      });
    });

    socketRef.current.on('user-joined', (peerId: string) => {
      if (!peersRef.current.find(p => p.peerId === peerId)) {
        createPeer(peerId, false);
      }
    });

    socketRef.current.on('offer', async ({ from, offer }: { from: string, offer: RTCSessionDescriptionInit }) => {
      const peerInfo = peersRef.current.find(p => p.peerId === from);
      if (peerInfo && peerInfo.peer) {
        await peerInfo.peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerInfo.peer.createAnswer();
        await peerInfo.peer.setLocalDescription(answer);
        socketRef.current.emit('answer', { to: from, answer, room: roomId });
      }
    });

    socketRef.current.on('answer', async ({ from, answer }: { from: string, answer: RTCSessionDescriptionInit }) => {
      const peerInfo = peersRef.current.find(p => p.peerId === from);
      if (peerInfo && peerInfo.peer) {
        await peerInfo.peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socketRef.current.on('ice-candidate', async ({ from, candidate }: { from: string, candidate: RTCIceCandidateInit }) => {
      const peerInfo = peersRef.current.find(p => p.peerId === from);
      if (peerInfo && peerInfo.peer) {
        try {
          await peerInfo.peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          // ignore
        }
      }
    });

    socketRef.current.on('user-left', (peerId: string) => {
      setPeers(prev => {
        const peerInfo = prev.find(p => p.peerId === peerId);
        if (peerInfo && peerInfo.peer) {
          peerInfo.peer.close();
        }
        return prev.filter(p => p.peerId !== peerId);
      });
    });

    return () => {
      socketRef.current.disconnect();
      setPeers([]);
    };
  }, [roomId]);

  const createPeer = (peerId: string, initiator: boolean) => {
    const peer = new RTCPeerConnection();

    // Ajoute les tracks locaux
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          to: peerId,
          candidate: event.candidate,
          room: roomId,
        });
      }
    };

    // Quand on reçoit un stream distant
    peer.ontrack = (event) => {
      setPeers(prev => prev.map(p =>
        p.peerId === peerId ? { ...p, stream: event.streams[0] } : p
      ));
      // La vidéo sera mise à jour dans le composant parent via peer.stream
    };

    // Ajoute le peer à la liste
    setPeers(prev => [
      ...prev,
      { peerId, peer, stream: null }
    ]);

    // Si initiateur, crée une offre
    if (initiator) {
      peer.onnegotiationneeded = async () => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socketRef.current.emit('offer', { to: peerId, offer, room: roomId });
      };
    }
  };

  const startCall = async () => {
    localStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    socketRef.current.emit('join-room', roomId);
    setInCall(true);
  };

  const endCall = () => {
    peersRef.current.forEach(p => {
      if (p.peer) p.peer.close();
    });
    setPeers([]);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    socketRef.current.emit('leave-room', roomId);
    setInCall(false);
  };

  return {
    localVideoRef,
    peers,
    startCall,
    endCall,
    inCall,
    connected,
  };
}