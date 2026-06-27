"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Loader2 } from "lucide-react";

export function ModelViewer3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dressMeshRef = useRef<THREE.Mesh | null>(null);
  const dressWireframeRef = useRef<THREE.Mesh | null>(null);
  const dressOutlineRef = useRef<THREE.LineLoop | null>(null);
  const dressDetailsGroupRef = useRef<THREE.Group | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDress, setShowDress] = useState(true); // Toggle to show dress on model

  // Dynamically toggle WebGL dress layers visibility based on state
  useEffect(() => {
    if (dressMeshRef.current) {
      dressMeshRef.current.visible = showDress;
    }
    if (dressWireframeRef.current) {
      dressWireframeRef.current.visible = showDress;
    }
    if (dressOutlineRef.current) {
      dressOutlineRef.current.visible = showDress;
    }
    if (dressDetailsGroupRef.current) {
      dressDetailsGroupRef.current.visible = showDress;
    }
  }, [showDress]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Controls (Locked to 2D view: rotate disabled, pan disabled, zoom enabled)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 15;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    let animationFrameId: number;

    // 6. Loader
    const loader = new PLYLoader();
    loader.load(
      "/meshes_try.ply",
      (geometry) => {
        geometry.computeVertexNormals();
        geometry.center();

        // Auto-scale the mesh to a standard visual height of 3.8 units
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox!;
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.8 / (maxDim || 1);

        // Highly refined scaling factors to stretch legs/neck and compress width for a tall, elegant 24yo woman
        const widthScale = 0.80; 
        const heightScale = 1.28; 

        // 1. Flat forest green silhouette body mesh
        const bodyMaterial = new THREE.MeshBasicMaterial({
          color: 0x091713, // Solid deep background green
        });
        const bodyMesh = new THREE.Mesh(geometry, bodyMaterial);
        bodyMesh.scale.set(scale * widthScale, scale * heightScale, scale * widthScale);
        scene.add(bodyMesh);

        // 2. High-tech mesh wireframe grid overlay
        const wireframeMaterial = new THREE.MeshBasicMaterial({
          color: 0xb0e4cc, // Mint green grid
          wireframe: true,
          transparent: true,
          opacity: 0.15, // Subtle overlay intensity
          depthWrite: false,
        });
        const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
        // Scale wireframe slightly larger to render on top of the solid silhouette, matching adult woman proportions
        wireframeMesh.scale.set(scale * 1.002 * widthScale, scale * 1.002 * heightScale, scale * 1.002 * widthScale);
        scene.add(wireframeMesh);

        // 2. Glowing mint border outline using shell technique
        const outlineMaterial = new THREE.MeshBasicMaterial({
          color: 0xb0e4cc, // Mint green border
          side: THREE.BackSide,
        });
        const outlineMesh = new THREE.Mesh(geometry, outlineMaterial);
        outlineMesh.scale.set(scale * 1.018 * widthScale, scale * 1.018 * heightScale, scale * 1.018 * widthScale);
        scene.add(outlineMesh);

        // 3. Custom Curvy Dress Geometry mapped to anatomically fit the 3.8-unit body model
        // We use a tapered horizontal offset because the model's head/neck are centered (xOff ~ -0.015)
        // while the hips and waist are shifted left (xOff ~ -0.050).
        const xOffNeck = -0.015;
        const xOffSleeve = -0.025;
        const xOffArmpit = -0.035;
        const xOffBody = -0.050; // Waist, hip, and hem

        const dressShape = new THREE.Shape();

        // Start at left neck base (narrowed neck hole from 0.25 to 0.21 to cover collarbone gaps)
        dressShape.moveTo(-0.21 + xOffNeck, 1.37);

        // Scoop neck curve: shallower scoop (dips to 1.15) to cover chest gaps
        dressShape.bezierCurveTo(-0.10 + xOffNeck, 1.15, 0.10 + xOffNeck, 1.15, 0.21 + xOffNeck, 1.37);

        // Right shoulder slope to sleeve end (shoulder slope starts at 0.21 neck hole)
        dressShape.bezierCurveTo(0.36 + xOffNeck, 1.41, 0.52 + xOffNeck, 1.36, 0.62 + xOffSleeve, 1.08);

        // Right sleeve bottom hem meeting bodice at armpit
        dressShape.quadraticCurveTo(0.58 + xOffArmpit, 1.00, 0.51 + xOffArmpit, 0.96);

        // Right side bodice & hip contour to skirt hem
        dressShape.bezierCurveTo(0.42 + xOffBody, 0.52, 0.60 + xOffBody, 0.07, 0.72 + xOffBody, -0.92);

        // Bottom skirt hem curve
        dressShape.bezierCurveTo(0.36 + xOffBody, -1.00, -0.36 + xOffBody, -1.00, -0.72 + xOffBody, -0.92);

        // Left side bodice & hip contour up to armpit
        dressShape.bezierCurveTo(-0.60 + xOffBody, 0.07, -0.42 + xOffBody, 0.52, -0.51 + xOffArmpit, 0.96);

        // Left sleeve bottom hem meeting sleeve cap
        dressShape.quadraticCurveTo(-0.58 + xOffArmpit, 1.00, -0.62 + xOffSleeve, 1.08);

        // Left sleeve cap curve up to shoulder and neck base
        dressShape.bezierCurveTo(-0.58 + xOffSleeve, 1.24, -0.36 + xOffNeck, 1.41, -0.21 + xOffNeck, 1.37);

        dressShape.closePath();

        // 4. Opaque solid pink dress body fill
        const dressGeometry = new THREE.ShapeGeometry(dressShape);
        const dressMaterial = new THREE.MeshBasicMaterial({
          color: 0xff4b82, // Vibrant flat pink fill
          transparent: false, // Fully opaque to hide body/mesh underneath
          depthTest: false, // Draw on top of the 3D body scanner mesh
        });
        const dressMesh = new THREE.Mesh(dressGeometry, dressMaterial);
        dressMesh.position.z = 0.05; 
        dressMesh.scale.set(widthScale, heightScale, 1); // Scale dress to match adult woman proportions
        dressMesh.renderOrder = 99; // Ensure WebGL renders this on top of body silhouette and wireframe
        dressMesh.visible = showDress;
        scene.add(dressMesh);
        dressMeshRef.current = dressMesh;

        // 5. Subdivided fabric mesh grid overlay (gives the dress a detailed 3D structure grid)
        const dressWireframeMaterial = new THREE.MeshBasicMaterial({
          color: 0xffa3c2, // Lighter glowing pink grid
          wireframe: true,
          transparent: true,
          opacity: 0.04, // Subtle structural lines
          depthTest: false,
        });
        const dressWireframeMesh = new THREE.Mesh(dressGeometry, dressWireframeMaterial);
        dressWireframeMesh.position.z = 0.055;
        dressWireframeMesh.scale.set(widthScale, heightScale, 1);
        dressWireframeMesh.renderOrder = 99.5;
        dressWireframeMesh.visible = showDress;
        scene.add(dressWireframeMesh);
        dressWireframeRef.current = dressWireframeMesh;

        // 6. WebGL Dress Dashed Outline
        const points = dressShape.getPoints(120); // High-res point interpolation for ultra-smooth lines
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const dressOutlineMaterial = new THREE.LineDashedMaterial({
          color: 0xff4b82, // Glowing pink outline
          dashSize: 0.06,
          gapSize: 0.03,
          transparent: true,
          opacity: 0.9,
          depthTest: false,
        });
        const dressOutline = new THREE.LineLoop(lineGeometry, dressOutlineMaterial);
        dressOutline.position.z = 0.06;
        dressOutline.scale.set(widthScale, heightScale, 1);
        dressOutline.renderOrder = 100; // Render on top of solid fill
        dressOutline.computeLineDistances(); // Required for dashed rendering
        dressOutline.visible = showDress;
        scene.add(dressOutline);
        dressOutlineRef.current = dressOutline;

        // 7. Custom blueprint design lines (waistband, collar, folds, creases)
        const dressDetailsGroup = new THREE.Group();
        dressDetailsGroup.scale.set(widthScale, heightScale, 1);
        
        const detailLineMaterial = new THREE.LineBasicMaterial({
          color: 0xffa3c2,
          transparent: true,
          opacity: 0.6,
          depthTest: false,
        });

        const detailDashedMaterial = new THREE.LineDashedMaterial({
          color: 0xffa3c2,
          dashSize: 0.04,
          gapSize: 0.02,
          transparent: true,
          opacity: 0.5,
          depthTest: false,
        });

        // 7a. Collar seam (scooped, shifted to match Y = 1.37 and neck width = 0.21)
        const collarPath = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-0.20 + xOffNeck, 1.31, 0.06),
          new THREE.Vector3(xOffNeck, 1.10, 0.06),
          new THREE.Vector3(0.20 + xOffNeck, 1.31, 0.06)
        );
        const collarGeo = new THREE.BufferGeometry().setFromPoints(collarPath.getPoints(30));
        const collarLine = new THREE.Line(collarGeo, detailDashedMaterial);
        collarLine.computeLineDistances();
        collarLine.renderOrder = 101;
        dressDetailsGroup.add(collarLine);

        // 7b. Waistband (double horizontal border, shifted up to match Y = 0.42)
        const waistTopPoints = [
          new THREE.Vector3(-0.48 + xOffBody, 0.42, 0.06),
          new THREE.Vector3(0.48 + xOffBody, 0.42, 0.06)
        ];
        const waistTopGeo = new THREE.BufferGeometry().setFromPoints(waistTopPoints);
        const waistTopLine = new THREE.Line(waistTopGeo, detailLineMaterial);
        waistTopLine.renderOrder = 101;
        dressDetailsGroup.add(waistTopLine);

        const waistBottomPoints = [
          new THREE.Vector3(-0.48 + xOffBody, 0.36, 0.06),
          new THREE.Vector3(0.48 + xOffBody, 0.36, 0.06)
        ];
        const waistBottomGeo = new THREE.BufferGeometry().setFromPoints(waistBottomPoints);
        const waistBottomLine = new THREE.Line(waistBottomGeo, detailLineMaterial);
        waistBottomLine.renderOrder = 101;
        dressDetailsGroup.add(waistBottomLine);

        // 7c. Skirt Drape creases (flow lines from waist down to hem, shifted up by +0.02)
        // Center fold
        const centerCreasePath = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(xOffBody, 0.36, 0.06),
          new THREE.Vector3(xOffBody - 0.02, -0.28, 0.06),
          new THREE.Vector3(xOffBody, -0.94, 0.06)
        );
        const centerCreaseGeo = new THREE.BufferGeometry().setFromPoints(centerCreasePath.getPoints(20));
        const centerCreaseLine = new THREE.Line(centerCreaseGeo, detailLineMaterial);
        centerCreaseLine.renderOrder = 101;
        dressDetailsGroup.add(centerCreaseLine);

        // Left fold
        const leftCreasePath = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-0.15 + xOffBody, 0.36, 0.06),
          new THREE.Vector3(-0.25 + xOffBody, -0.28, 0.06),
          new THREE.Vector3(-0.34 + xOffBody, -0.94, 0.06)
        );
        const leftCreaseGeo = new THREE.BufferGeometry().setFromPoints(leftCreasePath.getPoints(20));
        const leftCreaseLine = new THREE.Line(leftCreaseGeo, detailLineMaterial);
        leftCreaseLine.renderOrder = 101;
        dressDetailsGroup.add(leftCreaseLine);

        // Right fold
        const rightCreasePath = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0.15 + xOffBody, 0.36, 0.06),
          new THREE.Vector3(0.25 + xOffBody, -0.28, 0.06),
          new THREE.Vector3(0.34 + xOffBody, -0.94, 0.06)
        );
        const rightCreaseGeo = new THREE.BufferGeometry().setFromPoints(rightCreasePath.getPoints(20));
        const rightCreaseLine = new THREE.Line(rightCreaseGeo, detailLineMaterial);
        rightCreaseLine.renderOrder = 101;
        dressDetailsGroup.add(rightCreaseLine);

        // 7d. Bottom Hemline seam (dashed, shifted up by +0.02)
        const hemPath = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-0.70 + xOffBody, -0.86, 0.06),
          new THREE.Vector3(xOffBody, -0.94, 0.06),
          new THREE.Vector3(0.70 + xOffBody, -0.86, 0.06)
        );
        const hemGeo = new THREE.BufferGeometry().setFromPoints(hemPath.getPoints(40));
        const hemLine = new THREE.Line(hemGeo, detailDashedMaterial);
        hemLine.computeLineDistances();
        hemLine.renderOrder = 101;
        dressDetailsGroup.add(hemLine);

        dressDetailsGroup.visible = showDress;
        scene.add(dressDetailsGroup);
        dressDetailsGroupRef.current = dressDetailsGroup;

        setLoading(false);
      },
      undefined,
      (err) => {
        console.error("Error loading PLY mesh:", err);
        setError("Failed to load 2D mesh posture model.");
        setLoading(false);
      }
    );

    // 7. Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 9. Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[480px] bg-slate-950/40 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#091413]/60 backdrop-blur-sm z-10 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#B0E4CC]" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            Loading Posture Model...
          </span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#091413]/60 text-slate-500 text-xs font-semibold z-10">
          {error}
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
      
      {/* Top right dress toggle button */}
      {!loading && !error && (
        <button
          onClick={() => setShowDress(!showDress)}
          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 select-none pointer-events-auto z-20 active:scale-95"
        >
          <span>{showDress ? "👤 Hide Dress" : "👗 Dress Model"}</span>
        </button>
      )}

      {!loading && !error && (
        <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-md border-t border-white/10 px-3 py-2 flex justify-around items-center text-center z-20 pointer-events-auto select-none">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Weight</span>
            <span className="text-xs text-white font-bold">63.97 kg</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Height</span>
            <span className="text-xs text-white font-bold">161 cm</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Chest</span>
            <span className="text-xs text-white font-bold">39.37 in</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Waist</span>
            <span className="text-xs text-white font-bold">33.46 in</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Hips</span>
            <span className="text-xs text-white font-bold">38.98 in</span>
          </div>
        </div>
      )}
    </div>
  );
}
