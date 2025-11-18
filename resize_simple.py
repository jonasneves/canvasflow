#!/usr/bin/env python3
import os
from PIL import Image

# Target dimensions for Chrome Web Store
TARGET_WIDTH = 1280
TARGET_HEIGHT = 800

base_dir = '/home/user/canvasflow/screenshots'

# Screenshots to process - using exact filenames
screenshots = [
    ('Screenshot 2025-11-17 at 8.02.08 PM.png', 'screenshot-1-dashboard.png', 'Dashboard View'),
    ('Screenshot 2025-11-17 at 8.02.20 PM.png', 'screenshot-2-ai-insights.png', 'AI Insights'),
    ('Screenshot 2025-11-17 at 8.01.40 PM.png', 'screenshot-3-weekly-schedule.png', 'Weekly Schedule'),
    ('Screenshot 2025-11-17 at 8.10.03 PM.png', 'screenshot-4-in-context.png', 'In-Context View'),
    ('Screenshot 2025-11-17 at 8.02.49 PM.png', 'screenshot-5-mcp-server.png', 'MCP Server'),
]

print('🎨 Resizing screenshots for Chrome Web Store...\n')

for input_file, output_file, description in screenshots:
    input_path = os.path.join(base_dir, input_file)
    output_path = os.path.join(base_dir, output_file)

    print(f"Processing: {input_file}")
    print(f"  Exists: {os.path.exists(input_path)}")

    if not os.path.exists(input_path):
        print(f"  ❌ File not found\n")
        continue

    try:
        img = Image.open(input_path)
        w, h = img.size
        print(f"  Original: {w}x{h}")

        # Calculate crop dimensions (center crop to 1280x800 aspect ratio)
        target_ratio = TARGET_WIDTH / TARGET_HEIGHT  # 1.6
        current_ratio = w / h

        if current_ratio > target_ratio:
            # Image is wider - crop width
            new_width = int(h * target_ratio)
            left = (w - new_width) // 2
            img_cropped = img.crop((left, 0, left + new_width, h))
        else:
            # Image is taller - crop height
            new_height = int(w / target_ratio)
            top = (h - new_height) // 2
            img_cropped = img.crop((0, top, w, top + new_height))

        # Now resize to exact target dimensions
        img_resized = img_cropped.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)

        # Save
        img_resized.save(output_path, 'PNG', optimize=True)

        size_kb = os.path.getsize(output_path) / 1024
        print(f"  ✅ Saved: {output_file} ({size_kb:.2f} KB)")
        print(f"  Description: {description}\n")

    except Exception as e:
        print(f"  ❌ Error: {e}\n")

print('✨ Done!')
