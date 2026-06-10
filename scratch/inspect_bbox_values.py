from datasets import load_dataset

ds = load_dataset("Francesco/circuit-elements", split="train")
for item in ds:
    if 23 in item['objects']['category']:
        print("Width:", item['width'], "Height:", item['height'])
        for bbox, cat in zip(item['objects']['bbox'], item['objects']['category']):
            if cat == 23:
                print("Resistor bbox:", bbox)
        break
