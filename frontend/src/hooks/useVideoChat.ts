import { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export function useVideoChat(roomId: string) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [inCall, setInCall] = useState(false);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    socketRef.current = io('http://10.1.35.154:5000', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('user-joined', () => {
      console.log('Un utilisateur a rejoint, je suis initiateur');
      createPeer(true);
    });

    socketRef.current.on('offer', async (offer: RTCSessionDescriptionInit) => {
      console.log('Offre reçue, je suis receveur');
      createPeer(false);
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            peerRef.current!.addTrack(track, localStreamRef.current!);
          });
        }
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socketRef.current.emit('answer', { room: roomId, answer });
      }
    });

    socketRef.current.on('answer', async (answer: RTCSessionDescriptionInit) => {
      console.log('Réponse reçue');
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socketRef.current.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
      console.log('Candidat ICE reçu');
      try {
        if (peerRef.current) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.error(e);
      }
    });

    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId]);

  const createPeer = (isInitiator: boolean) => {
    if (peerRef.current) return;

    peerRef.current = new RTCPeerConnection();

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', { room: roomId, candidate: event.candidate });
      }
    };

    peerRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (isInitiator && localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerRef.current!.addTrack(track, localStreamRef.current!);
      });

      peerRef.current.createOffer().then(offer => {
        peerRef.current!.setLocalDescription(offer);
        socketRef.current.emit('offer', { room: roomId, offer });
      });
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
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    socketRef.current.emit('leave-room', roomId);
    setInCall(false);
  };

  return {
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    inCall,
    connected,
  };
}
