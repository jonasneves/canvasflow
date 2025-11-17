// Initialize Lucide icons after DOM is loaded
function initializeLucide() {
  if (typeof lucide !== 'undefined') {
    console.log('Initializing Lucide icons...');
    console.log('Available lucide methods:', Object.keys(lucide));

    try {
      // createIcons() doesn't work in this build, use manual creation
      console.log('Using manual icon creation');

      // Manual icon creation using individual icon functions
      const iconElements = document.querySelectorAll('[data-lucide]');
      iconElements.forEach(el => {
        const iconName = el.getAttribute('data-lucide');
        // Convert kebab-case to PascalCase (e.g., refresh-cw -> RefreshCw)
        const pascalName = iconName.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');

        console.log(`Trying to create icon: ${iconName} (${pascalName})`);

        if (lucide[pascalName]) {
          // Icon is an array of [tagName, attributes] elements
          const iconData = lucide[pascalName];

          if (Array.isArray(iconData)) {
            // Build SVG from the icon data array
            let paths = '';
            iconData.forEach(([tag, attrs]) => {
              if (tag === 'path' || tag === 'circle' || tag === 'line' || tag === 'polyline' || tag === 'polygon' || tag === 'rect') {
                const attrStr = Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(' ');
                paths += `<${tag} ${attrStr}/>`;
              }
            });

            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
            el.innerHTML = svg;
            console.log(`Created icon: ${iconName}`);
          } else {
            console.error(`Icon ${pascalName} is not an array`);
          }
        } else {
          console.error(`Icon ${pascalName} not found in lucide`);
        }
      });

      console.log('Lucide icons initialized successfully');

      // Check if icons were actually created
      console.log(`Found ${iconElements.length} icon elements`);
      iconElements.forEach(el => {
        console.log(`Icon: ${el.getAttribute('data-lucide')}, has SVG: ${el.querySelector('svg') !== null}`);
      });
    } catch (error) {
      console.error('Error initializing Lucide:', error);
    }
  } else {
    console.error('Lucide library not loaded');
  }
}

// Try multiple initialization strategies
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLucide);
} else {
  // DOM already loaded
  initializeLucide();
}

// Also try after a short delay as backup
setTimeout(initializeLucide, 100);
