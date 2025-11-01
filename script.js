// ====== Configuration ======
const STICKER_URLS = [
  'https://upload.wikimedia.org/wikipedia/commons/8/8b/Jack-o%27-lantern_with_open-mouth.png',
  'https://upload.wikimedia.org/wikipedia/commons/5/5f/Halloween_bat_icon.png',
  'https://upload.wikimedia.org/wikipedia/commons/6/6b/Ghost_icon.png',
  'https://upload.wikimedia.org/wikipedia/commons/0/06/Spider_icon.png'
];

const GHOST_IMG_URL = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Ghost_icon.png';
const SCREAM_AUDIO_URL = ''; // add an mp3/ogg url if you want sound

// ====== Elements ======
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const retakeBtn = document.getElementById('retakeBtn');
const saveBtn = document.getElementById('saveBtn');
const stickerList = document.getElementById('sticker-list');
const stickersSection = document.getElementById('stickers-section');
const workspace = document.getElementById('workspace');
const ghostPopup = document.getElementById('ghostPopup');
const ghostImg = document.getElementById('ghostImg');

let stream = null;
let currentStickers = [];
let audio = null;

// ====== Start camera ======
async function startCamera(){
  try{
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
    // wait for metadata so video.videoWidth/videoHeight are available
    video.addEventListener('loadedmetadata', ()=> {
      // set canvas internal resolution to the natural video resolution (helps with quality)
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      // set canvas display size same as video visible size
      syncWorkspaceSize();
    }, { once: true });
  }catch(err){
    alert('Camera access denied or not available. Please allow camera permission and reload.');
    console.error(err);
  }
}

// ====== Build sticker picker ======
function buildStickers(){
  stickerList.innerHTML = '';
  STICKER_URLS.forEach((url, idx) =>{
    const img = document.createElement('img');
    img.src = url;
    img.className = 'sticker-thumb';
    img.alt = `sticker-${idx}`;
    img.addEventListener('click', ()=> addStickerToWorkspace(url));
    stickerList.appendChild(img);
  })
}

// ====== Add sticker ======
function addStickerToWorkspace(url){
  workspace.classList.remove('hidden');
  stickersSection.classList.remove('hidden');

  const img = document.createElement('img');
  img.src = url;
  img.className = 'sticker';
  img.style.left = '20px';
  img.style.top = '20px';
  img.draggable = false;

  // pointer drag
  let offsetX=0, offsetY=0, isDown=false;
  img.addEventListener('pointerdown', (e)=>{
    isDown=true; img.setPointerCapture(e.pointerId);
    offsetX = e.clientX - img.offsetLeft; offsetY = e.clientY - img.offsetTop;
  });
  img.addEventListener('pointermove', (e)=>{
    if(!isDown) return;
    const parentRect = workspace.getBoundingClientRect();
    let x = e.clientX - offsetX - parentRect.left;
    let y = e.clientY - offsetY - parentRect.top;
    x = Math.max(0, Math.min(parentRect.width - img.width, x));
    y = Math.max(0, Math.min(parentRect.height - img.height, y));
    img.style.left = x + 'px';
    img.style.top = y + 'px';
  });
  img.addEventListener('pointerup', (e)=>{ isDown=false; try { img.releasePointerCapture(e.pointerId); } catch(e){} });

  // double click to remove
  img.addEventListener('dblclick', ()=> img.remove());

  workspace.appendChild(img);
  currentStickers.push(img);
}

// ====== Sync workspace size to the displayed video size ======
function syncWorkspaceSize(optionalRect){
  // use the video visible rect when available; if video is hidden, pass a rect from earlier
  const rect = optionalRect || video.getBoundingClientRect();
  // if rect has zero width (video hidden), try to use canvas display size
  if(rect.width === 0 && canvas.style.width){
    // parse canvas style width
    const w = parseFloat(canvas.style.width || 0);
    const h = parseFloat(canvas.style.height || 0);
    if(w && h){
      workspace.style.width = w + 'px';
      workspace.style.height = h + 'px';
      workspace.classList.remove('hidden');
      return;
    }
  }
  workspace.style.width = rect.width + 'px';
  workspace.style.height = rect.height + 'px';
  workspace.classList.remove('hidden');

  // set canvas display CSS to match video display size for consistent overlay
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
}

// ====== Capture frame ======
captureBtn.addEventListener('click', ()=>{
  // draw current video frame to canvas (natural resolution)
  const w = video.videoWidth || canvas.width;
  const h = video.videoHeight || canvas.height;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);

  // measure visible video rect BEFORE hiding video
  const displayedRect = video.getBoundingClientRect();
  // sync workspace & canvas display size using the measured rect
  syncWorkspaceSize(displayedRect);

  // now show canvas (display size) and hide video
  canvas.style.display = 'block';
  video.style.display = 'none';

  captureBtn.classList.add('hidden');
  retakeBtn.classList.remove('hidden');
  saveBtn.classList.remove('hidden');
  stickersSection.classList.remove('hidden');
});

// ====== Retake ======
retakeBtn.addEventListener('click', ()=>{
  canvas.style.display = 'none';
  video.style.display = 'block';
  captureBtn.classList.remove('hidden');
  retakeBtn.classList.add('hidden');
  saveBtn.classList.add('hidden');
  workspace.classList.add('hidden');
  // remove stickers
  workspace.innerHTML = '';
  currentStickers = [];
  // re-sync workspace to visible video
  syncWorkspaceSize();
});

// ====== Save final image (canvas + stickers) ======
saveBtn.addEventListener('click', async ()=>{
  const w = canvas.width; const h = canvas.height;
  const ctx = canvas.getContext('2d');

  // If user retook multiple times, ensure canvas has the captured image (we already drew it at capture).
  // Now draw stickers mapped from workspace display coords to canvas coords.
  const workspaceRect = workspace.getBoundingClientRect();
  if(workspaceRect.width === 0 || workspaceRect.height === 0){
    // fallback: use canvas displayed size
    syncWorkspaceSize();
  }

  const stickerImgs = workspace.querySelectorAll('img.sticker');
  stickerImgs.forEach(si=>{
    const imgRect = si.getBoundingClientRect();
    const sx = (imgRect.left - workspaceRect.left) * (w / workspaceRect.width);
    const sy = (imgRect.top - workspaceRect.top) * (h / workspaceRect.height);
    const sw = imgRect.width * (w / workspaceRect.width);
    const sh = imgRect.height * (h / workspaceRect.height);
    try{ ctx.drawImage(si, sx, sy, sw, sh);}catch(e){console.warn('sticker draw failed', e)}
  });

  // download
  const dataURL = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL; a.download = `halloween_${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // trigger jump-scare after a short delay
  setTimeout(triggerJumpScare, 900);
});

// ====== Jump scare ======
function triggerJumpScare(){
  if(SCREAM_AUDIO_URL && SCREAM_AUDIO_URL.length){
    if(!audio) audio = new Audio(SCREAM_AUDIO_URL);
    audio.play().catch(()=>{});
  }
  ghostImg.src = GHOST_IMG_URL;
  ghostPopup.classList.remove('hidden');

  // allow tap/click to dismiss immediately
  ghostPopup.addEventListener('click', ()=> ghostPopup.classList.add('hidden'), { once: true });

  // auto-hide after 2.6s
  setTimeout(()=>{ ghostPopup.classList.add('hidden'); }, 2600);
}

// ====== Initialize ======
startCamera();
buildStickers();