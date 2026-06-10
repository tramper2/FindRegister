import cv2
import numpy as np
from huggingface_hub import hf_hub_download

# Download image
filepath = hf_hub_download(repo_id="tylerebowers/synthetic_resistors", filename="images/0.png", repo_type="dataset")
img = cv2.imread(filepath)
h, w, c = img.shape
print(f"Image shape: {w}x{h}")

# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Background value at corner (0,0)
bg_val = int(gray[0, 0])
print("Background value at corner (0,0):", bg_val)

# Threshold to find non-background pixels
diff = cv2.absdiff(gray, bg_val)
_, thresh = cv2.threshold(diff, 10, 255, cv2.THRESH_BINARY)

# Find bounding box of all non-background pixels
pts = np.argwhere(thresh > 0)
if len(pts) > 0:
    # argwhere returns [y, x]
    ymin, xmin = pts.min(axis=0)
    ymax, xmax = pts.max(axis=0)
    print(f"Detected bounding box: [{xmin}, {ymin}, {xmax}, {ymax}]")
    print(f"Size: {xmax - xmin}x{ymax - ymin}")
else:
    print("No foreground detected")
