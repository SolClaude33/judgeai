import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';
import { Sparkles } from "lucide-react";
import type { EmotionType } from '@shared/schema';
import czLoadingImage from '@assets/frame-avatar.png';
import courtroomBackground from '@assets/frame-background.png';

interface CZ3DViewerProps {
  emotion?: EmotionType;
}

export default function CZ3DViewer({ emotion = 'idle' }: CZ3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<{ model: THREE.Group; mixer: THREE.AnimationMixer; clip: THREE.AnimationClip } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const loadTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (error) {
      console.error('WebGL not available:', error);
      setIsLoading(false);
      setLoadError(true);
      return;
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x1E3A8A, 0.3);
    pointLight1.position.set(-3, 2, -3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xD97706, 0.25);
    pointLight2.position.set(3, 2, 3);
    scene.add(pointLight2);

    // Add courtroom background
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      courtroomBackground,
      (texture) => {
        const aspectRatio = texture.image.width / texture.image.height;
        const planeWidth = 20;
        const planeHeight = planeWidth / aspectRatio;
        
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide
        });
        
        const backgroundPlane = new THREE.Mesh(geometry, material);
        backgroundPlane.position.set(1.0, 0.5, -3.5);
        scene.add(backgroundPlane);
        
        console.log('✅ Frame background added');
      },
      undefined,
      (error) => {
        console.error('Error loading courtroom background:', error);
      }
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI / 1.5;
    controlsRef.current = controls;

    const gltfLoader = new GLTFLoader();

    loadTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      setLoadError(true);
      console.warn('3D model loading timed out - showing UI without 3D');
    }, 20000);

    // Load the biped character model
    gltfLoader.load(
      '/biped-character.glb',
      (gltf) => {
        console.log('✅ Loaded Biped Character model');
        const model = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        console.log(`📦 Model Size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
        console.log(`📍 Model Center: ${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}`);
        
        const desiredHeight = 3.2;
        const currentHeight = size.y;
        const scaleFactor = currentHeight > 0 ? desiredHeight / currentHeight : 1;
        
        console.log(`🔍 Scale factor: ${scaleFactor.toFixed(4)}`);
        
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        box.setFromObject(model);
        const scaledCenter = box.getCenter(new THREE.Vector3());
        
        // Adjust Y position to move model upward for better framing
        model.position.set(-scaledCenter.x, -scaledCenter.y + 0.5, -scaledCenter.z);
        
        // Rotate model to face forward (adjust Y rotation so the desk appears horizontal)
        model.rotation.y = 0.15;
        
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                  if (mat && 'flatShading' in mat) {
                    (mat as any).flatShading = false;
                    mat.needsUpdate = true;
                  }
                });
              } else if ('flatShading' in mesh.material) {
                (mesh.material as any).flatShading = false;
                mesh.material.needsUpdate = true;
              }
            }
          }
        });

        scene.add(model);
        console.log('✨ Biped Character added to scene at position:', model.position);

        const mixer = new THREE.AnimationMixer(model);
        
        // Try to load and play animations
        if (gltf.animations && gltf.animations.length > 0) {
          const clip = gltf.animations[0];
          modelRef.current = { model, mixer, clip };
          
          const action = mixer.clipAction(clip);
          action.play();
          console.log(`▶️ Playing animation: ${clip.name || 'default'}`);
          console.log(`📊 Total animations in model: ${gltf.animations.length}`);
        } else {
          // If no animations in base model, try loading walking animation
          console.log('ℹ️ No animations found in base model, trying to load walking animation...');
          gltfLoader.load(
            '/biped-walking.glb',
            (walkingGltf) => {
              if (walkingGltf.animations && walkingGltf.animations.length > 0) {
                const walkingClip = walkingGltf.animations[0];
                const walkingAction = mixer.clipAction(walkingClip);
                walkingAction.play();
                modelRef.current = { model, mixer, clip: walkingClip };
                console.log(`▶️ Playing walking animation: ${walkingClip.name || 'default'}`);
              }
            },
            undefined,
            (err) => console.warn('Could not load walking animation:', err)
          );
          
          if (!modelRef.current) {
            modelRef.current = { model, mixer, clip: new THREE.AnimationClip('default', -1, []) };
          }
        }
        
        if (loadTimeoutRef.current !== null) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading Biped Character model:', error);
        if (loadTimeoutRef.current !== null) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        setIsLoading(false);
        setLoadError(true);
      }
    );

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      
      if (modelRef.current && modelRef.current.mixer) {
        modelRef.current.mixer.update(delta);
      }

      if (modelRef.current && modelRef.current.model) {
        // Oscillate around 0.15 baseline to keep avatar facing forward
        modelRef.current.model.rotation.y = 0.15 + Math.sin(clock.elapsedTime * 0.2) * 0.05;
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (loadTimeoutRef.current !== null) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (sceneRef.current && modelRef.current) {
        sceneRef.current.remove(modelRef.current.model);
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative w-32 h-32 mb-4">
            <img 
              src={czLoadingImage} 
              alt="Loading" 
              className="w-full h-full object-contain rounded-full animate-pulse"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading Biped Character...
          </p>
        </div>
      )}
      
      {loadError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              3D viewer unavailable
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
