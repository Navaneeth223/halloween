const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const captureBtn = document.getElementById("captureBtn");
const saveBtn = document.getElementById("saveBtn");
const retakeBtn = document.getElementById("retakeBtn");
const stickerLayer = document.getElementById("stickers-layer");
const ghostPopup = document.getElementById("ghostPopup");
const scream = document.getElementById("scream");

let captured = false;
let stickers = [];

// 🎥 Start camera
navigator.mediaDevices
  .getUserMedia({ video: { facingMode: "user" } })
  .then(stream => (video.srcObject = stream))
  .catch(() => alert("Camera access denied!"));

// 📸 Capture button
captureBtn.addEventListener("click", () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  video.style.display = "none";
  canvas.style.display = "block";
  saveBtn.disabled = false;
  retakeBtn.disabled = false;
  captured = true;
});

// 🔄 Retake photo
retakeBtn.addEventListener("click", () => {
  captured = false;
  video.style.display = "block";
  canvas.style.display = "none";
  stickerLayer.innerHTML = "";
  stickers = [];
  saveBtn.disabled = true;
  retakeBtn.disabled = true;
});

// 🧩 Add stickers
document.querySelectorAll(".sticker").forEach(sticker => {
  sticker.addEventListener("click", () => {
    if (!captured) return alert("Capture a photo first!");
    const newSticker = document.createElement("img");
    newSticker.src = sticker.src;
    newSticker.className = "placed-sticker";
    Object.assign(newSticker.style, {
      position: "absolute",
      width: "80px",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      cursor: "move",
      pointerEvents: "auto",
    });

    stickerLayer.appendChild(newSticker);
    stickers.push(newSticker);
    enableDrag(newSticker);

    newSticker.addEventListener("dblclick", () => {
      newSticker.remove();
      stickers = stickers.filter(s => s !== newSticker);
    });
  });
});

// 🎃 Sticker drag function
function enableDrag(el) {
  let offsetX, offsetY;
  const move = e => {
    e.preventDefault();
    const rect = stickerLayer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    el.style.left = `${clientX - rect.left - offsetX}px`;
    el.style.top = `${clientY - rect.top - offsetY}px`;
  };
  const stop = () => {
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", stop);
    document.removeEventListener("touchmove", move);
    document.removeEventListener("touchend", stop);
  };
  el.addEventListener("mousedown", e => {
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
  });
  el.addEventListener("touchstart", e => {
    const rect = el.getBoundingClientRect();
    offsetX = e.touches[0].clientX - rect.left;
    offsetY = e.touches[0].clientY - rect.top;
    document.addEventListener("touchmove", move);
    document.addEventListener("touchend", stop);
  });
}

// 💾 Save photo
saveBtn.addEventListener("click", () => {
  // Draw stickers onto canvas
  stickers.forEach(sticker => {
    const rect = sticker.getBoundingClientRect();
    const layerRect = stickerLayer.getBoundingClientRect();
    const x = rect.left - layerRect.left;
    const y = rect.top - layerRect.top;
    ctx.drawImage(sticker, x, y, rect.width, rect.height);
  });

  // Download
  const link = document.createElement("a");
  link.download = "halloween-photo.png";
  link.href = canvas.toDataURL("image/png");
  link.click();

  // 👻 Show ghost prank
  ghostPopup.style.display = "flex";
  scream.currentTime = 0;
  scream.play();
  setTimeout(() => (ghostPopup.style.display = "none"), 2500);
});
