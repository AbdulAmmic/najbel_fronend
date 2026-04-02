with open('ts_errors_clean.txt', encoding='utf-8-sig') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped:
        print(f"LINE {i}: {stripped}")
