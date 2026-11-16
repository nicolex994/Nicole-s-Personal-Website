// Scanline interpolation adapted from the supplied UI Layouts Mac Genie reference.
// No additional scroll listener: main.js supplies the existing hero progress.
export function createFinderGenie({stage, windowNode, dock, finderTarget, reduceMotion}) {
  stage.classList.add('has-genie');
  const canvas = document.createElement('canvas');
  canvas.className = 'genie-canvas';
  canvas.setAttribute('aria-hidden','true');
  windowNode.after(canvas);
  const ctx = canvas.getContext('2d');
  const clamp = v => Math.max(0,Math.min(1,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const eioC = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  // One source of truth: normalized hero scroll supplied by main.js.
  const START=.10, END=.94, HOME=.08;
  let texture=null, geometry, token=0, capturing=false, failed=false;
  let progress=0, completed=false, entry=null, viewportKey='';
  function clear() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    canvas.hidden=true;
  }
  function cancelEntry() { if(entry){entry.cancel();entry=null;} }
  function releaseTexture() {
    ++token;capturing=false;
    if(texture){texture.width=texture.height=0;texture=null;}
  }
  function home(animate=false) {
    clear();
    stage.classList.remove('genie-returning');
    windowNode.style.visibility='visible';
    stage.dataset.genieState='open';

    if(animate&&!reduceMotion.matches) {
      cancelEntry();
      const animation=windowNode.animate([
        {opacity:0,transform:'translateY(10px)'},
        {opacity:1,transform:'translateY(0)'}
      ],{duration:230,easing:'cubic-bezier(.2,.7,.3,1)'});
      entry=animation;
      animation.onfinish=()=>{if(entry===animation)entry=null;};
    }
  }
  function measure() {
    const root={left:0,top:0,width:innerWidth,height:innerHeight};
    const win=windowNode.getBoundingClientRect();
    const icon=finderTarget.getBoundingClientRect();
    return {w:root.width,h:root.height,x:win.left-root.left,y:win.top-root.top,
      ww:win.width,wh:win.height,dx:icon.left-root.left+icon.width/2,dy:icon.top-root.top+icon.height/2};
  }
  function setup() {
    geometry=measure();
    const dpr=Math.min(devicePixelRatio||1,2);
    const width=Math.round(geometry.w*dpr), height=Math.round(geometry.h*dpr);
    if(canvas.width!==width || canvas.height!==height){canvas.width=width;canvas.height=height;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    canvas.hidden=false;
  }
  function render(t) {
    const g=geometry;
    ctx.clearRect(0,0,g.w,g.h);
    // Bottom rows narrow first; the top edge follows into the same measured Dock point.
    for(let y=0;y<g.wh;y++) {
      const r=y/g.wh;
      const xStart=(1-r)*.65, yStart=(1-r)*.2;
      const local=clamp((t-xStart)/(1-xStart));
      const xe=.82*eioC(local)+.18*local;
      const ye=Math.pow(clamp((t-yStart)/(1-yStart)),2);
      const left=lerp(g.x,g.dx,xe), right=lerp(g.x+g.ww,g.dx,xe);
      if(right-left<.5)continue;
      const dy=Math.round(lerp(g.y+y,g.dy,ye));
      const nextStart=(1-(y+1)/g.wh)*.2;
      const nextEase=Math.pow(clamp((t-nextStart)/(1-nextStart)),2);
      const nextY=Math.round(lerp(g.y+y+1,g.dy,nextEase));
      const rowHeight=nextY-dy;
      if(rowHeight<=0)continue;
      const sy=y/g.wh*texture.height;
      ctx.drawImage(texture,0,sy,texture.width,Math.min(texture.height-sy,texture.height/g.wh),left,dy,right-left,rowHeight);
    }
  }
  async function capture() {
    if(capturing||failed||reduceMotion.matches||completed)return;
    const current=++token;capturing=true;
    try {
      await document.fonts.ready;
      if(current!==token)return;
      const shot=await window.htmlToImage.toCanvas(windowNode,{
        pixelRatio:1,cacheBust:false,
        style:{visibility:'visible',opacity:'1',transform:'none',position:'relative',left:'0',top:'0',right:'auto',bottom:'auto',margin:'0',width:`${windowNode.offsetWidth}px`,height:`${windowNode.offsetHeight}px`},
      });
      if(current!==token){shot.width=shot.height=0;return;}
      if(texture)texture.width=texture.height=0;
      texture=shot;capturing=false;
      // Use the latest scroll position, never the position at capture start.
      paint();
    } catch(error) {
      if(current!==token)return;
      capturing=false;failed=true;
      console.warn('Finder capture unavailable; keeping stable DOM until the section boundary.',error);
      paint();
    }
  }
  function paint() {
    const t=clamp((progress-START)/(END-START));
    stage.dataset.genieProgress=t.toFixed(4);
    if(reduceMotion.matches) {
      cancelEntry();clear();releaseTexture();
      if(progress<.5){completed=false;home();}
      else {completed=true;windowNode.style.visibility='hidden';stage.classList.add('genie-returning');stage.dataset.genieState='minimized';}
      return;
    }
    if(t>=1) {
      completed=true;cancelEntry();clear();
      windowNode.style.visibility='hidden';
      stage.classList.add('genie-returning');
      stage.dataset.genieState='minimized';return;
    }
    completed=false;
    stage.classList.remove('genie-returning');
    if(t<=0) {home();if(!texture)capture();return;}
    cancelEntry();

    if(!texture) {
      // Never hide the DOM before its replacement is ready.
      clear();windowNode.style.visibility='visible';
      stage.dataset.genieState='capturing';capture();return;
    }
    setup();render(t);
    windowNode.style.visibility='hidden';
    stage.dataset.genieState='scrubbing';
  }
  return {
    update(value, foregroundVisible) {
      // Share the portrait’s stacking context while it is visible. Once it
      // fades, the viewport canvas can travel over the Dock as before.
      const layer = foregroundVisible ? stage : document.body;
      if (canvas.parentNode !== layer) layer.append(canvas);
      progress=value;
      const key=`${innerWidth}:${innerHeight}:${devicePixelRatio}`;
      if(key!==viewportKey) {
        viewportKey=key;failed=false;cancelEntry();
        // Render the existing texture at newly measured coordinates while a
        // fresh-size capture resolves. No old async capture may win this race.
        ++token;capturing=false;
        if(!completed)capture();
      }
      paint();
    },
  };
}
