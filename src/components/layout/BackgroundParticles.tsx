import type { CSSProperties } from "react";
import styles from "./BackgroundParticles.module.css";

const particleColors = ["#6C63FF", "#00D4AA", "#FF6B6B", "#FFD93D", "#00BCF2"];

const particles = [
  { size: 3, left: 4, duration: 24, delay: 0, drift: 18 },
  { size: 5, left: 8, duration: 31, delay: 8, drift: -24 },
  { size: 2, left: 13, duration: 19, delay: 3, drift: 12 },
  { size: 4, left: 17, duration: 28, delay: 13, drift: -16 },
  { size: 6, left: 22, duration: 35, delay: 5, drift: 26 },
  { size: 3, left: 27, duration: 22, delay: 16, drift: -20 },
  { size: 5, left: 31, duration: 30, delay: 2, drift: 14 },
  { size: 2, left: 36, duration: 17, delay: 10, drift: -12 },
  { size: 4, left: 40, duration: 26, delay: 18, drift: 22 },
  { size: 6, left: 45, duration: 33, delay: 6, drift: -28 },
  { size: 3, left: 49, duration: 21, delay: 14, drift: 10 },
  { size: 5, left: 54, duration: 29, delay: 4, drift: -18 },
  { size: 2, left: 58, duration: 18, delay: 12, drift: 20 },
  { size: 4, left: 63, duration: 27, delay: 1, drift: -14 },
  { size: 6, left: 67, duration: 34, delay: 9, drift: 30 },
  { size: 3, left: 72, duration: 23, delay: 17, drift: -22 },
  { size: 5, left: 76, duration: 32, delay: 7, drift: 16 },
  { size: 2, left: 81, duration: 16, delay: 15, drift: -10 },
  { size: 4, left: 85, duration: 25, delay: 11, drift: 24 },
  { size: 6, left: 91, duration: 35, delay: 19, drift: -26 },
  { size: 3, left: 96, duration: 20, delay: 6, drift: 12 },
  { size: 4, left: 2, duration: 30, delay: 18, drift: -18 },
  { size: 5, left: 19, duration: 27, delay: 1, drift: 20 },
  { size: 2, left: 25, duration: 15, delay: 9, drift: -12 },
  { size: 6, left: 43, duration: 34, delay: 14, drift: 28 },
  { size: 3, left: 52, duration: 22, delay: 4, drift: -16 },
  { size: 4, left: 70, duration: 29, delay: 12, drift: 18 },
  { size: 5, left: 79, duration: 33, delay: 2, drift: -24 },
  { size: 2, left: 88, duration: 18, delay: 16, drift: 14 },
  { size: 4, left: 98, duration: 26, delay: 7, drift: -20 },
] as const;

export function BackgroundParticles() {
  return (
    <div className={styles.particles} aria-hidden="true">
      {particles.map((particle, index) => (
        <span
          key={`${particle.left}-${particle.delay}`}
          className={styles.particle}
          style={
            {
              "--particle-size": `${particle.size}px`,
              "--particle-left": `${particle.left}%`,
              "--particle-color": particleColors[index % particleColors.length],
              "--particle-duration": `${particle.duration}s`,
              "--particle-delay": `${particle.delay}s`,
              "--particle-drift": `${particle.drift}px`,
              "--particle-end-drift": `${particle.drift * -0.65}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}