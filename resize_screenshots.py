#!/usr/bin/env python3
import os
from PIL import Image
import glob

# Target dimensions for Chrome Web Store
TARGET_WIDTH = 1280
TARGET_HEIGHT = 800

# Screenshots to process with their new names
screenshots = [
    {
        'pattern': '*8.02.08 PM.png',
        'output': 'screenshot-1-dashboard.png',
        'description': 'Dashboard View - Assignment tracking with summary cards'
    },
    {
        'pattern': '*8.02.20 PM.png',
        'output': 'screenshot-2-ai-insights.png',
        'description': 'AI Insights - Workload analysis and study tips'
    },
    {
        'pattern': '*8.01.40 PM.png',
        'output': 'screenshot-3-weekly-schedule.png',
        'description': 'Weekly Schedule - AI-generated study plan'
    },
    {
        'pattern': '*8.10.03 PM.png',
        'output': 'screenshot-4-in-context.png',
        'description': 'In-Context View - CanvasFlow working alongside Canvas'
    },
    {
        'pattern': '*8.02.49 PM.png',
        'output': 'screenshot-5-mcp-server.png',
        'description': 'Claude Desktop Integration - Chat with your Canvas data'
    }
]

def resize_screenshot(input_path, output_path, description):
    try:
        # Open image
        img = Image.open(input_path)
        original_width, original_height = img.size

        print(f"\n📸 {os.path.basename(input_path)}")
        print(f"   Original: {original_width}x{original_height}")
        print(f"   → {os.path.basename(output_path)} (1280x800)")
        print(f"   Description: {description}")

        # Calculate aspect ratios
        target_ratio = TARGET_WIDTH / TARGET_HEIGHT
        original_ratio = original_width / original_height

        # Resize with cover fit (crop to fill)
        if original_ratio > target_ratio:
            # Image is wider - crop width
            new_height = TARGET_HEIGHT
            new_width = int(original_width * (TARGET_HEIGHT / original_height))
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            # Crop to target width (center)
            left = (new_width - TARGET_WIDTH) // 2
            img = img.crop((left, 0, left + TARGET_WIDTH, TARGET_HEIGHT))
        else:
            # Image is taller - crop height
            new_width = TARGET_WIDTH
            new_height = int(original_height * (TARGET_WIDTH / original_width))
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            # Crop to target height (center)
            top = (new_height - TARGET_HEIGHT) // 2
            img = img.crop((0, top, TARGET_WIDTH, top + TARGET_HEIGHT))

        # Save optimized PNG
        img.save(output_path, 'PNG', optimize=True, compress_level=9)

        size_kb = os.path.getsize(output_path) / 1024
        print(f"   ✅ Saved: {size_kb:.2f} KB")

        return True
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    screenshots_dir = '/home/user/canvasflow/screenshots'

    print('🎨 Resizing screenshots for Chrome Web Store...\n')
    print(f'Target dimensions: {TARGET_WIDTH}x{TARGET_HEIGHT}\n')
    print('=' * 60)

    success_count = 0

    for screenshot in screenshots:
        # Find the file matching the pattern
        pattern = os.path.join(screenshots_dir, screenshot['pattern'])
        matches = glob.glob(pattern)

        if not matches:
            print(f"\n❌ No file found matching: {screenshot['pattern']}")
            continue

        input_path = matches[0]
        output_path = os.path.join(screenshots_dir, screenshot['output'])

        if resize_screenshot(input_path, output_path, screenshot['description']):
            success_count += 1

    print('\n' + '=' * 60)
    print(f'\n✨ Successfully resized {success_count}/{len(screenshots)} screenshots!')
    print('\nNext steps:')
    print('1. Review the resized screenshots in the screenshots/ folder')
    print('2. Delete the original screenshots if satisfied')
    print('3. Upload to Chrome Web Store Developer Dashboard')
    print('4. Add screenshot descriptions in the store listing\n')

if __name__ == '__main__':
    main()
