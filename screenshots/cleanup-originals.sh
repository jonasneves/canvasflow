#!/bin/bash

echo "🗑️  Cleaning up original screenshots..."
echo ""
echo "This will delete the original, unsized screenshots and keep only the"
echo "Chrome Web Store-ready versions (screenshot-1 through screenshot-5)."
echo ""
echo "Files to delete:"
ls -lh "Screenshot"*.png 2>/dev/null | awk '{print "  - " $9 " (" $5 ")"}'
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    rm "Screenshot"*.png
    echo "✅ Original screenshots deleted!"
    echo ""
    echo "Remaining files:"
    ls -lh screenshot-*.png | awk '{print "  ✓ " $9 " (" $5 ")"}'
    echo ""
    echo "📁 Ready to upload to Chrome Web Store!"
else
    echo "❌ Cancelled. No files deleted."
fi
