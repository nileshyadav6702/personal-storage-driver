import {connectDB, client} from "./connectDB.js"

const db = await connectDB()

await db.command({
    collMod: "users",
    validator: {
        $jsonSchema: {
            required: [
                '_id',
                'name',
                'email',
                'password',
                'rootDirId'
            ],
            properties: {
                _id: {
                    bsonType: 'objectId'
                },
                name: {
                    bsonType: 'string',
                    minLength: 3
                },
                email: {
                    bsonType: 'string',
                    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$'
                },
                password: {
                    bsonType: 'string',
                    minLength: 4
                },
                rootDirId: {
                    bsonType: 'objectId'
                }
            },
            additionalProperties: false
        }
    },
    validationAction: "error",
    validationLevel: "strict"
})

await db.command({
    collMod: "folders",
    validator: {
        $jsonSchema: {
            required: [
                '_id',
                'name',
                'parentDir',
                'userId',
                'content.files',
                'content.folders'
            ],
            properties: {
                _id: {
                    bsonType: 'objectId'
                },
                name: {
                    bsonType: 'string'
                },
                parentDir: {
                    bsonType: [
                        'objectId',
                        'null'
                    ]
                },
                userId: {
                    bsonType: 'objectId'
                },
                'content.files': {
                    bsonType: 'array'
                },
                'content.folders': {
                    bsonType: 'array'
                }
            },
            additionalProperties: false
        }
    },
    validationAction: "error",
    validationLevel: "strict"
})

await db.command({
    collMod: "files",
    validator: {
        $jsonSchema: {
            required: [
                '_id',
                'name',
                'dirId',
                'size',
                'extension'
            ],
            properties: {
                _id: {
                    bsonType: 'objectId'
                },
                name: {
                    bsonType: 'string'
                },
                dirId: {
                    bsonType: 'objectId'
                },
                size: {
                    bsonType: 'string'
                },
                extension: {
                    bsonType: 'string'
                }
            },
            additionalProperties: false
        }
    },
    validationAction: "error",
    validationLevel: "strict"
})
await client.close()