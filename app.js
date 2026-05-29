// ════════════════════════════════════════════
// AUDIO
// ════════════════════════════════════════════
let actx;
function gAC(){if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();return actx;}
function tone(f,d,t='sine',v=0.15,delay=0){try{const c=gAC(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type=t;o.frequency.value=f;const s=c.currentTime+delay;g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(v,s+0.02);g.gain.exponentialRampToValueAtTime(0.001,s+d);o.start(s);o.stop(s+d);}catch(e){}}
function playCollect(){[523,659,784,1047].forEach((f,i)=>tone(f,0.35,'sine',0.18,i*.09));}
function playCastle(){[400,504,600,756,900,1200].forEach((f,i)=>tone(f,0.4,'sine',0.2,i*.1));}
function playFw(){for(let i=0;i<10;i++)tone(200+Math.random()*900,0.28,'sine',0.13,i*.05);}
function playStep(){tone(180+Math.random()*40,0.08,'square',0.04);}
function playHappyBirthday(){
  const melody=[
    {f:392,d:0.35},{f:392,d:0.35},{f:440,d:0.6},{f:392,d:0.6},{f:523,d:0.6},{f:494,d:0.9},
    {f:392,d:0.35},{f:392,d:0.35},{f:440,d:0.6},{f:392,d:0.6},{f:587,d:0.6},{f:523,d:0.9},
    {f:392,d:0.35},{f:392,d:0.35},{f:784,d:0.6},{f:659,d:0.6},{f:523,d:0.6},{f:494,d:0.6},{f:440,d:0.9},
    {f:698,d:0.35},{f:698,d:0.35},{f:659,d:0.6},{f:523,d:0.6},{f:587,d:0.6},{f:523,d:1.0},
  ];
  let t=0;
  melody.forEach(n=>{tone(n.f,n.d,'sine',0.14,t); t+=n.d*0.95;});
}

// ════════════════════════════════════════════
// SCENE SETUP
// ════════════════════════════════════════════
const canvas=document.getElementById('c');
// Detect mobile for aggressive optimizations
const isMobile=/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||window.innerWidth<768;
const renderer=new THREE.WebGLRenderer({canvas,antialias:!isMobile,powerPreference:'high-performance'});
// Mobile: cap at 1.0 to halve fragment shader load; desktop: allow up to 1.5
renderer.setPixelRatio(isMobile?Math.min(window.devicePixelRatio,1.0):Math.min(window.devicePixelRatio,1.5));
// Shadows only on desktop
renderer.shadowMap.enabled=!isMobile;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.2;
renderer.outputColorSpace=THREE.SRGBColorSpace;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x04011a);
scene.fog=new THREE.FogExp2(0x08022a,0.02);

function buildSky(){
  const segs=isMobile?16:32;
  const skyGeo=new THREE.SphereGeometry(180,segs,isMobile?8:16);
  const pos=skyGeo.attributes.position;
  const colors=[];
  const top=new THREE.Color(0x0f0c29);
  const mid=new THREE.Color(0x302b63);
  const bottom=new THREE.Color(0x24243e);
  for(let i=0;i<pos.count;i++){
    const y=pos.getY(i)/180;
    const t=(y+1)/2;
    const col=new THREE.Color();
    if(t<0.5) col.lerpColors(bottom,mid,t/0.5);
    else col.lerpColors(mid,top,(t-0.5)/0.5);
    colors.push(col.r,col.g,col.b);
  }
  skyGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const skyMat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide});
  const sky=new THREE.Mesh(skyGeo,skyMat);
  scene.add(sky);
}
buildSky();

const clouds=[];
function buildClouds(){
  const cloudMat=isMobile
    ? new THREE.MeshPhongMaterial({color:0x3b1d6a,shininess:10,transparent:true,opacity:0.45})
    : new THREE.MeshStandardMaterial({color:0x3b1d6a,roughness:1,metalness:0,transparent:true,opacity:0.45});
  const cloudCount=isMobile?5:10;
  // Share a single puff geometry across all cloud puffs
  const sharedPuffGeo=new THREE.SphereGeometry(1.5,isMobile?5:8,isMobile?4:6);
  for(let i=0;i<cloudCount;i++){
    const g=new THREE.Group();
    const cx=(Math.random()-0.5)*160;
    const cy=18+Math.random()*20;
    const cz=(Math.random()-0.5)*200-40;
    const puffCount=isMobile?2:3+Math.floor(Math.random()*3);
    for(let p=0;p<puffCount;p++){
      const puff=new THREE.Mesh(sharedPuffGeo,cloudMat);
      puff.position.set((Math.random()-0.5)*3,(Math.random()-0.5)*1,(Math.random()-0.5)*2);
      g.add(puff);
    }
    g.position.set(cx,cy,cz);
    g.userData.baseX=cx;
    g.userData.baseY=cy;
    g.userData.floatSeed=Math.random()*Math.PI*2;
    scene.add(g);
    clouds.push(g);
  }
}
buildClouds();

const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,0.1,200);
camera.position.set(0,2.6,-0.5);
camera.rotation.x=-0.06;

let lastWidth = window.innerWidth;
window.addEventListener('resize',()=>{
  if(isMobile && window.innerWidth === lastWidth) return;
  lastWidth = window.innerWidth;
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
renderer.setSize(innerWidth,innerHeight);

// ════════════════════════════════════════════
// LIGHTS
// ════════════════════════════════════════════
const ambLight=new THREE.AmbientLight(0x2a1458,0.95);
scene.add(ambLight);
const hemiLight=new THREE.HemisphereLight(0x2b2148,0x05020d,0.45);
scene.add(hemiLight);
const sunLight=new THREE.DirectionalLight(0x6b7cc7,0.35);
sunLight.position.set(18,26,12);
sunLight.castShadow=!isMobile;
sunLight.shadow.mapSize.set(isMobile?512:1024,isMobile?512:1024);
sunLight.shadow.camera.far=140;
sunLight.shadow.camera.left=-35;
sunLight.shadow.camera.right=35;
sunLight.shadow.camera.top=35;
sunLight.shadow.camera.bottom=-35;
scene.add(sunLight);
const moonLight=new THREE.DirectionalLight(0x8bb7ff,0.7);
moonLight.position.set(-20,30,-40);
scene.add(moonLight);

const baseMood={
  ambColor:ambLight.color.getHex(),
  ambIntensity:ambLight.intensity,
  hemiColor:hemiLight.color.getHex(),
  hemiGround:hemiLight.groundColor.getHex(),
  hemiIntensity:hemiLight.intensity,
  sunIntensity:sunLight.intensity,
  moonIntensity:moonLight.intensity,
  fogColor:scene.fog.color.getHex(),
  fogDensity:scene.fog.density,
  toneExposure:renderer.toneMappingExposure,
};
let castleMoodActive=false;

function setCastleMood(active){
  if(active===castleMoodActive) return;
  castleMoodActive=active;
  if(active){
    ambLight.color.set(0x1a0c2e);
    ambLight.intensity=0.55;
    hemiLight.color.set(0x1b1431);
    hemiLight.groundColor.set(0x050208);
    hemiLight.intensity=0.25;
    sunLight.intensity=0.18;
    moonLight.intensity=0.95;
    scene.fog.color.set(0x05020f);
    scene.fog.density=0.035;
    renderer.toneMappingExposure=1.05;
  } else {
    ambLight.color.set(baseMood.ambColor);
    ambLight.intensity=baseMood.ambIntensity;
    hemiLight.color.set(baseMood.hemiColor);
    hemiLight.groundColor.set(baseMood.hemiGround);
    hemiLight.intensity=baseMood.hemiIntensity;
    sunLight.intensity=baseMood.sunIntensity;
    moonLight.intensity=baseMood.moonIntensity;
    scene.fog.color.set(baseMood.fogColor);
    scene.fog.density=baseMood.fogDensity;
    renderer.toneMappingExposure=baseMood.toneExposure;
  }
}

// ════════════════════════════════════════════
// MATERIALS HELPER
// ════════════════════════════════════════════
const MM=(c,e=0,rough=0.7,metal=0.05)=>{
  let m;
  if (isMobile) {
    m = new THREE.MeshPhongMaterial({color:c,shininess:30});
  } else {
    m = new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal});
  }
  if(e>0) {
    m.emissive=new THREE.Color(c);
    m.emissiveIntensity=e;
  }
  return m;
};

// ════════════════════════════════════════════
// ROAD SPLINE
// ════════════════════════════════════════════
// Curved road path - S-curves, turns, winding
const roadPoints=[
  new THREE.Vector3(0,0,0),
  new THREE.Vector3(0,0,-8),
  new THREE.Vector3(2,0,-16),
  new THREE.Vector3(5,0,-24),
  new THREE.Vector3(4,0,-32),
  new THREE.Vector3(0,0,-40),
  new THREE.Vector3(-3,0,-48),
  new THREE.Vector3(-5,0,-56),
  new THREE.Vector3(-3,0,-64),
  new THREE.Vector3(0,0,-72),
  new THREE.Vector3(4,0,-80),
  new THREE.Vector3(6,0,-88),
  new THREE.Vector3(4,0,-96),
  new THREE.Vector3(0,0,-104),
  new THREE.Vector3(-4,0,-112),
  new THREE.Vector3(-6,0,-120),
  new THREE.Vector3(-3,0,-128),
  new THREE.Vector3(0,0,-136),
  new THREE.Vector3(3,0,-144),
  new THREE.Vector3(5,0,-152),
  new THREE.Vector3(2,0,-160),
  new THREE.Vector3(0,0,-168),
];
const roadSpline=new THREE.CatmullRomCurve3(roadPoints);

// ════════════════════════════════════════════
// BUILD ROAD MESH
// ════════════════════════════════════════════
function buildRoad(){
  const pts=roadSpline.getPoints(isMobile?160:320);

  function ribbon(width,y,mat){
    const geo=new THREE.BufferGeometry();
    const verts=[];const uvs=[];const indices=[];
    for(let i=0;i<pts.length-1;i++){
      const cur=pts[i],nxt=pts[i+1];
      const dir=new THREE.Vector3().subVectors(nxt,cur).normalize();
      const right=new THREE.Vector3(-dir.z,0,dir.x);
      const ul=cur.clone().addScaledVector(right,-width);
      const ur=cur.clone().addScaledVector(right,width);
      verts.push(ul.x,0,ul.z, ur.x,0,ur.z);
      const t=i/(pts.length-1);
      uvs.push(0,t,1,t);
      if(i<pts.length-2){
        const b=i*2;
        indices.push(b,b+1,b+2, b+1,b+3,b+2);
      }
    }
    geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,mat);
    mesh.receiveShadow=true;
    mesh.position.y=y;
    scene.add(mesh);
    return mesh;
  }

  const roadMat = isMobile ? new THREE.MeshPhongMaterial({color:0x1e0e50,shininess:5}) : new THREE.MeshStandardMaterial({color:0x1e0e50,roughness:0.95,metalness:0.0});
  const inlayMat = isMobile ? new THREE.MeshPhongMaterial({color:0x1a0f3a,shininess:15,emissive:new THREE.Color(0x1a0f3a),emissiveIntensity:0.02}) : new THREE.MeshStandardMaterial({color:0x1a0f3a,roughness:0.7,metalness:0.05,emissive:new THREE.Color(0x1a0f3a),emissiveIntensity:0.02});
  const centerMat = isMobile ? new THREE.MeshPhongMaterial({color:0x2a1b5a,shininess:30,emissive:new THREE.Color(0x2a1b5a),emissiveIntensity:0.05}) : new THREE.MeshStandardMaterial({color:0x2a1b5a,roughness:0.5,metalness:0.1,emissive:new THREE.Color(0x2a1b5a),emissiveIntensity:0.05});

  ribbon(3.6,-0.06,roadMat);
  ribbon(2.45,-0.03,inlayMat);
  ribbon(0.45,-0.005,centerMat);

  // Road edge lines (warm gold)
  for(let side=-1;side<=1;side+=2){
    const edgePts=pts.map((p,i)=>{
      if(i>=pts.length-1) return p.clone();
      const dir=new THREE.Vector3().subVectors(pts[i+1],p).normalize();
      const right=new THREE.Vector3(-dir.z,0,dir.x);
      return p.clone().addScaledVector(right,side*3.55).setY(0.02);
    });
    const eg=new THREE.BufferGeometry().setFromPoints(edgePts);
    const el=new THREE.Line(eg,new THREE.LineBasicMaterial({color:0xffd089,opacity:0.6,transparent:true}));
    scene.add(el);
  }

  // Small path lights along the avenue — fewer on mobile (each PointLight is expensive)
  const lightStep=isMobile?60:24;
  for(let i=6;i<pts.length;i+=lightStep){
    const cur=pts[i],nxt=pts[i+1]||pts[i-1];
    const dir=new THREE.Vector3().subVectors(nxt,cur).normalize();
    const right=new THREE.Vector3(-dir.z,0,dir.x);
    [-1,1].forEach(side=>{
      const p=cur.clone().addScaledVector(right,side*3.1);
      const gem=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,5),MM(0xffe3a6,1.2,0.2));
      gem.position.set(p.x,0.12,p.z);
      scene.add(gem);
      if(!isMobile){
        const pl=new THREE.PointLight(0xffe3a6,0.6,4,2);
        pl.position.set(p.x,0.5,p.z);
        scene.add(pl);
      }
    });
  }
}
buildRoad();

