#!/usr/bin/env python3
import os
from PIL import Image

# Target dimensions for Chrome Web Store
TARGET_WIDTH = 1280
TARGET_HEIGHT = 800

base_dir = '/home/user/canvasflow/screenshots'

# Get actual filenames from directory
all_files = os.listdir(base_dir)

# Map patterns to output names
file_mapping = {
    '8.02.08': ('screenshot-1-dashboard.png', 'Dashboard View - Assignment tracking with summary cards'),
    '8.02.20': ('screenshot-2-ai-insights.png', 'AI Insights - Workload analysis and study tips'),
    '8.01.40': ('screenshot-3-weekly-schedule.png', 'Weekly Schedule - AI-generated study plan'),
    '8.10.03': ('screenshot-4-in-context.png', 'In-Context View - CanvasFlow working alongside Canvas'),
    '8.02.49': ('screenshot-5-mcp-server.png', 'Claude Desktop Integration'),
}

print('🎨 Resizing screenshots for Chrome Web Store...\n')
print(f'Target: {TARGET_WIDTH}x{TARGET_HEIGHT}\n')
print('=' * 70)

success_count = 0

for filename in all_files:
    if not filename.endswith('.png'):
        continue

    # Find which screenshot this is
    matched = False
    for pattern, (output_file, description) in file_mapping.items():
        if pattern in filename:
            input_path = os.path.join(base_dir, filename)
            output_path = os.path.join(base_dir, output_file)

            print(f"\n📸 {filename}")

            try:
                img = Image.open(input_path)
                w, h = img.size
                print(f"   Original: {w}x{h}")

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
                print(f"   → {output_file}")
                print(f"   ✅ Saved: {size_kb:.2f} KB")
                print(f"   📝 {description}")

                success_count += 1
                matched = True
                break

            except Exception as e:
                print(f"   ❌ Error: {e}")

print('\n' + '=' * 70)
print(f'\n✨ Successfully resized {success_count}/{len(file_mapping)} screenshots!')
print('\n📋 Next steps:')
print('   1. Review the resized screenshots (screenshot-1-*.png through screenshot-5-*.png)')
print('   2. Delete the original screenshots if satisfied')
print('   3. Upload to Chrome Web Store Developer Dashboard')
print('   4. Use the descriptions provided above in your store listing\n')
