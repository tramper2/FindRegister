from datasets import load_dataset

ds = load_dataset("Francesco/circuit-elements", split="train")
for item in ds:
    if 23 in item['objects']['category']:
        print("Image shape:", item['width'], item['height'])
        print("Bboxes:", item['objects']['bbox'])
        print("Categories:", item['objects']['category'])
        break
