from datasets import load_dataset
import numpy as np

try:
    ds = load_dataset("akhil2808/YoloDataset", split="train")
    print("Dataset loaded successfully!")
    print("Features:")
    print(ds.features)
    # Check first item
    print("First item keys:", ds[0].keys())
    # Count resistors or check categories
    # Usually YOLO datasets on HF have labels in a specific format
except Exception as e:
    print(f"Error loading dataset: {e}")
