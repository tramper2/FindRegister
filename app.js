import { ResistorCalculator, COLOR_CODES } from './calculator.js';

// DOM Elements
const elTabScanner = document.getElementById('tab-scanner');
const elTabGenerator = document.getElementById('tab-generator');
const elTabReference = document.getElementById('tab-reference');

const elPanelScanner = document.getElementById('panel-scanner');
const elPanelGenerator = document.getElementById('panel-generator');
const elPanelReference = document.getElementById('panel-reference');

const elOpencvBanner = document.getElementById('opencv-banner');
const elOpencvStatusText = document.getElementById('opencv-status-text');

// Scanner Elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const elScannerOverlay = document.getElementById('scanner-overlay');
const elViewportPlaceholder = document.getElementById('viewport-placeholder');
const elBtnToggleCamera = document.getElementById('btn-toggle-camera');
const elBtnSwitchCamera = document.getElementById('btn-switch-camera');
const elBtnToggleTorch = document.getElementById('btn-toggle-torch');
const elFileUpload = document.getElementById('file-upload');
const elScannerIndicator = document.getElementById('scanner-indicator');
const elIndicatorText = document.getElementById('indicator-text');
const elDetectedCount = document.getElementById('detected-count');
const elDetectedList = document.getElementById('detected-list');
const elClearList = document.getElementById('btn-clear-list');

// Tuning Elements
const elBrightness = document.getElementById('slide-brightness');
const elContrast = document.getElementById('slide-contrast');
const elSaturation = document.getElementById('slide-saturation');
const elValBrightness = document.getElementById('val-brightness');
const elValContrast = document.getElementById('val-contrast');
const elValSaturation = document.getElementById('val-saturation');
const elColorSpace = document.getElementById('select-color-space');
const elBtnToggleTuning = document.getElementById('btn-toggle-tuning-collapse');
const elTuningBody = document.getElementById('tuning-body');

// Detail Card Elements
const elDetailCard = document.getElementById('resistor-detail-card');
const elCloseDetail = document.getElementById('btn-close-detail');
const elDetailOhms = document.getElementById('detail-ohms-value');
const elDetailTolerance = document.getElementById('detail-tolerance-value');
const elDetailBandsRow = document.getElementById('detail-bands-row');
const elBtnFlipResistor = document.getElementById('btn-flip-resistor');
const elBtnApplyToGen = document.getElementById('btn-apply-to-generator');
const elManualBandsSelectors = document.getElementById('manual-bands-selectors');

// Generator Elements
const elInputResistance = document.getElementById('input-resistance');
const elBtnGenerate = document.getElementById('btn-generate');
const elBtnBand4 = document.getElementById('btn-band-4');
const elBtnBand5 = document.getElementById('btn-band-5');
const elSelectTolerance = document.getElementById('select-tolerance');
const elResistorSvgContainer = document.getElementById('resistor-svg-container');
const elParsedOhmsText = document.getElementById('parsed-ohms-text');
const elParsedTolText = document.getElementById('parsed-tol-text');
const elBandsExpList = document.getElementById('bands-exp-list');
const elSuggestionsBox = document.getElementById('generator-suggestions-box');
const elSuggestionChips = document.getElementById('suggestion-chips');
const elReferenceTableBody = document.getElementById('reference-table-body');
const elDebugLogs = document.getElementById('debug-logs');
const elClearLogs = document.getElementById('btn-clear-logs');

// State Variables
let isOpenCvReady = false;
let isCameraRunning = false;
let isLiveCameraActive = false;
let cameraDevices = [];
let currentDeviceIndex = 0;
let stream = null;
let track = null; // for flashlight
let activePanel = 'scanner';

let trackedResistors = [];
let selectedResistorId = null;
let nextResistorId = 1;

let lastProcessingTime = 0;
const PROCESSING_INTERVAL = 150; // Milliseconds between frames (approx 6-7 FPS to save CPU)
let requestAnimationId = null;
let staticImage = null; // Hold uploaded static image

// Colors Reference for HTML list
const COLORS_LIST = Object.keys(COLOR_CODES);

