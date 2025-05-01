import {  CUSTOM_ELEMENTS_SCHEMA,  Component,  ElementRef,  ChangeDetectionStrategy,  ViewChild,  AfterViewInit,  OnDestroy, } from '@angular/core';
import { extend } from 'angular-three';
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Loadout, LoadoutService } from '../services/loadout.service';
extend({ Mesh, BoxGeometry, MeshBasicMaterial });

@Component({
  selector: 'app-experience',
  template: `<canvas #canvas></canvas>`, 
  styles: [`
    :host {display: block; width: 100%; height: 93vh; overflow: hidden;}
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
  helmet: new THREE.Vector3(-1.5, 1.8, 0),
  chest:  new THREE.Vector3(-0.5, 1.2, 0),
  legs:   new THREE.Vector3(0.5, 0.6, 0),
  shield:   new THREE.Vector3(1.5, 1.2, 0),
  weapon: new THREE.Vector3(0, 1.0, -1.5),
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

  private loadSlot(slot: keyof Loadout, url: string) {
    new GLTFLoader().load(url, gltf => {
      const obj = gltf.scene;
      // do your shadow/traverse stuff…
      obj.position.copy(this.positionMap[slot]);
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