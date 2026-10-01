import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Credit Copilot Lite API",
            version: "1.0.0",
            description:
                "Grounded RAG assistant for personal loan underwriting (synthetic data)",
        },
        servers: [{ url: "http://localhost:3000" }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/api/routes/*.ts"], // JSDoc comments in route files
};

export const swaggerSpec = swaggerJsdoc(options);
