export function PackLoadingScreen({ tierColor }: { tierColor: string }) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-950">
      <style>{`
        .pyramid {
          position: relative;
          width: 200px;
          height: 200px;
          transform-style: preserve-3d;
          animation: pyramidRotate 4s linear infinite;
        }
        @keyframes pyramidRotate {
          0% { transform: rotateX(-30deg) rotateY(0deg); }
          100% { transform: rotateX(-30deg) rotateY(360deg); }
        }
        .pyramid-faces {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }
        .pyramid-face {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(#7a4a00, #ffd700);
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          transform-origin: bottom;
        }
        .pyramid-face:nth-child(1) { transform: rotateY(calc(90deg * 0)) translateZ(99px) rotateX(30deg); }
        .pyramid-face:nth-child(2) { transform: rotateY(calc(90deg * 1)) translateZ(99px) rotateX(30deg); }
        .pyramid-face:nth-child(3) { transform: rotateY(calc(90deg * 2)) translateZ(99px) rotateX(30deg); }
        .pyramid-face:nth-child(4) { transform: rotateY(calc(90deg * 3)) translateZ(99px) rotateX(30deg); }
        .pyramid-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #ffd700;
          transform: rotateX(90deg) translateZ(-150px);
          filter: blur(20px);
          box-shadow: 0 0 500px #ffd700;
        }
        @keyframes fadeText {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="pyramid">
        <div className="pyramid-glow" />
        <div className="pyramid-faces">
          <div className="pyramid-face" />
          <div className="pyramid-face" />
          <div className="pyramid-face" />
          <div className="pyramid-face" />
        </div>
      </div>

      <p
        className="mt-21 text-sm tracking-widest uppercase"
        style={{
          color: "#ffd700",
          animation: "fadeText 2s ease-in-out infinite",
        }}
      >
        Preparing your pack...
      </p>
    </div>
  );
}