// Debug Log Helper
function logDebug(message, type = 'info') {
  if (!elDebugLogs) return;
  const item = document.createElement('div');
  item.className = `log-item log-${type}`;
  
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${(now.getMilliseconds()).toString().padStart(3, '0')}`;
  
  item.textContent = `[${timeStr}] ${message}`;
  elDebugLogs.appendChild(item);
  elDebugLogs.scrollTop = elDebugLogs.scrollHeight;
  
  // Keep last 100 entries to prevent memory leak
  while (elDebugLogs.childNodes.length > 100) {
    elDebugLogs.removeChild(elDebugLogs.firstChild);
  }
}

// Initialize App
function init() {
  bindTabs();
  bindTuning();
  bindScannerControls();
  bindDetailCard();
  bindGenerator();
  populateReferenceTable();

  // Clear logs button event
  elClearLogs.addEventListener('click', () => {
    elDebugLogs.innerHTML = '';
    logDebug('디버그 로그가 초기화되었습니다.', 'info');
  });

  // Handle OpenCV ready state
  function handleOpenCvReady() {
    if (isOpenCvReady) return; // avoid duplicate calls
    isOpenCvReady = true;
    elOpencvBanner.className = 'status-banner ready';
    elOpencvStatusText.textContent = 'OpenCV.js 이미지 프로세싱 엔진이 준비되었습니다.';
    elBtnToggleCamera.disabled = false;
    logDebug('OpenCV.js WebAssembly 이미지 프로세싱 엔진 컴파일 및 로드 완료!', 'success');
    
    // Automatically hide banner after 3 seconds
    setTimeout(() => {
      elOpencvBanner.style.display = 'none';
    }, 3000);
  }

  // Watch for OpenCV ready event, checking if already ready (handles race condition)
  if (window.cvReady || (typeof cv !== 'undefined' && cv.Mat)) {
    handleOpenCvReady();
  } else {
    logDebug('OpenCV.js 이미지 엔진 로딩을 대기 중...', 'info');
    document.addEventListener('opencvReady', handleOpenCvReady);
  }

  // Draw default resistor in generator
  generateResistorSVG(100, false, 1);
}

// ---------------- TAB NAVIGATION ----------------
function bindTabs() {
  const tabs = [
    { button: elTabScanner, panel: elPanelScanner, name: 'scanner' },
    { button: elTabGenerator, panel: elPanelGenerator, name: 'generator' },
    { button: elTabReference, panel: elPanelReference, name: 'reference' }
  ];

  tabs.forEach(t => {
    t.button.addEventListener('click', () => {
      // Deactivate all
      tabs.forEach(x => {
        x.button.classList.remove('active');
        x.panel.classList.remove('active');
      });

      // Activate clicked
      t.button.classList.add('active');
      t.panel.classList.add('active');
      activePanel = t.name;

      // Stop camera if leaving scanner
      if (t.name !== 'scanner' && isCameraRunning) {
        stopCamera();
      }
    });
  });
}

// ---------------- TUNING CONTROLS ----------------
function bindTuning() {
  elBrightness.addEventListener('input', (e) => {
    elValBrightness.textContent = e.target.value;
    triggerStaticReprocess();
  });
  elContrast.addEventListener('input', (e) => {
    elValContrast.textContent = `${e.target.value}%`;
    triggerStaticReprocess();
  });
  elSaturation.addEventListener('input', (e) => {
    elValSaturation.textContent = `${e.target.value}%`;
    triggerStaticReprocess();
  });
  elColorSpace.addEventListener('change', () => {
    triggerStaticReprocess();
  });

  elBtnToggleTuning.addEventListener('click', () => {
    const isCollapsed = elTuningBody.classList.toggle('collapsed');
    elBtnToggleTuning.textContent = isCollapsed ? '열기' : '접기';
  });
}

function triggerStaticReprocess() {
  if (staticImage && !isCameraRunning) {
    processStaticImage(staticImage);
  }
}

// ---------------- CAMERA MANAGEMENT ----------------
async function bindScannerControls() {
  elBtnToggleCamera.addEventListener('click', async () => {
    if (isCameraRunning) {
      stopCamera();
    } else {
      await startCamera();
    }
  });

  elBtnSwitchCamera.addEventListener('click', async () => {
    if (cameraDevices.length <= 1) return;
    currentDeviceIndex = (currentDeviceIndex + 1) % cameraDevices.length;
    await startCamera(cameraDevices[currentDeviceIndex].deviceId);
  });

  elBtnToggleTorch.addEventListener('click', async () => {
    if (!track) return;
    try {
      const capabilities = track.getCapabilities();
      if (capabilities.torch) {
        const settings = track.getSettings();
        await track.applyConstraints({
          advanced: [{ torch: !settings.torch }]
        });
        elBtnToggleTorch.classList.toggle('active', !settings.torch);
      }
    } catch (err) {
      console.warn('Torch control not supported or failed:', err);
    }
  });

  elFileUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Stop camera if running
    stopCamera();
    staticImage = new Image();
    
    const reader = new FileReader();
    reader.onload = function(event) {
      staticImage.onload = function() {
        elViewportPlaceholder.style.display = 'none';
        isLiveCameraActive = false;
        processStaticImage(staticImage);
      };
      staticImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  elClearList.addEventListener('click', () => {
    trackedResistors = [];
    selectedResistorId = null;
    elDetailCard.style.display = 'none';
    updateDetectedListUI();
    if (!isCameraRunning && staticImage) {
      // Clear overlay
      ctx.drawImage(staticImage, 0, 0, canvas.width, canvas.height);
    }
  });

  // Query cameras
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameraDevices = devices.filter(d => d.kind === 'videoinput');
    if (cameraDevices.length > 1) {
      elBtnSwitchCamera.disabled = false;
    }
    
    // Sort so rear camera is first on mobile
    cameraDevices.sort((a, b) => {
      const labelA = a.label.toLowerCase();
      const labelB = b.label.toLowerCase();
      if (labelA.includes('back') || labelA.includes('environment') || labelA.includes('후면')) return -1;
      if (labelB.includes('back') || labelB.includes('environment') || labelB.includes('후면')) return 1;
      return 0;
    });
  } catch (err) {
    console.error('Error listing cameras:', err);
  }
}

async function startCamera(deviceId = null) {
  if (stream) {
    stopCamera();
  }

  const constraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: deviceId ? undefined : 'environment'
    }
  };

  if (deviceId) {
    constraints.video.deviceId = { exact: deviceId };
  }

  try {
    elIndicatorText.textContent = '연결 중...';
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.play();
    
    isCameraRunning = true;
    isLiveCameraActive = true;
    staticImage = null; // Reset static upload
    elViewportPlaceholder.style.display = 'none';
    elScannerOverlay.classList.add('active');
    
    elBtnToggleCamera.querySelector('span').textContent = '카메라 끄기';
    elBtnToggleCamera.querySelector('svg').innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    elScannerIndicator.className = 'scanner-indicator status-scanning';
    elIndicatorText.textContent = '실시간 분석 중';
    
    // Enable/disable torch button based on capabilities
    track = stream.getVideoTracks()[0];
    setTimeout(async () => {
      try {
        const capabilities = track.getCapabilities();
        elBtnToggleTorch.disabled = !capabilities.torch;
      } catch (e) {
        elBtnToggleTorch.disabled = true;
      }
    }, 1000);

    // Start processing loop
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      requestAnimationId = requestAnimationFrame(processVideoFrame);
    };

  } catch (err) {
    console.error('Camera access failed, trying fallback constraints:', err);
    // Fallback: request any camera
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      video.play();
      isCameraRunning = true;
      isLiveCameraActive = true;
      staticImage = null;
      elViewportPlaceholder.style.display = 'none';
      elScannerOverlay.classList.add('active');
      elBtnToggleCamera.querySelector('span').textContent = '카메라 끄기';
      elIndicatorText.textContent = '실시간 분석 중';
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        requestAnimationId = requestAnimationFrame(processVideoFrame);
      };
    } catch (fallbackErr) {
      alert('카메라에 연결할 수 없습니다: ' + fallbackErr.message);
      elIndicatorText.textContent = '스캔 오류';
    }
  }
}

function stopCamera() {
  if (requestAnimationId) {
    cancelAnimationFrame(requestAnimationId);
    requestAnimationId = null;
  }
  
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  
  track = null;
  isCameraRunning = false;
  
  elBtnToggleCamera.querySelector('span').textContent = '카메라 켜기';
  elBtnToggleCamera.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>';
  elBtnToggleTorch.disabled = true;
  elBtnToggleTorch.classList.remove('active');
  elScannerOverlay.classList.remove('active');
  
  elScannerIndicator.className = 'scanner-indicator';
  elIndicatorText.textContent = '스캔 일시정지됨';
  
  // Show placeholder if no image loaded
  if (!staticImage) {
    elViewportPlaceholder.style.display = 'flex';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// ---------------- IMAGE TUNING PIPELINE (CPU helper) ----------------
function applyTuningFilters(srcMat, dstMat) {
  const brightness = parseInt(elBrightness.value);
  const contrast = parseInt(elContrast.value) / 100;
  const saturation = parseInt(elSaturation.value) / 100;

  // 1. Brightness & Contrast: dst = src * contrast + brightness
  srcMat.convertTo(dstMat, -1, contrast, brightness);

  // 2. Saturation adjustment in HSV
  if (saturation !== 1.0) {
    let hsv = new cv.Mat();
    cv.cvtColor(dstMat, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
    
    let channels = new cv.MatVector();
    cv.split(hsv, channels);
    
    // Multiply S channel
    let sChannel = channels.get(1);
    sChannel.convertTo(sChannel, -1, saturation, 0);
    
    cv.merge(channels, hsv);
    cv.cvtColor(hsv, dstMat, cv.COLOR_HSV2RGB);
    cv.cvtColor(dstMat, dstMat, cv.COLOR_RGB2RGBA);
    
    hsv.delete();
    channels.delete();
    sChannel.delete();
  }
}

// ---------------- SCANNING LOGIC (OPENCV.JS) ----------------
function processVideoFrame(timestamp) {
  if (!isCameraRunning) return;

  if (timestamp - lastProcessingTime >= PROCESSING_INTERVAL) {
    lastProcessingTime = timestamp;

    try {
      // Draw video to canvas first
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Read pixels into OpenCV Mat
      let src = cv.imread(canvas);
      let detections = detectResistorsCV(src);
      
      // Track detections
      trackResistors(detections);
      
      // Draw results (glowing bounds and labels)
      drawDetectionsUI();
      
      src.delete();
    } catch (err) {
      console.error('OpenCV frame processing error:', err);
    }
  }

  requestAnimationId = requestAnimationFrame(processVideoFrame);
}

function processStaticImage(image) {
  if (!isOpenCvReady) {
    logDebug('OpenCV.js가 로드되지 않았습니다. 잠시만 대기해 주세요.', 'warn');
    return;
  }
  
  logDebug(`정적 이미지 업로드됨: ${image.naturalWidth || image.width}x${image.naturalHeight || image.height}px`, 'info');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  
  // Draw image
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
  try {
    let src = cv.imread(canvas);
    logDebug('OpenCV.js 이미지 분석을 시작합니다...', 'info');
    
    // Clear old list on a new file upload
    trackedResistors = [];
    
    let detections = detectResistorsCV(src);
    logDebug(`분석 완료: 총 ${detections.length}개의 저항이 감지되었습니다.`, detections.length > 0 ? 'success' : 'warn');
    
    trackResistors(detections);
    drawDetectionsUI();
    
    src.delete();
  } catch (err) {
    logDebug(`이미지 분석 중 치명적 에러 발생: ${err.message || err}`, 'error');
    console.error('Static image process failed:', err);
  }
}

/**
 * OPENCV.JS PIPELINE: Detects all resistors in a Mat.
 * Returns array of { rect, bands: [] }
 */
function detectResistorsCV(src) {
  let detections = [];
  const isStatic = !isLiveCameraActive;
  
  if (isStatic) logDebug('--- CV 분석 파이프라인 가동 ---', 'info');
  
  // 1. Apply brightness/contrast/saturation tuning
  let tuned = new cv.Mat();
  applyTuningFilters(src, tuned);
  
  // 2. Reduce noise (Gaussian Blur)
  let blurred = new cv.Mat();
  cv.GaussianBlur(tuned, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
  
  // 3. Convert to HSV
  let rgb = new cv.Mat();
  cv.cvtColor(blurred, rgb, cv.COLOR_RGBA2RGB);
  let hsv = new cv.Mat();
  cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);
  
  // 4. Threshold base colors of resistor body (Tan / Blue)
  let mask = new cv.Mat();
  const mode = elColorSpace.value;
  if (isStatic) logDebug(`몸체 색상 세그멘테이션 (모드: ${mode === 'both' ? '모두' : mode === 'tan' ? '황토색' : '파란색'})`, 'info');
  
  if (mode === 'tan' || mode === 'both') {
    // Widen range to cover orange, brown, red, yellow, gold bands on tan/pink body
    let lowTan = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 8, 40, 0]);
    let highTan = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [38, 255, 255, 0]);
    let maskTan = new cv.Mat();
    cv.inRange(hsv, lowTan, highTan, maskTan);
    
    if (mask.empty()) {
      maskTan.copyTo(mask);
    } else {
      cv.bitwise_or(mask, maskTan, mask);
    }
    
    lowTan.delete();
    highTan.delete();
    maskTan.delete();
  }
  
  if (mode === 'blue' || mode === 'both') {
    // Widen range for blue/green body
    let lowBlue = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [35, 15, 35, 0]);
    let highBlue = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [140, 255, 255, 0]);
    let maskBlue = new cv.Mat();
    cv.inRange(hsv, lowBlue, highBlue, maskBlue);
    
    if (mask.empty()) {
      maskBlue.copyTo(mask);
    } else {
      cv.bitwise_or(mask, maskBlue, mask);
    }
    
    lowBlue.delete();
    highBlue.delete();
    maskBlue.delete();
  }
  
  // 5. Morphological Closing to fill gaps caused by color bands
  let closed = new cv.Mat();
  // Use a larger kernel (21x21) to merge gaps in high-res images
  let ksize = new cv.Size(21, 21);
  let M = cv.getStructuringElement(cv.MORPH_RECT, ksize);
  cv.morphologyEx(mask, closed, cv.MORPH_CLOSE, M);
  M.delete();
  
  // 6. Find Contours
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(closed, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  
  // Minimum aspect ratio and size thresholds
  // Scale dynamically with a cap to support high-res uploads
  const minArea = Math.min(600, canvas.width * canvas.height * 0.0005);
  if (isStatic) logDebug(`검출된 윤곽선 후보군: ${contours.size()}개 | 필터 최소면적 기준: ${Math.round(minArea)}px`, 'info');
  
  for (let i = 0; i < contours.size(); i++) {
    let contour = contours.get(i);
    let area = cv.contourArea(contour);
    
    if (area < minArea) {
      if (isStatic) logDebug(`[후보 #${i+1}] ➔ 탈락: 면적 미달 (${Math.round(area)}px < ${Math.round(minArea)}px)`, 'warn');
      contour.delete();
      continue;
    }
    
    // Find rotated rect
    let rect = cv.minAreaRect(contour);
    let width = rect.size.width;
    let height = rect.size.height;
    
    // Aspect ratio filter (resistors are long cylinders)
    let aspect = Math.max(width, height) / Math.min(width, height);
    if (aspect < 2.0 || aspect > 6.5) {
      if (isStatic) logDebug(`[후보 #${i+1}] 면적: ${Math.round(area)}px | ➔ 탈락: 가로세로 비율 불충족 (${aspect.toFixed(2)}배, 기준: 2.0~6.5)`, 'warn');
      contour.delete();
      continue;
    }
    
    // Solidity filter (should be moderately solid rectangular/oblong shape)
    let hull = new cv.Mat();
    cv.convexHull(contour, hull, false);
    let hullArea = cv.contourArea(hull);
    let solidity = area / hullArea;
    hull.delete();
    
    if (solidity < 0.60) {
      if (isStatic) logDebug(`[후보 #${i+1}] 면적: ${Math.round(area)}px | 비율: ${aspect.toFixed(2)} | ➔ 탈락: 볼록성 불충족 (${solidity.toFixed(2)}, 기준: >= 0.60)`, 'warn');
      contour.delete();
      continue;
    }
    
    if (isStatic) logDebug(`[후보 #${i+1}] 면적: ${Math.round(area)}px | 비율: ${aspect.toFixed(2)} | 볼록성: ${solidity.toFixed(2)} ➔ 통과! (색띠 스캔 시작)`, 'success');
    
    // Valid Resistor Candidate! Extract color bands.
    let bands = extractBandsFromResistor(tuned, rect, isStatic, i+1);
    if (bands && bands.length >= 3) {
      // Normalize rect angle to be in [-45, 45] range
      let normalizedAngle = rect.angle;
      let w = rect.size.width;
      let h = rect.size.height;
      if (w < h) {
        normalizedAngle += 90;
        w = rect.size.height;
        h = rect.size.width;
      }
      
      detections.push({
        rect: {
          center: { x: rect.center.x, y: rect.center.y },
          size: { width: w, height: h },
          angle: normalizedAngle
        },
        bands: bands
      });
    } else {
      if (isStatic) logDebug(`[후보 #${i+1}] ➔ 탈락: 유효한 색띠 추출 실패 (3개 미만 감지)`, 'warn');
    }
    
    contour.delete();
  }
  
  // Cleanup mats
  tuned.delete();
  blurred.delete();
  rgb.delete();
  hsv.delete();
  mask.delete();
  closed.delete();
  contours.delete();
  hierarchy.delete();
  
  return detections;
}

