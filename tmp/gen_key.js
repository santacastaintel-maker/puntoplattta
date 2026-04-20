const SECRET_SALT = 'WACHAMONOS-AGRADECIDO1234';
const businessName = 'LUISTEST';
const type = 'mensual';
const timestamp = new Date('2026-04-12T21:11:18-06:00').getTime();
const expiresAt = timestamp + (7 * 24 * 60 * 60 * 1000);

const createHash = (str) => {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }
    return Math.abs(hash);
};

const cleanName = businessName.trim().toUpperCase();
const dataString = `${cleanName}|${type}|${expiresAt}|${SECRET_SALT}`;
const hashSignature = createHash(dataString).toString(16).toUpperCase();
const key = `PP-MES-${hashSignature}-${expiresAt.toString(36).toUpperCase()}`;

console.log('--- LICENCIA DE 7 DÍAS ---');
console.log('Usuario:', cleanName);
console.log('Expira:', new Date(expiresAt).toLocaleString());
console.log('Key:', key);
