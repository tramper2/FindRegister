import cv2
import numpy as np
from huggingface_hub import hf_hub_download

# Download image
path = hf_hub_download(repo_id="tylerebowers/synthetic_resistors", filename="images/0.png", repo_type="dataset")
img = cv2.imread(path)
h, w, c = img.shape
print(f"Image shape: {w}x{h}")

# Check corners
corners = [img[0, 0], img[0, w-1], img[h-1, 0], img[h-1, w-1]]
print("Corner colors (BGR):")
for idx, corner in enumerate(corners):
    print(f"Corner #{idx}: {corner}")

# Calculate brightness (grayscale)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
print("Grayscale unique values count:", len(np.unique(gray)))
print("Grayscale min:", np.min(gray), "max:", np.max(gray))

# Let's count how many pixels are close to the background color at (0,0)
bg_val = int(gray[0, 0])
diff = cv2.absdiff(gray, bg_val)
for tol in [1, 2, 5, 10, 15, 20]:
    foreground_mask = diff > tol
    foreground_pixels = np.sum(foreground_mask)
    total_pixels = w * h
    ratio = foreground_pixels / total_pixels * 100
    print(f"Tolerance: {tol} | Foreground pixels: {foreground_pixels} ({ratio:.2f}%)")
    
    if foreground_pixels > 0:
        pts = np.argwhere(foreground_mask)
        ymin, xmin = pts.min(axis=0)
        ymax, xmax = pts.max(axis=0)
        print(f"  Bounding box: [{xmin}, {ymin}, {xmax}, {ymax}] Size: {xmax - xmin}x{ymax - ymin}")
