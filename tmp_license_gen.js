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

const generateKey = (businessName, type) => {
    const cleanName = businessName.trim().toUpperCase();
    const expiresAt = undefined;
    const dataString = `${cleanName}|${type}|${expiresAt || 'PERM'}|${SECRET_SALT}`;
    const hashSignature = createHash(dataString).toString(16).toUpperCase();
    return `PP-${type === 'vitalicia' ? 'VIT' : 'MES'}-${hashSignature}`;
};

console.log("Nombre: JOYERIA PRISCA 925");
console.log("Key: " + generateKey("JOYERIA PRISCA 925", "vitalicia"));