// Ground (wide magical grass/floor)
const groundGeo=new THREE.PlaneGeometry(220,320);
const groundMat=isMobile ? new THREE.MeshPhongMaterial({color:0x050310,shininess:5}) : new THREE.MeshStandardMaterial({color:0x050310,roughness:1,metalness:0});
const ground=new THREE.Mesh(groundGeo,groundMat);
ground.rotation.x=-Math.PI/2; ground.position.y=-0.1; ground.position.z=-80;
ground.receiveShadow=true;
scene.add(ground);

// ════════════════════════════════════════════
// HELPERS: CARTOON SHAPES
// ════════════════════════════════════════════
function roundBox(w,h,d,r,mat){
  // Use beveled box via ExtrudeGeometry
  const shape=new THREE.Shape();
  const hw=w/2-r, hh=h/2-r; // use for pillowing
  // Simple rounded by using merged sphere+box approach
  const group=new THREE.Group();
  const box=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  box.castShadow=true;box.receiveShadow=true;
  group.add(box);
  return group;
}

function cylinder(rt,rb,h,seg,mat){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat);
  m.castShadow=true; return m;
}

function sphere(r,mat){
  const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),mat);
  m.castShadow=true; return m;
}

// ════════════════════════════════════════════
// CUTE HOUSE BUILDER
// ════════════════════════════════════════════
const houseColors=[0x7c3aed,0xb83260,0x2872b9,0x247a44,0xc06820,0x7a24ad,0xb83000,0x148070,0xc01870,0x164a8a,0x7a20c0,0x908010];
const roofColors=[0xec4899,0x6c3483,0xa04000,0x1a4a80,0x7b2d00,0x2e4057,0xc0392b,0x8e44ad,0xf59e0b];
const windowColors=[0xfde68a,0xffd4a0,0xffecc0,0xfffbe0];

function makeHouse(type,seed){
  const group=new THREE.Group();
  const rng=(n)=>{let x=Math.sin(seed+n)*43758.5;return x-Math.floor(x);};

  const wallCol=houseColors[Math.floor(rng(1)*houseColors.length)];
  const roofCol=roofColors[Math.floor(rng(2)*roofColors.length)];
  const wallMat=MM(wallCol,0,0.85);
  const roofMat=MM(roofCol,0.05,0.7);
  const trimMat=MM(0xf5deb3,0,0.6);
  const winMat=MM(0xfde68a,0.8,0.2);

  // Body
  const w=1.2+rng(3)*0.8, h=1.4+rng(4)*1.0, d=1.2+rng(5)*0.8;
  const bodyGeo=new THREE.BoxGeometry(w,h,d);
  const body=new THREE.Mesh(bodyGeo,wallMat);
  body.position.y=h/2; body.castShadow=true; body.receiveShadow=true;
  group.add(body);

  // Rounded base skirt to soften the silhouette
  if (!isMobile) {
    const baseR=Math.max(w,d)*0.55;
    const base=new THREE.Mesh(new THREE.CylinderGeometry(baseR,baseR*1.05,0.22,12),MM(0xf7f2ff,0,0.8));
    base.position.y=0.11; base.castShadow=true; base.receiveShadow=true;
    group.add(base);

    // Trim around base
    const trimGeo=new THREE.BoxGeometry(w+0.1,0.12,d+0.1);
    const trim=new THREE.Mesh(trimGeo,trimMat);
    trim.position.y=0.06; group.add(trim);
    const trim2=new THREE.Mesh(trimGeo,trimMat);
    trim2.position.y=h-0.06; group.add(trim2);
  }

  // Roof
  if(rng(6)<0.5){
    // Pointed
    const roofGeo=new THREE.ConeGeometry(Math.max(w,d)*0.78,0.9+rng(7)*0.5,4);
    const roof=new THREE.Mesh(roofGeo,roofMat);
    roof.position.y=h+0.45; roof.rotation.y=Math.PI/4;
    roof.castShadow=true; group.add(roof);
    // Chimney
    if(!isMobile && rng(8)<0.6){
      const chim=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.4,0.22),MM(0x604030));
      chim.position.set(w*0.2,h+0.75+0.2,0); chim.castShadow=true; group.add(chim);
      // Smoke puff
      const smoke=sphere(0.12,MM(0xccbbdd,0.1,0.4));
      smoke.position.set(w*0.2,h+1.08,0);
      smoke.userData.floatOffset=rng(9)*Math.PI*2;
      group.add(smoke);
    }
  } else {
    // Hip roof
    const rGeo=new THREE.BoxGeometry(w+0.15,0.15,d+0.15);
    const rBase=new THREE.Mesh(rGeo,roofMat);
    rBase.position.y=h+0.075; rBase.castShadow=true; group.add(rBase);
    const roofGeo=new THREE.ConeGeometry(Math.max(w,d)*0.72,0.7+rng(7)*0.4,4);
    const roof2=new THREE.Mesh(roofGeo,roofMat);
    roof2.position.y=h+0.45; roof2.rotation.y=Math.PI/4;
    roof2.castShadow=true; group.add(roof2);
  }

  // Side tower for whimsical silhouette
  if(rng(15)<0.38){
    const tr=0.35+rng(16)*0.28;
    const th=1.4+rng(17)*1.2;
    const tx=w*0.55*(rng(18)>0.5?1:-1);
    const tz=d*0.25;
    const tower=new THREE.Mesh(new THREE.CylinderGeometry(tr,tr,th,10),wallMat);
    tower.position.set(tx,th/2,tz); tower.castShadow=true; group.add(tower);
    const tRoof=new THREE.Mesh(new THREE.ConeGeometry(tr*1.2,0.9+rng(19)*0.6,10),roofMat);
    tRoof.position.set(tx,th+0.45,tz); tRoof.castShadow=true; group.add(tRoof);
    const finial=new THREE.Mesh(new THREE.SphereGeometry(0.08,8,6),MM(0xfde68a,0.8,0.2));
    finial.position.set(tx,th+0.95,tz); group.add(finial);
  }

  // Windows
  const winCount=1+Math.floor(rng(10)*2);
  for(let i=0;i<winCount;i++){
    const wx=(i-(winCount-1)/2)*(w/(winCount+0.5));
    const winFrame=new THREE.Mesh(new THREE.BoxGeometry(0.38,0.45,d+0.02),trimMat);
    winFrame.position.set(wx,h*0.55,0); group.add(winFrame);
    const winGlass=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.34,d+0.04),winMat);
    winGlass.position.set(wx,h*0.55,0);
    winGlass.userData.isWin=true; winGlass.userData.blinkOff=rng(11+i)*6;
    group.add(winGlass);
    // Window arch top
    if(!isMobile) {
      const archGeo=new THREE.CylinderGeometry(0.14,0.14,0.05,8,1,false,0,Math.PI);
      const arch=new THREE.Mesh(archGeo,trimMat);
      arch.position.set(wx,h*0.55+0.17+0.025,d*0.51); arch.rotation.x=Math.PI/2;
      group.add(arch);
    }
  }

  // Round feature window
  if(!isMobile && rng(20)<0.4){
    const rw=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.06,12),winMat);
    rw.position.set(-w*0.25,h*0.75,d*0.52);
    rw.rotation.x=Math.PI/2;
    rw.userData.isWin=true; rw.userData.blinkOff=rng(21)*6;
    group.add(rw);
  }

  // Small awning
  if(!isMobile && rng(22)<0.45){
    const awnMat=MM(0xf9a8d4,0.2,0.5);
    const awn=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.08,0.4),awnMat);
    awn.position.set(0,h*0.35,d*0.55);
    awn.rotation.x=-Math.PI/10;
    group.add(awn);
  }

  // Door
  const doorMat=MM(0x5a3010,0,0.9);
  const door=new THREE.Mesh(new THREE.BoxGeometry(0.38,0.6,d+0.02),doorMat);
  door.position.set(0,0.3,0); group.add(door);
  // Door arch
  if(!isMobile) {
    const darchGeo=new THREE.TorusGeometry(0.19,0.05,8,16,Math.PI);
    const darch=new THREE.Mesh(darchGeo,trimMat);
    darch.position.set(0,0.6,d*0.51); darch.rotation.z=Math.PI;
    group.add(darch);
  }

  // Balcony (sometimes)
  if(!isMobile && rng(12)<0.4 && h>2){
    const balMat=MM(0xf0ead0,0,0.7);
    const balFloor=new THREE.Mesh(new THREE.BoxGeometry(w*0.7,0.06,0.55),balMat);
    balFloor.position.set(0,h*0.65,d*0.5+0.27); group.add(balFloor);
    // Railing
    for(let r=-1;r<=1;r+=2){
      const rail=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.25,0.55),balMat);
      rail.position.set(r*w*0.32,h*0.65+0.12,d*0.5+0.27); group.add(rail);
    }
    const topRail=new THREE.Mesh(new THREE.BoxGeometry(w*0.7,0.05,0.05),balMat);
    topRail.position.set(0,h*0.65+0.25,d*0.5+0.54); group.add(topRail);
    // Flower pot
    const potMat=MM(0xe06030,0,0.8);
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.06,0.14,8),potMat);
    pot.position.set(w*0.15,h*0.65+0.11,d*0.5+0.4); group.add(pot);
    const flower=new THREE.Mesh(new THREE.SphereGeometry(0.09,8,6),MM(0xec4899,0.3));
    flower.position.set(w*0.15,h*0.65+0.22,d*0.5+0.4); group.add(flower);
  }

  // Flower boxes
  if(!isMobile && rng(13)<0.5){
    const fbMat=MM(0x8b4513,0,0.9);
    const fb=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.12,0.18),fbMat);
    fb.position.set(0,h*0.4,d*0.5+0.09); group.add(fb);
    ['#ec4899','#f59e0b','#a78bfa'].slice(0,2+Math.floor(rng(14)*2)).forEach((col,i)=>{
      const f=new THREE.Mesh(new THREE.SphereGeometry(0.08,6,5),MM(parseInt(col.replace('#','0x')),0.4));
      f.position.set(-0.15+i*0.15,h*0.4+0.14,d*0.5+0.09); group.add(f);
    });
  }

  return group;
}

