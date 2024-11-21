# WellTrack AI API Documentation

## Overview
This is an AI-Powered BMI Calculation Mobile App, which provides users with tools to calculate and track their BMI, receive personalized health recommendations, and manage their health through various interactive features.<br/>This documentation focuses on the custom API services for the mobile app.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)

## Features
### Social Signup
- **Google Oauth Login**: Redirects the user to Google for OAuth Login.
- **Google OAuth Callback**: Handles the callback after Google OAuth Authentication.
- **Facebook OAuth Login**: Redirects the user to Facebook for OAuth Login.
- **Facebook OAuth Callback**: Handles the callback after Facebook OAuth Authentication.
- **Set password**: Allows a user to set a new password using a temporary password.

### Authentication
- **Verify Email**: Initiate email verification for user registration. Sends a verification code to the user's email. This endpoint requires the user's email, fullname, password and username.
- **Signup**: Sign up a new user. Create a new user account.
- **Login**: Log in a user. Authenticate a user and returns a token.
- **Refresh Token**: Refresh the authentication token. Refresh the user's token if it is about to expire.
- **Logout**: Logs out the user. Logs out the user and removes the authenticated tokens from Redis.
- **Request password reset**: Generate a password reset code and sends it to the user's email.

### Profile Management
- **Get user's profile information**: Retrieve the current user's profile data.
- **Update User profile**:
- **Delete user's profile and account**: Deletes the user's profile and account.

### BMI management
- **Calculate user's BMI**: Calculates the user's BMI based on input height and weight and unit for the calculation.
- **BMI History**: Retrieves a user's BMI history.

## Project Structure
This is the detailed structure of the files used in this directory in creating the WellTrack AI custom APIs.

```plaintext
BMI/backend/
    ├── config/
    │   ├── config.json
    │   ├── passport.js
    │   ├── redis.js
    │   ├── sequalize.js
    │   └── swagger.json
    ├── controllers/
    │   ├── authController.js
    │   ├── bmiController.js
    │   └── userController.js
    ├── middlewares/
    |   └── authMiddleware.js
    ├── migrations/
    |   ├── 20240906032228-create-users.js
    |   ├── 20240906064956-change-gender-to-string.js
    |   ├── 20240925225128-create-bmivalue-table.js
    |   ├── 20240925232330-create-bmi-table.js
    |   ├── 20240926141201-add-height-weight-to-bmivalue.js
    |   ├── 20241106045855-add_heightunit_weightunit_to_bmivalue.js
    |   ├── 20241114142120-add-social-login-columns-to-user.js
    |   └── 20241118112638-remove-height-weight-from-users.js
    ├── models/
    |   ├── User.js
    |   ├── bmiModel.js
    |   └── index.js
    ├── routes/
    |   └── routes.js
    ├── services/
    |   └── bmiService.js
    ├── tests/
    |   ├── calculateBMI.test.js
    |   ├── deleteProfile.test.js
    |   ├── endpoints.test.js
    |   ├── getBMI.test.js
    |   ├── logout.test.js
    |   ├── profile.test.js
    |   ├── putProfile.test.js
    |   └── reset.test.js
    ├── utils/
    |   ├── emailQueue.js
    |   └── emailQueue.js
    ├── views/
    |   └── index.ejs
    ├── .gitignore
    ├── README.md
    ├── app.js
    ├── package-lock.json
    ├── package.json
    └── run-migration.js
```

## API Documentation

The API documentation is available through the FastAPI auto-generated docs. Once the backend server is running, you can access the documentation at:

- Swagger UI: `http://localhost:3000/api-docs`<br/>

These endpoints provide detailed information about the API routes, request/response formats, and models.

- **Social Login Endpoints**

+ [x] `GET /auth/google`
- **Summary:** Google OAuth Login
- **Description:** Redirects the user to Google for OAuth login.
- **Headers:**
 - `Authorization: OAuth`
- **Redirection Response:**
```json
{
    "302": 
    {
        "description": "Redirect to Google authentication page."
    },
}
```
- **Error Responses:**
```json
{
    "500": 
    {
        "description": "Internal server error."
    }
}
```

