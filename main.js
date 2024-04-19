/* Config Consts */
const extensionLayer                    = document.getElementById("extension-layer");
const extensionGameLayer                = document.getElementById("extension-game-layer");

const swordWrapper                      = document.getElementById("sword-wrapper");
const sword                             = document.getElementById("sword");
const slash                             = document.getElementById("slash");
const volumeSlider                      = document.getElementById("volume-slider");
const volumeUpIcon                      = document.getElementById("volumeup");
const volumeDownIcon                    = document.getElementById("volumedown");

const SWORD_HOVER_CLASSNAME             ="animate-sword-hover";
const SWORD_ANIMATION_CLASSNAME         = "animate-sword";
const SWORD_CHARGE_ANIMATION_CLASSNAME  = "rotate";
const SWORD_CHARGED_ANIMATION_CLASSNAME = "sword-charged";
const SHAKE_ANIMATION_CLASSNAME         = "shake";
const SLASH_ANIMATION_CLASSNAME         = "animate-slash";
const SLASH_ANIMATION_CHARGED_CLASSNAME = "animate-slash-charged";

const RESET_SWORD_TIMEOUT  = 500;   // ms
const CHARGE_SWORD_TIMEOUT = 1250;  // ms
const EVOLUTION_TIMEOUT    = 60000  // ms // Use 900000 when this goes live
const SLASH_X_OFFSET       = 95;    // px
const SLASH_Y_OFFSET       = 40;    // px


// https://dev.twitch.tv/docs/extensions/guidelines-and-policies/#2-technical
// 2.4  Extensions can include audio, only if they include controls which allow viewers 
// to adjust the volume, and by default, these controls are set to off/muted.


/* Audio Config */
const VOLUME_INITIAL = 0;
const swordAudio0 = new Audio("assets/slice.wav");
const swordAudio1 = new Audio("assets/slash.wav");
const swordAudio2 = new Audio("assets/tear.wav");
const swordAudio3 = new Audio("assets/gather.wav");
const swordAudio4 = new Audio("assets/huzzah.wav");

function pickAudio() {
    const values = [swordAudio0, swordAudio1, swordAudio0, swordAudio1, swordAudio0, swordAudio1, swordAudio0, swordAudio1, swordAudio2, swordAudio3, swordAudio4, swordAudio4, swordAudio4];
    const randomIndex = Math.floor(Math.random() * values.length);
    return values[randomIndex];
}

const maxVolume  = Number(volumeSlider.getAttribute("max"));
const minVolume  = Number(volumeSlider.getAttribute("min"));
const volumeStep = Number(volumeSlider.getAttribute("step"));
const storageAvailable = typeof Storage !== "undefined" ? true : false;

const volumeKey = "xorloslash_volume";

const saveVolumeToLocalStorageIfAvailable = (value) => { if (storageAvailable) { localStorage.setItem(volumeKey, value); } };
const getVolumeFromLocalStorageIfAvailable = () => { if (storageAvailable) { return localStorage.getItem(volumeKey) ?? VOLUME_INITIAL; } };

/** initialize volume from localstorage if available */
volumeSlider.value = getVolumeFromLocalStorageIfAvailable();

const setVolume = (value) => { volumeSlider.value = value; saveVolumeToLocalStorageIfAvailable(value); };
const volumeGoesUp   = () => { setVolume(clampVolume(volumeSlider.valueAsNumber + volumeStep)); };
const volumeGoesDown = () => { setVolume(clampVolume(volumeSlider.valueAsNumber - volumeStep)); };
const onVolumeInputRangeChange = (event) => { setVolume(event.target.valueAsNumber); };
const clampVolume = (num, min = minVolume, max = maxVolume) => { return Math.min(Math.max(num, min), max); };

const playSlashSound = () => {
    const selectedAudio = pickAudio();
    let swordAudioCopy = selectedAudio.cloneNode();
    swordAudioCopy.addEventListener("ended", () => { swordAudioCopy = null; });
    swordAudioCopy.volume = volumeSlider.value / 600;
    swordAudioCopy.play();
};

/* Animation Stuff */
let isSlashing = false;
let isChargedSlash = false;
let isEvolved = false;
let isEvolutionTimerStarted = false;
let evolutionTimer;
let slashTimeout;
let chargeTimeout;
let hoverTimeout;