// ════════════════════════════════════════════
// LANTERN
// ════════════════════════════════════════════
function makeLantern(glowColor=0xfde68a){
  const g=new THREE.Group();
  // Pole
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.05,2.4,isMobile?5:8),MM(0x3a2a1a));
  pole.position.y=1.2; pole.castShadow=true; g.add(pole);
  // Top cross
  const cross=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.05,0.05),MM(0x3a2a1a));
  cross.position.y=2.35; g.add(cross);
  // Lantern body
  const lanBody=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.15,0.35,isMobile?4:6),MM(0x2a1a0a,0,0.6));
  lanBody.position.y=2.2; g.add(lanBody);
  // Glow
  const glow=new THREE.Mesh(new THREE.SphereGeometry(0.14,isMobile?5:8,isMobile?4:6),MM(glowColor,2.8,0.1));
  glow.position.y=2.2; g.add(glow);
  // PointLights are the #1 GPU cost — skip on mobile
  if(!isMobile){
    const pl=new THREE.PointLight(glowColor,3.2,9.5,2);
    pl.position.y=2.2; g.add(pl);
  }
  return g;
}

// ════════════════════════════════════════════
// BALLOON
// ════════════════════════════════════════════
function makeBalloon(col,x,y,z){
  const g=new THREE.Group();
  g.position.set(x,y,z);
  const colors=[0xec4899,0xa78bfa,0xfde68a,0x60d9f0,0x6ee7b7];
  const c=col||colors[Math.floor(Math.random()*colors.length)];
  const ball=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,10),MM(c,0.2,0.1));
  ball.scale.y=1.2; g.add(ball);
  // String
  const sPts=[new THREE.Vector3(0,0,0),new THREE.Vector3(0.05,-0.3,0),new THREE.Vector3(0,-0.5,0)];
  const sg=new THREE.BufferGeometry().setFromPoints(sPts);
  g.add(new THREE.Line(sg,new THREE.LineBasicMaterial({color:0xddccff})));
  g.userData.floatSeed=Math.random()*Math.PI*2;
  scene.add(g);
  return g;
}

// ════════════════════════════════════════════
// SIGN
// ════════════════════════════════════════════
function makeSign3D(text,x,y,z,rotY=0){
  const g=new THREE.Group();
  g.position.set(x,y,z); g.rotation.y=rotY;
  // Post
  const post=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.5,6),MM(0x5a3010));
  post.position.y=0.75; g.add(post);
  // Board
  const board=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.5,0.08),MM(0x2d1a5a));
  board.position.y=1.6;
  // Border
  const border=new THREE.Mesh(new THREE.BoxGeometry(1.68,0.58,0.06),MM(0xa78bfa,0.3));
  border.position.y=1.6; g.add(border); g.add(board);
  return g;
}

// ════════════════════════════════════════════
// ROYAL ARCHWAY
// ════════════════════════════════════════════
function makeRoyalArch(x,y,z,rotY=0){
  const g=new THREE.Group();
  g.position.set(x,y,z); g.rotation.y=rotY;
  const colMat=MM(0xf7e5ff,0.05,0.75);
  const goldMat=MM(0xf6c56a,0.8,0.3,0.7);
  const postL=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,4,10),colMat);
  postL.position.set(-2,2,0); postL.castShadow=true; g.add(postL);
  const postR=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,4,10),colMat);
  postR.position.set(2,2,0); postR.castShadow=true; g.add(postR);
  const arch=new THREE.Mesh(new THREE.TorusGeometry(2,0.22,10,18,Math.PI),colMat);
  arch.position.set(0,4,0); arch.rotation.z=Math.PI; arch.castShadow=true; g.add(arch);
  const crown=new THREE.Mesh(new THREE.ConeGeometry(0.5,0.6,8),goldMat);
  crown.position.set(0,4.8,0); g.add(crown);
  const jewel=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,6),MM(0xfde68a,1.2,0.2));
  jewel.position.set(0,5.2,0); g.add(jewel);
  if(!isMobile){
    const pl=new THREE.PointLight(0xfde68a,1,8,2);
    pl.position.set(0,5.2,0); g.add(pl);
  }
  return g;
}

// ════════════════════════════════════════════
// TREE
// ════════════════════════════════════════════
function makeTree(scale=1){
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.12*scale,0.16*scale,0.9*scale,7),MM(0x6b3d1e,0,0.9));
  trunk.position.y=0.45*scale; trunk.castShadow=true; g.add(trunk);
  // Layered canopy
  [[1.2,0.9],[0.95,1.4],[0.7,1.85]].forEach(([r,y],i)=>{
    const lMat=MM(i===0?0x1a6b30:i===1?0x2a8a40:0x3aaa50,0.05,0.8);
    const layer=new THREE.Mesh(new THREE.ConeGeometry(r*scale,0.7*scale,8),lMat);
    layer.position.y=y*scale; layer.castShadow=true; g.add(layer);
  });
  // Small flowers on canopy sometimes
  if(Math.random()<0.4){
    const fl=new THREE.Mesh(new THREE.SphereGeometry(0.12*scale,6,5),MM(0xec4899,0.4));
    fl.position.set(0.5*scale,1.6*scale,0.3*scale); g.add(fl);
  }
  return g;
}

function makeStreetCritter(type,x,y,z){
  const g=new THREE.Group();
  g.position.set(x,y,z);
  const colors={cat:0xf8d5a0,bunny:0xf7e7ff,bear:0xd9a373,fox:0xf4a65d};
  const c=colors[type]||0xf8d5a0;
  const bodyMat=MM(c,0,0.7);
  const eyeMat=MM(0x1a0a04,0,0.5);
  const blushMat=MM(0xffa8c8,0.2,0.2);

  const body=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,6),bodyMat);
  body.scale.y=1.1; g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.15,8,6),bodyMat);
  head.position.y=0.26; g.add(head);

  const eL=new THREE.Mesh(new THREE.SphereGeometry(0.03,6,5),eyeMat);
  eL.position.set(-0.05,0.28,0.12); g.add(eL);
  const eR=new THREE.Mesh(new THREE.SphereGeometry(0.03,6,5),eyeMat);
  eR.position.set(0.05,0.28,0.12); g.add(eR);
  const cheekL=new THREE.Mesh(new THREE.SphereGeometry(0.03,6,5),blushMat);
  cheekL.position.set(-0.09,0.24,0.11); g.add(cheekL);
  const cheekR=new THREE.Mesh(new THREE.SphereGeometry(0.03,6,5),blushMat);
  cheekR.position.set(0.09,0.24,0.11); g.add(cheekR);

  if(type==='bunny'){
    [-1,1].forEach(s=>{
      const ear=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.04,0.18,6),bodyMat);
      ear.position.set(s*0.06,0.42,0); ear.rotation.z=s*0.2; g.add(ear);
    });
  } else if(type==='cat'||type==='fox'){
    [-1,1].forEach(s=>{
      const ear=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.12,5),bodyMat);
      ear.position.set(s*0.07,0.38,0); ear.rotation.z=s*0.2; g.add(ear);
    });
  } else if(type==='bear'){
    [-1,1].forEach(s=>{
      const ear=new THREE.Mesh(new THREE.SphereGeometry(0.05,6,5),bodyMat);
      ear.position.set(s*0.08,0.34,0); g.add(ear);
    });
  }

  g.userData.bounceOffset=Math.random()*Math.PI*2;
  g.userData.baseY=y;
  scene.add(g);
  streetCritters.push(g);
  return g;
}

// ════════════════════════════════════════════
// PLACE BUILDINGS ALONG ROAD
// ════════════════════════════════════════════
const allObjects=[];
const windows=[];
const balloons=[];
const streetCritters=[];
const skyOrbs=[];

function placeCityAlong(){
  const pts=roadSpline.getPoints(isMobile?36:60);
  pts.forEach((pt,i)=>{
    if(i===0) return;
    const dir=i<pts.length-1
      ?new THREE.Vector3().subVectors(pts[i+1],pt).normalize()
      :new THREE.Vector3().subVectors(pt,pts[i-1]).normalize();
    const right=new THREE.Vector3(-dir.z,0,dir.x);

    // Place buildings on both sides
    [-1,1].forEach(side=>{
      const seed=i*100+side*50;
      const off=4.5+Math.random()*2.5;
      const bpos=pt.clone().addScaledVector(right,side*off);

      if(i%2===0){
        // House
        const h=makeHouse('normal',seed);
        h.position.set(bpos.x,0,bpos.z);
        h.rotation.y=Math.atan2(right.x,right.z)*(side>0?1:-1)+Math.PI/2+side*Math.PI/8;
        scene.add(h);
        allObjects.push(h);

        // Collect window meshes
        h.traverse(c=>{
          if(c.userData.isWin) windows.push(c);
        });
      }

      // Lanterns — every other segment on mobile
      const lanternStep=isMobile?4:2;
      if(i%lanternStep===0){
        const lpos=pt.clone().addScaledVector(right,side*3.5);
        const lanColors=[0xfde68a,0xffd089,0xf9a8d4,0xffc0d9];
        const lan=makeLantern(lanColors[i%lanColors.length]);
        lan.position.set(lpos.x,0,lpos.z);
        scene.add(lan);
        allObjects.push(lan);
      }

      // Trees — less on mobile
      const treeStep=isMobile?8:4;
      const treePct=isMobile?0.5:0.7;
      if(i%treeStep===0 && Math.random()<treePct){
        const tpos=pt.clone().addScaledVector(right,side*(off+1.5+Math.random()*1.5));
        const t=makeTree(0.8+Math.random()*0.5);
        t.position.set(tpos.x,0,tpos.z);
        scene.add(t);
      }

      // Street critters — less on mobile
      const critterStep=isMobile?10:5;
      const critterPct=isMobile?0.35:0.55;
      if(i%critterStep===0 && Math.random()<critterPct){
        const cpos=pt.clone().addScaledVector(right,side*(off-1.2+Math.random()*0.8));
        const types=['bunny','cat','bear','fox'];
        makeStreetCritter(types[(i+types.length)%types.length],cpos.x,0,cpos.z);
      }

      // Balloons — skip on mobile
      if(!isMobile && Math.random()<0.35){
        const bpos2=bpos.clone().addScaledVector(right,side*0.5);
        const b=makeBalloon(null,bpos2.x,2.2+Math.random()*2.2,bpos2.z);
        balloons.push(b);
      }

      // Signs
      if(i%8===0 && side===1){
        const spos=pt.clone().addScaledVector(right,side*3.6);
        const signs3d=makeSign3D('',spos.x,0,spos.z,Math.atan2(-dir.x,-dir.z));
        scene.add(signs3d);
      }
    });
  });
}
placeCityAlong();

function placeRoyalAvenue(){
  const tList=[0.72,0.8,0.86];
  tList.forEach(t=>{
    const p=roadSpline.getPoint(t);
    const p2=roadSpline.getPoint(Math.min(t+0.01,0.99));
    const dir=new THREE.Vector3().subVectors(p2,p).normalize();
    const rotY=Math.atan2(dir.x,dir.z);
    const arch=makeRoyalArch(p.x,0,p.z,rotY);
    scene.add(arch);
  });
}
placeRoyalAvenue();

// ════════════════════════════════════════════
// MOON in sky
// ════════════════════════════════════════════
const moonGroup=new THREE.Group();
moonGroup.position.set(-25,45,-120);
scene.add(moonGroup);

const cBody=document.createElement('canvas');
cBody.width=256;cBody.height=256;
const ctxB=cBody.getContext('2d');
ctxB.fillStyle='#fffceb';
ctxB.beginPath();ctxB.arc(128,128,120,0,Math.PI*2);ctxB.fill();
ctxB.fillStyle='rgba(230,220,180,0.5)';
ctxB.beginPath();ctxB.arc(90,90,30,0,Math.PI*2);ctxB.fill();
ctxB.beginPath();ctxB.arc(170,110,20,0,Math.PI*2);ctxB.fill();
ctxB.beginPath();ctxB.arc(130,180,40,0,Math.PI*2);ctxB.fill();
const texBody=new THREE.CanvasTexture(cBody);

