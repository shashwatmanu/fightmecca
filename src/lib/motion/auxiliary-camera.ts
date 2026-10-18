/**
 * Fight Mecca Auxiliary Camera Foundation (Phone Pairing & WebRTC Synchronization)
 */

export interface CameraDeviceRegistration {
  deviceId: string;       // e.g. 'CAMERA_1', 'CAMERA_2'
  role: 'PRIMARY_LAPTOP' | 'AUXILIARY_PHONE' | 'SECONDARY_OVERHEAD';
  label: string;
  connectedAtIso: string;
  peerId?: string;
  isOnline: boolean;
  stream?: MediaStream;
}

export interface CaptureSessionPairing {
  sessionId: string;
  pairingCode: string;
  qrCodeUrl: string;
  createdAtIso: string;
  devices: CameraDeviceRegistration[];
}

export interface CameraSyncDiagnostic {
  sessionId: string;
  primaryCameraTimestampMs: number;
  auxiliaryCameraTimestampMs: number;
  estimatedClockOffsetMs: number;
  syncQuality: 'HIGH' | 'MEDIUM' | 'POOR' | 'DISCONNECTED';
}

export class AuxiliaryCameraManager {
  private currentSession: CaptureSessionPairing | null = null;
  private listeners: Set<(session: CaptureSessionPairing) => void> = new Set();
  private peerConnection: RTCPeerConnection | null = null;

  /**
   * Initializes a new multi-camera pairing session.
   */
  public createPairingSession(hostUrl: string): CaptureSessionPairing {
    const sessionId = `cap_session_${Math.random().toString(36).substring(2, 9)}`;
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    const pairingUrl = `${hostUrl}/train/cameras?session=${sessionId}&code=${pairingCode}`;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pairingUrl)}`;

    const primaryDevice: CameraDeviceRegistration = {
      deviceId: 'CAMERA_1',
      role: 'PRIMARY_LAPTOP',
      label: 'Primary Laptop Webcam',
      connectedAtIso: new Date().toISOString(),
      isOnline: true,
    };

    this.currentSession = {
      sessionId,
      pairingCode,
      qrCodeUrl,
      createdAtIso: new Date().toISOString(),
      devices: [primaryDevice],
    };

    this.notifyListeners();
    return this.currentSession;
  }

  /**
   * Initializes WebRTC RTCPeerConnection on host or phone.
   */
  public createPeerConnection(onRemoteStream?: (stream: MediaStream) => void): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0] && onRemoteStream) {
        onRemoteStream(event.streams[0]);
      }
    };

    this.peerConnection = pc;
    return pc;
  }

  /**
   * Registers a paired phone camera as CAMERA_2.
   */
  public registerAuxiliaryCamera(
    sessionId: string,
    deviceName: string = 'Paired Phone',
    stream?: MediaStream
  ): CameraDeviceRegistration | null {
    if (!this.currentSession || this.currentSession.sessionId !== sessionId) {
      return null;
    }

    const auxDevice: CameraDeviceRegistration = {
      deviceId: `CAMERA_${this.currentSession.devices.length + 1}`,
      role: 'AUXILIARY_PHONE',
      label: deviceName,
      connectedAtIso: new Date().toISOString(),
      isOnline: true,
      stream,
    };

    this.currentSession.devices.push(auxDevice);
    this.notifyListeners();
    return auxDevice;
  }

  /**
   * Computes clock offset and synchronization status.
   */
  public computeSyncDiagnostics(tPrimaryMs: number, tAuxMs: number): CameraSyncDiagnostic {
    const offset = tAuxMs - tPrimaryMs;
    const absDiff = Math.abs(offset);

    let syncQuality: 'HIGH' | 'MEDIUM' | 'POOR' | 'DISCONNECTED' = 'HIGH';
    if (absDiff > 100) syncQuality = 'POOR';
    else if (absDiff > 33) syncQuality = 'MEDIUM';

    return {
      sessionId: this.currentSession?.sessionId || 'unpaired',
      primaryCameraTimestampMs: tPrimaryMs,
      auxiliaryCameraTimestampMs: tAuxMs,
      estimatedClockOffsetMs: offset,
      syncQuality,
    };
  }

  public subscribe(listener: (session: CaptureSessionPairing) => void) {
    this.listeners.add(listener);
    if (this.currentSession) listener(this.currentSession);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    if (this.currentSession) {
      this.listeners.forEach((l) => l(this.currentSession!));
    }
  }
}

export const auxiliaryCameraManager = new AuxiliaryCameraManager();
