const createHash = (str) => {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

const SECRET_SALT = 'WACHAMONOS-AGRADECIDO1234';
const businessName = 'PRISCA925';
const type = 'vitalicia';
const expiresAt = undefined;

const dataString = `${businessName}|${type}|${expiresAt || 'PERM'}|${SECRET_SALT}`;
const hashSignature = createHash(dataString).toString(16).toUpperCase();
const key = `PP-VIT-${hashSignature}`;

console.log('BUSINESS:', businessName);
console.log('KEY:', key);
