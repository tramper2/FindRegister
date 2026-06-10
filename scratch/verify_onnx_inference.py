import cv2
import numpy as np
import onnxruntime as ort
from pathlib import Path

# 1. Paths
BASE_DIR = Path("/home/tramp/Projects/Homepage/FindRegister")
model_path = BASE_DIR / "models" / "resistor_yolov8n.onnx"
image_path = BASE_DIR / "scratch" / "images_0.png"

print("Checking files...")
print(f"Model exists: {model_path.exists()} (size: {model_path.stat().st_size / 1024 / 1024:.2f} MB)")
print(f"Image exists: {image_path.exists()}")

if not model_path.exists():
    print("Error: ONNX model not found!")
    exit(1)

# 2. Initialize ONNX runtime session
session = ort.InferenceSession(str(model_path), providers=['CPUExecutionProvider'])
print("\nModel Input Names:", [i.name for i in session.get_inputs()])
print("Model Output Names:", [o.name for o in session.get_outputs()])

# Check shapes
input_shape = session.get_inputs()[0].shape
output_shape = session.get_outputs()[0].shape
print(f"Expected Input Shape: {input_shape}")
print(f"Expected Output Shape: {output_shape}")

# 3. Read and preprocess image
img = cv2.imread(str(image_path))
original_h, original_w, _ = img.shape
print(f"\nOriginal image size: {original_w}x{original_h}")

# Resize to model input size (512x512)
img_resized = cv2.resize(img, (512, 512))
# Convert BGR to RGB
img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
# Normalize to [0, 1]
img_normalized = img_rgb.astype(np.float32) / 255.0
# HWC to CHW format: [3, 512, 512]
img_chw = np.transpose(img_normalized, (2, 0, 1))
# Add batch dimension: [1, 3, 512, 512]
input_tensor = np.expand_dims(img_chw, axis=0)

# 4. Run inference
outputs = session.run(None, {"images": input_tensor})
output_arr = outputs[0]  # Shape: [1, 5, 5376]
print(f"Inference output shape: {output_arr.shape}")

# 5. Analyze detections
# Row 4 is confidence score
scores = output_arr[0, 4, :]
max_score_idx = np.argmax(scores)
max_score = scores[max_score_idx]

print(f"\nMaximum confidence score: {max_score:.4f} at anchor index {max_score_idx}")

if max_score > 0.35:
    cx = output_arr[0, 0, max_score_idx]
    cy = output_arr[0, 1, max_score_idx]
    w = output_arr[0, 2, max_score_idx]
    h = output_arr[0, 3, max_score_idx]
    print("Detections found! Best anchor coordinates (512x512 space):")
    print(f"  Center X: {cx:.2f}, Center Y: {cy:.2f}")
    print(f"  Width: {w:.2f}, Height: {h:.2f}")
    
    # Scale to original image size
    scale_x = original_w / 512
    scale_y = original_h / 512
    orig_cx = cx * scale_x
    orig_cy = cy * scale_y
    orig_w = w * scale_x
    orig_h = h * scale_y
    print("Scale back to original image:")
    print(f"  Center: ({orig_cx:.1f}, {orig_cy:.1f}), Size: {orig_w:.1f}x{orig_h:.1f}")
else:
    print("No resistors detected with confidence > 0.35")

print("\nVerification Complete.")
