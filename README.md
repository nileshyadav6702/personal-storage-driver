# Personal Storage Driver

A custom storage driver implementation for managing personal file storage and data management operations.

## 🚀 Features

- **File Management**: Upload, download, and organize files efficiently
- **Multiple Storage Backends**: Support for local filesystem, cloud storage, and remote servers
- **Secure Operations**: Built-in encryption and access control
- **API Integration**: RESTful API for programmatic access
- **Cross-Platform**: Compatible with Windows, macOS, and Linux
- **Lightweight**: Minimal dependencies and resource usage

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn package manager
- Git

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/nileshyadav6702/personal-storage-driver.git
cd personal-storage-driver
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
PORT=3000
STORAGE_PATH=./storage
API_KEY=your_api_key_here
ENCRYPTION_KEY=your_encryption_key
```

## 🚦 Usage

### Starting the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Basic API Usage

```javascript
// Upload a file
const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key'
  },
  body: formData
});

// Download a file
const file = await fetch('/api/download/filename.txt', {
  headers: {
    'Authorization': 'Bearer your-api-key'
  }
});
```

### CLI Usage

```bash
# Upload a file
node cli.js upload ./path/to/file.txt

# List files
node cli.js list

# Download a file
node cli.js download filename.txt ./destination/
```

## 📁 Project Structure

```
personal-storage-driver/
├── src/
│   ├── controllers/     # API controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   └── services/        # Business logic
├── storage/             # File storage directory
├── tests/               # Test files
├── docs/                # Documentation
├── .env.example         # Environment template
├── package.json
└── README.md
```

## 🔧 Configuration

### Storage Backends

Configure different storage backends in your `.env` file:

```env
# Local filesystem
STORAGE_TYPE=local
STORAGE_PATH=./storage

# AWS S3
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_bucket_name

# Google Cloud Storage
STORAGE_TYPE=gcs
GCS_PROJECT_ID=your_project_id
GCS_BUCKET_NAME=your_bucket_name
```

### Security Settings

```env
# Enable encryption
ENABLE_ENCRYPTION=true
ENCRYPTION_ALGORITHM=aes-256-gcm

# Access control
ENABLE_AUTH=true
JWT_SECRET=your_jwt_secret
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/upload.test.js
```

## 📖 API Documentation

### Authentication

All API endpoints require authentication via Bearer token:

```
Authorization: Bearer your-api-key
```

### Endpoints

#### Upload File
```http
POST /api/upload
Content-Type: multipart/form-data

{
  "file": "binary file data",
  "path": "/optional/custom/path"
}
```

#### Download File
```http
GET /api/download/:filename
Authorization: Bearer your-api-key
```

#### List Files
```http
GET /api/files
Authorization: Bearer your-api-key
```

#### Delete File
```http
DELETE /api/files/:filename
Authorization: Bearer your-api-key
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📝 Changelog

### [1.0.0] - 2025-06-12
- Initial release
- Basic file upload/download functionality
- API authentication
- Local storage support

## 🐛 Known Issues

- Large file uploads (>100MB) may timeout
- Concurrent uploads to the same path need improvement
- Cloud storage retry logic needs enhancement

## 📋 Todo

- [ ] Add file versioning
- [ ] Implement file sharing functionality  
- [ ] Add batch operations
- [ ] Improve error handling
- [ ] Add file compression
- [ ] Implement file synchronization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Nilesh Yadav**
- GitHub: [@nileshyadav6702](https://github.com/nileshyadav6702)
- Email: rameshkumaryadav1918@gamil.com

## 🙏 Acknowledgments

- Thanks to the open-source community
- Inspired by various storage solutions
- Built with Node.js and Express.js

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation in the `/docs` folder
- Contact the maintainer

---

⭐ If you found this project helpful, please give it a star!
