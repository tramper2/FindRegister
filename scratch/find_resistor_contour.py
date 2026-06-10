import cv2
import numpy as np
from huggingface_hub import hf_hub_download

# Download image
path = hf_hub_download(repo_id="tylerebowers/synthetic_resistors", filename="images/0.png", repo_type="dataset")
img = cv2.imread(path)
h, w, c = img.shape
print(f"Image shape: {w}x{h}")

# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Apply Gaussian Blur
blurred = cv2.GaussianBlur(gray, (5, 5), 0)

# Canny Edge Detection
edges = cv2.Canny(blurred, 30, 150)

# Find contours
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
print(f"Found {len(contours)} contours")

# Filter contours by size and print the largest ones
valid_contours = []
for idx, cnt in enumerate(contours):
    area = cv2.contourArea(cnt)
    x, y, cw, ch = cv2.boundingRect(cnt)
    # Check aspect ratio
    aspect = max(cw, ch) / min(cw, ch) if min(cw, ch) > 0 else 0
    valid_contours.append((area, [x, y, x + cw, y + ch], aspect))

# Sort by area
valid_contours.sort(key=lambda x: x[0], reverse=True)

print("Top 5 largest contours:")
for idx, (area, bbox, aspect) in enumerate(valid_contours[:5]):
    print(f"Contour #{idx+1}: Area: {area:.1f}px | BBox: {bbox} | Size: {bbox[2]-bbox[0]}x{bbox[3]-bbox[1]} | Aspect Ratio: {aspect:.2f}")
