export default function LocalVideo({ videoRef }) {
  return (
    <div className="video-tile">
      <video ref={videoRef} autoPlay playsInline muted className="video-feed" />
      <div className="video-label">You</div>
    </div>
  );
}
