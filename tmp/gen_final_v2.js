const createHash = (str) => {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }
    return Math.abs(hash);
};

const businessName = 'LUISTEST';
const type = 'mensual';
const salt = 'WACHAMONOS-AGRADECIDO1234';

// 7 días desde hoy (20 de abril 2026) -> Aprox May 1st 2026 for safety
const expiresAt = 1777248000000; 

const cleanName = businessName.trim().toUpperCase();
const dataString = `${cleanName}|${type}|${expiresAt}|${salt}`;
const hashVal = createHash(dataString);
const hashSignature = hashVal.toString(16).toUpperCase();
const expiresBase36 = expiresAt.toString(36).toUpperCase();

const key = `PP-MES-${hashSignature}-${expiresBase36}`;
console.log('BUSINESS_NAME:', cleanName);
console.log('LICENSE_KEY:', key);