/**
 * Extract color bands by rotating, cropping, and profiling the resistor body.
 */
function extractBandsFromResistor(src, rect, isStatic = false, id = 0) {
  let angle = rect.angle;
  let w = rect.size.width;
  let h = rect.size.height;
  
  // Align horizontally
  if (w < h) {
    angle += 90;
    let temp = w;
    w = h;
    h = temp;
  }
  
  // Create rotation matrix and warp
  let M = cv.getRotationMatrix2D(rect.center, angle, 1.0);
  let warped = new cv.Mat();
  cv.warpAffine(src, warped, M, src.size(), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(0,0,0,0));
  M.delete();
  
  // Calculate bounding ROI coordinates safely
  let x = Math.max(0, Math.round(rect.center.x - w / 2));
  let y = Math.max(0, Math.round(rect.center.y - h / 2));
  let cropW = Math.min(warped.cols - x, Math.round(w));
  let cropH = Math.min(warped.rows - y, Math.round(h));
  
  if (cropW < 20 || cropH < 6) {
    if (isStatic) logDebug(`[저항 #${id}] 탈락: 크롭 영역 크기가 너무 작음 (${cropW}x${cropH}px)`, 'warn');
    warped.delete();
    return null;
  }
  
  if (isStatic) logDebug(`[저항 #${id}] 크롭 영역 설정: x=${x}, y=${y}, 크기=${cropW}x${cropH}px`, 'info');

  let rectRoi = new cv.Rect(x, y, cropW, cropH);
  let crop = warped.roi(rectRoi);
  warped.delete();
  
  // Now crop is a horizontal resistor.
  // Profile the columns: average color in vertical center slice
  let colProfiles = [];
  const startY = Math.round(cropH * 0.2);
  const endY = Math.round(cropH * 0.8);
  const sliceHeight = endY - startY;
  
  if (sliceHeight <= 0) {
    if (isStatic) logDebug(`[저항 #${id}] 탈락: 슬라이스 높이 유효하지 않음 (${sliceHeight})`, 'warn');
    crop.delete();
    return null;
  }
  
  for (let col = 0; col < cropW; col++) {
    let sumR = 0, sumG = 0, sumB = 0;
    for (let row = startY; row < endY; row++) {
      let ptr = crop.ucharPtr(row, col);
      sumR += ptr[0];
      sumG += ptr[1];
      sumB += ptr[2];
    }
    colProfiles.push({
      r: Math.round(sumR / sliceHeight),
      g: Math.round(sumG / sliceHeight),
      b: Math.round(sumB / sliceHeight)
    });
  }
  crop.delete();
  
  // Convert colProfiles to HSV to make segmentation easier
  colProfiles.forEach(p => {
    let rNorm = p.r / 255;
    let gNorm = p.g / 255;
    let bNorm = p.b / 255;
    
    let max = Math.max(rNorm, gNorm, bNorm);
    let min = Math.min(rNorm, gNorm, bNorm);
    let diff = max - min;
    
    let h = 0;
    let s = max === 0 ? 0 : diff / max;
    let v = max;
    
    if (diff !== 0) {
      if (max === rNorm) {
        h = (gNorm - bNorm) / diff + (gNorm < bNorm ? 6 : 0);
      } else if (max === gNorm) {
        h = (bNorm - rNorm) / diff + 2;
      } else {
        h = (rNorm - gNorm) / diff + 4;
      }
      h /= 6;
    }
    
    p.h = Math.round(h * 360);
    p.s = Math.round(s * 100);
    p.v = Math.round(v * 100);
  });
  
  // Smooth profiles with moving average (window size 5)
  let smoothed = [];
  const windowSize = 5;
  const halfWindow = Math.floor(windowSize / 2);
  for (let i = 0; i < colProfiles.length; i++) {
    let sumR = 0, sumG = 0, sumB = 0, sumH = 0, sumS = 0, sumV = 0;
    let count = 0;
    for (let w = -halfWindow; w <= halfWindow; w++) {
      let idx = i + w;
      if (idx >= 0 && idx < colProfiles.length) {
        sumR += colProfiles[idx].r;
        sumG += colProfiles[idx].g;
        sumB += colProfiles[idx].b;
        sumH += colProfiles[idx].h;
        sumS += colProfiles[idx].s;
        sumV += colProfiles[idx].v;
        count++;
      }
    }
    smoothed.push({
      r: Math.round(sumR / count),
      g: Math.round(sumG / count),
      b: Math.round(sumB / count),
      h: Math.round(sumH / count),
      s: Math.round(sumS / count),
      v: Math.round(sumV / count)
    });
  }
  
  // Determine dominant base color of the body (tan/beige vs blue/green)
  // We can sample the outer edges of the resistor (which are usually base body color)
  let edgeSampleCount = Math.min(10, Math.floor(smoothed.length * 0.1));
  let baseR = 0, baseG = 0, baseB = 0;
  for (let i = 0; i < edgeSampleCount; i++) {
    // left edge
    baseR += smoothed[i].r;
    baseG += smoothed[i].g;
    baseB += smoothed[i].b;
    // right edge
    baseR += smoothed[smoothed.length - 1 - i].r;
    baseG += smoothed[smoothed.length - 1 - i].g;
    baseB += smoothed[smoothed.length - 1 - i].b;
  }
  baseR = Math.round(baseR / (edgeSampleCount * 2));
  baseG = Math.round(baseG / (edgeSampleCount * 2));
  baseB = Math.round(baseB / (edgeSampleCount * 2));
  
  if (isStatic) {
    logDebug(`[저항 #${id}] 몸체 기본 색상 샘플링 완료 - RGB: (${baseR}, ${baseG}, ${baseB})`, 'info');
  }

  // Scan columns and find bands: columns whose color is significantly different from the base body color
  let bandSegments = [];
  let currentSegment = null;
  
  // Skip the extreme left and right margins to avoid lead wires and shadows
  const margin = Math.max(5, Math.round(smoothed.length * 0.1));
  
  for (let i = margin; i < smoothed.length - margin; i++) {
    const col = smoothed[i];
    // Calculate Euclidean color distance from base color
    let dist = Math.sqrt(Math.pow(col.r - baseR, 2) + Math.pow(col.g - baseG, 2) + Math.pow(col.b - baseB, 2));
    
    // Distance threshold: if color deviates enough, it's a band
    if (dist > 30) {
      if (!currentSegment) {
        currentSegment = { start: i, sumR: 0, sumG: 0, sumB: 0, sumH: 0, sumS: 0, sumV: 0, count: 0 };
      }
      currentSegment.sumR += col.r;
      currentSegment.sumG += col.g;
      currentSegment.sumB += col.b;
      currentSegment.sumH += col.h;
      currentSegment.sumS += col.s;
      currentSegment.sumV += col.v;
      currentSegment.count++;
    } else {
      if (currentSegment) {
        currentSegment.end = i - 1;
        bandSegments.push(currentSegment);
        currentSegment = null;
      }
    }
  }
  if (currentSegment) {
    currentSegment.end = smoothed.length - 1 - margin;
    bandSegments.push(currentSegment);
  }
  
  if (isStatic) {
    logDebug(`[저항 #${id}] 몸체 색상 편차 검출 완료 - 원시 색띠 구간 개수: ${bandSegments.length}개`, 'info');
  }

  // Post-process segments: calculate average colors, filter by width
  const minBandWidth = Math.max(2, Math.round(smoothed.length * 0.015)); // at least 1.5% width
  const maxBandWidth = Math.round(smoothed.length * 0.22); // max 22% width
  
  let validBands = [];
  bandSegments.forEach((seg, idx) => {
    let width = seg.end - seg.start + 1;
    let avgR = Math.round(seg.sumR / seg.count);
    let avgG = Math.round(seg.sumG / seg.count);
    let avgB = Math.round(seg.sumB / seg.count);
    let avgH = Math.round(seg.sumH / seg.count);
    let avgS = Math.round(seg.sumS / seg.count);
    let avgV = Math.round(seg.sumV / seg.count);
    
    if (width >= minBandWidth && width <= maxBandWidth) {
      let colorName = classifyColor(avgR, avgG, avgB, avgH, avgS, avgV);
      validBands.push({
        centerX: seg.start + width / 2,
        width: width,
        color: colorName,
        rgb: [avgR, avgG, avgB]
      });
      if (isStatic) {
        logDebug(`[저항 #${id}] - 세그먼트 #${idx+1} (폭: ${width}px, 기준: ${minBandWidth}~${maxBandWidth}px): RGB(${avgR}, ${avgG}, ${avgB}) HSV(${avgH}, ${avgS}%, ${avgV}%) ➔ 분류 결과: ${colorName}`, 'success');
      }
    } else {
      if (isStatic) {
        logDebug(`[저항 #${id}] - 세그먼트 #${idx+1} (폭: ${width}px, 기준: ${minBandWidth}~${maxBandWidth}px): 저항 크기 대비 폭 불충족 ➔ 제외`, 'warn');
      }
    }
  });
  
  // Sort bands left-to-right
  validBands.sort((a, b) => a.centerX - b.centerX);
  
  if (isStatic) {
    logDebug(`[저항 #${id}] 최종 정렬 및 분류된 색띠: [${validBands.map(b => b.color).join(', ')}]`, 'success');
  }
  
  // Map to simple array of color strings
  return validBands.map(b => b.color);
}

