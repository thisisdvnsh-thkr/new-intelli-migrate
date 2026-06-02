import re
import os

# Define the target path
file_path = r"frontend/src/context/LanguageContext.jsx"

if not os.path.exists(file_path):
    print(f"Error: Could not find file at {file_path}. Make sure you run this from the project root folder.")
    exit(1)

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

output_lines = []
seen_keys = set()

for line in lines:
    # Detect the start of a language block (e.g., en: {, es: {, hi: {, zh: {)
    if re.search(r'^\s*[\'"]?[a-z]{2}(-[A-Za-z0-9]+)?[\'"]?:\s*\{', line):
        seen_keys.clear()
    
    # Check for the target duplicate keys
    match = re.search(r'^\s*[\'"](Upload|Settings)[\'"]\s*:', line)
    if match:
        key = match.group(1)
        if key in seen_keys:
            # Duplicate detected in this block -> Skip adding it to the output
            continue
            
        seen_keys.add(key)
    
    output_lines.append(line)

# Overwrite the file safely with the cleaned lines
with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(output_lines)

print("Success! LanguageContext.jsx has been cleanly purged of duplicate keys.")