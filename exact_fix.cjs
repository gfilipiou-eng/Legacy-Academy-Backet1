const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

const t1 = 'getDescriptorAccentClass(author.profileDescriptor, author.profileDescriptor === author?.profileDescriptor ? author?.role : (author.profileDescriptor === publicUser?.profileDescriptor ? publicUser?.role : (author.profileDescriptor === shareModalPost?.author?.profileDescriptor ? shareModalPost?.author?.role : undefined))).replace(/rounded-none/g, "")';
const r1 = 'getDescriptorAccentClass(author.profileDescriptor, author?.role).replace(/rounded-none/g, "")';

const t2 = 'getDescriptorAccentClass(publicUser.profileDescriptor, publicUser.profileDescriptor === author?.profileDescriptor ? author?.role : (publicUser.profileDescriptor === publicUser?.profileDescriptor ? publicUser?.role : (publicUser.profileDescriptor === shareModalPost?.author?.profileDescriptor ? shareModalPost?.author?.role : undefined))).replace(/rounded-none/g, "")';
const r2 = 'getDescriptorAccentClass(publicUser.profileDescriptor, publicUser?.role).replace(/rounded-none/g, "")';

const t3 = 'getDescriptorAccentClass(shareModalPost.author.profileDescriptor, shareModalPost.author.profileDescriptor === author?.profileDescriptor ? author?.role : (shareModalPost.author.profileDescriptor === publicUser?.profileDescriptor ? publicUser?.role : (shareModalPost.author.profileDescriptor === shareModalPost?.author?.profileDescriptor ? shareModalPost?.author?.role : undefined))).replace(/rounded-none/g, "")';
const r3 = 'getDescriptorAccentClass(shareModalPost.author.profileDescriptor, shareModalPost.author?.role).replace(/rounded-none/g, "")';

appContent = appContent.replace(t1, r1);
appContent = appContent.replace(t2, r2);
appContent = appContent.replace(t3, r3);

fs.writeFileSync(appPath, appContent);
console.log('App.jsx fixed successfully!');
