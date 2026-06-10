import sys
try:
    import datasets
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "datasets", "--break-system-packages"])
    import datasets

from datasets import load_dataset

print("Loading dataset metadata...")
ds = load_dataset("Francesco/circuit-elements", split="train", streaming=True)
features = ds.features
print("Features in dataset:")
print(features)

# Let's inspect the categories/classes
# Often class labels are in objects/category
if 'objects' in features:
    print("Objects schema:")
    print(features['objects'])
    if hasattr(features['objects'], 'feature') and 'category' in features['objects'].feature:
        print("Categories/Classes list:")
        print(features['objects'].feature['category'].names)
