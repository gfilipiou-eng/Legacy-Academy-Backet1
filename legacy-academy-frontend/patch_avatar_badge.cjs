const fs = require('fs');
let code = fs.readFileSync('src/components/VerifiedBadge.jsx', 'utf8');

const exportAddition = `
export const AvatarFounderBadge = ({ className }) => {
    return <VerifiedBadge isFounder={true} className={className} />;
};
`;

code = code.replace('export default VerifiedBadge;', exportAddition + 'export default VerifiedBadge;');
fs.writeFileSync('src/components/VerifiedBadge.jsx', code);
