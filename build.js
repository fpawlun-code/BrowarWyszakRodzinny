const fs = require('fs');
const path = require('path');

// Config
const TEMPLATES_DIR = 'src/templates';
const ROOT_DIR = '.';

// Language mappings
const langMap = {
  'index.html': 'pl',
  'menu.html': 'pl',
  'kontakt.html': 'pl',
  'piwa-rzemieslnicze.html': 'pl',
  'imprezy-firmowe.html': 'pl',
  'en-home.html': 'en',
  'en-menu.html': 'en',
  'en-kontakt.html': 'en',
  'en-piwa-rzemieslnicze.html': 'en',
  'en-imprezy-firmowe.html': 'en',
  'de-home.html': 'de',
  'de-menu.html': 'de',
  'de-kontakt.html': 'de',
  'de-piwa-rzemieslnicze.html': 'de',
  'de-imprezy-firmowe.html': 'de'
};

// Load templates
function loadTemplates() {
  const templates = {};
  ['pl', 'en', 'de'].forEach(lang => {
    templates[lang] = {
      header: fs.readFileSync(path.join(TEMPLATES_DIR, `header-${lang}.html`), 'utf8'),
      footer: fs.readFileSync(path.join(TEMPLATES_DIR, `footer-${lang}.html`), 'utf8')
    };
  });
  return templates;
}

// Extract content between header and footer
function extractContent(html) {
  // Find where mobile-nav ends
  const mobileNavEnd = html.indexOf('</div>\n</div>');

  // Find where footer starts
  const footerStart = html.indexOf('<footer class="site-footer">');

  if (mobileNavEnd === -1 || footerStart === -1) {
    // Fallback: try to find just the mobile-nav closing
    const altMarker = '</div>\n\n<!-- ===== HERO';
    const altEnd = html.indexOf(altMarker);
    if (altEnd !== -1 && footerStart !== -1) {
      return html.substring(altEnd + 7, footerStart); // +7 to skip </div>\n\n
    }

    console.warn('⚠️  Could not find header/footer markers');
    return html;
  }

  // Skip to next line after mobile-nav
  let contentStart = mobileNavEnd + 13; // length of '</div>\n</div>'

  // Skip empty lines
  while (contentStart < html.length && (html[contentStart] === '\n' || html[contentStart] === '\r')) {
    contentStart++;
  }

  // Extract content between mobile-nav and footer
  const content = html.substring(contentStart, footerStart);
  return content;
}

// Extract head section (before <body>)
function extractHead(html) {
  const bodyStart = html.indexOf('<body>');
  if (bodyStart === -1) return '';
  return html.substring(0, bodyStart + 6); // Include <body> tag
}

// Extract scripts section (after </footer>)
function extractScripts(html) {
  const footerEnd = html.indexOf('</footer>');
  if (footerEnd === -1) return '';
  return html.substring(footerEnd + 9); // After </footer>
}

// Build single page
function buildPage(filename, templates) {
  const lang = langMap[filename];
  if (!lang) {
    console.log(`⏭️  Skipping ${filename} (not in langMap)`);
    return;
  }

  const filePath = path.join(ROOT_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${filename} (file not found)`);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Replace header + mobile nav: from "<!-- ===== HEADER =====" to end of mobile-nav div
  // Look for the closing </div> that comes right before <!-- ===== HERO (or similar section marker)
  const headerRegex = /<!-- ===== HEADER ===== -->[\s\S]*?<\/div>\s*(?=\n<!-- ===== )/;
  html = html.replace(headerRegex, templates[lang].header);

  // Replace footer: from "<footer" to "</footer>"
  const footerRegex = /<footer class="site-footer">[\s\S]*?<\/footer>/;
  html = html.replace(footerRegex, templates[lang].footer);

  // Write back
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ Built ${filename}`);
}

// Main
function main() {
  console.log('🔨 Building HTML files...\n');

  const templates = loadTemplates();
  console.log('📦 Loaded templates for PL, EN, DE\n');

  Object.keys(langMap).forEach(filename => {
    buildPage(filename, templates);
  });

  console.log('\n✨ Build complete!\n');
}

main();