const cGlow=document.createElement('canvas');
cGlow.width=256;cGlow.height=256;
const ctxG=cGlow.getContext('2d');
const gradG=ctxG.createRadialGradient(128,128,20,128,128,128);
gradG.addColorStop(0,'rgba(255,255,255,1)');
gradG.addColorStop(0.2,'rgba(253,230,138,0.9)');
gradG.addColorStop(0.5,'rgba(236,72,153,0.4)');
gradG.addColorStop(1,'rgba(124,58,237,0)');
ctxG.fillStyle=gradG;
ctxG.fillRect(0,0,256,256);
const texGlow=new THREE.CanvasTexture(cGlow);

const moonBody=new THREE.Sprite(new THREE.SpriteMaterial({map:texBody,color:0xffffff}));
moonBody.scale.set(16,16,1);
moonGroup.add(moonBody);

const moonGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:texGlow,color:0xffffff,blending:THREE.AdditiveBlending,transparent:true}));
moonGlow.scale.set(45,45,1);
moonGroup.add(moonGlow);

const moonPL=new THREE.PointLight(0xfde68a,1.5,250);
moonPL.position.copy(moonGroup.position);
scene.add(moonPL);

// ════════════════════════════════════════════
// STARS
// ════════════════════════════════════════════
const starGeo=new THREE.BufferGeometry();
const starVerts=[];
const starCount=isMobile?200:450;
for(let i=0;i<starCount;i++){
  starVerts.push((Math.random()-0.5)*300,(10+Math.random()*60),(Math.random()-0.5)*300);
}
starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starVerts,3));
const starMat=new THREE.PointsMaterial({color:0xffffff,size:0.2,sizeAttenuation:true,transparent:true,opacity:0.75});
scene.add(new THREE.Points(starGeo,starMat));

function buildSkyOrbs(){
  const cols=[0xfde68a,0xf9a8d4,0xa78bfa,0x93c5fd,0x6ee7b7];
  const orbCount=isMobile?8:22;
  for(let i=0;i<orbCount;i++){
    const orb=new THREE.Mesh(
      new THREE.SphereGeometry(0.18+Math.random()*0.18,8,6),
      MM(cols[i%cols.length],0.9,0.2)
    );
    orb.position.set((Math.random()-0.5)*200,12+Math.random()*40,(Math.random()-0.5)*200);
    orb.userData.floatSeed=Math.random()*Math.PI*2;
    scene.add(orb);
    skyOrbs.push(orb);
  }
}
buildSkyOrbs();

// ════════════════════════════════════════════
// PARTICLES (magical floating)
// ════════════════════════════════════════════
const partGeo=new THREE.BufferGeometry();
const partPos=[];const partPhases=[];
const partCount=isMobile?40:100;
for(let i=0;i<partCount;i++){
  partPos.push((Math.random()-0.5)*80,(Math.random()*6),(Math.random()-0.5)*300-100);
  partPhases.push(Math.random()*Math.PI*2);
}
partGeo.setAttribute('position',new THREE.Float32BufferAttribute(partPos,3));
const partMat=new THREE.PointsMaterial({color:0xa78bfa,size:0.12,sizeAttenuation:true,transparent:true,opacity:0.7});
const parts=new THREE.Points(partGeo,partMat);
scene.add(parts);

// ════════════════════════════════════════════
// GIFT BOXES
// ════════════════════════════════════════════
const giftPositionsT=[0.12,0.24,0.36,0.48,0.60,0.72]; // t along spline
const giftMeshes=[];

function makeGiftBox(t,idx){
  const pos=roadSpline.getPoint(t);
  const g=new THREE.Group();
  g.position.set(pos.x,0,pos.z);

  const colors=[0x7c3aed,0xec4899,0xf59e0b,0x10b981,0x3b82f6,0xa855f7];
  const col=colors[idx%colors.length];
  const boxMat=MM(col,0.1,0.3,0.1);
  const lidMat=MM(col,0.15,0.3,0.1);
  const ribMat=MM(0xfde68a,0.5,0.2);

  // Box
  const box=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.6,0.7),boxMat);
  box.position.y=0.3; box.castShadow=true; g.add(box);
  // Lid
  const lid=new THREE.Mesh(new THREE.BoxGeometry(0.72,0.18,0.72),lidMat);
  lid.position.y=0.69; lid.castShadow=true; g.add(lid);
  // Ribbons
  const ribX=new THREE.Mesh(new THREE.BoxGeometry(0.73,0.08,0.08),ribMat);
  ribX.position.y=0.5; g.add(ribX);
  const ribZ=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.73),ribMat);
  ribZ.position.y=0.5; g.add(ribZ);
  // Bow
  const bowMat=MM(0xfde68a,0.6,0.2);
  const bowL=new THREE.Mesh(new THREE.TorusGeometry(0.12,0.04,6,12,Math.PI),bowMat);
  bowL.position.set(-0.12,0.78,0); bowL.rotation.z=Math.PI/4; g.add(bowL);
  const bowR=new THREE.Mesh(new THREE.TorusGeometry(0.12,0.04,6,12,Math.PI),bowMat);
  bowR.position.set(0.12,0.78,0); bowR.rotation.z=-Math.PI/4; g.add(bowR);

  // Glow ring
  const glowRing=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.04,8,20),MM(0xfde68a,1.2,0.1));
  glowRing.rotation.x=Math.PI/2; glowRing.position.y=0.05;
  g.add(glowRing);

  g.userData={idx,t,opened:false,glowRing,pl:null};
  if(!isMobile){
    const gpl=new THREE.PointLight(0xfde68a,2,4,2);
    gpl.position.y=1; g.add(gpl);
    g.userData.pl=gpl;
  }
  scene.add(g);
  giftMeshes.push(g);
  return g;
}

giftPositionsT.forEach((t,i)=>makeGiftBox(t,i));

// ════════════════════════════════════════════
// CASTLE
// ════════════════════════════════════════════
const castleGroup=new THREE.Group();
const castleT=0.88;
const castlePos=roadSpline.getPoint(castleT);
castleGroup.position.set(castlePos.x,0,castlePos.z-10);
castleGroup.rotation.y=Math.PI/10;
scene.add(castleGroup);
castleGroup.visible=false;
const castleSignGroup=new THREE.Group();
castleGroup.add(castleSignGroup);

const gateFocus=new THREE.Vector3();
function updateGateFocus(){
  if(castleGroup.userData.gateHit){
    castleGroup.userData.gateHit.getWorldPosition(gateFocus);
    gateFocus.y+=0.8;
    setLookOverride(gateFocus);
  }
}

