import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);

export function encryptCredentials(appId, appSecret) {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
        
        const encryptedAppId = cipher.update(appId, 'utf8', 'hex') + cipher.final('hex');
        const encryptedSecret = cipher.update(appSecret, 'utf8', 'hex') + cipher.final('hex');
        
        return {
            appId: encryptedAppId,
            appSecret: encryptedSecret,
            iv: iv.toString('hex')
        };
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Failed to encrypt credentials');
    }
}

export function decryptCredentials(encryptedAppId, encryptedSecret, iv) {
    try {
        const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
        
        const appId = decipher.update(encryptedAppId, 'hex', 'utf8') + decipher.final('utf8');
        const appSecret = decipher.update(encryptedSecret, 'hex', 'utf8') + decipher.final('utf8');
        
        return { appId, appSecret };
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt credentials');
    }
}

export function hashPassword(password) {
    return crypto.pbkdf2Sync(password, 'salt', 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password, hash) {
    const hashVerify = crypto.pbkdf2Sync(password, 'salt', 10000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
}