module.exports = {
    components: {
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'user full name' },
                    fullNames: { type: 'string', description: 'user full name' },
                    email: { type: 'string', description: 'user email address' },
                    status: { type: 'string', description: 'account password' },
                    role: { type: 'string', description: 'account role' },
                    createdAt: { type: 'string', description: 'user full name' }
                },
            },
            RegisterUserInput: {
                type: 'object',
                properties: {
                    fullNames: { type:'string', description: 'user full name', default: '' },
                    email: { type: 'string', description: 'user email address', default: '' },
                    password: { type: 'string', description: 'account password', default: '' },
                    role: { type: 'string', description: 'account role', default: '' }
                },
                required: ['fullNames', 'email', 'password', 'role'],
            },
            RegisterUserResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string',}
                },
            },
            LoginUserInput: {
                type: 'object',
                properties: {
                    email: { type: 'string', description: 'user email address' },
                    password: { type: 'string', description: 'account password' },
                },
                required: ['email', 'password'],
            },
            LoginUserResponse: {
                type: 'object',
                properties: {
                    token: { type: 'string' },
                    message: { type: 'string' },
                    user: {
                        $ref: '#/components/schemas/User',
                    },
                },
            },
            RequestNewPassword: {
                type: 'object',
                properties: {
                    email: { type: 'string', description: 'user email address' },
                },
                required: ['email'],
            },
            SuccessResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', }
                },
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', default: false },
                    message: { type: 'string', }
                },
            }
        },
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        }
    },
};