function buildCastle(){
  const wallMat=MM(0xe6d9ff,0.05,0.85);
  const shadowMat=MM(0xd1c2f2,0.05,0.9);
  const roofMat2=MM(0x7a5de8,0.15,0.55);
  const goldMat=MM(0xf6c56a,0.9,0.3,0.7);
  const winGlowMat=MM(0xfff0b3,1.8,0.1);
  const trimMat=MM(0xffffff,0.08,0.6);
  const gateGlowMat=MM(0xfde68a,1.4,0.2);

  // Plaza
  const plaza=new THREE.Mesh(new THREE.CircleGeometry(11,32),MM(0xece4ff,0.05,0.9));
  plaza.rotation.x=-Math.PI/2; plaza.position.set(0,0.01,-1.5); plaza.receiveShadow=true; castleGroup.add(plaza);

  // Base walls
  const base=new THREE.Mesh(new THREE.BoxGeometry(18,4.5,14),wallMat);
  base.position.y=2.25; base.castShadow=true; base.receiveShadow=true; castleGroup.add(base);
  const frontWall=new THREE.Mesh(new THREE.BoxGeometry(18,5,2.6),shadowMat);
  frontWall.position.set(0,2.5,-7.6); frontWall.castShadow=true; castleGroup.add(frontWall);

  // Front columns for depth
  for(let i=-7;i<=7;i+=2.8){
    const col=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,4.0,10),trimMat);
    col.position.set(i,2.1,-7.2); col.castShadow=true; castleGroup.add(col);
  }

  // Front gable layer to break the rectangle
  const gable=new THREE.Mesh(new THREE.ConeGeometry(4.8,2.8,4),roofMat2);
  gable.position.set(0,6.5,-7.0); gable.rotation.y=Math.PI/4; gable.castShadow=true; castleGroup.add(gable);
  const gableBase=new THREE.Mesh(new THREE.BoxGeometry(10,0.5,3.0),trimMat);
  gableBase.position.set(0,5.3,-7.2); castleGroup.add(gableBase);

  // Gatehouse
  const gateHouse=new THREE.Mesh(new THREE.BoxGeometry(6.5,7.2,5.8),wallMat);
  gateHouse.position.set(0,3.6,-6.0); gateHouse.castShadow=true; castleGroup.add(gateHouse);
  const gateBody=new THREE.Mesh(new THREE.BoxGeometry(4.0,4.0,2.4),MM(0x20102e,0,0.9));
  gateBody.position.set(0,2.0,-9.0); castleGroup.add(gateBody);
  const gateArch=new THREE.Mesh(new THREE.TorusGeometry(1.8,0.26,10,18,Math.PI),shadowMat);
  gateArch.position.set(0,3.6,-9.0); gateArch.rotation.z=Math.PI; gateArch.castShadow=true; castleGroup.add(gateArch);
  const gateFrame=new THREE.Mesh(new THREE.TorusGeometry(2.05,0.13,8,20,Math.PI),gateGlowMat);
  gateFrame.position.set(0,3.6,-9.0); gateFrame.rotation.z=Math.PI; castleGroup.add(gateFrame);

  // Gate doors (L+R)
  const doorL=new THREE.Mesh(new THREE.BoxGeometry(1.6,3.4,0.2),MM(0x3a1a0a,0,0.9));
  doorL.position.set(-0.8,1.7,-8.2); castleGroup.add(doorL);
  const doorR=new THREE.Mesh(new THREE.BoxGeometry(1.6,3.4,0.2),MM(0x3a1a0a,0,0.9));
  doorR.position.set(0.8,1.7,-8.2); castleGroup.add(doorR);
  const doorKnobL=new THREE.Mesh(new THREE.SphereGeometry(0.08,8,6),goldMat);
  doorKnobL.position.set(-0.22,1.8,-8.05); castleGroup.add(doorKnobL);
  const doorKnobR=new THREE.Mesh(new THREE.SphereGeometry(0.08,8,6),goldMat);
  doorKnobR.position.set(0.22,1.8,-8.05); castleGroup.add(doorKnobR);
  const gateHit=new THREE.Mesh(new THREE.BoxGeometry(4.2,4.5,1.8),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));
  gateHit.position.set(0,2.1,-8.2); castleGroup.add(gateHit);
  castleGroup.userData={doorL,doorR,gateHit};

  // Balcony
  const balcony=new THREE.Mesh(new THREE.BoxGeometry(3.6,0.2,1.2),trimMat);
  balcony.position.set(0,4.4,-6.8); balcony.castShadow=true; castleGroup.add(balcony);
  const balRail=new THREE.Mesh(new THREE.BoxGeometry(3.6,0.55,0.1),goldMat);
  balRail.position.set(0,4.68,-6.2); castleGroup.add(balRail);

  // Side wings
  const wingL=new THREE.Mesh(new THREE.BoxGeometry(5.2,5.5,7),wallMat);
  wingL.position.set(-6.6,2.75,1.2); wingL.castShadow=true; castleGroup.add(wingL);
  const wingR=new THREE.Mesh(new THREE.BoxGeometry(5.2,5.5,7),wallMat);
  wingR.position.set(6.6,2.75,1.2); wingR.castShadow=true; castleGroup.add(wingR);
  const wingRoofL=new THREE.Mesh(new THREE.ConeGeometry(3.2,2.6,4),roofMat2);
  wingRoofL.position.set(-6.6,6.2,1.2); wingRoofL.rotation.y=Math.PI/4; wingRoofL.castShadow=true; castleGroup.add(wingRoofL);
  const wingRoofR=new THREE.Mesh(new THREE.ConeGeometry(3.2,2.6,4),roofMat2);
  wingRoofR.position.set(6.6,6.2,1.2); wingRoofR.rotation.y=Math.PI/4; wingRoofR.castShadow=true; castleGroup.add(wingRoofR);

  // Main keep
  const keep=new THREE.Mesh(new THREE.BoxGeometry(9,12,9),shadowMat);
  keep.position.set(0,8,0.8); keep.castShadow=true; keep.receiveShadow=true; castleGroup.add(keep);
  const keepRoof=new THREE.Mesh(new THREE.ConeGeometry(6,5,4),roofMat2);
  keepRoof.position.set(0,14.5,1); keepRoof.rotation.y=Math.PI/4; keepRoof.castShadow=true; castleGroup.add(keepRoof);
  const keepRoofBand=new THREE.Mesh(new THREE.BoxGeometry(9.6,0.4,9.6),trimMat);
  keepRoofBand.position.set(0,12.2,0.8); castleGroup.add(keepRoofBand);

  // Central spire
  const spireBase=new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.9,5,10),roofMat2);
  spireBase.position.set(0,17.5,1); spireBase.castShadow=true; castleGroup.add(spireBase);
  const spireTop=new THREE.Mesh(new THREE.ConeGeometry(1.2,3,10),roofMat2);
  spireTop.position.set(0,20.5,1); spireTop.castShadow=true; castleGroup.add(spireTop);
  const spireStar=new THREE.Mesh(new THREE.OctahedronGeometry(0.5),MM(0xfde68a,1.6,0.2));
  spireStar.position.set(0,22,1); castleGroup.add(spireStar);
  if(!isMobile) {
    const starLight=new THREE.PointLight(0xfde68a,1.6,18,2);
    starLight.position.set(0,22,1); castleGroup.add(starLight);
  }

  function addTower(x,z,h=9,r=1.6){
    const tower=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),shadowMat);
    tower.position.set(x,h/2,z); tower.castShadow=true; castleGroup.add(tower);
    const tRoof=new THREE.Mesh(new THREE.ConeGeometry(r*1.25,3,12),roofMat2);
    tRoof.position.set(x,h+1.5,z); tRoof.castShadow=true; castleGroup.add(tRoof);
    const tFinial=new THREE.Mesh(new THREE.SphereGeometry(0.25,8,6),goldMat);
    tFinial.position.set(x,h+3.2,z); castleGroup.add(tFinial);
    const tw=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.9,0.2),winGlowMat);
    tw.position.set(x+(x>0?-r*0.9:r*0.9),h*0.6,z); castleGroup.add(tw);
    if(!isMobile){
      const pl=new THREE.PointLight(0xfff0b3,0.7,6,2);
      pl.position.set(x,h*0.7,z); castleGroup.add(pl);
    }
    const flagPole=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,2.2,6),goldMat);
    flagPole.position.set(x,h+3.6,z); castleGroup.add(flagPole);
    const flag=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.6,0.05),MM(0xec4899,0.2));
    flag.position.set(x+0.5, h+4.1, z); castleGroup.add(flag);
  }

  addTower(-8.2,-4.4,9,1.6);
  addTower(8.2,-4.4,9,1.6);
  addTower(-8.2,4.4,9,1.6);
  addTower(8.2,4.4,9,1.6);
  addTower(-4.5,-7.6,7,1.2);
  addTower(4.5,-7.6,7,1.2);

  // Battlements along the front wall
  for(let i=-7;i<=7;i+=2){
    const bm=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.8,0.7),shadowMat);
    bm.position.set(i,5,-6.8); castleGroup.add(bm);
  }

  // Main windows
  [-2.2,0,2.2].forEach(x=>{
    [6,9,11].forEach(y=>{
      const mw=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.2,0.12),winGlowMat);
      mw.position.set(x,y,-2.6); castleGroup.add(mw);
      if(!isMobile){
        const wpl=new THREE.PointLight(0xfff0b3,0.5,4,2);
        wpl.position.set(x,y,-2.2); castleGroup.add(wpl);
      }
    });
  });

  // Bridge
  const bridge=new THREE.Mesh(new THREE.BoxGeometry(4.0,0.3,6.0),MM(0xe0c9a8,0.1,0.8));
  bridge.position.set(0,0.2,-5.2); bridge.receiveShadow=true; castleGroup.add(bridge);
  const bridgeRail=new THREE.Mesh(new THREE.BoxGeometry(4.2,0.18,0.12),goldMat);
  bridgeRail.position.set(0,0.45,-7.6); castleGroup.add(bridgeRail);
  const torchL=new THREE.Mesh(new THREE.SphereGeometry(0.18,isMobile?5:8,isMobile?4:6),gateGlowMat);
  torchL.position.set(-2.2,1.9,-7.2); castleGroup.add(torchL);
  const torchR=new THREE.Mesh(new THREE.SphereGeometry(0.18,isMobile?5:8,isMobile?4:6),gateGlowMat);
  torchR.position.set(2.2,1.9,-7.2); castleGroup.add(torchR);
  if(!isMobile) {
    const torchPL=new THREE.PointLight(0xfde68a,1.2,6,2);
    torchPL.position.set(-2.2,2.1,-7.2); castleGroup.add(torchPL);
    const torchPR=new THREE.PointLight(0xfde68a,1.2,6,2);
    torchPR.position.set(2.2,2.1,-7.2); castleGroup.add(torchPR);

    // Castle ambient glow
    const apl=new THREE.PointLight(0xa78bfa,2.2,35,1);
    apl.position.set(0,9,0); castleGroup.add(apl);
    const gpl=new THREE.PointLight(0xfde68a,2,30,1.5);
    gpl.position.set(0,18,1); castleGroup.add(gpl);
  }
}
buildCastle();

function buildCastleSigns(){
  const spots=[
    {x:0,z:-12,ry:0},
    {x:0,z:6,ry:Math.PI},
    {x:-10,z:-2,ry:Math.PI/2},
    {x:10,z:-2,ry:-Math.PI/2},
    {x:-6.5,z:-9.5,ry:Math.PI/6},
    {x:6.5,z:-9.5,ry:-Math.PI/6},
  ];
  spots.forEach((p)=>{
    const s=makeSign3D('',p.x,0,p.z,p.ry);
    castleSignGroup.add(s);
    if(!isMobile){
      const glow=new THREE.PointLight(0xfde68a,0.8,6,2);
      glow.position.set(p.x,1.8,p.z);
      castleSignGroup.add(glow);
    }
  });
}
buildCastleSigns();

// ════════════════════════════════════════════
// PARTY ANIMALS (final scene)
// ════════════════════════════════════════════
const partyGroup=new THREE.Group();
partyGroup.visible=false;
scene.add(partyGroup);

function makeAnimal(type,x,y,z){
  const g=new THREE.Group();
  g.position.set(x,y,z);
  const colors={
    cat:0xf8d5a0,
    bunny:0xf7e7ff,
    bear:0xd9a373,
    bird:0xfff1a3,
    fox:0xf8b26a,
    panda:0xf2f2f2,
    dog:0xd7b087,
    duck:0xffe08a,
  };
  const c=colors[type]||0xf8d5a0;
  const bodyMat=MM(c,0,0.7);
  const bellyMat=MM(0xffffff,0.12,0.3);
  const eyeMat=MM(0x1a0a04,0,0.4);
  const blushMat=MM(0xffa8c8,0.2,0.2);

  // Body
  const body=new THREE.Mesh(new THREE.SphereGeometry(0.28,12,10),bodyMat);
  body.scale.y=1.15; g.add(body);
  const belly=new THREE.Mesh(new THREE.SphereGeometry(0.18,10,8),bellyMat);
  belly.position.set(0,-0.02,0.12); g.add(belly);

  // Head
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,10),bodyMat);
  head.position.y=0.44; g.add(head);

  // Eyes + highlights
  const eL=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,6),eyeMat);
  eL.position.set(-0.08,0.46,0.18); g.add(eL);
  const eR=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,6),eyeMat);
  eR.position.set(0.08,0.46,0.18); g.add(eR);
  const shineL=new THREE.Mesh(new THREE.SphereGeometry(0.02,6,5),MM(0xffffff,0.4));
  shineL.position.set(-0.065,0.48,0.2); g.add(shineL);
  const shineR=new THREE.Mesh(new THREE.SphereGeometry(0.02,6,5),MM(0xffffff,0.4));
  shineR.position.set(0.095,0.48,0.2); g.add(shineR);

  // Cheeks
  const cheekL=new THREE.Mesh(new THREE.SphereGeometry(0.04,8,6),blushMat);
  cheekL.position.set(-0.13,0.41,0.16); g.add(cheekL);
  const cheekR=new THREE.Mesh(new THREE.SphereGeometry(0.04,8,6),blushMat);
  cheekR.position.set(0.13,0.41,0.16); g.add(cheekR);

  // Party hat
  const hatMat=MM(Math.random()>0.5?0xec4899:0x7c3aed,0.1);
  const hat=new THREE.Mesh(new THREE.ConeGeometry(0.13,0.32,8),hatMat);
  hat.position.y=0.68; g.add(hat);
  const hatPom=new THREE.Mesh(new THREE.SphereGeometry(0.04,6,5),MM(0xffffff,0.3));
  hatPom.position.y=0.84; g.add(hatPom);

  // Ears
  if(type==='cat'||type==='bunny'||type==='bear'||type==='fox'||type==='dog'||type==='panda'){
    const earH=type==='bunny'?0.28:(type==='bear'||type==='panda'?0.16:0.2);
    [-1,1].forEach(s=>{
      const earTop=type==='fox'?0.09:0.08;
      const ear=new THREE.Mesh(new THREE.CylinderGeometry(type==='bunny'?0.05:0.07,earTop,earH,7),bodyMat);
      ear.position.set(s*0.12,0.6+earH/2,0); ear.rotation.z=s*0.2; g.add(ear);
      const inner=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.04,earH*0.7,6),blushMat);
      inner.position.set(s*0.12,0.6+earH/2,0.02); inner.rotation.z=s*0.2; g.add(inner);
    });
  }

  // Tiny feet
  [-0.12,0.12].forEach(s=>{
    const foot=new THREE.Mesh(new THREE.SphereGeometry(0.06,8,6),bellyMat);
    foot.position.set(s,-0.2,0.1); g.add(foot);
  });

  // Tail
  if(type==='cat'||type==='bunny'||type==='bear'||type==='fox'||type==='dog'||type==='panda'){
    const tail=new THREE.Mesh(new THREE.SphereGeometry(0.08,8,6),bodyMat);
    tail.position.set(0,-0.05,-0.2); g.add(tail);
  }
  g.userData.bounceOffset=Math.random()*Math.PI*2;
  g.userData.baseY=y;
  partyGroup.add(g);
  return g;
}

// ════════════════════════════════════════════
// BIRTHDAY CAKE (final)
// ════════════════════════════════════════════
const cakeGroup=new THREE.Group();
cakeGroup.visible=false;
scene.add(cakeGroup);

