import { RestApiKeyGuard } from './rest-api-key.guard'
import { Controller, Get, UseGuards } from '@nestjs/common'

// Documentation requires a valid REST bearer key.
@Controller('api')
@UseGuards(RestApiKeyGuard)
export class RestApiDocsController {
  @Get('docs-json')
  specification() {
    return {
  "openapi": "3.0.3",
  "info": {
    "title": "HeyForm REST API",
    "version": "1.0.0",
    "description": "Workspace integration API. Keys are secrets; use a scoped key whenever possible."
  },
  "servers": [
    {
      "url": "/"
    }
  ],
  "security": [
    {
      "BearerAuth": []
    }
  ],
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer"
      }
    }
  },
  "paths": {
    "/api/v1/health": {
      "get": {
        "operationId": "health",
        "summary": "health",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      }
    },
    "/api/v1/keys": {
      "post": {
        "operationId": "createKey",
        "summary": "create Key",
        "description": "Requires bootstrap administrator key.",
        "parameters": [],
        "responses": {
          "201": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "workspaceId",
                  "name",
                  "scopes"
                ],
                "properties": {
                  "workspaceId": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "scopes": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "get": {
        "operationId": "listKeys",
        "summary": "list Keys",
        "description": "Requires bootstrap administrator key.",
        "parameters": [],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      }
    },
    "/api/v1/keys/{id}": {
      "delete": {
        "operationId": "revokeKey",
        "summary": "revoke Key",
        "description": "Requires bootstrap administrator key.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      }
    },
    "/api/v1/workspaces": {
      "get": {
        "operationId": "workspaces",
        "summary": "workspaces",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      },
      "post": {
        "operationId": "createWorkspace",
        "summary": "create Workspace",
        "description": "Requires bootstrap administrator key.",
        "parameters": [],
        "responses": {
          "201": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name",
                  "ownerId"
                ],
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "ownerId": {
                    "type": "string"
                  },
                  "projectName": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/workspaces/{id}/projects": {
      "get": {
        "operationId": "listProjects",
        "summary": "list Projects",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      },
      "post": {
        "operationId": "createProject",
        "summary": "create Project",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "201": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name"
                ],
                "properties": {
                  "name": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/users": {
      "get": {
        "operationId": "findUser",
        "summary": "find User",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "email",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      },
      "post": {
        "operationId": "provisionUser",
        "summary": "provision User",
        "description": "Requires bootstrap administrator key.",
        "parameters": [],
        "responses": {
          "201": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "email",
                  "name"
                ],
                "properties": {
                  "email": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/workspaces/{id}/members": {
      "post": {
        "operationId": "addMember",
        "summary": "add Member",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "201": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "userId"
                ],
                "properties": {
                  "userId": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      },
      "get": {
        "operationId": "listMembers",
        "summary": "list Members",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      }
    },
    "/api/v1/workspaces/{id}": {
      "get": {
        "operationId": "getWorkspace",
        "summary": "get Workspace",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      },
      "patch": {
        "operationId": "updateWorkspace",
        "summary": "update Workspace",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name"
                ],
                "properties": {
                  "name": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "operationId": "deleteWorkspace",
        "summary": "delete Workspace",
        "description": "Requires bootstrap administrator key.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      }
    },
    "/api/v1/users/{id}": {
      "get": {
        "operationId": "getUser",
        "summary": "get User",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      }
    },
    "/api/v1/workspaces/{id}/members/{userId}": {
      "patch": {
        "operationId": "updateMember",
        "summary": "update Member",
        "description": "Requires bootstrap administrator key.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "role"
                ],
                "properties": {
                  "role": {
                    "type": "integer"
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "operationId": "removeMember",
        "summary": "remove Member",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      }
    },
    "/api/v1/projects/{id}": {
      "patch": {
        "operationId": "renameProject",
        "summary": "rename Project",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name"
                ],
                "properties": {
                  "name": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "operationId": "deleteProject",
        "summary": "delete Project",
        "description": "Requires bootstrap administrator key.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      }
    },
    "/api/v1/projects/{id}/forms": {
      "get": {
        "operationId": "listForms",
        "summary": "list Forms",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      },
      "post": {
        "operationId": "createForm",
        "summary": "create Form",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "201": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name"
                ],
                "properties": {
                  "name": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/forms/{id}": {
      "patch": {
        "operationId": "renameForm",
        "summary": "rename Form",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name"
                ],
                "properties": {
                  "name": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "operationId": "deleteForm",
        "summary": "delete Form",
        "description": "Requires bootstrap administrator key.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      },
      "get": {
        "operationId": "getForm",
        "summary": "get Form",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      }
    },
    "/api/v1/forms/{id}/drafts": {
      "patch": {
        "operationId": "updateDrafts",
        "summary": "update Drafts",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "version",
                  "drafts"
                ],
                "properties": {
                  "version": {
                    "type": "integer"
                  },
                  "drafts": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  },
                  "logics": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/forms/{id}/publish": {
      "post": {
        "operationId": "publishForm",
        "summary": "publish Form",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "201": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "version",
                  "drafts"
                ],
                "properties": {
                  "version": {
                    "type": "integer"
                  },
                  "drafts": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  },
                  "logics": {
                    "type": "array",
                    "items": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/forms/{id}/unpublish": {
      "post": {
        "operationId": "unpublishForm",
        "summary": "unpublish Form",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "201": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      }
    },
    "/api/v1/forms/{id}/submissions": {
      "get": {
        "operationId": "listSubmissions",
        "summary": "list Submissions",
        "description": "Bearer key required; workspace and permission restrictions apply where applicable.",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "page",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "default": 1
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "default": 30
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Not found"
          },
          "409": {
            "description": "Conflict"
          }
        }
      }
    }
  }
}
  }
}
