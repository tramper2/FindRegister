import sys
from huggingface_hub import hf_hub_download
try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "--break-system-packages"])
    from PIL import Image

try:
    filepath = hf_hub_download(repo_id="tylerebowers/synthetic_resistors", filename="images/0.png", repo_type="dataset")
    print(f"Downloaded sample image to: {filepath}")
    img = Image.open(filepath)
    print(f"Image format: {img.format}, Size: {img.size}, Mode: {img.mode}")
except Exception as e:
    print(f"Error: {e}")