function buildCake(){
  const plate=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.7,0.2,26),MM(0xffffff,0.1,0.4));
  plate.position.y=0.1; plate.receiveShadow=true; cakeGroup.add(plate);

  const layers=[
    {r:3.0,h:0.9,y:0.65,col:0xf9a8d4},
    {r:2.4,h:0.85,y:1.65,col:0xffe4b5},
    {r:1.85,h:0.8,y:2.55,col:0xbad7ff},
    {r:1.35,h:0.75,y:3.35,col:0xdac1ff},
    {r:0.9,h:0.65,y:4.05,col:0xf9a8d4},
  ];
  const frostingMat=MM(0xffffff,0.1,0.2);
  layers.forEach((l,idx)=>{
    const tier=new THREE.Mesh(new THREE.CylinderGeometry(l.r,l.r,l.h,24),MM(l.col,0.06,0.35));
    tier.position.y=l.y; tier.castShadow=true; cakeGroup.add(tier);
    // Frosting top
    const frost=new THREE.Mesh(new THREE.CylinderGeometry(l.r+0.07,l.r+0.07,0.12,24),frostingMat);
    frost.position.y=l.y+l.h/2+0.06; cakeGroup.add(frost);
    // Ribbon ring
    const ring=new THREE.Mesh(new THREE.TorusGeometry(l.r+0.02,0.035,8,24),MM(0xfde68a,0.5,0.2));
    ring.position.y=l.y; ring.rotation.x=Math.PI/2; cakeGroup.add(ring);
    // Sprinkles
    const sprinkleCount=isMobile?5:20;
    for(let s=0;s<sprinkleCount;s++){
      const ang=Math.random()*Math.PI*2;
      const rr=l.r*0.7+Math.random()*l.r*0.25;
      const sp=new THREE.Mesh(new THREE.SphereGeometry(0.05,isMobile?4:6,isMobile?3:5),MM([0xec4899,0x7c3aed,0xf59e0b,0x10b981,0x3b82f6][s%5],0.3));
      sp.position.set(Math.cos(ang)*rr,l.y+l.h/2+0.12,Math.sin(ang)*rr);
      cakeGroup.add(sp);
    }
    // Drip pearls
    if(idx===0||idx===1){
      const dripCount=isMobile?3:10;
      for(let d=0;d<dripCount;d++){
        const ang=Math.random()*Math.PI*2;
        const drip=new THREE.Mesh(new THREE.SphereGeometry(0.06,isMobile?4:6,isMobile?3:5),MM(0xffffff,0.15,0.2));
        drip.position.set(Math.cos(ang)*(l.r+0.02),l.y-0.1,Math.sin(ang)*(l.r+0.02));
        cakeGroup.add(drip);
      }
    }
  });

  // Candles
  const candleColors=[0xec4899,0x7c3aed,0xf59e0b,0x10b981,0x3b82f6,0xa855f7,0x60d9f0];
  for(let i=0;i<7;i++){
    const angle=i/7*Math.PI*2;
    const cx2=Math.cos(angle)*0.6, cz2=Math.sin(angle)*0.6;
    const candle=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.5,isMobile?4:8),MM(candleColors[i]));
    candle.position.set(cx2,4.6,cz2); cakeGroup.add(candle);
    const flame=new THREE.Mesh(new THREE.SphereGeometry(0.07,isMobile?4:6,isMobile?3:5),MM(0xfde68a,2));
    flame.position.set(cx2,4.95,cz2); flame.scale.y=1.5; cakeGroup.add(flame);
    
    if(!isMobile) {
      const fpl=new THREE.PointLight(0xfde68a,1.6,2.5,2);
      fpl.position.set(cx2,4.95,cz2); cakeGroup.add(fpl);
    } else if (i===0) {
      const fplBase=new THREE.PointLight(0xfde68a,2.5,8,2);
      fplBase.position.set(0,4.95,0); cakeGroup.add(fplBase);
    }
  }

  // Crown topper
  const crownBase=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.7,0.2,12),MM(0xf6c56a,1,0.3,0.7));
  crownBase.position.y=5.2; cakeGroup.add(crownBase);
  const crown=new THREE.Mesh(new THREE.ConeGeometry(0.6,0.7,8),MM(0xf6c56a,1,0.3,0.7));
  crown.position.y=5.6; cakeGroup.add(crown);
  const starDeco=new THREE.Mesh(new THREE.OctahedronGeometry(0.25),MM(0xfde68a,2));
  starDeco.position.y=6.1; cakeGroup.add(starDeco);

  // Glow
  if(!isMobile) {
    const cpl=new THREE.PointLight(0xf9a8d4,3.5,12,1.5);
    cpl.position.y=2.5; cakeGroup.add(cpl);
  }

  // Click detection sphere (invisible)
  const hitSphere=new THREE.Mesh(new THREE.SphereGeometry(3.2,8,6),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));
  hitSphere.position.y=2.8; cakeGroup.add(hitSphere);
  cakeGroup.userData.hitSphere=hitSphere;
}
buildCake();

// ════════════════════════════════════════════
// FIREWORK PARTICLES
// ════════════════════════════════════════════
const fwParticles=[];
function spawnFW(x,y,z){
  const colors=[0xf59e0b,0xec4899,0xa78bfa,0xfde68a,0x93c5fd,0x6ee7b7,0xffffff];
  const count=isMobile?15:30;
  for(let i=0;i<count;i++){
    const geo=new THREE.SphereGeometry(0.08,4,3);
    const mat=new THREE.MeshBasicMaterial({color:colors[Math.floor(Math.random()*colors.length)]});
    const p=new THREE.Mesh(geo,mat);
    p.position.set(x,y,z);
    const angle=Math.random()*Math.PI*2;
    const elev=Math.random()*Math.PI-Math.PI/2;
    const speed=3+Math.random()*5;
    p.userData.vel=new THREE.Vector3(Math.cos(angle)*Math.cos(elev)*speed,Math.sin(elev)*speed,Math.sin(angle)*Math.cos(elev)*speed);
    p.userData.life=1;
    scene.add(p);
    fwParticles.push(p);
  }
}
function spawnFWBurst(){
  for(let i=0;i<8;i++){
    setTimeout(()=>{
      const x=(Math.random()-0.5)*20;
      const y=8+Math.random()*12;
      const z=camera.position.z-5-Math.random()*10;
      spawnFW(x,y,z);
      playFw();
    },i*300);
  }
}

// HTML Confetti
function htmlConfetti(n=80){
  // Halve confetti on mobile - DOM manipulation is expensive
  const count=isMobile?Math.floor(n/2):n;
  const cols=['#7c3aed','#ec4899','#f59e0b','#a78bfa','#fde68a','#93c5fd','#6ee7b7','#f9a8d4'];
  for(let i=0;i<count;i++){
    const el=document.createElement('div');
    el.className='cf';
    const s=5+Math.random()*8;
    el.style.cssText=`left:${Math.random()*100}vw;width:${s}px;height:${s*(Math.random()>.5?1:.3)}px;background:${cols[Math.floor(Math.random()*cols.length)]};--dx:${(Math.random()-.5)*160}px;animation-duration:${2+Math.random()*2}s;animation-delay:${Math.random()*.5}s;border-radius:${Math.random()>.5?'50%':'2px'};`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),5000);
  }
}

// ════════════════════════════════════════════
// GAME STATE
// ════════════════════════════════════════════
let gameState='start'; // start|moving|giftOpen|castle|party|final
let currentGift=0;
let camT=0.02; // camera position along spline
let targetT=0.0;
let isMoving=false;
let cameraLookAhead=0.014;
let inputEnabled=true;

let tiltEnabled=false;
let tiltReqDone=false;
const tiltOffset=new THREE.Vector2(0,0);
const lookOverride=new THREE.Vector3();
let useLookOverride=false;
let sweetnessSequenceRunning=false;
let awaitingCakeTap=false;
let finalCelebrationRunning=false;
let inspectionMode=false;
let castleSignCycleTimer=null;
let sweetnessSequenceDone=false;
let finalMessageShown=false;
let birthdayLoopActive=false;
let birthdayLoopTimer=null;

const moonFaces=['🌙😐','🌙😒','🌙😭'];
const moonProgressGifts=new Set([0,1,3]);
let moonStage=0;

// Camera smooth pos
let camPos=new THREE.Vector3();
let camLook=new THREE.Vector3();

function setLookOverride(v){
  lookOverride.copy(v);
  useLookOverride=true;
}

function clearLookOverride(){
  useLookOverride=false;
}

function updateCameraFromSpline(t){
  const tClamped=Math.max(0,Math.min(0.99,t));
  const pos=roadSpline.getPoint(tClamped);
  const lookT=Math.min(0.99,tClamped+cameraLookAhead);
  const lookPt=roadSpline.getPoint(lookT);
  camPos.set(pos.x,2.7,pos.z);
  if(useLookOverride){
    camLook.copy(lookOverride);
  } else {
    camLook.set(lookPt.x,2.0,lookPt.z);
  }
  if(tiltEnabled){
    camLook.x+=tiltOffset.x;
    camLook.y+=tiltOffset.y;
  }
  camera.position.lerp(camPos,0.08);
  camera.lookAt(camLook);
}

// ════════════════════════════════════════════
// GIFT DATA
// ════════════════════════════════════════════
const giftData=[
  {
    emoji:'🌙',
    title:'رسالة من القمر',
    text:'القمر قدم اعتراض رسمي...\n\nبيقول المنافسة النهاردة غير عادلة إطلاقا 😭😏',
    moonUp:true,
    catLine:'أنا لو مكانه أزعل بصراحة 😂',
  },
  {
    emoji:'🚨',
    title:'خبر عاجل',
    text:'نجوم المدينة كانت مرتبة السماء كويس...\n\nبس أول ما عرفوا مين عيد ميلاده النهاردة...\n\nبدأوا يلمعوا زيادة تلقائي 😭✨',
    moonUp:true,
    catLine:'واضح إنهم بيحاولوا يلفتوا الانتباه بس مفيش أمل 😂',
  },
  {
    emoji:'👨‍🔬',
    title:'تقرير علمي جديد',
    text:'العلماء اكتشفوا زيادة خطيرة في نسبة الجمال داخل المدينة...\n\nولحد دلوقتي محدش قادر يحدد المصدر 😶\n\nمع إن الموضوع واضح جدا بصراحة 😏',
    moonUp:true,
    catLine:'المدينة كلها مفضوح أمرها 😭😂',
  },
  {
    emoji:'👀',
    title:'رسالة على الحائط',
    text:'لقينا رسالة مكتوبة على الحائط...\n\nبعض الأيام حلوة...\n\nوبعض الأيام...\n\nبيكون فيها ريم ماشية في المدينة 😭✨',
    moonUp:true,
    catLine:'لا خلاص دي بقت مبالغة شوية 😂',
  },
  {
    emoji:'☁️',
    title:'الغيوم بعتت شكوى',
    text:'بيقولوا الجو النهاردة لطيف زيادة عن الطبيعي...\n\nوشاكين إن السبب شخص معين 😏\n\nوأيوة... يقصدوا انتي 😭✨',
    moonUp:true,
    catLine:'أنا مش بقول حاجة... أنا مجرد قطة بريئة 😭😂',
  },
  {
    emoji:'💌',
    title:'آخر رسالة سرية',
    text:'المدينة كلها كانت بتحاول تعرف...\n\nإزاي شخص واحد يقدر يخلي المكان كله ألطف كده 😭✨\n\nوبصراحة... لحد دلوقتي محدش لقى إجابة 😏',
    moonUp:true,
    catLine:'آه كده فهمت ليه القمر كان متضايق طول الرحلة 😂🌙',
  },
];

const introCatLine='أخيرا وصلت 😏\nأنا المرشدة الرسمية للمدينة...\nوبصراحة...\nحاسّة إن في شخص ورا كمية الحلاوة دي كلها 👀';

const roadSignsByGift={
  0:['ممنوع المشي بالحلاوة دي في الأماكن العامة 😏'],
  1:['حتى الشارع مرتب نفسه عشانك 😭'],
  2:['النجوم قالت: احنا هنطفي وخلاص 😂✨'],
  3:['القمر انسحب رسميا من المنافسة 🌙'],
  4:['تحذير: النجوم متوترة الليلة دي ✨'],
};

