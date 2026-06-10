import re
import urllib.request
import urllib.error

# Try a few common model page URLs for circuits-project/resistor-detection
urls = [
    "https://universe.roboflow.com/circuits-project/resistor-detection/model/5",
    "https://universe.roboflow.com/circuits-project/resistor-detection",
    "https://universe.roboflow.com/ant-snpik/resistor-detector-dgotz/model/1",
    "https://universe.roboflow.com/ant-snpik/resistor-detector-dgotz"
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

for url in urls:
    print(f"Fetching: {url}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            # Look for publishable key rf_
            keys = re.findall(r'rf_[a-zA-Z0-9]{20,50}', html)
            if keys:
                print(f"Found keys: {list(set(keys))}")
                break
            else:
                print("No key starting with rf_ found on this page.")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
    except Exception as e:
        print(f"Error: {e}")
print("Done.")
