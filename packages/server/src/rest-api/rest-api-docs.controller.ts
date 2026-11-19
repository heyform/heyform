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
        },
        "tags": [
          "Forms"
        ]
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
        },
        "tags": [
          "Forms"
        ]
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
        },
        "tags": [
          "Forms"
        ]
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
        },
        "tags": [
          "Forms"
        ]
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
        },
        "tags": [
          "Forms"
        ]
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
        },
        "tags": [
          "Forms"
        ]
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
        },
        "tags": [
          "Forms"
        ]
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
        },
        "tags": [
          "Forms"
        ]
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
        },
        "tags": [
          "Submissions"
        ]
      }
    },
    "/api/v1/forms/{id}/duplicate": {
      "post": {
        "tags": [
          "Forms"
        ],
        "summary": "duplicate form",
        "description": "Requires forms:write in the form workspace. ",
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
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  }
                },
                "required": [
                  "name"
                ],
                "additionalProperties": false
              },
              "example": {
                "name": "Survey copy"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
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
            "description": "Invalid form status"
          }
        }
      }
    },
    "/api/v1/forms/{id}/move": {
      "post": {
        "tags": [
          "Forms"
        ],
        "summary": "move form",
        "description": "Requires forms:write in the form workspace. Target project must be in the same workspace.",
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
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "targetProjectId": {
                    "type": "string"
                  }
                },
                "required": [
                  "targetProjectId"
                ],
                "additionalProperties": false
              },
              "example": {
                "targetProjectId": "PROJECT_ID"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
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
            "description": "Invalid form status"
          }
        }
      }
    },
    "/api/v1/forms/{id}/hidden-fields": {
      "patch": {
        "tags": [
          "Forms"
        ],
        "summary": "hidden fields form",
        "description": "Requires forms:write in the form workspace.  Each entry defines an internal id and a URL parameter name; neither is the submitted value. For example name location_id is populated by ?location_id=56 on the public form URL.",
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
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "hiddenFields": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "name": {
                          "type": "string"
                        }
                      },
                      "required": [
                        "id",
                        "name"
                      ],
                      "additionalProperties": false
                    }
                  }
                },
                "required": [
                  "hiddenFields"
                ],
                "additionalProperties": false
              },
              "example": {
                "hiddenFields": [
                  {
                    "id": "location_id",
                    "name": "location_id"
                  },
                  {
                    "id": "assignment_id",
                    "name": "assignment_id"
                  },
                  {
                    "id": "submission_token",
                    "name": "submission_token"
                  }
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
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
            "description": "Invalid form status"
          }
        }
      }
    },
    "/api/v1/forms/{id}/variables": {
      "patch": {
        "tags": [
          "Forms"
        ],
        "summary": "variables form",
        "description": "Requires forms:write in the form workspace. ",
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
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "variables": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string"
                        },
                        "name": {
                          "type": "string"
                        },
                        "kind": {
                          "type": "string",
                          "enum": [
                            "string",
                            "number"
                          ]
                        },
                        "value": {
                          "oneOf": [
                            {
                              "type": "string"
                            },
                            {
                              "type": "number"
                            }
                          ]
                        }
                      },
                      "required": [
                        "id",
                        "name",
                        "kind",
                        "value"
                      ],
                      "additionalProperties": false
                    }
                  }
                },
                "required": [
                  "variables"
                ],
                "additionalProperties": false
              },
              "example": {
                "variables": [
                  {
                    "id": "score",
                    "name": "score",
                    "kind": "number",
                    "value": 0
                  }
                ]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
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
            "description": "Invalid form status"
          }
        }
      }
    },
    "/api/v1/forms/{id}/settings": {
      "patch": {
        "tags": [
          "Forms"
        ],
        "summary": "settings form",
        "description": "Requires forms:write in the form workspace. ",
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
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "enableExpirationDate": {
                    "type": "boolean"
                  },
                  "enableTimeLimit": {
                    "type": "boolean"
                  },
                  "filterSpam": {
                    "type": "boolean"
                  },
                  "generatePseudonymId": {
                    "type": "boolean"
                  },
                  "enableQuotaLimit": {
                    "type": "boolean"
                  },
                  "enableIpLimit": {
                    "type": "boolean"
                  },
                  "displayIpAddress": {
                    "type": "boolean"
                  },
                  "enableProgress": {
                    "type": "boolean"
                  },
                  "enableQuestionList": {
                    "type": "boolean"
                  },
                  "enableNavigationArrows": {
                    "type": "boolean"
                  },
                  "openLinksInNewTab": {
                    "type": "boolean"
                  },
                  "enableClosedMessage": {
                    "type": "boolean"
                  },
                  "allowArchive": {
                    "type": "boolean"
                  },
                  "requirePassword": {
                    "type": "boolean"
                  },
                  "enableEmailNotification": {
                    "type": "boolean"
                  },
                  "redirectOnCompletion": {
                    "type": "boolean"
                  },
                  "enabledAt": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "closedAt": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "timeLimit": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "quotaLimit": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "ipLimitCount": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "ipLimitTime": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "redirectDelay": {
                    "type": "integer",
                    "minimum": 0
                  },
                  "expirationTimeZone": {
                    "type": "string"
                  },
                  "locale": {
                    "type": "string"
                  },
                  "closedFormTitle": {
                    "type": "string"
                  },
                  "closedFormDescription": {
                    "type": "string"
                  },
                  "metaTitle": {
                    "type": "string"
                  },
                  "metaDescription": {
                    "type": "string"
                  },
                  "redirectUrl": {
                    "type": "string"
                  },
                  "metaOGImageUrl": {
                    "type": "string"
                  },
                  "password": {
                    "type": "string",
                    "writeOnly": true,
                    "minLength": 1,
                    "maxLength": 72
                  }
                },
                "required": [],
                "additionalProperties": false
              },
              "example": {
                "enableProgress": true
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
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
            "description": "Invalid form status"
          }
        }
      }
    },
    "/api/v1/forms/{id}/theme": {
      "patch": {
        "tags": [
          "Forms"
        ],
        "summary": "theme form",
        "description": "Requires forms:write in the form workspace. ",
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
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "logo": {
                    "type": "string",
                    "nullable": true
                  },
                  "favicon": {
                    "type": "string",
                    "nullable": true
                  },
                  "theme": {
                    "type": "object",
                    "properties": {
                      "fontFamily": {
                        "type": "string"
                      },
                      "questionTextColor": {
                        "type": "string"
                      },
                      "answerTextColor": {
                        "type": "string"
                      },
                      "buttonBackground": {
                        "type": "string"
                      },
                      "buttonTextColor": {
                        "type": "string"
                      },
                      "backgroundColor": {
                        "type": "string"
                      },
                      "backgroundImage": {
                        "type": "string"
                      },
                      "customCSS": {
                        "type": "string"
                      },
                      "backgroundBrightness": {
                        "type": "number",
                        "minimum": -100,
                        "maximum": 100
                      }
                    },
                    "required": [],
                    "additionalProperties": false
                  }
                },
                "required": [
                  "theme"
                ],
                "additionalProperties": false
              },
              "example": {
                "theme": {
                  "backgroundColor": "#ffffff",
                  "buttonBackground": "#222222"
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
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
            "description": "Invalid form status"
          }
        }
      }
    },
    "/api/v1/forms/{id}/trash": {
      "post": {
        "tags": [
          "Forms"
        ],
        "summary": "trash form",
        "description": "Requires forms:write in the form workspace. Deactivates form; 30-day retention.",
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
                "schema": {
                  "type": "object"
                }
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
            "description": "Invalid form status"
          }
        }
      }
    },
    "/api/v1/forms/{id}/restore": {
      "post": {
        "tags": [
          "Forms"
        ],
        "summary": "restore form",
        "description": "Requires forms:write in the form workspace. Restores an inactive draft or published form without activating it.",
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
                "schema": {
                  "type": "object"
                }
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
            "description": "Invalid form status"
          }
        }
      }
    },
    "/api/v1/forms/{id}/submissions/{submissionId}": {
      "get": {
        "tags": [
          "Submissions"
        ],
        "summary": "Retrieve submission",
        "description": "Requires submissions:read. Returns completed public submission including hidden fields and variables, without IP address.",
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
            "name": "submissionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "24-character MongoDB submission ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Success"
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
          }
        }
      },
      "delete": {
        "tags": [
          "Submissions"
        ],
        "summary": "Permanently delete submission",
        "description": "Bootstrap administrator only. Irreversible.",
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
            "name": "submissionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "24-character MongoDB submission ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Success"
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
          }
        }
      }
    },
    "/api/v1/forms/{id}/submissions/{submissionId}/category": {
      "patch": {
        "tags": [
          "Submissions"
        ],
        "summary": "Change submission category",
        "description": "Requires submissions:write in the form workspace.",
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
            "name": "submissionId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "24-character MongoDB submission ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Success"
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
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "category"
                ],
                "properties": {
                  "category": {
                    "type": "string"
                  }
                },
                "additionalProperties": false
              },
              "example": {
                "category": "inbox"
              }
            }
          }
        }
      }
    },
    "/api/v1/forms/{id}/webhook": {
      "get": {
        "tags": [
          "Webhooks"
        ],
        "summary": "Read webhook configuration",
        "description": "Bootstrap administrator only. Returns the configured endpoint and status.",
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
            "description": "Success"
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
            "description": "Invalid form status"
          }
        }
      },
      "post": {
        "tags": [
          "Webhooks"
        ],
        "summary": "Configure and enable webhook",
        "description": "Bootstrap administrator only. Uses native HeyForm submission delivery. Requires safe public HTTPS URL. Existing destination is replaced.",
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
            "description": "Success"
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
            "description": "Invalid form status"
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "endpointUrl"
                ],
                "properties": {
                  "endpointUrl": {
                    "type": "string",
                    "format": "uri"
                  }
                }
              },
              "example": {
                "endpointUrl": "https://shopper.example.com/api/webhooks/heyform"
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Webhooks"
        ],
        "summary": "Disable webhook",
        "description": "Bootstrap administrator only. Disables future delivery without deleting configuration or delivery history.",
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
            "description": "Success"
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
            "description": "Invalid form status"
          }
        }
      }
    }
  }
}
  }
}