const castleWallSignTexts=[
  'كل سنة وانتي طيبة يا ريما 💖',
  'HBD REEM ✨',
  'احلى برميل ده ولا اي 😂',
  'القصر كله منور عشانك 😭',
  'المدينة كلها بتقولك كل سنة وانتي طيبة 🎂',
];

function showRoadSignsForGift(giftIdx){
  const list=roadSignsByGift[giftIdx];
  if(!list) return;
  list.forEach((text,i)=>{
    setTimeout(()=>showSign(text),i*1600);
  });
}

// ════════════════════════════════════════════
// UI FUNCTIONS
// ════════════════════════════════════════════
function showTapHint(text,show=true){
  const el=document.getElementById('tapHint');
  document.getElementById('tapText').textContent=text;
  el.style.opacity=show?'1':'0';
}

function catSay(msg,duration=4000){
  const bubble=document.getElementById('speechBubble');
  bubble.textContent=msg;
  bubble.classList.add('show');
  clearTimeout(catSay._t);
  catSay._t=setTimeout(()=>bubble.classList.remove('show'),duration);
}

function showSign(text){
  const el=document.getElementById('signPill');
  el.textContent=text;
  el.classList.add('vis');
  clearTimeout(showSign._t);
  showSign._t=setTimeout(()=>el.classList.remove('vis'),3500);
}

function showHbdBanner(show){
  const el=document.getElementById('hbdBanner');
  if(show) el.classList.add('show');
  else el.classList.remove('show');
}

function showPopup(emoji,title,text,btnText='يلا نكمل 🌟',cb){
  document.getElementById('popEmoji').textContent=emoji;
  document.getElementById('popTitle').textContent=title;
  document.getElementById('popText').textContent=text;
  document.getElementById('popBtn').textContent=btnText;
  document.getElementById('popup').classList.add('show');
  document.getElementById('speechBubble').classList.remove('show');
  inputEnabled=false;
  window._popupCb=cb||null;
}

window.closePopup=function(){
  document.getElementById('popup').classList.remove('show');
  inputEnabled=true;
  if(window._popupCb){ window._popupCb(); window._popupCb=null; }
};

function showTimedMsg(emoji,title,body,duration,onDone){
  const overlay=document.getElementById('msgOverlay');
  const bar=document.getElementById('msgProgress');
  document.getElementById('msgEmoji').textContent=emoji;
  document.getElementById('msgTitle').textContent=title;
  document.getElementById('msgBody').textContent=body||'';
  bar.style.transition='none';
  bar.style.width='0%';
  overlay.classList.add('show');
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      bar.style.transition=`width ${duration}ms linear`;
      bar.style.width='100%';
    });
  });
  setTimeout(()=>{
    overlay.classList.remove('show');
    onDone&&onDone();
  },duration);
}

function showFinalMessage(){
  if(finalMessageShown) return;
  finalMessageShown=true;
  inputEnabled=false;
  document.getElementById('finalContent').innerHTML=`
    <h2>عيد ميلاد سعيد يا ريم 🎂❤️</h2>
    <p>بصراحة... مهما المدينة حاولت تشرح سبب النور والحلاوة الليلة دي، ولا القمر عرف ينافس، ولا النجوم قدرت توصف... فالحقيقة أبسط من كل ده 😌✨</p>
    <p>إنتِ كنتِ أجمل وأحلى حاجة حصلت في حياتي، وأقرب وأعز شخص عليا. وجودك لوحده بيغير أي يوم ويخليه ألطف وأخف وأجمل ❤️</p>
    <p>أتمنى لك سنة مليانة ضحك وفرحة ونجاح وراحة قلب، وتحققي فيها كل اللي نفسك فيه، وتفضلي دايما بنفس الحلاوة والروح اللي بتخلي أي مكان حواليكي أحلى 😏🌙✨</p>
    <p>وبيننا سر صغير... واضح إن المدينة كلها كانت بتحاول تقولك نفس الكلام طول الرحلة 😭❤️</p>
    <p>اقفلي الرسالة بـ X عشان نولّع الاحتفال 🎉</p>
    <div class="secret">— M7</div>
  `;
  document.getElementById('finalMsg').classList.add('show');
}

function closeFinalMessage(){
  document.getElementById('finalMsg').classList.remove('show');
  initTiltControl();
  startFinalCelebration();
  setTimeout(()=>startInspectionMode(),1200);
}
window.closeFinalMessage=closeFinalMessage;

function startFinalCelebration(){
  if(finalCelebrationRunning) return;
  finalCelebrationRunning=true;
  inputEnabled=false;
  gameState='final';
  showTapHint('',false);
  showHbdBanner(true);

  // Fireworks + confetti + music
  spawnFWBurst();
  htmlConfetti(240);
  if(!birthdayLoopActive) playHappyBirthday();
  catSay('Happy Birthday Reem! 🎉🎂',6000);
  showSign('Happy Birthday Reem 🎶');

  let bursts=0;
  const iv=setInterval(()=>{
    spawnFWBurst();
    bursts++;
    if(bursts>=4) clearInterval(iv);
  },1800);
}

function startBirthdayLoop(){
  if(birthdayLoopActive) return;
  birthdayLoopActive=true;
  const loop=()=>{
    if(!birthdayLoopActive) return;
    playHappyBirthday();
    birthdayLoopTimer=setTimeout(loop,15000);
  };
  loop();
}

function startInspectionMode(){
  if(inspectionMode) return;
  inspectionMode=true;
  gameState='inspect';
  inputEnabled=false;
  showTapHint('',false);
  setCastleMood(true);
  initTiltControl();

  const focus=new THREE.Vector3(0,3.2,-6);
  castleGroup.localToWorld(focus);
  setLookOverride(focus);
  
  setTimeout(()=>{
    showSign('جولة تفحص القصر بدأت 👀');
    htmlConfetti(80);
    if(castleSignCycleTimer) clearInterval(castleSignCycleTimer);
    let idx=0;
    castleSignCycleTimer=setInterval(()=>{
      if(idx >= castleWallSignTexts.length) {
        clearInterval(castleSignCycleTimer);
        return;
      }
      showSign(castleWallSignTexts[idx]);
      idx++;
    },3800);
  }, 100);
}

function updateMoonForGift(giftIdx){
  if(!moonProgressGifts.has(giftIdx)) return;
  if(moonStage<moonFaces.length){
    document.getElementById('moonFace').textContent=moonFaces[moonStage];
    moonStage++;
  }
}

function updateGiftCounter(){
  document.getElementById('giftNum').textContent=currentGift;
}

// ════════════════════════════════════════════
// CAT BLINK ANIMATION
// ════════════════════════════════════════════
let blinkTimer=0;
function animateCat(dt){
  blinkTimer+=dt;
  const blinkL=document.getElementById('blinkL');
  const blinkR=document.getElementById('blinkR');
  if(blinkTimer>3+Math.random()*2){
    blinkTimer=0;
    blinkL.style.opacity='1'; blinkR.style.opacity='1';
    setTimeout(()=>{ blinkL.style.opacity='0'; blinkR.style.opacity='0'; },150);
  }
}

// ════════════════════════════════════════════
// GIFT OPEN ANIMATION
// ════════════════════════════════════════════
const giftSparkleGeo=new THREE.SphereGeometry(0.06,4,3);
function spawnGiftSparkle(basePos){
  const mat=new THREE.MeshBasicMaterial({color:0xfde68a,transparent:true,opacity:1});
  const pp=new THREE.Mesh(giftSparkleGeo,mat);
  pp.position.copy(basePos);
  pp.position.y=0.5;
  const ang=Math.random()*Math.PI*2;
  pp.userData.vel=new THREE.Vector3(Math.cos(ang)*1.6,2.2+Math.random()*1.4,Math.sin(ang)*1.6);
  pp.userData.life=1;
  pp.userData.baseOpacity=1;
  scene.add(pp);
  fwParticles.push(pp);
}

function openGift(giftMesh,cb){
  // Lid flies up
  const lid=giftMesh.children[1];
  if(!lid) return cb&&cb();
  let t2=0;
  let lastSparkle=0;
  let sparkleCount=0;
  const anim=()=>{
    t2+=0.12;
    lid.position.y=0.69+Math.sin(t2)*1.5+t2*0.3;
    lid.rotation.z=t2*0.5;
    lid.rotation.x=t2*0.3;
    // Sparkle particles around gift
    const now=performance.now();
    if(sparkleCount<5 && now-lastSparkle>90){
      lastSparkle=now;
      sparkleCount++;
      spawnGiftSparkle(giftMesh.position);
    }
    if(t2<0.9) requestAnimationFrame(anim);
    else{
      // Remove gift mesh
      setTimeout(()=>{
        giftMesh.visible=false;
        cb&&cb();
      },120);
    }
  };
  requestAnimationFrame(anim);
  playCollect();
}

// ════════════════════════════════════════════
// MOVE CAMERA TO T
// ════════════════════════════════════════════
function moveCameraTo(t,onArrival,speed=0.025){
  isMoving=true;
  targetT=t;
  let stepCount=0;
  const moveInterval=setInterval(()=>{
    if(Math.abs(camT-targetT)<0.002){
      camT=targetT;
      isMoving=false;
      clearInterval(moveInterval);
      onArrival&&onArrival();
    } else {
      camT+=(targetT-camT)*speed;
      if(stepCount%5===0) playStep();
      stepCount++;
    }
  },16);
}

// ════════════════════════════════════════════
// GAME FLOW
// ════════════════════════════════════════════
function handleGiftReached(giftIdx){
  inputEnabled=false;
  showTapHint('',false);
  const gm=giftMeshes[giftIdx];
  openGift(gm,()=>{
    currentGift++;
    updateGiftCounter();
    const d=giftData[giftIdx];
    if(d.moonUp) updateMoonForGift(giftIdx);
    showPopup(d.emoji,d.title,d.text,'يلا نكمل 🌟',()=>{
      if(d.catLine) catSay(d.catLine,4200);
      if(giftIdx<5){
        // Next gift or castle
        gameState='moving';
        inputEnabled=true;
        showTapHint('اضغط أي مكان للمتابعة',true);
        showRoadSignsForGift(giftIdx);
      } else {
        // All gifts done - show castle
        startCastleApproach();
      }
    });
  });
}

function startCastleApproach(){
  gameState='castle';
  castleGroup.visible=true;
  updateGateFocus();
  setCastleMood(true);
  inputEnabled=false;
  showTapHint('',false);
  showTimedMsg('🏰','بوابة القصر','الجو هنا أهدى شوية... والصدى أغرب...\nبس فيه دفء مستني جوا ✨',800,()=>{
    catSay('حاسّة إن القصر هنا ليه طابع مختلف... معاكس للمدينة شويه 😶',3000);
    showTapHint('اضغط أي مكان لفتح البوابة 🏰',true);
    showSign('ممنوع فتح الباب 👀');
    setTimeout(()=>showSign('القصر ساكت... بس بينادي'),1000);
    inputEnabled=true;
  });
}

function openCastleGate(){
  const {doorL,doorR}=castleGroup.userData;
  inputEnabled=false;
  showTapHint('',false);
  playCastle();
  showTimedMsg('🕯️','فتح البوابة','لحظة... البوابة بتستجيب ✨',400,()=>{
    let t2=0;
    const anim=()=>{
      t2+=0.15;
      if(doorL) doorL.rotation.y=-t2*0.9;
      if(doorR) doorR.rotation.y=t2*0.9;
      if(t2<Math.PI/2) requestAnimationFrame(anim);
      else moveCameraTo(castleT+0.03,()=>startPartyScene(),0.08);
    };
    requestAnimationFrame(anim);
  });
}

