import{Scene as re,PerspectiveCamera as ae,Group as te,PlaneGeometry as K,Mesh as G,ShaderMaterial as ee,Color as Q,WebGLRenderer as pe,Vector2 as y,BufferGeometry as he,BufferAttribute as oe,AdditiveBlending as ge,Points as xe,TextureLoader as we,SRGBColorSpace as J,Raycaster as ye,CanvasTexture as Me}from"./three.module-PDSP0dbZ.js";function Pe(){try{if(typeof window>"u"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return!1;const n=navigator.connection;if(n&&(n.saveData||/(^|-)2g$/.test(n.effectiveType||""))||(navigator.hardwareConcurrency||8)<=2||(navigator.deviceMemory||8)<=2)return!1;const e=document.createElement("canvas");return!!(e.getContext("webgl2")||e.getContext("webgl"))}catch{return!1}}function Ue(n){const e=getComputedStyle(n),s=(l,r)=>e.getPropertyValue(l).trim()||r;return{a:new Q(s("--sf-a","#23C4A6")),b:new Q(s("--sf-b","#0BAA8F"))}}const be="varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",ie="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",Se=`
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; } return v; }`,Ae=`
uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform vec3 uA; uniform vec3 uB; uniform vec2 uFocus; uniform float uStrength;
varying vec2 vUv;
${Se}
void main(){
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * asp * 1.7;
  float t = uTime * 0.07;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0*q + vec2(1.7, 9.2) + t*1.5), fbm(p + 3.0*q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 3.0*r);
  vec2 m = (uMouse - 0.5) * asp * 1.7;
  float spot = exp(-3.2 * length(p - m));
  float focus = smoothstep(1.15, 0.05, length((vUv - uFocus) * asp));
  vec3 col = mix(uA, uB, clamp(f * 1.5, 0.0, 1.0)) * (0.55 + f);
  float a = (0.10 + 0.62 * f * f + 0.55 * spot) * (0.35 + 0.65 * focus) * uStrength;
  gl_FragColor = vec4(col, clamp(a, 0.0, 0.95));
  #include <colorspace_fragment>
}`,Te=`
uniform sampler2D uTex; uniform float uAspect; uniform float uHover; uniform float uTime; uniform vec2 uTilt;
uniform float uMode; uniform vec3 uColor; uniform float uAlpha;
varying vec2 vUv;
float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec2 p = vUv - 0.5;
  float d = sdRound(p, vec2(0.5), 0.085);
  float mask = 1.0 - smoothstep(0.0, 0.006, d);
  if (mask < 0.01) discard;
  vec4 col;
  if (uMode > 0.5) {
    col = vec4(uColor, mask * uAlpha);
  } else {
    vec2 uv = vUv;
    if (uAspect > 1.0) uv.x = (uv.x - 0.5) / uAspect + 0.5; else uv.y = (uv.y - 0.5) * uAspect + 0.5;
    uv += uTilt * 0.012;
    vec3 c = texture2D(uTex, uv).rgb;
    float diag = vUv.x + vUv.y * 0.65;
    float pos = fract(uTime * 0.09 + uHover * 0.2) * 2.6 - 0.45;
    float sweep = smoothstep(0.34, 0.0, abs(diag - pos));
    c += sweep * (0.10 + 0.22 * uHover);
    vec2 g = vUv - (0.5 + uTilt * 0.5);
    c += exp(-6.0 * dot(g, g)) * 0.10;
    c *= 0.93 + 0.07 * (1.0 - vUv.y);
    float rim = 1.0 - smoothstep(0.0, 0.014, abs(d + 0.007));
    c = mix(c, vec3(1.0), rim * (0.30 + 0.35 * uHover));
    col = vec4(c, mask * uAlpha);
  }
  gl_FragColor = col;
  #include <colorspace_fragment>
}`,Ce=`
uniform float uTime; uniform float uH; uniform float uPx; attribute float aSeed; varying float vA;
void main(){
  vec3 pos = position;
  pos.y = mod(pos.y + uTime * (0.05 + aSeed * 0.16) + uH * 0.5, uH) - uH * 0.5;
  pos.x += sin(uTime * 0.4 + aSeed * 40.0) * 0.08;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (1.6 + aSeed * 4.2) * uPx * (7.0 / -mv.z);
  vA = 0.25 + aSeed * 0.55;
  gl_Position = projectionMatrix * mv;
}`,Re=`
uniform vec3 uColor; varying float vA;
void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA; gl_FragColor = vec4(uColor, a);
#include <colorspace_fragment>
}`,se=n=>1-(1-Math.min(1,Math.max(0,n)))**3,X=(n,e,s)=>n+(e-n)*s;function Ee(n=""){return n.split(/\s+/).filter(Boolean).slice(0,2).map(e=>e[0]).join("").toUpperCase()||"·"}function ne(n,e,s){const l=document.createElement("canvas");l.width=512,l.height=512;const r=l.getContext("2d"),v=r.createLinearGradient(0,0,512,512);v.addColorStop(0,`#${e.getHexString(J)}`),v.addColorStop(1,`#${s.getHexString(J)}`),r.fillStyle=v,r.fillRect(0,0,512,512),r.fillStyle="rgba(255,255,255,.88)",r.font="800 180px system-ui, sans-serif",r.textAlign="center",r.textBaseline="middle",r.fillText(Ee(n),256,272);const m=new Me(l);return m.colorSpace=J,{tex:m,aspect:1}}function le(n,e,s){return new Promise(l=>{if(!n){l(ne(e,s.a,s.b));return}const r=new we;r.setCrossOrigin("anonymous"),r.load(n,v=>{v.colorSpace=J,v.anisotropy=4,l({tex:v,aspect:v.image.width/Math.max(1,v.image.height)})},void 0,()=>l(ne(e,s.a,s.b)))})}function Z(n,e,s,l){return new ee({vertexShader:ie,fragmentShader:Te,transparent:!0,depthWrite:s===0,uniforms:{uTex:{value:n},uAspect:{value:e},uHover:{value:0},uTime:{value:0},uTilt:{value:new y},uMode:{value:s},uColor:{value:l||new Q(0)},uAlpha:{value:0}}})}function ue(n){const e=new pe({canvas:n,alpha:!0,antialias:!0,powerPreference:"high-performance"});return e.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75)),e.setClearColor(0,0),e}function ce(n,e){return new G(new K(2,2),new ee({vertexShader:be,fragmentShader:Ae,transparent:!0,depthTest:!1,depthWrite:!1,uniforms:{uTime:{value:0},uRes:{value:new y(1,1)},uMouse:{value:new y(.7,.5)},uA:{value:n.a},uB:{value:n.b},uFocus:{value:new y(.72,.5)},uStrength:{value:e}}}))}function ve(n,e){const s=new he,l=new Float32Array(e*3),r=new Float32Array(e);for(let f=0;f<e;f+=1)l[f*3]=(Math.random()-.5)*12,l[f*3+1]=(Math.random()-.5)*6,l[f*3+2]=-3+Math.random()*4,r[f]=Math.random();s.setAttribute("position",new oe(l,3)),s.setAttribute("aSeed",new oe(r,1));const v=new ee({vertexShader:Ce,fragmentShader:Re,transparent:!0,depthWrite:!1,blending:ge,uniforms:{uTime:{value:0},uH:{value:6},uPx:{value:Math.min(window.devicePixelRatio||1,1.75)},uColor:{value:n.a.clone().lerp(new Q(16777215),.35)}}}),m=new xe(s,v);return m.frustumCulled=!1,m}function me(n,e){let s=0,l=!0,r=performance.now(),v=0,m=!1;const f=d=>{if(m)return;const h=Math.min(.05,(d-r)/1e3);r=d,v+=h,l&&!document.hidden&&e(v,h),s=requestAnimationFrame(f)},p=new IntersectionObserver(([d])=>{l=d.isIntersecting},{threshold:0});return p.observe(n),s=requestAnimationFrame(f),()=>{m=!0,cancelAnimationFrame(s),p.disconnect()}}function Fe({canvas:n,host:e,anchor:s,items:l,accent:r,backdrop:v=!0,onHover:m,onPick:f}){const p=ue(n),d=new re,h=new ae(32,1,.1,60);h.position.z=9;const T=window.innerWidth<700,g=v?ce(r,1):null;g&&(g.renderOrder=-10,d.add(g));const O=ve(r,T?46:110);d.add(O);const P=new te;d.add(P);const _=r.b.clone().multiplyScalar(.35),M=l.slice(0,5).map((a,o)=>{const t=new te,u=new K(1,1),i=[2,1].map(z=>{const F=new G(u,Z(null,1,1,_));return F.position.z=-.025*z,F.scale.setScalar(1-.012*z),F.material.uniforms.uAlpha.value=0,t.add(F),F}),c=new G(u,Z(null,1,0));c.userData.index=o,t.add(c),P.add(t);const A={it:a,group:t,front:c,slabs:i,hover:0,tex:null};return le(a.image_url,a.name,r).then(({tex:z,aspect:F})=>{A.tex=z,c.material.uniforms.uTex.value=z,c.material.uniforms.uAspect.value=F}),A}),W=[{x:-.22,y:.04,z:.35,r:-.09,k:1,d:0},{x:.58,y:.34,z:-.25,r:.07,k:.8,d:.12},{x:.44,y:-.58,z:.6,r:-.05,k:.7,d:.22},{x:-.78,y:-.52,z:-.55,r:.1,k:.56,d:.32},{x:-.06,y:.78,z:-.9,r:-.06,k:.5,d:.4}];let b=1,C=1,L=.01,S=1,k=0,U=0;const q=()=>{const a=e.getBoundingClientRect();b=Math.max(1,a.width),C=Math.max(1,a.height),p.setSize(b,C,!1),h.aspect=b/C,h.updateProjectionMatrix();const o=2*Math.tan(h.fov*Math.PI/360)*h.position.z;L=o/C;const t=s();S=Math.min(t.h*.56,t.w*.52)*L,k=(t.cx-b/2)*L,U=(C/2-t.cy)*L,g&&(g.material.uniforms.uRes.value.set(b,C),g.material.uniforms.uFocus.value.set(t.cx/b,1-t.cy/C)),O.material.uniforms.uH.value=o,O.position.set(0,0,0)};q();const j=new ResizeObserver(q);j.observe(e);const H=new y(.5,.5),R=new y(.5,.5);let E=!1,x=-1;const w=new ye,B=new y,I=a=>{const o=e.getBoundingClientRect();if(H.set((a.clientX-o.left)/o.width,1-(a.clientY-o.top)/o.height),E=!0,g&&g.material.uniforms.uMouse.value.copy(R),a.target!==n){x!==-1&&(x=-1,m?.(null),n.style.cursor="");return}B.set(H.x*2-1,H.y*2-1),w.setFromCamera(B,h);const t=w.intersectObjects(M.map(i=>i.front),!1)[0],u=t?t.object.userData.index:-1;u!==x&&(x=u,n.style.cursor=u>=0?"pointer":"")},V=()=>{E=!1,x=-1,m?.(null),n.style.cursor=""},$=a=>{a.target===n&&x>=0&&f?.(M[x].it)};e.addEventListener("pointermove",I),e.addEventListener("pointerleave",V),e.addEventListener("click",$);const D=new y,Y=me(e,a=>{R.lerp(E?H:new y(.62,.5),.06);const o=(R.x-.5)*2,t=(R.y-.5)*2;g&&(g.material.uniforms.uTime.value=a,g.material.uniforms.uMouse.value.copy(R)),O.material.uniforms.uTime.value=a,P.rotation.y=X(P.rotation.y,o*.2,.06),P.rotation.x=X(P.rotation.x,-t*.12,.06);let u=null;if(M.forEach((i,c)=>{const A=W[c],z=i.tex?se((a-.15-A.d*1.5)/1.1):0;i.hover=X(i.hover,x===c?1:0,.12);const F=S*A.k*(.62+.38*z)*(1+i.hover*.09),fe=Math.sin(a*.7+c*1.7)*.05*S;i.group.position.set(k+A.x*S,U+A.y*S+fe-(1-z)*.9*S,A.z+i.hover*.7),i.group.rotation.set(Math.sin(a*.5+c)*.03,Math.sin(a*.4+c*2)*.07+o*.12*(1+A.z*.3),A.r+Math.sin(a*.45+c)*.02+i.hover*(-A.r*.6)),i.group.scale.setScalar(F);const N=i.front.material.uniforms;N.uTime.value=a+c*3,N.uHover.value=i.hover,N.uAlpha.value=z,N.uTilt.value.set(o*.5*(1-A.z*.2),t*.5),i.slabs.forEach(de=>{de.material.uniforms.uAlpha.value=z*.85}),x===c&&(D.set(i.group.position.x,i.group.position.y),u={i:c,x:0,y:0,it:i.it})}),u){const i=M[u.i],c=i.group.position.clone().project(h);u.x=(c.x*.5+.5)*b,u.y=(1-(c.y*.5+.5))*C-S*i.group.scale.y*.5/L*0,m?.(u)}p.render(d,h)});return{resize:q,destroy(){Y(),j.disconnect(),e.removeEventListener("pointermove",I),e.removeEventListener("pointerleave",V),e.removeEventListener("click",$),M.forEach(a=>{a.tex?.dispose(),a.front.material.dispose(),a.slabs.forEach(o=>o.material.dispose())}),d.traverse(a=>{a.geometry?.dispose?.()}),p.dispose(),p.forceContextLoss?.()}}}function Le({canvas:n,host:e,imageUrl:s,name:l,accent:r,onReady:v}){const m=ue(n),f=new re,p=new ae(30,1,.1,40);p.position.z=6;const d=ce(r,1.15);d.material.uniforms.uFocus.value.set(.5,.5),d.renderOrder=-10,f.add(d);const h=ve(r,window.innerWidth<700?40:90);f.add(h);const T=new te;f.add(T);const g=new K(1,1),O=r.b.clone().multiplyScalar(.3),P=[3,2,1].map(o=>{const t=new G(g,Z(null,1,1,O));return t.position.z=-.03*o,t.scale.setScalar(1-.01*o),T.add(t),t}),_=new G(g,Z(null,1,0));T.add(_);const M=new G(new K(1,1),new ee({transparent:!0,depthWrite:!1,vertexShader:ie,fragmentShader:"varying vec2 vUv; void main(){ float d = length((vUv - 0.5) * vec2(1.0, 2.4)); gl_FragColor = vec4(0.0, 0.0, 0.0, smoothstep(0.5, 0.0, d) * 0.5); }"}));M.rotation.x=-Math.PI/2,f.add(M);let W=null,b=0,C=!0;const L=(o,t)=>le(o,t||l,r).then(({tex:u,aspect:i})=>{W?.dispose(),W=u,_.material.uniforms.uTex.value=u,_.material.uniforms.uAspect.value=i,b=1,C&&(C=!1,v?.())});L(s);let S=1,k=1,U=2;const q=()=>{const o=e.getBoundingClientRect();S=Math.max(1,o.width),k=Math.max(1,o.height),m.setSize(S,k,!1),p.aspect=S/k,p.updateProjectionMatrix();const t=2*Math.tan(p.fov*Math.PI/360)*p.position.z,u=t*p.aspect;U=Math.min(t*.7,u*.7),d.material.uniforms.uRes.value.set(S,k),h.material.uniforms.uH.value=t*1.2,M.scale.set(U*1.1,U*.9,1),M.position.set(0,-U*.62,0)};q();const j=new ResizeObserver(q);j.observe(e);const H=new y,R=new y;let E=!1,x=null,w=new y,B=!1;const I=o=>{const t=e.getBoundingClientRect();return new y((o.clientX-t.left)/t.width*2-1,-((o.clientY-t.top)/t.height*2-1))},V=o=>{E=!0,x=I(o),e.setPointerCapture?.(o.pointerId)},$=o=>{const t=I(o);B=!0,E?(w.set(Math.max(-.7,Math.min(.7,w.x+(t.x-x.x)*1.4)),Math.max(-.4,Math.min(.4,w.y+(t.y-x.y)*.9))),x=t):H.copy(t),d.material.uniforms.uMouse.value.set(t.x*.5+.5,t.y*.5+.5)},D=()=>{E=!1},Y=()=>{B=!1,E=!1,H.set(0,0)};e.addEventListener("pointerdown",V),e.addEventListener("pointermove",$),e.addEventListener("pointerup",D),e.addEventListener("pointerleave",Y),e.addEventListener("pointercancel",D);const a=me(e,o=>{E||(w.x=X(w.x,0,.05),w.y=X(w.y,0,.05)),R.lerp(B&&!E?H:new y(Math.sin(o*.35)*.35,Math.cos(o*.28)*.18),.07);const t=W?se(o/1.1):0;b=Math.max(0,b-.03),T.position.y=Math.sin(o*.8)*.05+(1-t)*-.6,T.rotation.y=R.x*.32+w.x,T.rotation.x=-R.y*.2-w.y,T.rotation.z=Math.sin(o*.5)*.015;const u=U*(.7+.3*t)*(1+b*.06);T.scale.setScalar(u);const i=_.material.uniforms;i.uTime.value=o,i.uHover.value=B?.6:.2,i.uAlpha.value=t,i.uTilt.value.set(R.x+w.x,R.y+w.y),P.forEach(c=>{c.material.uniforms.uAlpha.value=t*.9}),M.material.opacity=t,M.position.y=-U*.62-T.position.y*.3,d.material.uniforms.uTime.value=o,h.material.uniforms.uTime.value=o,m.render(f,p)});return{setImage:L,destroy(){a(),j.disconnect(),["pointerdown","pointermove","pointerup","pointerleave","pointercancel"].forEach(o=>e.removeEventListener(o,{pointerdown:V,pointermove:$,pointerup:D,pointerleave:Y,pointercancel:D}[o])),W?.dispose(),_.material.dispose(),P.forEach(o=>o.material.dispose()),M.material.dispose(),g.dispose(),m.dispose(),m.forceContextLoss?.()}}}export{Pe as canUse3D,Fe as mountHero,Le as mountStage,Ue as readAccent};
