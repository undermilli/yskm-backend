const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LOLHUB Backend API",
      version: "1.0",
      description: "The LOLHUB Backend API Documentation",
    },
    tags: [
      {
        name: "Server",
      },
      {
        name: "Auth",
      },
      {
        name: "User",
      },
    ],
    paths: {
      "/": {
        get: {
          summary: "Get a greeting",
          description: "Endpoint to get a greeting",
          tags: ["Server"],
          responses: {
            200: {
              description: "Ok",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
      "/api/auth/signup": {
        post: {
          summary: "Username and Password required",
          description: "For signup enter username and password",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    username: {
                      type: "string",
                    },
                    password: {
                      type: "string",
                    },
                  },
                  required: ["username", "password"],
                },
              },
            },
          },
          responses: {
            201: {
              description: "Created",
            },
            422: {
              description: "Username or Password invalid format",
            },
            409: {
              description: "Already exists",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
      "/api/auth/login": {
        post: {
          summary: "Username and Password required",
          description: "For login enter username and password",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    username: {
                      type: "string",
                    },
                    password: {
                      type: "string",
                    },
                  },
                  required: ["username", "password"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Logged in",
            },
            422: {
              description: "Username or Password invalid format",
            },
            401: {
              description: "Username or Password not matched",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
      "/api/auth/refresh-token": {
        post: {
          summary: "Get new accessToken",
          description: "Pass refreshToken and get new accessToken",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    refreshToken: {
                      type: "string",
                    },
                  },
                  required: ["refreshToken"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Ok",
            },
            401: {
              description: "Invalid token",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
      "/api/user": {
        get: {
          security: [
            {
              bearerAuth: [],
            },
          ],
          summary: "Get user",
          description: "Retrieve user details",
          tags: ["User"],
          responses: {
            200: {
              description: "Get user",
            },
            401: {
              description: "Invalid token",
            },
            404: {
              description: "Not found",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
        put: {
          security: [
            {
              bearerAuth: [],
            },
          ],
          summary: "email and description",
          description:
            "Provide email empty string or formatted and also provide description empty string or any string value",
          tags: ["User"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: {
                      type: "string",
                    },
                    description: {
                      type: "string",
                    },
                  },
                  required: ["email", "description"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "User updated",
            },
            422: {
              description: "email or description invalid format",
            },
            401: {
              description: "User not found",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
      "/api/user/change-password": {
        put: {
          security: [
            {
              bearerAuth: [],
            },
          ],
          summary: "Change old password",
          description: "Provide old password and new password",
          tags: ["User"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    oldPassword: {
                      type: "string",
                    },
                    newPassword: {
                      type: "string",
                    },
                  },
                  required: ["oldPassword", "newPassword"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Password updated",
            },
            422: {
              description: "invalid format",
            },
            404: {
              description: "Old password invalid",
            },
            401: {
              description: "User not found",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
      "/api/user/update-score": {
        get: {
          security: [
            {
              bearerAuth: [],
            },
          ],
          summary: "Get updated score",
          description: "Get updated score after 24 hrs",
          tags: ["User"],
          responses: {
            200: {
              description: "Score updated",
            },
            401: {
              description: "Invalid token",
            },
            400: {
              description: "Already got today score",
            },
            500: {
              description: "Internal server error",
            },
          },
        },
      },
    },
    components: {
      schemas: {
        User: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: {
              type: "string",
              minLength: 2,
              maxLength: 15,
              pattern: "^[a-z0-9]+$",
            },
            password: {
              type: "string",
              minLength: 60,
              maxLength: 60,
            },
            userNumber: {
              type: "number",
              unique: true,
            },
            score: {
              type: "number",
              default: 0,
            },
            description: {
              type: "string",
              default: "",
            },
            email: {
              type: "string",
              default: "",
            },
            lastVisited: {
              type: "string",
              format: "date-time",
              default: "current date and time",
            },
            refreshTokens: {
              type: "array",
              items: {
                type: "object",
                required: ["token", "expiresIn"],
                properties: {
                  token: {
                    type: "string",
                  },
                  expiresIn: {
                    type: "string",
                    format: "date-time",
                  },
                },
              },
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
