/* Tuile hero immersive (bento) : photo en WebGL (cover), parallaxe souris,
   zoom respirant, halo lumineux, grain, poussière d'or, vignette. */
import * as THREE from 'three';

export function initHero(canvas, imageUrl){
  const reduce = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const r = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  r.setPixelRatio(Math.min(devicePixelRatio,2)); r.autoClear=false;
  const bg=new THREE.Scene(), bgCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const u={uTex:{value:null},uImageRes:{value:new THREE.Vector2(1,1)},uResolution:{value:new THREE.Vector2(1,1)},
    uOffset:{value:new THREE.Vector2(0,0)},uZoom:{value:1.07},uReady:{value:0},uTime:{value:0}};
  const mat=new THREE.ShaderMaterial({uniforms:u,depthTest:false,depthWrite:false,
    vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`precision highp float;varying vec2 v;uniform sampler2D uTex;uniform vec2 uImageRes,uResolution,uOffset;uniform float uZoom,uReady,uTime;
      float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      void main(){float rs=uResolution.x/uResolution.y,ri=uImageRes.x/uImageRes.y;vec2 st=v;
        if(rs>ri)st.y=(v.y-.5)*(ri/rs)+.5;else st.x=(v.x-.5)*(rs/ri)+.5;
        st=(st-.5)/uZoom+.5+uOffset;vec3 c=texture2D(uTex,st).rgb;
        float l=dot(c,vec3(.299,.587,.114));c+=pow(max(l-.55,0.),1.5)*vec3(1.,.82,.5)*1.3;
        vec2 d=v-.5;float vig=smoothstep(.95,.45,length(d)*1.25);c*=mix(1.,vig,.9);
        c*=mix(.7,1.,smoothstep(0.,.55,v.y));
        c+=(h(v*uResolution+uTime)-.5)*.03;gl_FragColor=vec4(c*uReady,1.);}`});
  bg.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat));
  new THREE.TextureLoader().load(imageUrl,t=>{t.colorSpace=THREE.SRGBColorSpace;t.generateMipmaps=false;
    t.minFilter=t.magFilter=THREE.LinearFilter;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
    u.uTex.value=t;u.uImageRes.value.set(t.image.width,t.image.height);});
  const fx=new THREE.Scene(),fxCam=new THREE.PerspectiveCamera(45,1,.1,100);fxCam.position.z=6;
  const N=reduce?60:260,pos=new Float32Array(N*3),sp=new Float32Array(N);
  for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*15;pos[i*3+1]=(Math.random()-.5)*9;pos[i*3+2]=(Math.random()-.5)*5;sp[i]=.1+Math.random()*.3;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const dust=new THREE.Points(g,new THREE.PointsMaterial({color:0xe6c98a,size:.05,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));
  fx.add(dust);
  const p={x:0,y:0,tx:0,ty:0};
  if(!reduce)addEventListener('pointermove',e=>{p.tx=e.clientX/innerWidth-.5;p.ty=e.clientY/innerHeight-.5;});
  function rs(){const w=canvas.clientWidth||1,h=canvas.clientHeight||1;r.setSize(w,h,false);u.uResolution.value.set(w,h);fxCam.aspect=w/h;fxCam.updateProjectionMatrix();}
  new ResizeObserver(rs).observe(canvas);rs();
  const clk=new THREE.Clock();let last=0;
  (function t_(){const t=clk.getElapsedTime(),dt=Math.min(.05,t-last);last=t;
    u.uReady.value=Math.min(1,u.uReady.value+dt*1.2);u.uTime.value=t;
    if(!reduce){p.x+=(p.tx-p.x)*.05;p.y+=(p.ty-p.y)*.05;u.uOffset.value.set(p.x*.04,-p.y*.04);u.uZoom.value=1.07+Math.sin(t*.33)*.028;
      dust.rotation.y=t*.02;fxCam.position.x=p.x*.5;fxCam.position.y=-p.y*.3;fxCam.lookAt(0,0,0);
      const a=g.attributes.position;for(let i=0;i<N;i++){let y=a.getY(i)+sp[i]*dt*.35;if(y>4.5)y=-4.5;a.setY(i,y);}a.needsUpdate=true;}
    r.clear();r.render(bg,bgCam);r.render(fx,fxCam);requestAnimationFrame(t_);})();
}
