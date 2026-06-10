from datasets import load_dataset

for split in ["train", "validation", "test"]:
    try:
        ds = load_dataset("Francesco/circuit-elements", split=split)
        print(f"Split '{split}': {len(ds)} images total.")
        resistor_count = 0
        for item in ds:
            # check if category 23 (Resistor) is in objects
            if 23 in item['objects']['category']:
                resistor_count += 1
        print(f"  Images with resistors: {resistor_count}")
    except Exception as e:
        print(f"Error for split '{split}': {e}")
