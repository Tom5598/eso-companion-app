import {  CUSTOM_ELEMENTS_SCHEMA,  Component,  ElementRef,  ChangeDetectionStrategy,  ViewChild,  AfterViewInit,  OnDestroy, } from '@angular/core';
import { extend } from 'angular-three';
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BackgroundItem, Item, Loadout, LoadoutService } from '../services/loadout.service';
extend({ Mesh, BoxGeometry, MeshBasicMaterial });

@Component({
  selector: 'app-experience',
  template: `<canvas #canvas></canvas>`, 
  styles: [`
    :host {display: block; width: 100%; height: 100dvh; overflow: hidden; padding-bottom: env(safe-area-inset-bottom);}
    canvas {width: 100%; height: 100%; display: block;}
  `],
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experience implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private loadout : LoadoutService) {}
  // locally editable transforms, index matches the Firestore array order
  private backgroundTransforms = [
    { position: new THREE.Vector3( 2, 0, -3), rotation: new THREE.Euler(0, -0.25, 0), scale: new THREE.Vector3(2,2,2) },
    { position: new THREE.Vector3(-2, 0, -2), rotation: new THREE.Euler(0, -0.4, 0), scale: new THREE.Vector3(1,1,1) },
    { position: new THREE.Vector3(-1, 0, -1), rotation: new THREE.Euler(0, 0.2, 0), scale: new THREE.Vector3(1,1,1) },
  ];
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private frameId?: number;
  private mixer!: THREE.AnimationMixer;
  clock = new THREE.Clock();
  // track currently rendered items
  private rendered: Record<string, THREE.Object3D> = {};
  private lastLoadout: Loadout = {};
  // fixed positions for each slot
  private positionMap: Record<string, THREE.Vector3> = {
  helmet: new THREE.Vector3(-2.1, 0.25, -1.8),
  chest:  new THREE.Vector3(2, 1.5, -2.8),
  legs:   new THREE.Vector3(2.8, 0.65, -2),
  shield:   new THREE.Vector3(0.65, 1.5, -2.95),
  weapon: new THREE.Vector3(1, 0.8, -1.5),
  };
  private rotationMap: Record<string, THREE.Euler> = {
    helmet: new THREE.Euler(0, 0.3, 0),
    chest:  new THREE.Euler(0, -0.3, 0),
    legs:   new THREE.Euler(0, -0.5, 0),
    shield: new THREE.Euler(0, -0.5, 0),
    weapon: new THREE.Euler(90, 0, 0),
  };

  ngAfterViewInit(): void {
    // 1. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, 3);
    // 3. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    // 4. Light & Grid & Background
    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.position.set(1, 2, 2);
    this.scene.add(dirLight);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
    this.scene.add(new THREE.GridHelper(10, 10));
    const geometry = new THREE.SphereGeometry( 500, 60, 40 );    
    geometry.scale( - 1, 1, 1 ); // invert the geometry on the x-axis so that all of the faces point inward
    const texture = new THREE.TextureLoader().load( './background.jpg' );
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial( { map: texture } );
    const mesh = new THREE.Mesh( geometry, material );
    this.scene.add( mesh );
    
    const groundGeo = new THREE.PlaneGeometry(10, 10);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8,});
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; // lay flat
    ground.receiveShadow = true; // allow other objects to cast shadows onto it   
    this.scene.add(ground);
    
    this.loadout.getBackgroundModels().subscribe(urls => {
      urls.forEach((url, idx) => {
        const tf = this.backgroundTransforms[idx] 
                  || { position: new THREE.Vector3(), rotation: new THREE.Euler(), scale: new THREE.Vector3(1,1,1) };
        this.loadBackgroundModel(url, tf);
      });
    });
    // 4.5 Loadout
    this.loadout.loadout$
    .subscribe((lo) => {
      Object.entries(lo).forEach(([slot, url]) => {
        const prevUrl = this.lastLoadout[slot as keyof Loadout];
        if (url === prevUrl) {
          // no change → skip
          return;
        }
        // if there was an old model, remove it
        if (this.rendered[slot]) {
          this.scene.remove(this.rendered[slot]);
          delete this.rendered[slot];
        }
        // if there's a new URL, load & add it
        if (url) {
          this.loadSlot(slot as keyof Loadout, url);
        }
      });
      // remember for next time
      this.lastLoadout = { ...lo };
    });
    // 5. Start rendering
    this.animate();
    // 6. Handle resize
    window.addEventListener('resize', this.onResize);
  }
  private loadBackgroundModel(
    url: string,
    tf: { position: THREE.Vector3, rotation: THREE.Euler, scale: THREE.Vector3 }
  ) {
    new GLTFLoader().load(url, gltf => {
      const obj = gltf.scene;
      obj.position.copy(tf.position);
      obj.rotation.copy(tf.rotation);
      obj.scale   .copy(tf.scale);
      obj.traverse(n => {
        if ((n as THREE.Mesh).isMesh) {
          const m = n as THREE.Mesh;
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      this.scene.add(obj);
    });
  }
  private loadSlot(slot: keyof Loadout, url: string) {
    new GLTFLoader().load(url, gltf => {
      const obj = gltf.scene;
      // do your shadow/traverse stuff…
      obj.position.copy(this.positionMap[slot]);
      obj.rotation.copy(this.rotationMap[slot]);
      this.scene.add(obj);
      this.rendered[slot] = obj;
    });
  }
 
  private animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();  // seconds since last frame
    this.controls.update();
    if(this.mixer){
      this.mixer.update(delta);
    }
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId!);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}