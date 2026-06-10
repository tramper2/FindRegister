import os
import json
import urllib.request
import shutil
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from ultralytics import YOLO

# 1. Setup paths
BASE_DIR = Path("/home/tramp/Projects/Homepage/FindRegister")
DATASET_DIR = BASE_DIR / "dataset"
IMAGES_TRAIN = DATASET_DIR / "images" / "train"
IMAGES_VAL = DATASET_DIR / "images" / "val"
LABELS_TRAIN = DATASET_DIR / "labels" / "train"
LABELS_VAL = DATASET_DIR / "labels" / "val"

for p in [IMAGES_TRAIN, IMAGES_VAL, LABELS_TRAIN, LABELS_VAL]:
    p.mkdir(parents=True, exist_ok=True)

# 2. Download bands.json if not exists
bands_path = BASE_DIR / "scratch" / "bands.json"
if not bands_path.exists():
    print("Downloading bands.json...")
    urllib.request.urlretrieve(
        "https://huggingface.co/datasets/tylerebowers/synthetic_resistors/resolve/main/bands.json",
        bands_path
    )

with open(bands_path, "r") as f:
    bands_data = json.load(f)

# We will use 150 for training, 30 for validation
train_count = 150
val_count = 30
total_needed = train_count + val_count

print(f"Preparing dataset: {train_count} train, {val_count} val images...")

def download_item(idx):
    item = bands_data[idx]
    filename = item["file"]  # e.g., "images/0.png"
    file_id = filename.split("/")[-1]  # e.g., "0.png"
    label_id = file_id.replace(".png", ".txt")  # e.g., "0.txt"
    
    is_train = idx < train_count
    dest_img_dir = IMAGES_TRAIN if is_train else IMAGES_VAL
    dest_lbl_dir = LABELS_TRAIN if is_train else LABELS_VAL
    
    img_dest = dest_img_dir / file_id
    lbl_dest = dest_lbl_dir / label_id
    
    # Download image if not exists
    if not img_dest.exists():
        url = f"https://huggingface.co/datasets/tylerebowers/synthetic_resistors/resolve/main/{filename}"
        try:
            urllib.request.urlretrieve(url, img_dest)
        except Exception as e:
            print(f"Error downloading {filename}: {e}")
            return
            
    # Write YOLO label file: class_id x_center y_center width height
    # Resistor is exactly in the center (0.5, 0.5) with body width ~0.36 and height ~0.11
    with open(lbl_dest, "w") as lf:
        lf.write("0 0.5 0.5 0.36 0.11\n")

# Use ThreadPoolExecutor to download in parallel
print("Downloading images in parallel...")
with ThreadPoolExecutor(max_workers=16) as executor:
    executor.map(download_item, range(total_needed))

print("Dataset preparation complete!")

# 3. Create data.yaml
yaml_content = f"""
path: {DATASET_DIR}
train: images/train
val: images/val
nc: 1
names:
  0: resistor
"""

yaml_path = DATASET_DIR / "data.yaml"
with open(yaml_path, "w") as f:
    f.write(yaml_content.strip())
print(f"Created data.yaml at {yaml_path}")

# 4. Train YOLOv8n
print("Starting YOLOv8 training...")
model = YOLO("yolov8n.pt")  # load pretrained model

# Train the model
results = model.train(
    data=str(yaml_path),
    epochs=25,
    imgsz=512,
    batch=32,
    degrees=180.0,   # Full rotation augmentation
    translate=0.3,   # Random translation
    scale=0.5,       # Random scale
    flipud=0.5,      # Vertical flip
    fliplr=0.5,      # Horizontal flip
    mosaic=0.0,      # Disable mosaic for simple centered object detection
    device="cpu",    # Train on CPU
    workers=4
)

print("Training finished! Exporting to ONNX...")
# Export the model to ONNX format
onnx_path = model.export(format="onnx", imgsz=512)
print(f"Exported model to ONNX at: {onnx_path}")

# Copy to model directory of project
models_dir = BASE_DIR / "models"
models_dir.mkdir(exist_ok=True)
shutil.copy(onnx_path, models_dir / "resistor_yolov8n.onnx")
print("Successfully copied resistor_yolov8n.onnx to models/")
