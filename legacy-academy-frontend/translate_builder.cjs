const fs = require('fs');

const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteBuilder.jsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/>Business Name<\/label>/g, ">{t('wb_businessName', 'Business Name')}</label>");
code = code.replace(/>Slogan<\/label>/g, ">{t('wb_slogan', 'Slogan')}</label>");
code = code.replace(/>Description<\/label>/g, ">{t('wb_description', 'Description')}</label>");
code = code.replace(/>Logo \(Optional\)<\/label>/g, ">{t('wb_logo', 'Logo (Optional)')}</label>");
code = code.replace(/>Cover Image<\/label>/g, ">{t('wb_coverImage', 'Cover Image')}</label>");
code = code.replace(/>Color Palette<\/label>/g, ">{t('wb_colorPalette', 'Color Palette')}</label>");
code = code.replace(/>Typography<\/label>/g, ">{t('wb_typography', 'Typography')}</label>");
code = code.replace(/>Call to Action Button<\/label>/g, ">{t('wb_ctaButton', 'Call to Action Button')}</label>");
code = code.replace(/>Button Text<\/label>/g, ">{t('wb_buttonText', 'Button Text')}</label>");
code = code.replace(/>Button Link<\/label>/g, ">{t('wb_buttonLink', 'Button Link')}</label>");
code = code.replace(/>Navigation Links<\/label>/g, ">{t('wb_navLinks', 'Navigation Links')}</label>");
code = code.replace(/>Link 1<\/label>/g, ">{t('wb_link1', 'Link 1')}</label>");
code = code.replace(/>Link 2<\/label>/g, ">{t('wb_link2', 'Link 2')}</label>");
code = code.replace(/>Link 3<\/label>/g, ">{t('wb_link3', 'Link 3')}</label>");
code = code.replace(/>Features Title<\/label>/g, ">{t('wb_featuresTitle', 'Features Title')}</label>");
code = code.replace(/>Feature 1<\/label>/g, ">{t('wb_feature1', 'Feature 1')}</label>");
code = code.replace(/>Feature 2<\/label>/g, ">{t('wb_feature2', 'Feature 2')}</label>");
code = code.replace(/>Feature 3<\/label>/g, ">{t('wb_feature3', 'Feature 3')}</label>");
code = code.replace(/>About Text<\/label>/g, ">{t('wb_aboutText', 'About Text')}</label>");
code = code.replace(/>Contact Email<\/label>/g, ">{t('wb_contactEmail', 'Contact Email')}</label>");
code = code.replace(/>Contact Phone<\/label>/g, ">{t('wb_contactPhone', 'Contact Phone')}</label>");
code = code.replace(/>X \(Twitter\) Link<\/label>/g, ">{t('wb_socialX', 'X (Twitter) Link')}</label>");
code = code.replace(/>Instagram Link<\/label>/g, ">{t('wb_socialInsta', 'Instagram Link')}</label>");
code = code.replace(/>LinkedIn Link<\/label>/g, ">{t('wb_socialLinkedin', 'LinkedIn Link')}</label>");

code = code.replace(/placeholder="e\.g\. Acme Corp"/g, "placeholder={t('wb_ph_acme', 'e.g. Acme Corp')}");
code = code.replace(/placeholder="Building the future"/g, "placeholder={t('wb_ph_slogan', 'Building the future')}");
code = code.replace(/placeholder="We provide premium services..."/g, "placeholder={t('wb_ph_desc', 'We provide premium services...')}");
code = code.replace(/placeholder="Get in Touch"/g, "placeholder={t('wb_ph_getInTouch', 'Get in Touch')}");
code = code.replace(/placeholder="Title"/g, "placeholder={t('wb_ph_title', 'Title')}");
code = code.replace(/placeholder="Description"/g, "placeholder={t('wb_ph_description', 'Description')}");

code = code.replace(/<label className=\"text-\[10px\] font-bold text-gray-500 uppercase tracking-widest mb-1\"/g, '<label className=\"text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 break-words hyphens-auto whitespace-normal\"');

fs.writeFileSync(path, code, 'utf8');
console.log('Translated WebsiteBuilder UI');