/**
 * Classify RGB + HSV coordinates into 12 standard resistor colors
 */
function classifyColor(r, g, b, h, s, v) {
  // Hue is 0-360, Saturation: 0-100, Value: 0-100

  // 1. Black: very dark colors
  if (v < 22) return 'black';

  // 2. White: very bright, very low saturation
  if (v > 75 && s < 15) return 'white';

  // 3. Grey: low saturation, medium brightness
  if (s < 18) {
    if (v > 20 && v <= 75) return 'grey';
  }

  // 4. Gold: shiny yellow/orange (Hue: 25-45, Saturation: 35-75, Value: 35-85)
  if (h >= 25 && h <= 49 && s >= 35 && s <= 80 && v >= 30 && v <= 85) {
    return 'gold';
  }

  // 5. Brown: dark reddish-orange (H: 5-25, S: 25-80, V: 15-50)
  if (h >= 5 && h <= 28 && s >= 20 && v >= 10 && v <= 55) {
    return 'brown';
  }

  // 6. Red
  if ((h >= 0 && h <= 12) || (h >= 345 && h <= 360)) {
    if (s > 35) return 'red';
    return 'brown'; // Low saturation red is brown
  }

  // 7. Orange
  if (h > 12 && h <= 28) {
    if (v < 40) return 'brown';
    return 'orange';
  }

  // 8. Yellow
  if (h > 28 && h <= 49) {
    return 'yellow';
  }

  // 9. Green
  if (h > 49 && h <= 88) {
    return 'green';
  }

  // 10. Blue
  if (h > 88 && h <= 145) {
    return 'blue';
  }

  // 11. Violet/Purple
  if (h > 145 && h <= 175) {
    return 'violet';
  }
  
  // 12. Silver: light grey/white, metallic sheen
  if (s < 25 && v > 50 && v < 85) {
    return 'silver';
  }

  // RGB Euclidean fallback
  return getClosestColorRGB(r, g, b);
}

