#!/usr/bin/env python3
"""
Custom crop positions for specific screenshots
"""
import os
from PIL import Image

TARGET_WIDTH = 1280
TARGET_HEIGHT = 800
base_dir = '/home/user/canvasflow/screenshots'

def custom_crop_screenshot(input_filename, output_filename, crop_position, description):
    """
    Custom crop with specific positioning
    crop_position: dict with 'left_offset' and/or 'top_offset' as percentages (0-100)
    """
    all_files = os.listdir(base_dir)

    # Find the file
    time_pattern = input_filename.split(' at ')[1].replace(' PM.png', '').replace(' AM.png', '')
    matching = [f for f in all_files if time_pattern in f and f.endswith('.png')]

    if not matching:
        print(f"❌ File not found: {input_filename}")
        return False

    input_path = os.path.join(base_dir, matching[0])
    output_path = os.path.join(base_dir, output_filename)

    try:
        img = Image.open(input_path)
        w, h = img.size

        print(f"\n📸 {matching[0]}")
        print(f"   Original: {w}x{h}")
        print(f"   Description: {description}")
        print(f"   Crop position: {crop_position}")

        target_ratio = TARGET_WIDTH / TARGET_HEIGHT  # 1.6
        current_ratio = w / h

        if current_ratio > target_ratio:
            # Image is wider - need to crop width
            new_height = TARGET_HEIGHT
            new_width = int(w * (TARGET_HEIGHT / h))
            img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Calculate left position based on offset
            if 'left_offset' in crop_position:
                # Offset as percentage (0 = far left, 100 = far right)
                offset_pct = crop_position['left_offset']
                max_offset = new_width - TARGET_WIDTH
                left = int((offset_pct / 100) * max_offset)
            else:
                # Default center
                left = (new_width - TARGET_WIDTH) // 2

            img_final = img_resized.crop((left, 0, left + TARGET_WIDTH, TARGET_HEIGHT))
            print(f"   Horizontal crop: left={left}px (out of {new_width}px width)")

        else:
            # Image is taller - need to crop height
            new_width = TARGET_WIDTH
            new_height = int(h * (TARGET_WIDTH / w))
            img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Calculate top position based on offset
            if 'top_offset' in crop_position:
                # Offset as percentage (0 = top, 100 = bottom)
                offset_pct = crop_position['top_offset']
                max_offset = new_height - TARGET_HEIGHT
                top = int((offset_pct / 100) * max_offset)
            else:
                # Default center
                top = (new_height - TARGET_HEIGHT) // 2

            img_final = img_resized.crop((0, top, TARGET_WIDTH, top + TARGET_HEIGHT))
            print(f"   Vertical crop: top={top}px (out of {new_height}px height)")

        # Save
        img_final.save(output_path, 'PNG', optimize=True)
        size_kb = os.path.getsize(output_path) / 1024

        print(f"   → {output_filename}")
        print(f"   ✅ Saved: {size_kb:.2f} KB")

        return True

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    print('🎨 Custom Crop Fix for Specific Screenshots\n')
    print('=' * 70)

    # Fix #1: In-context view - shift LEFT to show CanvasFlow icon
    custom_crop_screenshot(
        'Screenshot 2025-11-17 at 8.10.03 PM.png',
        'screenshot-4-in-context-v3.png',
        {'left_offset': 0},  # Far left to show the Canvas sidebar with icon
        'In-Context - Shows CanvasFlow icon in Canvas sidebar'
    )

    # Fix #2: Claude Desktop - shift UP to show full initial prompt
    custom_crop_screenshot(
        'Screenshot 2025-11-17 at 8.33.48 PM.png',
        'screenshot-6-claude-desktop-v3.png',
        {'top_offset': 0},  # Top to show full conversation including prompt
        'Claude Desktop - Shows complete conversation from start'
    )

    print('\n' + '=' * 70)
    print('\n✨ Fixed crops created!')
    print('\n📋 New files:')
    print('   - screenshot-4-in-context-v3.png (shows Canvas icon)')
    print('   - screenshot-6-claude-desktop-v3.png (shows full prompt)')
    print('\nThese replace the v2 versions for better context.\n')

if __name__ == '__main__':
    main()
