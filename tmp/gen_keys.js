
const SECRET_SALT = 'WACHAMONOS-AGRADECIDO1234';

const createHash = (str) => {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; 
    }
    return Math.abs(hash);
};

const generateVitalicia = (businessName) => {
    const cleanName = businessName.trim().toUpperCase();
    const type = 'vitalicia';
    const expiresAt = undefined;
    const dataString = `${cleanName}|${type}|${expiresAt || 'PERM'}|${SECRET_SALT}`;
    const hashSignature = createHash(dataString).toString(16).toUpperCase();
    const key = `PP-VIT-${hashSignature}`;
    return key;
};

console.log("Key for 'MIRI MONTERO JOYERIA':", generateVitalicia('MIRI MONTERO JOYERIA'));
console.log("Key for 'MIRI MONTERO JOYERÍA':", generateVitalicia('MIRI MONTERO JOYERÍA'));
console.log("Key for 'ANDRES MONTERO JOYERIA':", generateVitalicia('ANDRES MONTERO JOYERIA'));