function getClosestColorRGB(r, g, b) {
  let minDistance = Infinity;
  let closestColor = 'black';
  
  const referenceRGBs = {
    black: [0, 0, 0],
    brown: [110, 60, 20],
    red: [220, 20, 20],
    orange: [255, 100, 0],
    yellow: [230, 200, 30],
    green: [20, 150, 40],
    blue: [20, 60, 200],
    violet: [150, 50, 150],
    grey: [110, 110, 110],
    white: [240, 240, 240],
    gold: [190, 140, 40],
    silver: [170, 170, 170]
  };
  
  for (let color in referenceRGBs) {
    let ref = referenceRGBs[color];
    let dist = Math.pow(r - ref[0], 2) + Math.pow(g - ref[1], 2) + Math.pow(b - ref[2], 2);
    if (dist < minDistance) {
      minDistance = dist;
      closestColor = color;
    }
  }
  
  return closestColor;
}

// ---------------- RESISTOR TRACKER & DATA SYNC ----------------
function trackResistors(newDetections) {
  // Flag current items
  trackedResistors.forEach(r => r.seenThisFrame = false);
  
  newDetections.forEach(det => {
    // Find closest tracked resistor based on center distance
    let closest = null;
    let minDist = 50; // pixels
    
    trackedResistors.forEach(tr => {
      let dx = tr.rect.center.x - det.rect.center.x;
      let dy = tr.rect.center.y - det.rect.center.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < minDist) {
        minDist = dist;
        closest = tr;
      }
    });
    
    if (closest) {
      closest.rect = det.rect;
      closest.seenThisFrame = true;
      closest.framesUnseen = 0;
      
      // Update bands ONLY if the user hasn't overridden them manually
      if (!closest.isManuallyEdited) {
        // Simple stability check: only update colors if they are identical or we have a solid reading
        closest.bands = det.bands;
        closest.recalculate();
      }
    } else {
      let newRes = {
        id: nextResistorId++,
        rect: det.rect,
        bands: det.bands,
        isReversed: false,
        isManuallyEdited: false,
        seenThisFrame: true,
        framesUnseen: 0,
        recalculate: function() {
          let bandsToUse = [...this.bands];
          if (this.isReversed) {
            bandsToUse.reverse();
          }
          
          // Decide if 4 or 5 band
          // If we detect 3 bands, we assume it's a 4-band resistor with a missing tolerance band (defaults to gold/silver)
          if (bandsToUse.length === 3) {
            bandsToUse.push('gold'); // default tolerance fallback
          } else if (bandsToUse.length > 5) {
            bandsToUse = bandsToUse.slice(0, 5); // limit to 5
          }
          
          // If the first band is gold or silver, or if the tolerance is more likely gold/silver, try reverse decoding
          let decoded = ResistorCalculator.bandsToValue(bandsToUse);
          
          // Optimize direction: check if reverse gives a more standard value or avoids gold/silver as first digit
          if (!this.isReversed && !this.isManuallyEdited) {
            const firstColor = bandsToUse[0];
            if (firstColor === 'gold' || firstColor === 'silver') {
              this.isReversed = true;
              bandsToUse.reverse();
              decoded = ResistorCalculator.bandsToValue(bandsToUse);
            } else {
              // Compare E24 standards of both directions
              let reversedBands = [...bandsToUse].reverse();
              let decodedRev = ResistorCalculator.bandsToValue(reversedBands);
              if (decodedRev && decoded) {
                let currentStd = ResistorCalculator.isStandardValue(decoded.value, bandsToUse.length === 5);
                let revStd = ResistorCalculator.isStandardValue(decodedRev.value, reversedBands.length === 5);
                if (revStd && !currentStd) {
                  this.isReversed = true;
                  bandsToUse = reversedBands;
                  decoded = decodedRev;
                }
              }
            }
          }
          
          if (decoded) {
            this.value = decoded.value;
            this.tolerance = decoded.tolerance;
            this.formattedValue = ResistorCalculator.formatValue(decoded.value);
          } else {
            this.value = null;
            this.tolerance = null;
            this.formattedValue = '측정 불가';
          }
        }
      };
      newRes.recalculate();
      trackedResistors.push(newRes);
    }
  });
  
  // Unseen counts
  trackedResistors.forEach(r => {
    if (!r.seenThisFrame) {
      r.framesUnseen++;
    }
  });
  
  // Filter out expired items (only in live camera mode)
  if (isLiveCameraActive) {
    trackedResistors = trackedResistors.filter(r => r.framesUnseen < 15);
  }
  
  elDetectedCount.textContent = trackedResistors.length;
  updateDetectedListUI();
}

