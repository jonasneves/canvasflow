#!/usr/bin/env python3
"""
Smart screenshot resizer with better cropping strategies
Gives you control over crop position and method
"""
import os
from PIL import Image

TARGET_WIDTH = 1280
TARGET_HEIGHT = 800
base_dir = '/home/user/canvasflow/screenshots'

# Screenshot configurations with smart crop strategies
screenshots = [
    {
        'input': 'Screenshot 2025-11-17 at 8.02.08 PM.png',
        'output': 'screenshot-1-dashboard-v2.png',
        'description': 'Dashboard View',
        'strategy': 'top',  # Keep top portion (where summary cards are)
        'notes': 'Focus on summary cards at top'
    },
    {
        'input': 'Screenshot 2025-11-17 at 8.02.20 PM.png',
        'output': 'screenshot-2-ai-insights-v2.png',
        'description': 'AI Insights',
        'strategy': 'top',  # Keep workload overview
        'notes': 'Focus on workload overview section'
    },
    {
        'input': 'Screenshot 2025-11-17 at 8.01.40 PM.png',
        'output': 'screenshot-3-weekly-schedule-v2.png',
        'description': 'Weekly Schedule',
        'strategy': 'top',  # Keep Monday/Tuesday sections
        'notes': 'Keep first 2 days visible'
    },
    {
        'input': 'Screenshot 2025-11-17 at 8.10.03 PM.png',
        'output': 'screenshot-4-in-context-v2.png',
        'description': 'In-Context View',
        'strategy': 'center',  # Keep both panels visible
        'notes': 'Show both Canvas and CanvasFlow'
    },
    {
        'input': 'Screenshot 2025-11-17 at 8.02.49 PM.png',
        'output': 'screenshot-5-mcp-server-v2.png',
        'description': 'MCP Server Tab',
        'strategy': 'top',  # Keep instructions visible
        'notes': 'Focus on setup instructions'
    },
    {
        'input': 'Screenshot 2025-11-17 at 8.33.48 PM.png',
        'output': 'screenshot-6-claude-desktop-v2.png',
        'description': 'Claude Desktop - MCP in Action',
        'strategy': 'center',  # Keep conversation visible
        'notes': 'Show actual MCP working!'
    },
]

def smart_resize(input_path, output_path, description, strategy, notes):
    """Resize with smart cropping based on strategy"""
    try:
        img = Image.open(input_path)
        w, h = img.size

        print(f"\n📸 {os.path.basename(input_path)}")
        print(f"   Original: {w}x{h}")
        print(f"   Strategy: {strategy}")
        print(f"   Notes: {notes}")

        target_ratio = TARGET_WIDTH / TARGET_HEIGHT  # 1.6
        current_ratio = w / h

        if current_ratio > target_ratio:
            # Image is wider - crop width
            new_height = TARGET_HEIGHT
            new_width = int(w * (TARGET_HEIGHT / h))
            img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Apply horizontal crop strategy
            if strategy == 'left':
                left = 0
            elif strategy == 'right':
                left = new_width - TARGET_WIDTH
            else:  # center
                left = (new_width - TARGET_WIDTH) // 2

            img_final = img_resized.crop((left, 0, left + TARGET_WIDTH, TARGET_HEIGHT))

        else:
            # Image is taller - crop height
            new_width = TARGET_WIDTH
            new_height = int(h * (TARGET_WIDTH / w))
            img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Apply vertical crop strategy
            if strategy == 'top':
                top = 0
            elif strategy == 'bottom':
                top = new_height - TARGET_HEIGHT
            else:  # center
                top = (new_height - TARGET_HEIGHT) // 2

            img_final = img_resized.crop((0, top, TARGET_WIDTH, top + TARGET_HEIGHT))

        # Save
        img_final.save(output_path, 'PNG', optimize=True)
        size_kb = os.path.getsize(output_path) / 1024

        print(f"   → {os.path.basename(output_path)}")
        print(f"   ✅ Saved: {size_kb:.2f} KB")

        return True

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    print('🎨 Smart Screenshot Resizer v2\n')
    print(f'Target: {TARGET_WIDTH}x{TARGET_HEIGHT}')
    print('Crop strategies: top (keep top), center (keep middle), bottom (keep bottom)\n')
    print('=' * 70)

    success = 0

    # Find files by pattern
    all_files = os.listdir(base_dir)

    for config in screenshots:
        pattern = config['input']

        # Find matching file - check for time pattern since filenames have special chars
        time_pattern = pattern.split(' at ')[1].replace(' PM.png', '').replace(' AM.png', '')
        matching = [f for f in all_files if time_pattern in f and f.endswith('.png')]

        if not matching:
            print(f"\n❌ File not found: {pattern}")
            continue

        input_path = os.path.join(base_dir, matching[0])
        output_path = os.path.join(base_dir, config['output'])

        if smart_resize(
            input_path,
            output_path,
            config['description'],
            config['strategy'],
            config['notes']
        ):
            success += 1

    print('\n' + '=' * 70)
    print(f'\n✨ Successfully created {success}/{len(screenshots)} screenshots!')
    print('\n📋 Files created with "-v2" suffix so you can compare:')
    print('   - Original crops: screenshot-1.png through screenshot-5.png')
    print('   - Smart crops: screenshot-1-v2.png through screenshot-6-v2.png')
    print('\n💡 Open screenshot-preview.html to compare all versions!\n')

if __name__ == '__main__':
    main()