+ [x] `GET /auth/google/callback`
- **Summary:** Google OAuth Callback
- **Description:** Handles the callback after Google OAuth authentication.
- **Headers:**
 - `Authorization: OAuth`
- **Response:**
```json
{
    "200": 
    {
        "description": "Successfully authenticated."
    },
}
```
- **Error Responses:**
```json
{
    "400":
    {
        "description": "Authentication failure."
    }
},
{
    "500": 
    {
        "description": "Internal server error."
    }
}
```

+ [x] `GET /auth/facebook`
- **Summary:** Facebook OAuth Login
- **Description:** Redirects the user to facebook for OAuth login.
- **Headers:**
 - `Authorization: OAuth`
- **Redirection Response:**
```json
{
    "302": 
    {
        "description": "Redirect to facebook authentication page."
    },
}
```
- **Error Responses:**
```json
{
    "500": 
    {
        "description": "Internal server error."
    }
}
```

+ [x] `GET /auth/facebook/callback`
- **Summary:** Facebook OAuth Callback
- **Description:** Handles the callback after Facebook OAuth authentication.
- **Headers:**
 - `Authorization: OAuth`
- **Response:**
```json
{
    "200": 
    {
        "description": "Successfully authenticated."
    },
}
```
- **Error Responses:**
```json
{
    "400":
    {
        "description": "Authentication failure."
    }
},
{
    "500": 
    {
        "description": "Internal server error."
    }
}
```

+ [x] `POST /set-password`
- **Summary:** Set password
- **Description:** Allows a user to set a new password using a temporary password.
- **Request Body:** 
```json
{
    "required": true,
    "content": 
    {
        "application/json": 
        {
            "schema": 
            {
                "type": "object",
                "properties": 
                {
                  "email": { "type": "string", "example": "user@example.com" },
                  "tempPassword": { "type": "string", "example": "TempPass123!" },
                  "password": { "type": "string", "example": "NewPassword123!"}
                },
                "required": ["userId", "tempPassword", "password"]
            }
        }
    }
},
```
- **Responses:**
```json
{
    "200": {
            "description": "Password successfully set."
        },
    "400": {
            "description": "Invalid inout or temporary password."
        },
    "404": {
            "description": "User not found."
        },
    "500": {
            "description": "Internal server error."
        }
}
```

- **Authentication Endpoints**

+ [x] `POST /verify-email`
- **Summary**: Initiate email verification for user registration
- **Description**: Sends a verification code to the user's email. This endpoint requires the user's email, fullname, password and username.
- **Request Body**:
```json
{
    "required": true,
    "content": {
        "application/json": {
            "schema": {
                "type": "object",
                "properties": {
                  "email": { "type": "string", "example": "user@example.com" },
                  "fullname": { "type": "string", "example": "John Doe" },
                  "password": { "type": "string", "example": "Password123!" },
                  "username": { "type": "string", "example": "Divine"}
                },
                "required": ["email", "fullname", "password", "username"]
            }
        }
    }
}
```
- **Responses:** 
```json
{
    "200": {
        "description": "Verification code sent to email successfully."
    },
    "400": {
        "description": "Invalid input or user already exists."
    },
    "500": {
        "description": "Internal server error."
    }
}
```

- [x] `POST /signup`
- **Summary:** Sign up a new user.
- **Description:** Create a new user account.
- **Request Body:** 
```json
{
    "required": true,
    "content": {
        "application/json": {
            "schema": {
                "type": "object",
                "properties": {
                  "email": { "type": "string", "example": "user@example.com" },
                  "verificationCode": { "type": "number", "example": "1234" },
                  "age": { "type": "integer", "example": 30 },
                  "gender": { "type": "string", "example": "male" },
                  "country": { "type": "string", "example": "USA" },
                  "preferredLanguage": { "type": "string", "example": "English" }
                },
                "required": ["email", "verificationCode"]
            }
        }
    }
}
```
- **Responses:** 
```json
{
    "201": { 
        "description": "User verified and signed up successfully." 
    },
    "400": { 
        "description": "Verification code expired, invalid, or missing fields." 
    },
    "500": { 
        "description": "Internal server error."
    }
}
```