// ---------------- CANVAS DRAWING / UI OVERLAY ----------------
function drawDetectionsUI() {
  // Clear canvas overlay, but redraw source background image if static
  if (!isCameraRunning && staticImage) {
    ctx.drawImage(staticImage, 0, 0, canvas.width, canvas.height);
  }
  
  trackedResistors.forEach(r => {
    const isSelected = (r.id === selectedResistorId);
    
    // Draw Rotated Bounding Box
    ctx.save();
    ctx.translate(r.rect.center.x, r.rect.center.y);
    ctx.rotate(r.rect.angle * Math.PI / 180);
    
    // Styles
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.strokeStyle = isSelected ? '#a855f7' : '#00d2ff';
    ctx.shadowColor = isSelected ? '#a855f7' : '#00d2ff';
    ctx.shadowBlur = isSelected ? 15 : 6;
    
    // Rounded bounding box
    const w = r.rect.size.width;
    const h = r.rect.size.height;
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2, w, h, 8);
    ctx.stroke();
    
    ctx.restore();
    
    // Draw Value text tag above resistor
    ctx.save();
    ctx.font = 'bold 15px Outfit, Inter, sans-serif';
    
    // Measure text
    const text = `${r.formattedValue} (${r.tolerance !== null ? '±' + r.tolerance + '%' : '오차 모름'})`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    
    const tagX = r.rect.center.x - textWidth / 2;
    const tagY = r.rect.center.y - r.rect.size.height / 2 - 12;
    
    // Draw label background
    ctx.fillStyle = isSelected ? 'rgba(168, 85, 247, 0.9)' : 'rgba(13, 15, 23, 0.85)';
    ctx.strokeStyle = isSelected ? '#a855f7' : '#00d2ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tagX - 8, tagY - 18, textWidth + 16, 26, 6);
    ctx.fill();
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, tagX, tagY);
    ctx.restore();
  });
}

// Click listener on canvas for selecting resistor boxes
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
  
  let clickedResistor = null;
  let minDist = Infinity;
  
  trackedResistors.forEach(r => {
    // Check if click is inside bounding box (simplified circle check or rotated box check)
    // For simplicity, checking distance to center, bounded by resistor width/2
    let dx = r.rect.center.x - clickX;
    let dy = r.rect.center.y - clickY;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < Math.max(r.rect.size.width, r.rect.size.height) && dist < minDist) {
      minDist = dist;
      clickedResistor = r;
    }
  });
  
  if (clickedResistor) {
    selectResistor(clickedResistor.id);
  } else {
    // Clicked empty area
    selectedResistorId = null;
    elDetailCard.style.display = 'none';
    drawDetectionsUI();
    updateDetectedListUI();
  }
});

function selectResistor(id) {
  selectedResistorId = id;
  drawDetectionsUI();
  updateDetectedListUI();
  showDetailCard(id);
}

