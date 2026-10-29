"use client";

import { useEffect, useRef } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";

/** Visor 360 equirectangular a pantalla completa (Photo Sphere Viewer). */
export function PanoViewer({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new Viewer({
      container: containerRef.current,
      panorama: src,
      navbar: ["zoom", "move", "fullscreen"],
      loadingTxt: "Cargando…",
      touchmoveTwoFingers: false,
      mousewheel: true,
    });
    viewerRef.current = viewer;
    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [src]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export default PanoViewer;