const onSlashRelease = () => {
  clearTimeout(chargeTimeout);
  swing(isChargedSlash);

  sword.classList.remove(SWORD_CHARGE_ANIMATION_CLASSNAME);
  swordWrapper.classList.remove(SWORD_CHARGED_ANIMATION_CLASSNAME);

  isChargedSlash = false;
  chargeTimeout = null;
  document.addEventListener("mouseup", onMouseUp, {once: true,});
};

const onSwordSlashStart = () => {
  addOrReplaceClassName(sword, SWORD_CHARGE_ANIMATION_CLASSNAME);
  chargeTimeout = setTimeout(() => {
    addOrReplaceClassName(swordWrapper, SWORD_CHARGED_ANIMATION_CLASSNAME);
    isChargedSlash = true;
  }, CHARGE_SWORD_TIMEOUT);
};

const swing = (charged) => {
  if (isSlashing) { return; }
  playSlashSound(); spawnSlash(charged); animateSword(); evolutionTimerStart();

  if (charged) { addOrReplaceClassName(extensionLayer, SHAKE_ANIMATION_CLASSNAME); }
};

const evolutionTimerStart = () => {
  if (isEvolutionTimerStarted) { return;}
  evolutionTimer = setTimeout(() => {
    addOrReplaceClassName(sword, )
    isEvolutionTimerStarted = true;
  }, EVOLUTION_TIMEOUT);
};

const addOrReplaceClassName = (element, className) => { if (element.classList.contains(className)) { element.classList.remove(className); element.offsetWidth = element.offsetWidth; element.classList.add(className); } else { element.classList.add(className); } };

const spawnSlash = (charged) => {
  const animationClassName = charged ? SLASH_ANIMATION_CHARGED_CLASSNAME : SLASH_ANIMATION_CLASSNAME;
  let slashAudioCopy = slash.cloneNode(true);
  slashAudioCopy.style.left = `calc(${swordWrapper.style.left} - ${SLASH_X_OFFSET}px) `;
  slashAudioCopy.style.top = `calc(${swordWrapper.style.top} + ${SLASH_Y_OFFSET}px) `;
  slashAudioCopy.classList.add(animationClassName);

  extensionGameLayer.appendChild(slashAudioCopy);
  slashAudioCopy.addEventListener( "animationend", () => { slashAudioCopy.remove(); }, { once: true, } );
};

const animateSword = () => { 
  hoverTimeout = setTimeout(() => { 
    sword.classList.remove(SWORD_HOVER_CLASSNAME);
    
  }, RESET_SWORD_TIMEOUT);
  isSlashing = true; 
  sword.classList.add(SWORD_ANIMATION_CLASSNAME); 
  slashTimeout = setTimeout(() => { 
    sword.classList.remove(SWORD_ANIMATION_CLASSNAME); 
    isSlashing = false; 
  }, 
  RESET_SWORD_TIMEOUT); 
};

const moveSword = (event) => {
  swordWrapper.style.left = `${ event.clientX - swordWrapper.offsetWidth  / 2 }px`;
  swordWrapper.style.top  = `${ event.clientY - swordWrapper.offsetHeight / 2 }px`;
};



/* Event Listening and mapping */
const onMouseMove = (event) => moveSword(event);
const onMouseDown = () => onSwordSlashStart();
const onMouseUp = () => onSlashRelease();
const onVolumeChange = (event) => onVolumeInputRangeChange(event);
const disableDefaultBehaviour = () => false;
const onVolumeUpClick = volumeGoesUp;
const onVolumeDownClick = volumeGoesDown;

/* Main Config */
document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousedown", onSwordSlashStart);
    document.addEventListener("mouseup", onMouseUp, { once: true, });
    volumeSlider.addEventListener("input", onVolumeChange);
    sword.ondragstart = disableDefaultBehaviour;
    volumeUpIcon.ondragstart = disableDefaultBehaviour;
    volumeDownIcon.ondragstart = disableDefaultBehaviour;
    volumeUpIcon.addEventListener("click", onVolumeUpClick);
    volumeDownIcon.addEventListener("click", onVolumeDownClick);
  });