// ---------------- DETAIL CARD (MANUAL ADJUSTMENT) ----------------
function showDetailCard(id) {
  const resistor = trackedResistors.find(r => r.id === id);
  if (!resistor) return;
  
  elDetailCard.style.display = 'block';
  elDetailOhms.textContent = resistor.formattedValue;
  elDetailTolerance.textContent = resistor.tolerance !== null ? `±${resistor.tolerance}%` : '오차 범위 알 수 없음';
  
  // Render bands capsules
  elDetailBandsRow.innerHTML = '';
  resistor.bands.forEach((b, idx) => {
    const code = COLOR_CODES[b.toLowerCase()] || { hex: '#444', label: b };
    const cap = document.createElement('div');
    cap.className = 'band-color-capsule';
    
    const circle = document.createElement('div');
    circle.className = 'band-color-circle';
    circle.style.backgroundColor = code.hex;
    
    const label = document.createElement('span');
    label.textContent = `${idx+1}: ${code.label}`;
    
    cap.appendChild(circle);
    cap.appendChild(label);
    elDetailBandsRow.appendChild(cap);
  });
  
  // Render manual selectors
  elManualBandsSelectors.innerHTML = '';
  resistor.bands.forEach((b, idx) => {
    const group = document.createElement('div');
    group.className = 'band-select-group';
    
    const label = document.createElement('label');
    label.textContent = `${idx+1}번째 띠`;
    
    const select = document.createElement('select');
    
    COLORS_LIST.forEach(cName => {
      const code = COLOR_CODES[cName];
      const opt = document.createElement('option');
      opt.value = cName;
      opt.textContent = code.label;
      if (cName === b.toLowerCase()) opt.selected = true;
      select.appendChild(opt);
    });
    
    select.addEventListener('change', (e) => {
      resistor.bands[idx] = e.target.value;
      resistor.isManuallyEdited = true;
      resistor.recalculate();
      selectResistor(resistor.id); // Refresh detail card
      triggerStaticReprocess();
    });
    
    group.appendChild(label);
    group.appendChild(select);
    elManualBandsSelectors.appendChild(group);
  });
}

function bindDetailCard() {
  elCloseDetail.addEventListener('click', () => {
    selectedResistorId = null;
    elDetailCard.style.display = 'none';
    drawDetectionsUI();
    updateDetectedListUI();
  });
  
  elBtnFlipResistor.addEventListener('click', () => {
    if (selectedResistorId === null) return;
    const resistor = trackedResistors.find(r => r.id === selectedResistorId);
    if (resistor) {
      resistor.isReversed = !resistor.isReversed;
      resistor.recalculate();
      selectResistor(resistor.id);
    }
  });
  
  elBtnApplyToGen.addEventListener('click', () => {
    if (selectedResistorId === null) return;
    const resistor = trackedResistors.find(r => r.id === selectedResistorId);
    if (resistor && resistor.value) {
      // Export value to generator and switch tabs
      elInputResistance.value = resistor.value;
      elSelectTolerance.value = resistor.tolerance || 5;
      
      const is5 = resistor.bands.length === 5;
      elBtnBand4.classList.toggle('active', !is5);
      elBtnBand5.classList.toggle('active', is5);
      
      generateResistorSVG(resistor.value, is5, resistor.tolerance || 5);
      
      // Click generator tab
      elTabGenerator.click();
    }
  });
}

// ---------------- DETECTED LIST UI ----------------
function updateDetectedListUI() {
  if (trackedResistors.length === 0) {
    elDetectedList.innerHTML = `
      <div class="empty-list-msg">
        <p>화면에 저항을 비추거나 사진을 올려주세요. 자동으로 검출을 시작합니다.</p>
      </div>
    `;
    return;
  }
  
  elDetectedList.innerHTML = '';
  trackedResistors.forEach(r => {
    const item = document.createElement('div');
    item.className = `detected-item ${r.id === selectedResistorId ? 'selected' : ''}`;
    
    // Left side info
    const left = document.createElement('div');
    left.className = 'item-left';
    
    const title = document.createElement('span');
    title.className = 'item-title';
    title.textContent = r.formattedValue;
    
    const meta = document.createElement('span');
    meta.className = 'item-meta';
    meta.textContent = `ID: #${r.id} | 오차: ${r.tolerance !== null ? '±' + r.tolerance + '%' : '없음'}`;
    
    left.appendChild(title);
    left.appendChild(meta);
    
    // Right side previews
    const right = document.createElement('div');
    right.className = 'item-right';
    
    const preview = document.createElement('div');
    preview.className = 'mini-bands-preview';
    
    r.bands.forEach(b => {
      const code = COLOR_CODES[b.toLowerCase()] || { hex: '#444' };
      const dot = document.createElement('div');
      dot.className = 'mini-band-dot';
      dot.style.backgroundColor = code.hex;
      preview.appendChild(dot);
    });
    
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-xs-circle-delete';
    delBtn.innerHTML = '&times;';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      trackedResistors = trackedResistors.filter(x => x.id !== r.id);
      if (selectedResistorId === r.id) {
        selectedResistorId = null;
        elDetailCard.style.display = 'none';
      }
      updateDetectedListUI();
      drawDetectionsUI();
    });
    
    right.appendChild(preview);
    right.appendChild(delBtn);
    
    item.appendChild(left);
    item.appendChild(right);
    
    item.addEventListener('click', () => {
      selectResistor(r.id);
    });
    
    elDetectedList.appendChild(item);
  });
}

// ---------------- REFERENCE TABLE POPULATOR ----------------
function populateReferenceTable() {
  const tbody = elReferenceTableBody;
  tbody.innerHTML = '';
  
  COLORS_LIST.forEach(cName => {
    const code = COLOR_CODES[cName];
    const tr = document.createElement('tr');
    
    // Color cell with swatch
    const tdColor = document.createElement('td');
    tdColor.className = 'color-cell';
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = code.hex;
    tdColor.appendChild(swatch);
    tdColor.appendChild(document.createTextNode(code.label));
    tr.appendChild(tdColor);
    
    // Digits
    const val = code.value !== -1 && code.value !== -2 ? code.value : '-';
    for (let i = 0; i < 3; i++) {
      const td = document.createElement('td');
      td.textContent = val !== null ? val : '-';
      tr.appendChild(td);
    }
    
    // Multiplier
    const tdMult = document.createElement('td');
    if (code.multiplier !== null) {
      if (code.multiplier >= 1e9) tdMult.textContent = '1 GΩ';
      else if (code.multiplier >= 1e6) tdMult.textContent = '1 MΩ';
      else if (code.multiplier >= 1e3) tdMult.textContent = '1 kΩ';
      else tdMult.textContent = `${code.multiplier} Ω`;
    } else {
      tdMult.textContent = '-';
    }
    tr.appendChild(tdMult);
    
    // Tolerance
    const tdTol = document.createElement('td');
    tdTol.textContent = code.tolerance !== null ? `±${code.tolerance}%` : '-';
    tr.appendChild(tdTol);
    
    tbody.appendChild(tr);
  });
}