- [x] `POST /login`
- **Summary:** Log in a user
- **Description:** Authenticate a user and return a token
- **Request Body:** 
```json
{
    "required": true,
    "content": {
        "application/json": {
            "schema": {
                "type": "object",
                "properties": {
                    "email": { "type": "string" },
                    "password": { "type": "string" }
                }
            }
        }
    }
}
```
- **Responses**: 
```json
{
    "200": {
        "description": "User logged in successfully.",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                        "token": { "type": "string", "description": "Authentication token." }
                    }
                }
            }
        }
    },
    "400": {
        "description": "Error logging in." 
    },
    "401": {
        "description": "Unauthorized." 
    }
}
```
- [x] `POST /refresh-token`
- **Summary:** Refresh the authentication token
- **Description:** "Refresh the user's token if it is about to expire.
- **Request Body:** 
```json
{
    "required": true,
    "content": {
        "application/json": {
            "schema": {
                "type": "object",
                "properties": {
                  "refreshToken": {
                        "type": "string",
                        "description": "The current authentication token that is about to expire."
                    }
                }
            }
        }
    }
}
```
- **Responses:** 
```json
{
    "200": {
        "description": "Token refreshed successfully.",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "sessionToken": {
                      "type": "string",
                      "description": "The new refreshed token."
                    }
                  }
                }
            }
        }
    },
    "400": { "description": "Error refreshing token, Bad Request." },
    "401": { "description": "Unauthorized, invalid or expired token." }
}
```

- [x] `POST /logout`
- **Summary:** Logs out the user
- **Description:** Logs out the user and removes the authenticated tokens from Redis.
- **Request Body:** 
```json
{
    "required": true,
    "content": {
        "application/json": {
            "schema": {
                "type": "object",
                "properties": {
                  "sessionToken": {
                    "type": "string",
                    "description": "The user's session token"
                  },
                  "refreshToken": {
                    "type": "string",
                    "description": "The user's refresh token"
                  }
                }
            }
        }
    }
}
```
- **Responses:** 
```json
{
    "200": { "description": "Logged out successfully." },
    "400": { "description": "Error logging out." }
}
```

- [x] `POST /request-password-reset`
- **Summary:** Request a password reset
- **Description:** Generates a password reset code and sends it to the user's email.
- **Request Body:**
```json
{
    "required": true,
    "content": {
        "application/json": {
            "schema": {
                "type": "object",
                "properties": {
                  "email": {
                    "type": "string",
                    "description": "The user's registered email address."
                  }
                },
                "required": ["email"]
            }
        }
    }
}
```
- **Responses:** 
```json
{
    "200": { "description": "Password reset code sent successfully." },
    "400": { "description": "Invalid email address or error sending password reset code." },
    "404": { "description": "User not found." },
    "500": { "description": "Server error." }
}
```

- [x] `POST /reset-password`
- **Summary:** Reset the password
- **Description:** Reset the user's password using the reset code.
- **Request Body:** 
```json
{
    "required": true,
    "content": {
        "application/json": {
            "schema": {
                "type": "object",
                "properties": {
                  "email": {
                    "type": "string",
                    "description": "The user's registered email address."
                  },
                  "resetCode": {
                    "type": "string",
                    "description": "The 4-digit password reset code sent to the user's email."
                  },
                  "newPassword": {
                    "type": "string",
                    "description": "The new password for the user."
                  }
                },
                "required": ["email", "resetCode", "newPassword"]
            }
        }
    }
}
```
- **Responses:** 
```json
{
    "200": { "description": "Password reset successfully." },
    "400": { "description": "Invalid or expired code, or error resetting password." },
    "404": { "description": "User not found." },
    "500": { "description": "Server error." }
}
```

- **Profile Management Endpoints**

