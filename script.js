// ====== Configuration ======
ctx.drawImage(video, 0, 0, w, h);


// show canvas overlay (we'll use workspace to position stickers over the same area)
canvas.style.display = 'block';
video.style.display = 'none';
captureBtn.classList.add('hidden');
retakeBtn.classList.remove('hidden');
saveBtn.classList.remove('hidden');
stickersSection.classList.remove('hidden');


// size workspace to match displayed video size
syncWorkspaceSize();
});


retakeBtn.addEventListener('click', ()=>{
// reset
canvas.style.display = 'none';
video.style.display = 'block';
captureBtn.classList.remove('hidden');
retakeBtn.classList.add('hidden');
saveBtn.classList.add('hidden');
workspace.classList.add('hidden');
// remove stickers
workspace.innerHTML = '';
currentStickers = [];
});


// ====== Save final image (canvas + stickers) ======
saveBtn.addEventListener('click', async ()=>{
// draw current video frame again to ensure high-res capture
const w = canvas.width; const h = canvas.height;
const ctx = canvas.getContext('2d');
// canvas already has the captured frame; now draw stickers on top scaled to canvas size


// For correctness, we need to map workspace (display) coords to canvas coords
const workspaceRect = workspace.getBoundingClientRect();
const canvasRect = video.getBoundingClientRect();


// draw stickers
const stickerImgs = workspace.querySelectorAll('img.sticker');
stickerImgs.forEach(si=>{
const imgRect = si.getBoundingClientRect();
const sx = (imgRect.left - workspaceRect.left) * (w / workspaceRect.width);
const sy = (imgRect.top - workspaceRect.top) * (h / workspaceRect.height);
const sw = imgRect.width * (w / workspaceRect.width);
const sh = imgRect.height * (h / workspaceRect.height);
try{ ctx.drawImage(si, sx, sy, sw, sh);}catch(e){console.warn('sticker draw failed', e)}
});


// create download
const dataURL = canvas.toDataURL('image/png');
const a = document.createElement('a');
a.href = dataURL; a.download = `halloween_${Date.now()}.png`;
document.body.appendChild(a);
a.click();
a.remove();


// trigger jump-scare after a short delay
setTimeout(triggerJumpScare, 1000);
});


function triggerJumpScare(){
if(SCREAM_AUDIO_URL && SCREAM_AUDIO_URL.length){
if(!audio) audio = new Audio(SCREAM_AUDIO_URL);
audio.play().catch(()=>{});
}
ghostImg.src = GHOST_IMG_URL;
ghostPopup.classList.remove('hidden');
// hide after some time
setTimeout(()=>{
ghostPopup