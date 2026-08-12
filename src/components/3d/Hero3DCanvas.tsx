'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  radius: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  originalZ: number;
}

interface Shape3D {
  x: number;
  y: number;
  z: number;
  size: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  rotSpeedX: number;
  rotSpeedY: number;
  type: 'cube' | 'pyramid';
  color: string;
}

export function Hero3DCanvas(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const updateSize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const newWidth = rect.width || window.innerWidth;
      const newHeight = rect.height || window.innerHeight;
      
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
      }
    };

    updateSize();

    let width = canvas.width || window.innerWidth;
    let height = canvas.height || window.innerHeight;

    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
      width = canvas.width;
      height = canvas.height;
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const colors = [
      'rgba(99, 102, 241, 0.85)',  // Vivid Indigo
      'rgba(56, 189, 248, 0.85)',  // Sky blue
      'rgba(168, 85, 247, 0.75)',  // Purple
      'rgba(6, 182, 212, 0.8)',   // Cyan
    ];

    // Generate 3D Particles
    const particleCount = 75;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const z = Math.random() * 500 + 50;
      particles.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z,
        originalZ: z,
        radius: Math.random() * 2.5 + 1.2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Generate 3D wireframe shapes
    const shapes: Shape3D[] = [
      {
        x: -width * 0.32,
        y: -height * 0.12,
        z: 280,
        size: 50,
        rotX: 0.2,
        rotY: 0.4,
        rotZ: 0.1,
        rotSpeedX: 0.006,
        rotSpeedY: 0.009,
        type: 'cube',
        color: 'rgba(99, 102, 241, 0.65)',
      },
      {
        x: width * 0.33,
        y: height * 0.08,
        z: 240,
        size: 60,
        rotX: 0.5,
        rotY: 0.1,
        rotZ: 0.3,
        rotSpeedX: -0.007,
        rotSpeedY: 0.008,
        type: 'cube',
        color: 'rgba(56, 189, 248, 0.65)',
      },
      {
        x: width * 0.26,
        y: -height * 0.22,
        z: 320,
        size: 40,
        rotX: 0.1,
        rotY: 0.8,
        rotZ: 0.4,
        rotSpeedX: 0.008,
        rotSpeedY: -0.005,
        type: 'pyramid',
        color: 'rgba(192, 132, 252, 0.7)',
      },
    ];

    const fov = 400; // Field of view depth

    // Cube vertices relative to center
    const cubeVertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1],
    ];
    const cubeEdges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7]
    ];

    // Pyramid vertices
    const pyramidVertices = [
      [0, -1.3, 0],   // Top apex
      [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1] // Base
    ];
    const pyramidEdges = [
      [0,1],[0,2],[0,3],[0,4],
      [1,2],[2,3],[3,4],[4,1]
    ];

    const project = (x: number, y: number, z: number) => {
      const currentWidth = canvas.width || width;
      const currentHeight = canvas.height || height;
      const scale = fov / (fov + z);
      return {
        x: x * scale + currentWidth / 2,
        y: y * scale + currentHeight / 2,
        scale,
      };
    };

    const render = () => {
      const currentWidth = canvas.width || width;
      const currentHeight = canvas.height || height;

      // Smooth mouse easing
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      const offsetX = (mouse.x - currentWidth / 2) * 0.15;
      const offsetY = (mouse.y - currentHeight / 2) * 0.15;

      ctx.clearRect(0, 0, currentWidth, currentHeight);

      // Render projected particles & connect lines
      const projectedParticles: { x: number; y: number; scale: number; p: Particle }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        if (Math.abs(p.x) > currentWidth) p.vx *= -1;
        if (Math.abs(p.y) > currentHeight) p.vy *= -1;
        if (p.z < 50 || p.z > 600) p.vz *= -1;

        const projected = project(p.x + offsetX, p.y + offsetY, p.z);
        projectedParticles.push({ ...projected, p });

        // Draw particle node
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, Math.max(0.8, p.radius * projected.scale), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 14 * projected.scale;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw subtle web connection lines between nearby projected particles
      for (let i = 0; i < projectedParticles.length; i++) {
        for (let j = i + 1; j < projectedParticles.length; j++) {
          const p1 = projectedParticles[i];
          const p2 = projectedParticles[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.35 * Math.min(p1.scale, p2.scale);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }
      }

      // Render 3D Wireframe Shapes
      shapes.forEach((shape) => {
        shape.rotX += shape.rotSpeedX;
        shape.rotY += shape.rotSpeedY;

        const vertices = shape.type === 'cube' ? cubeVertices : pyramidVertices;
        const edges = shape.type === 'cube' ? cubeEdges : pyramidEdges;

        const transformed: { x: number; y: number; scale: number }[] = [];

        vertices.forEach(([vx, vy, vz]) => {
          let rx = vx * shape.size;
          let ry = vy * shape.size;
          let rz = vz * shape.size;

          // Rotate around X
          const cosX = Math.cos(shape.rotX);
          const sinX = Math.sin(shape.rotX);
          const y1 = ry * cosX - rz * sinX;
          const z1 = ry * sinX + rz * cosX;

          // Rotate around Y
          const cosY = Math.cos(shape.rotY);
          const sinY = Math.sin(shape.rotY);
          const x2 = rx * cosY + z1 * sinY;
          const z2 = -rx * sinY + z1 * cosY;

          // Rotate around Z
          const cosZ = Math.cos(shape.rotZ);
          const sinZ = Math.sin(shape.rotZ);
          const x3 = x2 * cosZ - y1 * sinZ;
          const y3 = x2 * sinZ + y1 * cosZ;

          const proj = project(shape.x + x3 + offsetX * 0.7, shape.y + y3 + offsetY * 0.7, shape.z + z2);
          transformed.push(proj);
        });

        // Draw edges
        ctx.beginPath();
        edges.forEach(([start, end]) => {
          const pStart = transformed[start];
          const pEnd = transformed[end];
          if (pStart && pEnd) {
            ctx.moveTo(pStart.x, pStart.y);
            ctx.lineTo(pEnd.x, pEnd.y);
          }
        });
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = 18;
        ctx.shadowColor = shape.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-90 block"
    />
  );
}
