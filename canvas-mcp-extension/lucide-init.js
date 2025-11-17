// Initialize Lucide icons
function initializeLucide() {
  if (typeof lucide === 'undefined') return;

  try {
    const iconElements = document.querySelectorAll('[data-lucide]');

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

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
        el.innerHTML = svg;
      }
    });
  } catch (error) {
    console.error('Error initializing Lucide icons:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLucide);
} else {
  initializeLucide();
}
