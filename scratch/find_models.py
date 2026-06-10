import sys
from huggingface_hub import HfApi

api = HfApi()
models = api.list_models(search="resistor")
print("Models found for 'resistor':")
for m in models:
    print(f"- {m.id} (downloads: {getattr(m, 'downloads', 0)})")

models_pcb = api.list_models(search="pcb")
print("\nModels found for 'pcb':")
for m in models_pcb:
    print(f"- {m.id} (downloads: {getattr(m, 'downloads', 0)})")