// ---------------- GENERATOR LOGIC & SVG DRAWING ----------------
function bindGenerator() {
  elBtnGenerate.addEventListener('click', () => {
    triggerGeneration();
  });

  elInputResistance.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      triggerGeneration();
    }
  });

  elBtnBand4.addEventListener('click', () => {
    elBtnBand4.classList.add('active');
    elBtnBand5.classList.remove('active');
    triggerGeneration();
  });

  elBtnBand5.addEventListener('click', () => {
    elBtnBand5.classList.add('active');
    elBtnBand4.classList.remove('active');
    triggerGeneration();
  });

  elSelectTolerance.addEventListener('change', () => {
    triggerGeneration();
  });
}

function triggerGeneration() {
  const valueText = elInputResistance.value;
  const is5Band = elBtnBand5.classList.contains('active');
  const tolerance = parseFloat(elSelectTolerance.value);

  const value = ResistorCalculator.parseValue(valueText);
  if (value === null || value <= 0) {
    alert('올바른 저항값을 입력해 주세요. (예: 100, 1k, 4.7k)');
    return;
  }

  generateResistorSVG(value, is5Band, tolerance);
}

function generateResistorSVG(value, is5Band, tolerance) {
  const bands = ResistorCalculator.valueToBands(value, is5Band, tolerance);
  if (!bands) return;

  // Format display text
  elParsedOhmsText.textContent = ResistorCalculator.formatValue(value);
  elParsedTolText.textContent = `±${tolerance}%`;

  // Draw SVG
  const svg = drawResistorSVGMarkup(bands, is5Band);
  elResistorSvgContainer.innerHTML = svg;

  // Write Explanation
  elBandsExpList.innerHTML = '';
  bands.forEach((b, idx) => {
    const code = COLOR_CODES[b];
    const isTol = idx === bands.length - 1;
    const isMult = idx === bands.length - 2;

    const item = document.createElement('div');
    item.className = 'band-exp-item';

    const dot = document.createElement('div');
    dot.className = 'band-exp-dot';
    dot.style.backgroundColor = code.hex;

    const name = document.createElement('span');
    name.className = 'band-exp-name';
    if (isTol) name.textContent = '오차 한계 띠';
    else if (isMult) name.textContent = '승수(곱함) 띠';
    else name.textContent = `${idx + 1}번째 숫자 띠`;

    const val = document.createElement('span');
    val.className = 'band-exp-val';
    if (isTol) {
      val.textContent = `${code.label} (±${code.tolerance}%)`;
    } else if (isMult) {
      let multStr = code.multiplier >= 1e6 ? `${code.multiplier / 1e6} M` 
                  : code.multiplier >= 1e3 ? `${code.multiplier / 1e3} k` 
                  : code.multiplier;
      val.textContent = `${code.label} (x${multStr})`;
    } else {
      val.textContent = `${code.label} (${code.value})`;
    }

    item.appendChild(dot);
    item.appendChild(name);
    item.appendChild(val);
    elBandsExpList.appendChild(item);
  });

  // Suggest Standard Values if current value is non-standard
  const isStd = ResistorCalculator.isStandardValue(value, is5Band);
  if (!isStd) {
    elSuggestionsBox.style.display = 'block';
    elSuggestionChips.innerHTML = '';
    const stds = ResistorCalculator.getNearestStandardValues(value, is5Band);
    
    stds.forEach(stdVal => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = ResistorCalculator.formatValue(stdVal);
      chip.addEventListener('click', () => {
        elInputResistance.value = stdVal;
        generateResistorSVG(stdVal, is5Band, tolerance);
      });
      elSuggestionChips.appendChild(chip);
    });
  } else {
    elSuggestionsBox.style.display = 'none';
  }
}

/**
 * Return raw SVG markup for the resistor body and bands
 */
function drawResistorSVGMarkup(bands, is5Band) {
  const isTanBody = !is5Band; // 4-band commonly tan, 5-band commonly blue/green
  const bodyColor = isTanBody ? '#e6c89c' : '#8cd7e6';
  
  // X positions for bands along the resistor body (width = 240, from X = 80 to 320)
  // Standard resistors have the tolerance band slightly isolated on the right
  let bandPositions = [];
  if (is5Band) {
    // 5-band: Digit1, Digit2, Digit3, Multiplier, [Gap], Tolerance
    bandPositions = [110, 140, 170, 200, 280];
  } else {
    // 4-band: Digit1, Digit2, Multiplier, [Gap], Tolerance
    bandPositions = [110, 150, 190, 285];
  }

  let bandsMarkup = bands.map((color, idx) => {
    const x = bandPositions[idx];
    const hex = COLOR_CODES[color].hex;
    
    // Add realistic 3D cylinder lighting overlay gradient for each band
    return `
      <g>
        <rect x="${x}" y="70" width="16" height="60" fill="${hex}" />
        <rect x="${x}" y="70" width="16" height="60" fill="url(#band-shading)" opacity="0.4" />
      </g>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 400 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Body Shading -->
        <linearGradient id="body-shading" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/>
          <stop offset="25%" stop-color="#ffffff" stop-opacity="0.1"/>
          <stop offset="60%" stop-color="#000000" stop-opacity="0.1"/>
          <stop offset="85%" stop-color="#000000" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.7"/>
        </linearGradient>
        
        <!-- Band Shading overlay -->
        <linearGradient id="band-shading" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
          <stop offset="30%" stop-color="#ffffff" stop-opacity="0.0"/>
          <stop offset="75%" stop-color="#000000" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
        </linearGradient>
        
        <!-- Drop Shadow -->
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.45"/>
        </filter>
        
        <!-- Metal Lead wire gradient -->
        <linearGradient id="lead-wire" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7a7a7a"/>
          <stop offset="40%" stop-color="#d4d4d4"/>
          <stop offset="60%" stop-color="#d4d4d4"/>
          <stop offset="100%" stop-color="#545454"/>
        </linearGradient>
      </defs>

      <!-- Drop shadow group -->
      <g filter="url(#shadow)">
        <!-- Metal Leads (Left & Right wires) -->
        <rect x="20" y="96" width="360" height="8" rx="4" fill="url(#lead-wire)" />
        
        <!-- Resistor Body (Rounded Cylinder) -->
        <!-- Center cylinder -->
        <rect x="90" y="70" width="220" height="60" rx="4" fill="${bodyColor}" />
        <!-- Left bulged connector cap -->
        <rect x="80" y="65" width="20" height="70" rx="8" fill="${bodyColor}" />
        <!-- Right bulged connector cap -->
        <rect x="300" y="65" width="20" height="70" rx="8" fill="${bodyColor}" />
        
        <!-- Shading for 3D appearance -->
        <rect x="80" y="65" width="240" height="70" rx="8" fill="url(#body-shading)" opacity="0.6" style="mix-blend-mode: multiply; pointer-events: none;" />
        
        <!-- Render Color Bands -->
        ${bandsMarkup}
      </g>
    </svg>
  `;
}

// Start App
window.addEventListener('DOMContentLoaded', init);
