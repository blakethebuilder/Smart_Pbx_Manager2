import Joi from 'joi';

export const pbxSchema = Joi.object({
    name: Joi.string().min(1).max(100).trim().required(),
    url: Joi.string().uri({ scheme: ['https'] }).required(),
    appId: Joi.string().min(10).max(100).alphanum().required(),
    appSecret: Joi.string().min(10).max(200).required(),
    isShared: Joi.boolean().default(false)
});

export const loginSchema = Joi.object({
    password: Joi.string().min(1).required()
});

export const bulkImportSchema = Joi.object({
    instances: Joi.array().items(pbxSchema).min(1).max(100).required()
});

export function validateRequest(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);
        
        if (error) {
            console.log('❌ Validation error:', error.details[0].message);
            return res.status(400).json({ 
                error: 'Invalid input', 
                details: error.details[0].message 
            });
        }
        
        req.body = value; // Use sanitized values
        next();
    };
}

export function sanitizeOutput(pbx) {
    return {
        id: pbx.id,
        name: pbx.name,
        url: pbx.url,
        isShared: pbx.isShared,
        status: pbx.status,
        lastCheck: pbx.lastCheck,
        createdAt: pbx.createdAt,
        health: pbx.health
        // Never expose appId or appSecret
    };
}