- [x] `GET /profile`
- **Summary:** Get user's profile information
- **Description:** Retrieve the current user's profile data.
- **Responses:** 
```json
{
    "200": {
        "description": "Profile retrieved successfully",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "fullname": { "type": "string" },
                    "username": { "type": "string" },
                    "age": { "type": "integer" },
                    "gender": { "type": "string" },
                    "country": { "type": "string" },
                    "preferredLanguage": { "type": "string" },
                    "last_updated_at": { "type": "string", "format": "date-time" },
                    "created_at": { "type": "string", "format": "date-time" }
                  }
                }
            }
        }
    },
    "400": { "description": "Unauthorized, user not found or token invalid/expired" },
    "500": { "description": "Internal server error" }
}
```

- [x] `PUT /profile`
- **Summary:** Update's user profile
- **Description:** Update specific profile details such as fullname, age, gender, country, height, weight or preferred language.
- **Request Body:** 
```json
{
    "required": true,
    "content": {
        "application/json": {
            "schema": {
                "type": "object",
                "properties": {
                  "fullname": {
                    "type": "string",
                    "description": "The user's fullname",
                    "example": "John Doe"
                  },
                  "username": {
                    "type": "string",
                    "description": "The user's username",
                    "example": "Divine"
                  },
                  "age": {
                    "type": "integer",
                    "description": "The user's age",
                    "example": 30
                  },
                  "gender" : {
                    "type": "integer",
                    "description": "The user's gender",
                    "example": "male"
                  },
                  "country": {
                    "type": "string",
                    "description": "The user's country",
                    "example": "USA"
                  },
                  "preferredLanguage": {
                    "type": "string",
                    "description": "The user's preferred language",
                    "example": "English"
                  }
                }
            }
        }
    }
}
```
- **Responses:** 
```json
{
    "200": {
        "description": "Profile updated successfully.",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                        "message": { "type": "string", "example": "Profile updated successfully" },
                        "user": {
                            "type": "object",
                            "properties": {
                                "fullname": { "type": "string", "example": "John Doe" },
                                "username": { "type": "string", "example": "Divine"},
                                "age": { "type": "integer", "example": 30 },
                                "gender": { "type": "string", "example": "male" },
                                "country": { "type": "string", "example": "USA" },
                                "preferredLanguage": { "type": "string", "example": "English" },
                                "last_updated_at": { "type": "string", "format": "date-time" },
                                "created_at": { "type": "string", "format": "date-time" }
                            }
                        }
                    }
                }
            }
        }
    },
    "400": {
        "description": "Invalid input. Validation errors.",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string", "example": "Fullname must be a string" }
                  }
                }
            }
        }
    },
    "404": {
        "description": "User not found.",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string", "example": "User not found" }
                  }
                }
            }
        }
    },
    "500": {
        "description": "Internal server error",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string", "example": "User's details cannot be updated at the moment" }
                  }
                }
            }
        }
    }
}
```
- [x] `DELETE /profile`
- **summary:** Deletes the user's profile and account
- **Description:** Deletes the user's profile and account
- **Responses:** 
```json
{
    "200": {
        "description": "User profile and account deleted successfully",
        "content": {
              "application/json": {
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": { "type": "string", "example": "User profile and account deleted successfully"}
                    }
                }
            }
        }
    },
    "400": {
        "description": "Token is missing or invalid",
        "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string", "example": "Expired token" }
                  }
                }
            }
        }
    },
    "404": { 
        "description": "User not found",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                    "properties": {
                      "message": { "type": "string", "example": "User not found" }
                  }
                }
            }
        }
    },
    "500": {
        "description": "Internal server error",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                    "properties": {
                      "message": { "type": "string", "example": "Internal server error" }
                    }
                }
            }
        }
    }
}
```

- **BMI Management Endpoints**

