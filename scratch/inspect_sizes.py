from datasets import load_dataset
import numpy as np

ds = load_dataset("Francesco/circuit-elements", split="train")
widths = []
heights = []

for item in ds:
    img_w, img_h = item['width'], item['height']
    for bbox, cat in zip(item['objects']['bbox'], item['objects']['category']):
        if cat in [23, 24, 25]: # Resistor, Resistor Jumper, Resistor Network
            w = bbox[2]
            h = bbox[3]
            widths.append(w)
            heights.append(h)

print(f"Total resistor instances: {len(widths)}")
if len(widths) > 0:
    print(f"Widths - Min: {min(widths)}, Max: {max(widths)}, Mean: {np.mean(widths):.2f}")
    print(f"Heights - Min: {min(heights)}, Max: {max(heights)}, Mean: {np.mean(heights):.2f}")
else:
    print("No resistors found.")
