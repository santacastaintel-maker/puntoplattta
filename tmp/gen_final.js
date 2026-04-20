const SECRET_SALT = 'WACHAMONOS-AGRADECIDO1234';
const businessName = 'LUISTEST';
const type = 'mensual';
const timestamp = 1776057078000;
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
const hashVal = createHash(dataString);
const hashSignature = hashVal.toString(16).toUpperCase();
const expiresBase36 = expiresAt.toString(36).toUpperCase();
const key = `PP-MES-${hashSignature}-${expiresBase36}`;
process.stdout.write(key + '\n');
