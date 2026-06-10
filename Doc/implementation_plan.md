# Resistor Identification Web App (FindRegister)

This is a web-based client-side application for detecting and identifying resistor color codes using a live camera feed (webcam/mobile back camera) or image uploads. It also features a resistor color-band generator based on user input.

The application will be built using standard HTML5, CSS3, and modern Vanilla JS (ES6 modules). It uses **OpenCV.js** loaded via CDN for high-performance client-side computer vision without requiring any server-side processing.

---

## User Review Required

> [!IMPORTANT]
> **Client-Side OpenCV.js & Performance**
> OpenCV.js is a large library (~8-10MB). We will load it asynchronously from a CDN and show a beautiful, interactive loading animation while it compiles in the background. The computer vision frame processing will be throttled (to around 5–10 FPS) to maintain smooth UI performance on both PCs and mobile devices.

> [!WARNING]
> **Color Recognition & Lighting Limitations**
> Image-based resistor color identification is highly sensitive to ambient lighting, glare, and shadows. To provide the best UX:
> 1. We will calibrate our HSV color classifier to cover common variations.
> 2. We will list the detected bands and allow the user to **click a bounding box to review, swap reading directions (reverse), or manually fine-tune the colors** if the environment causes incorrect recognition.
> 3. We will add a camera torch/flashlight toggle if supported by the browser/device.

---

## Open Questions

> [!NOTE]
> 1. **Do you have sample resistor images?** If you have any sample images, we can place them in a test folder or use them to verify the color detection thresholds.
> 2. **GitHub Deployment:** Does your local git environment have SSH access configured for `git@github.com:tramper2/FindRegister.git`? We will write a deployment script and can trigger the git push directly, but it requires that your SSH keys are set up. If not, we can deploy via HTTPS or guide you through committing the files.

---

## Proposed Changes

### Core Web Application

#### [NEW] [index.html](file://///wsl.localhost/Ubuntu/home/tramp/Projects/Homepage/FindRegister/index.html)
Main page containing:
*   **Header Section**: Title, logo, and active mode toggles (Scanner vs Generator vs Reference Chart).
*   **Scanner Interface**:
    *   Camera view panel with interactive `<video>` and overlay `<canvas>` for drawing bounding boxes and labels.
    *   Controls: Switch camera (front/back), start/pause scanner, torch toggle, and file upload button.
    *   Throttled canvas processing loop feeding frames to the OpenCV.js engine.
    *   Detail Card: Appears when clicking an identified resistor, showing detected bands, confidence, resistance value, and manual adjustment sliders/buttons.
*   **Generator Interface**:
    *   Search input supporting units (e.g., `100`, `1k`, `4.7M`, `10k5`).
    *   Band mode toggle (4-band or 5-band).
    *   Interactive, high-fidelity SVG graphic of a resistor displaying the exact color bands.
    *   Detailed explanation card: breakdowns of digits, multiplier, and tolerance.
*   **Reference Table**:
    *   An interactive resistor color code reference chart for quick manual lookups.

#### [NEW] [style.css](file://///wsl.localhost/Ubuntu/home/tramp/Projects/Homepage/FindRegister/style.css)
Premium CSS design system:
*   **Dark Mode Palette**: Deep space background (`#0d0e15`), translucent card layouts, glassmorphism (`backdrop-filter`), and glowing borders.
*   **Aesthetics**: Sleek animations, hover effects, color band previews, custom styled inputs, and responsive flex/grid layouts tailored for both desktop and mobile.
*   **Transitions**: Smooth modal popups and state transitions.

#### [NEW] [app.js](file://///wsl.localhost/Ubuntu/home/tramp/Projects/Homepage/FindRegister/app.js)
Core application logic:
*   **Module structure**: Sub-components for Camera Management, OpenCV processor, Resistance Calculator, SVG Resistor Renderer, and UI bindings.
*   **OpenCV.js Pipeline**:
    1.  *Preprocessing*: Rescale frame, apply bilateral filtering to reduce noise.
    2.  *Segmentation*: Apply HSV color-range thresholds matching resistor bodies (tan, blue, green).
    3.  *Contour Detection*: Find contours, filter by minimum area (to ignore noise) and aspect ratio (2.2 to 6.0) to locate resistor bodies.
    4.  *Straightening*: Crop bounding rotated rectangles and rotate them to be horizontal.
    5.  *Band Profiling*: Scan horizontal average color values along the resistor axis to locate peaks representing bands.
    6.  *Classification*: Classify the average HSV/RGB of each band into 12 standard resistor colors.
    7.  *Decoding*: Compute resistance in both directions, choosing the one with standard values/valid tolerance band, and allowing manual user swap.
*   **Resistor Parser & Generator**:
    *   Parse text inputs (e.g., `1.2k` -> `1200`).
    *   Map values to standard E-series sequences.
    *   Generate SVG paths with dynamic fill colors matching the color bands.

---

### Documentation & Git

#### [NEW] [README.md](file://///wsl.localhost/Ubuntu/home/tramp/Projects/Homepage/FindRegister/README.md)
Project documentation explaining what the app is, how it works, how the algorithm works, and how to run/deploy it.

#### [NEW] [Doc/algorithm_design.md](file://///wsl.localhost/Ubuntu/home/tramp/Projects/Homepage/FindRegister/Doc/algorithm_design.md)
Detailed technical documentation on the computer vision pipeline, HSV ranges, band peak-detection logic, and color classifier formulas.

#### [NEW] [Doc/user_guide.md](file://///wsl.localhost/Ubuntu/home/tramp/Projects/Homepage/FindRegister/Doc/user_guide.md)
User manual for operating the scanner, uploading photos, using the generator, and understanding resistor color codes.

#### [NEW] [deploy.sh](file://///wsl.localhost/Ubuntu/home/tramp/Projects/Homepage/FindRegister/deploy.sh)
Bash script to automate:
1. Git repository initialization.
2. Committing codebase to `main`.
3. Creating a clean `gh-pages` branch.
4. Pushing files to `git@github.com:tramper2/FindRegister.git` on the `gh-pages` branch for hosting.

---

## Verification Plan

### Automated Tests
*   Since this is a client-side frontend project, we can run static linting or verification using a simple HTTP server to load the app in the browser.
*   Write a unit test script (`scratch/test_calc.js`) to verify:
    *   Resistor value parsing (e.g., `100`, `1k`, `4M7` -> correct ohms).
    *   Resistor color code translation (value -> band colors and band colors -> value).
    *   Run it using a lightweight Node.js task to ensure core logic is 100% correct.

### Manual Verification
1.  **Local Dev Server**: Launch a local development server (like `npx http-server` or `python -m http.server`) to access the app.
2.  **Webcam & Upload Test**: Verify camera enumeration (front/back camera selection) and photo uploading. We will test uploading image files and verify bounding boxes.
3.  **Generator Verification**: Type in various resistance values (10, 220, 1k, 4.7k, 100k, 1M, 10M, 0.22) and check that the SVG matches standard color charts.
4.  **Deployment Verification**: Verify that the deployed site on `gh-pages` loads properly and the CDNs are resolved correctly.