- [x] `POST /bmi/calculate`
- **Summary:** Calculate BMI based on input height and weight
- **Description:** Calculates the user's BMI based on input height and weight and unit for the calculation
- **Request Body:** 
```json
{
    "required": true,
    "content": {
        "application/json": {
            "schema": {
                "type":"object",
                "properties": {
                  "height": { 
                    "type": "number",
                    "format": "float",
                    "description": "The user's height value",
                    "example": 1.73
                  },
                  "weight": {
                    "type": "number",
                    "format": "float",
                    "description": "The user's weight value",
                    "example": 70
                  },
                  "unit" : {
                    "type": "string",
                    "description": "The user's preferred unit for the height and weight values",
                    "example": "metric",
                    "enum": ["metric", "imperial"]
                  },
                  "heightunit": {
                    "type": "string",
                    "description": "The unit for height (e.g., 'cm', 'm', 'in', 'ft')",
                    "example": "cm",
                    "enum": ["cm", "m", "in", "ft"]
                  },
                  "weightunit": {
                    "type": "string",
                    "description": "The unit for weight (e.g., 'kg', 'g', 'lbs', 'st')",
                    "example": "kg",
                    "enum": ["kg", "g", "lbs", "st"]
                  },
                  "age": {
                    "type": "integer",
                    "description": "The user's age in years",
                    "example": 25
                  },
                  "gender": {
                    "type": "string",
                    "description": "The user's gender",
                    "example": "male",
                    "enum": ["male", "female", "other"]
                  },
                  "country": {
                    "type": "string",
                    "description": "The user's country of residence",
                    "example": "USA"
                  }
                },
                "required": ["height", "weight", "unit", "age", "gender", "country"]
            }
        }
    }
}
```
- **Responses:** 
```json
{
    "200": {
        "description": "Successfully calculated and returned the user's BMI value and category",
        "content": {
            "application/json": {
                "schema": {
                  "properties": {
                    "bmi": {
                      "type": "number",
                      "format": "float",
                      "description": "User's BMI value",
                      "example": "22.86"
                    },
                    "category": {
                      "type": "string",
                      "description": "The user's BMI value category",
                      "example": "Normal weight"
                    }
                  }
                }
            }
        }
    },
    "400" : {
        "description": "Invalid input. Validation errors.",
        "content": {
            "application/json": {
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {
                        "type": "string",
                        "example": "Height and weight must be a valid float number"
                        }
                    }
                }
            }
        }
    },
    "404": {
        "description": "User not found", 
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "User not found"
                    }
                  }
                }
            }
        }
    },
    "500": {
        "description": "Internal server error",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Internal server error"
                    }
                  }
                }
            }
        }
    }
}
```

- [x] `GET /bmi/history`
- **Summary:** Retrieves a user's BMI history
- **Description:** Fetch all BMI records for the authenticated user, grouped by height, weight, unit, BMI value, category, and creation date. Supports pagination.
- **Produces:** application/json
- **Parameters:** 
```json
[
    {
        "name": "page",
        "in": "query",
        "description": "Page number for pagination",
        "required": false,
        "type": "integer",
        "default": 1
    },
    {
    "name": "limit",
    "in": "query",
    "description": "Number of records per page",
    "required": false,
    "type": "integer",
    "default": 10
    }
]
```
- **Responses:**
```json
{
    "200": {
        "description": "Successful retrieval of BMI history",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "BMI records retrieved successfully"
                    },
                    "total": {
                      "type": "integer",
                      "example": 1
                    },
                    "currentPage": {
                      "type": "integer",
                      "example": "1"
                    },
                    "totalPages": {
                      "type": "integer",
                      "example": 1
                    },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "height": { "type": "number", "example": 175 },
                          "weight": { "type": "number", "example": 70 },
                          "unit": { "type": "string", "example": "metric" },
                          "bmi": { "type": "number", "example": 22.88 },
                          "category": { "type": "string", "example": "Normal weight" },
                          "createdAt": { "type": "string", "format": "date-time", "example": "2024-09-26T12:34:56Z" }
                        }
                        }
                    }
                    }
                }
            }
        }
    },
    "401": {
        "description": "Unauthorized access",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Unauthorized"
                    }
                  }
                }
            }
        }
    },
    "404": {
        "description": "User not found",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "User not found"
                    }
                  }
                }
            }
        }
    },
    "500": {
        "description": "Internal server error",
        "content": {
            "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "An error occured while retrieving BMI records"
                    }
                  }
                }
            }
        }
    }
}
