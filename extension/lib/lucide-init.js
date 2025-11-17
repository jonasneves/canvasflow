// Initialize Lucide icons
function initializeLucide(container = document) {
  if (typeof lucide === 'undefined') return;

  try {
    // Ensure container is a valid element or document
    if (!container || typeof container.querySelectorAll !== 'function') {
      container = document;
    }

    const iconElements = container.querySelectorAll('[data-lucide]:not([data-lucide-processed])');

    iconElements.forEach(el => {
      const iconName = el.getAttribute('data-lucide');

      // Convert kebab-case to PascalCase (e.g., refresh-cw -> RefreshCw)
      const pascalName = iconName.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');

      const iconData = lucide[pascalName];

      if (Array.isArray(iconData)) {
        // Build SVG from icon data array
        const paths = iconData.map(([tag, attrs]) => {
          const attrStr = Object.entries(attrs)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ');
          return `<${tag} ${attrStr}/>`;
        }).join('');

        // Use custom width/height from element style if provided, otherwise default to 20x20
        const width = el.style.width || '20px';
        const height = el.style.height || '20px';

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
        el.innerHTML = svg;

        // Mark as processed to avoid re-processing
        el.setAttribute('data-lucide-processed', 'true');
      }
    });
  } catch (error) {
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLucide);
} else {
  initializeLucide();
}
