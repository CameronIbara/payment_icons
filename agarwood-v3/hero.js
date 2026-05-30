/* Hero immersif plein écran : photo de boutique en WebGL (cover), parallaxe
   souris, zoom respirant, halo lumineux sur les vitrines, grain de film,
   poussière d'or, assombrissement gauche/bas pour la lisibilité du texte. */
import * as THREE from 'three';

export function initHero(canvas, imageUrl){
  const reduce = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.autoClear=false;

  const bgScene=new THREE.Scene();
  const bgCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const u={
    uTex:{value:null}, uImageRes:{value:new THREE.Vector2(1,1)},
    uResolution:{value:new THREE.Vector2(1,1)}, uOffset:{value:new THREE.Vector2(0,0)},
    uZoom:{value:1.08}, uReady:{value:0}, uTime:{value:0},
  };
  const mat=new THREE.ShaderMaterial({uniforms:u,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`precision highp float;varying vec2 vUv;
      uniform sampler2D uTex;uniform vec2 uImageRes,uResolution,uOffset;uniform float uZoom,uReady,uTime;
      float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      void main(){
        float rs=uResolution.x/uResolution.y, ri=uImageRes.x/uImageRes.y; vec2 st=vUv;
        if(rs>ri){st.y=(vUv.y-.5)*(ri/rs)+.5;} else {st.x=(vUv.x-.5)*(rs/ri)+.5;}
        st=(st-.5)/uZoom+.5+uOffset;
        vec3 c=texture2D(uTex,st).rgb;
        float lum=dot(c,vec3(.299,.587,.114));
        c+=pow(max(lum-.55,0.),1.5)*vec3(1.,.82,.5)*1.25;
        vec2 d=vUv-.5; float vig=smoothstep(.96,.5,length(d)*1.2); c*=mix(1.,vig,.9);
        c*=mix(.34,1.,smoothstep(0.,.62,vUv.x));                 // gauche → texte
        c*=mix(.55,1.,smoothstep(0.,.5,vUv.y));                  // bas → texte
        c+=(hash(vUv*uResolution+uTime)-.5)*.03;                 // grain
        gl_FragColor=vec4(c*uReady,1.);
      }`});
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat));
  new THREE.TextureLoader().load(imageUrl,t=>{
    t.colorSpace=THREE.SRGBColorSpace; t.generateMipmaps=false;
    t.minFilter=t.magFilter=THREE.LinearFilter; t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
    u.uTex.value=t; u.uImageRes.value.set(t.image.width,t.image.height);
  });

  const fxScene=new THREE.Scene();
  const fxCam=new THREE.PerspectiveCamera(45,1,.1,100); fxCam.position.z=6;
  const N=reduce?80:340, pos=new Float32Array(N*3), spd=new Float32Array(N);
  for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*16;pos[i*3+1]=(Math.random()-.5)*10;pos[i*3+2]=(Math.random()-.5)*6;spd[i]=.1+Math.random()*.3;}
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const dust=new THREE.Points(g,new THREE.PointsMaterial({color:0xe6c98a,size:.05,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));
  fxScene.add(dust);

  const p={x:0,y:0,tx:0,ty:0};
  if(!reduce) addEventListener('pointermove',e=>{p.tx=e.clientX/innerWidth-.5;p.ty=e.clientY/innerHeight-.5;});

  function resize(){const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;
    renderer.setSize(w,h,false);u.uResolution.value.set(w,h);fxCam.aspect=w/h;fxCam.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(canvas); resize();

  const clock=new THREE.Clock(); let last=0;
  (function tick(){
    const t=clock.getElapsedTime(), dt=Math.min(.05,t-last); last=t;
    u.uReady.value=Math.min(1,u.uReady.value+dt*1.1); u.uTime.value=t;
    if(!reduce){
      p.x+=(p.tx-p.x)*.05; p.y+=(p.ty-p.y)*.05;
      u.uOffset.value.set(p.x*.04,-p.y*.04); u.uZoom.value=1.08+Math.sin(t*.32)*.03;
      dust.rotation.y=t*.02; fxCam.position.x=p.x*.5; fxCam.position.y=-p.y*.3; fxCam.lookAt(0,0,0);
      const a=g.attributes.position;
      for(let i=0;i<N;i++){let y=a.getY(i)+spd[i]*dt*.35; if(y>5)y=-5; a.setY(i,y);}
      a.needsUpdate=true;
    }
    renderer.clear(); renderer.render(bgScene,bgCam); renderer.render(fxScene,fxCam);
    requestAnimationFrame(tick);
  })();
}