function startPartyScene(){
  gameState='party';
  awaitingCakeTap=true;
  sweetnessSequenceRunning=false;
  finalCelebrationRunning=false;
  showHbdBanner(false);
  setCastleMood(true);
  startBirthdayLoop();

  // Place cake inside the castle
  const cakePos=new THREE.Vector3(0,0,-3.4);
  castleGroup.localToWorld(cakePos);
  cakeGroup.position.copy(cakePos);
  cakeGroup.visible=true;

  // Place animals around the cake
  partyGroup.position.copy(cakePos);
  partyGroup.visible=true;
  const animalTypes=['cat','bunny','bear','bird','fox','panda','dog','duck','cat','bunny','bear','bird'];
  animalTypes.forEach((t,i)=>{
    const angle=i/animalTypes.length*Math.PI*2;
    makeAnimal(t,Math.cos(angle)*4.0,0,Math.sin(angle)*4.0);
  });

  // Party lights ring
  const ring=new THREE.Group();
  const ringColors=[0xfde68a,0xf9a8d4,0x93c5fd,0xa78bfa,0x6ee7b7];
  const ringLightStep=isMobile?6:3;
  for(let i=0;i<18;i++){
    const ang=i/18*Math.PI*2;
    const col=ringColors[i%ringColors.length];
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(0.1,isMobile?5:8,isMobile?4:6),MM(col,1.2,0.2));
    bulb.position.set(Math.cos(ang)*4.7,1.4,Math.sin(ang)*4.7);
    ring.add(bulb);
    if(!isMobile && i%ringLightStep===0){
      const pl=new THREE.PointLight(col,0.9,6,2);
      pl.position.copy(bulb.position);
      ring.add(pl);
    }
  }
  partyGroup.add(ring);

  // Soft fireworks and confetti in the distance
  spawnFWBurst();
  htmlConfetti(160);

  catSay('بنصحك بلاش تدوسي عليها 😂 بس لو نفسك اضغطي 🎂',5200);
  showTapHint('اضغط على التورتة 🎂',true);
  inputEnabled=true;

  // Focus camera on the cake
  const cakeFocus=cakePos.clone();
  cakeFocus.y+=1.6;
  setLookOverride(cakeFocus);
}

function startSweetnessSequence(){
  if(gameState!=='party'||sweetnessSequenceRunning||sweetnessSequenceDone) return;
  sweetnessSequenceRunning=true;
  sweetnessSequenceDone=true;
  inputEnabled=false;

  const autoMsgs=[
    {emoji:'⏳',title:'جاري تحميل الهدية...',text:'',duration:1400},
    {emoji:'📊',title:'جاري قياس كمية الحلاوة...',text:'رجاء الانتظار ✨',duration:1600},
    {emoji:'❌',title:'خطأ بالنظام 😶',text:'',duration:1500},
    {emoji:'💥',title:'القيمة أكبر من قدرة المدينة 😭✨',text:'',duration:1700},
  ];

  const btn=document.getElementById('popBtn');
  const prevDisplay=btn.style.display;
  let idx=0;

  const next=()=>{
    if(idx>=autoMsgs.length){
      closePopup();
      btn.style.display=prevDisplay||'';
      sweetnessSequenceRunning=false;
      showHbdBanner(true);
      showSign('HBD REEM ✨');
      showFinalMessage();
      return;
    }
    const m=autoMsgs[idx++];
    showPopup(m.emoji,m.title,m.text,'',null);
    btn.style.display='none';
    setTimeout(()=>{
      closePopup();
      next();
    },m.duration);
  };

  next();
}

// ════════════════════════════════════════════
// INPUT HANDLER
// ════════════════════════════════════════════
let tapCooldown=false;
const raycaster=new THREE.Raycaster();
const mouse=new THREE.Vector2();

function updatePointerFromEvent(e){
  const rect=canvas.getBoundingClientRect();
  const p=e.touches?e.touches[0]:e;
  const x=((p.clientX-rect.left)/rect.width)*2-1;
  const y=-((p.clientY-rect.top)/rect.height)*2+1;
  mouse.set(x,y);
}

function hitTest(obj){
  if(!obj) return false;
  raycaster.setFromCamera(mouse,camera);
  const hits=raycaster.intersectObject(obj,true);
  return hits.length>0;
}

function onDeviceTilt(e){
  if(e.beta==null||e.gamma==null) return;
  const gx=THREE.MathUtils.clamp(e.gamma/30,-0.6,0.6);
  const by=THREE.MathUtils.clamp(-e.beta/40,-0.5,0.5);
  tiltOffset.set(gx,by);
  tiltEnabled=true;
}

function initTiltControl(){
  tiltEnabled=false;
  return;
}

function handleTap(e){
  try{gAC();}catch(x){}
  initTiltControl();
  if(!inputEnabled||tapCooldown||isMoving) return;
  if(document.getElementById('popup').classList.contains('show')) return;
  if(document.getElementById('msgOverlay').classList.contains('show')) return;
  if(document.getElementById('finalMsg').classList.contains('show')) return;

  tapCooldown=true;
  setTimeout(()=>tapCooldown=false,800);

  if(gameState==='start'){
    gameState='moving';
    showTapHint('اضغط أي مكان للتحرك',true);
    catSay(introCatLine,6000);
    moveToNextGift();
    return;
  }

  if(gameState==='moving'){
    moveToNextGift();
    return;
  }

  if(gameState==='castle'){
    // Move to castle gate and open
    inputEnabled=false;
    showTapHint('',false);
    moveCameraTo(castleT-0.06,()=>{
      updateGateFocus();
      openCastleGate();
    });
    return;
  }

  if(gameState==='party'){
    if(sweetnessSequenceRunning) return;
    if(awaitingCakeTap){
      updatePointerFromEvent(e);
      if(hitTest(cakeGroup.userData.hitSphere)){
        awaitingCakeTap=false;
        gameState='party';
        showTapHint('',false);
        playCollect();
        moveCameraTo(castleT+0.05,()=>startSweetnessSequence());
      } else {
        showTapHint('اضغط على التورتة 🎂',true);
      }
    }
    return;
  }

  if(gameState==='inspect'){
    return;
  }
}

function moveToNextGift(){
  if(currentGift>=6) return;
  const t=giftPositionsT[currentGift];
  showTapHint('',false);
  moveCameraTo(t,()=>{
    handleGiftReached(currentGift);
  });
}

canvas.addEventListener('click',handleTap);
canvas.addEventListener('touchstart',(e)=>{ e.preventDefault(); handleTap(e); },{passive:false});

const walkBtn=document.getElementById('walkBtn');
if(walkBtn){
  walkBtn.addEventListener('touchstart',(e)=>{ e.preventDefault(); handleTap(e); },{passive:false});
  walkBtn.addEventListener('click',(e)=>{ e.preventDefault(); handleTap(e); });
}



// ════════════════════════════════════════════
// MAIN LOOP
// ════════════════════════════════════════════
let lastTime=0;
const clock=new THREE.Clock();
let frameCount=0;

function animate(){
  requestAnimationFrame(animate);
  const dt=clock.getDelta();
  const et=clock.getElapsedTime();
  frameCount++;
  // On mobile skip heavy per-frame work every other frame
  const doHeavy=!isMobile||(frameCount%2===0);

  // Camera from spline
  updateCameraFromSpline(camT);

  // Clouds drift — throttle on mobile
  if(doHeavy){
    clouds.forEach(c=>{
      c.position.y=c.userData.baseY+Math.sin(et*0.2+c.userData.floatSeed)*0.6;
      c.position.x=c.userData.baseX+Math.sin(et*0.12+c.userData.floatSeed)*1.2;
    });
  }

  // Sky orbs float — throttle on mobile
  if(doHeavy){
    skyOrbs.forEach(o=>{
      o.position.y+=Math.sin(et*0.6+o.userData.floatSeed)*0.01;
      o.material.emissiveIntensity=1.0+0.4*Math.sin(et*0.8+o.userData.floatSeed);
    });
  }

  // Animate balloons
  balloons.forEach(b=>{
    b.position.y+=(Math.sin(et*1.5+b.userData.floatSeed)*0.005);
    b.rotation.z=Math.sin(et*0.8+b.userData.floatSeed)*0.1;
  });

  // Street critters bounce — throttle on mobile
  if(doHeavy){
    streetCritters.forEach(c=>{
      c.position.y=c.userData.baseY+Math.abs(Math.sin(et*2.6+c.userData.bounceOffset))*0.08;
      c.rotation.y+=0.01;
    });
  }

  // Animate gift glow
  giftMeshes.forEach((gm,i)=>{
    if(gm.visible){
      gm.position.y=Math.sin(et*2+i)*0.12+0.12;
      gm.rotation.y+=0.02;
      if(gm.userData.glowRing) gm.userData.glowRing.rotation.z+=0.03;
    }
  });

  // Animate party animals
  if(partyGroup.visible){
    partyGroup.children.forEach(a=>{
      if(typeof a.userData.baseY==='number'){
        const sp=finalCelebrationRunning?4.2:2.5;
        a.position.y=a.userData.baseY+Math.abs(Math.sin(et*sp+a.userData.bounceOffset))*0.25;
        a.rotation.y+=finalCelebrationRunning?0.02:0.01;
      }
    });
    // Cake rotation
    if(cakeGroup.visible) cakeGroup.rotation.y+=finalCelebrationRunning?0.012:0.005;
  }

  // Firework particles
  for(let i=fwParticles.length-1;i>=0;i--){
    const p=fwParticles[i];
    p.userData.vel.y-=0.08;
    p.position.addScaledVector(p.userData.vel,dt);
    p.userData.life-=dt*0.7;
    if(p.material){
      const base=p.userData.baseOpacity||1;
      p.material.opacity=p.userData.life*base;
    }
    if(p.userData.life<=0){
      scene.remove(p);
      fwParticles.splice(i,1);
    }
  }

  // Window blinking — throttle on mobile (every 4 frames)
  if(!isMobile||(frameCount%4===0)){
    windows.forEach(w=>{
      const off=w.userData.blinkOff||0;
      w.material.emissiveIntensity=0.5+0.5*Math.sin(et*0.7+off);
      w.material.emissive.set(0xfde68a);
    });
  }

  // Moon glow pulse
  if(typeof moonGlow !== 'undefined') {
    moonGlow.material.opacity = 0.8+0.2*Math.sin(et*0.5);
  }

  // Stars twinkle
  starMat.opacity=0.6+0.4*Math.sin(et*0.3);

  // Magical particles float — throttle on mobile (every 3 frames)
  if(!isMobile||(frameCount%3===0)){
    const pPos=partGeo.attributes.position.array;
    for(let i=0;i<pPos.length;i+=3){
      pPos[i+1]+=Math.sin(et+partPhases[i/3])*0.003;
    }
    partGeo.attributes.position.needsUpdate=true;
  }

  // Cat blink
  animateCat(dt);

  renderer.render(scene,camera);
}

// ════════════════════════════════════════════
// START
// ════════════════════════════════════════════
function startJourney(){
  const intro=document.getElementById('intro');
  intro.style.transition='opacity .7s';
  intro.style.opacity='0';
  setTimeout(()=>{ intro.style.display='none'; },700);

  gameState='moving';
  inputEnabled=true;
  showTapHint('اضغط أي مكان للتحرك',true);
  catSay(introCatLine,6000);
  if(walkBtn) walkBtn.classList.add('show');
}
window.startJourney=startJourney;

function startGame(){
  document.getElementById('loading').style.transition='opacity .8s';
  document.getElementById('loading').style.opacity='0';
  setTimeout(()=>{ document.getElementById('loading').style.display='none'; },800);

  // Init camera
  const startPos=roadSpline.getPoint(0.01);
  camera.position.set(startPos.x,2.6,startPos.z+1);

  const intro=document.getElementById('intro');
  intro.style.opacity='1';
  intro.style.display='flex';

  animate();
}

// Wait for Three.js
setTimeout(startGame,400);
