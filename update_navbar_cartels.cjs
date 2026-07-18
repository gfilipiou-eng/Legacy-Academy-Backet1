const fs = require('fs');
const path = require('path');

const navbarPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'BottomNavbar.jsx');
let navbarContent = fs.readFileSync(navbarPath, 'utf8');

const cartelTab = `
                {/* Tab: Cartels */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onTabChange('cartels'); }}
                    aria-label="Cartels"
                    className="flex items-center justify-center flex-1 min-w-0 group active:scale-95 transition-transform duration-200"
                >
                    <div className={navItemClass(activeTab === 'cartels')}>
                        {activeTab === 'cartels' && (
                            <div className="absolute inset-0 bottom-nav-item-active pointer-events-none animate-in fade-in duration-300" />
                        )}
                        <Icons.Users className={iconClass(activeTab === 'cartels')} fill={activeTab === 'cartels' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'cartels' ? '2.5' : '2'} shapeRendering="geometricPrecision" />
                    </div>
                </button>
`;

if (!navbarContent.includes("onTabChange('cartels')")) {
    navbarContent = navbarContent.replace(
        `{/* Tab: Search */}`,
        `${cartelTab}\n                {/* Tab: Search */}`
    );
    
    // Also update the tabs array for swipe logic
    navbarContent = navbarContent.replace(
        "const tabs = ['home', 'search', 'alerts', 'profile'];",
        "const tabs = ['home', 'cartels', 'search', 'alerts', 'profile'];"
    );

    fs.writeFileSync(navbarPath, navbarContent);
    console.log('BottomNavbar.jsx updated with Cartels tab');
}
