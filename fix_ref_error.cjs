const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// The regex I used earlier put a HUGE ternary block. We need to replace it.
// The problematic string looks like:
// getDescriptorAccentClass(author.profileDescriptor, author.profileDescriptor === author?.profileDescriptor ? author?.role : (author.profileDescriptor === publicUser?.profileDescriptor ? publicUser?.role : (author.profileDescriptor === shareModalPost?.author?.profileDescriptor ? shareModalPost?.author?.role : undefined))).replace(/rounded-none/g, "")

// I will use regex to find all getDescriptorAccentClass calls and clean them up.
appContent = appContent.replace(/getDescriptorAccentClass\(author\.profileDescriptor,[^\)]+\)\.replace\(\/rounded-none\/g, ""\)/g, 'getDescriptorAccentClass(author.profileDescriptor, author?.role).replace(/rounded-none/g, "")');

appContent = appContent.replace(/getDescriptorAccentClass\(publicUser\.profileDescriptor,[^\)]+\)\.replace\(\/rounded-none\/g, ""\)/g, 'getDescriptorAccentClass(publicUser.profileDescriptor, publicUser?.role).replace(/rounded-none/g, "")');

appContent = appContent.replace(/getDescriptorAccentClass\(shareModalPost\.author\.profileDescriptor,[^\)]+\)\.replace\(\/rounded-none\/g, ""\)/g, 'getDescriptorAccentClass(shareModalPost.author.profileDescriptor, shareModalPost.author?.role).replace(/rounded-none/g, "")');

fs.writeFileSync(appPath, appContent);
console.log('Fixed App.jsx ReferenceErrors');

// Now index.css: Make it "live gold" without glow
const cssPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

const newFounderCss = `
.descriptor-founder-entrepreneur {
  color: #fbbf24 !important;
  background-color: transparent !important;
  border: 1px solid #fbbf24 !important;
  box-shadow: none !important;
  text-shadow: none !important;
  font-weight: 800 !important;
  transition: all 0.2s ease-in-out !important;
}

@media (hover: hover) {
  .descriptor-founder-entrepreneur:hover {
    background-color: rgba(251, 191, 36, 0.1) !important;
    border-color: #f59e0b !important;
    transform: translateY(-1px) scale(1.02);
  }
}
`;

// Replace the old block
cssContent = cssContent.replace(/\.descriptor-founder-entrepreneur \{[\s\S]*?\}\s*\}\s*/, newFounderCss);
fs.writeFileSync(cssPath, cssContent);
console.log('Fixed index.css');
