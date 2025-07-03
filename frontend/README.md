# CloudDeck - AWS S3 File Manager

CloudDeck is a modern, user-friendly web application for managing files in AWS S3 buckets. It provides an intuitive interface for uploading, downloading, organizing, and sharing files with team collaboration features.

## ✨ Features

- **🔒 Secure AWS S3 Integration**: Connect to your S3 bucket with AWS credentials
- **👥 Team Collaboration**: Create teams and share credentials securely
- **📁 File Management**: Upload, download, delete, and organize files and folders
- **🔍 Smart Search & Filtering**: Find files quickly with advanced search and filtering
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🎨 Modern UI**: Clean, intuitive interface with dark mode support
- **⚡ Fast Performance**: Optimized for speed with modern web technologies

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following:

1. **Node.js** (version 16 or higher)
2. **npm** or **yarn** package manager
3. **AWS Account** with S3 access
4. **AWS S3 Bucket** configured with proper permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/clouddeck.git
   cd clouddeck/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to access CloudDeck

## 🔧 AWS S3 Configuration

### Step 1: Create an S3 Bucket

1. Log into your AWS Console
2. Navigate to S3 service
3. Click "Create bucket"
4. Choose a unique bucket name
5. Select your preferred region
6. Configure bucket settings as needed

### Step 2: Create IAM User with S3 Permissions

1. Navigate to IAM in AWS Console
2. Click "Users" → "Add user"
3. Choose a username (e.g., "clouddeck-user")
4. Select "Programmatic access"
5. Attach the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:GetBucketCors",
                "s3:PutBucketCors"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

6. Save the Access Key ID and Secret Access Key

### Step 3: Configure CORS

CloudDeck needs CORS configuration to access your S3 bucket from the browser:

1. Go to your S3 bucket in AWS Console
2. Navigate to "Permissions" → "Cross-origin resource sharing (CORS)"
3. Add the following configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag", "x-amz-meta-*"],
        "MaxAgeSeconds": 3600
    }
]
```

> ⚠️ **Security Note**: For production use, replace `"*"` in `AllowedOrigins` with your specific domain (e.g., `"https://yourdomain.com"`)

## 🔐 Authentication Setup

### Individual Setup

1. Open CloudDeck in your browser
2. Click "Individual" tab
3. Enter your AWS credentials:
   - **Access Key ID**: Your AWS Access Key
   - **Secret Access Key**: Your AWS Secret Key
   - **Bucket Name**: Your S3 bucket name
   - **Region**: Your bucket's AWS region
4. Click "Connect to AWS"

### Team Setup

1. **Create a Team:**
   - Click "Create Team" tab
   - Enter a team name
   - Fill in AWS credentials
   - Click "Create Team & Connect"
   - Generate and share the team link

2. **Join a Team:**
   - Click the team invitation link
   - The application will auto-connect with team credentials

## 📖 User Guide

### File Operations

#### Uploading Files
- **Drag & Drop**: Drag files directly into the interface
- **Upload Button**: Click the upload button in the toolbar
- **Bulk Upload**: Select multiple files at once

#### Downloading Files
- **Single File**: Right-click → Download
- **Multiple Files**: Select files → Download button
- **Folders**: Download as ZIP archive

#### File Organization
- **Create Folders**: Click "+" button → New Folder
- **Move Files**: Drag files between folders
- **Rename**: Right-click → Rename
- **Delete**: Select files → Delete button

### Navigation

#### Breadcrumb Navigation
- Click any folder in the breadcrumb to navigate
- Shows current path and navigation history

#### Search & Filter
- **Search**: Type in the search bar to find files
- **Filter**: Use filter dropdown to show specific file types
- **View Modes**: Toggle between grid and list view

### Team Collaboration

#### Sharing Team Access
1. Create a team with your AWS credentials
2. Generate a team invitation link
3. Share the link with team members
4. Team members can join instantly

#### Team Benefits
- **Shared Credentials**: No need to share AWS keys individually
- **Unified Access**: All team members access the same bucket
- **Easy Setup**: One-click join via invitation link

## 🛠️ Technical Details

### Built With
- **Frontend**: React 19, Vite, TailwindCSS
- **Animations**: Framer Motion, GSAP
- **AWS SDK**: @aws-sdk/client-s3
- **Styling**: TailwindCSS with custom components

### Architecture
- **Client-Side**: Single Page Application (SPA)
- **Authentication**: AWS IAM credentials
- **Storage**: Browser localStorage for credentials
- **API**: Direct AWS S3 API calls

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔒 Security Features

### Credential Security
- **Local Storage**: Credentials stored locally in browser
- **No Server**: No backend server means no credential exposure
- **Encrypted Transport**: All AWS API calls use HTTPS

### Access Control
- **IAM Policies**: Fine-grained S3 permissions
- **CORS Protection**: Configurable origin restrictions
- **Team Isolation**: Each team has separate credentials

## 🚨 Troubleshooting

### Common Issues

#### Connection Failed
- **Check Credentials**: Verify Access Key ID and Secret Key
- **Check Permissions**: Ensure IAM user has S3 permissions
- **Check Region**: Verify bucket region matches selection

#### CORS Errors
- **Configure CORS**: Follow CORS setup instructions
- **Check Origins**: Ensure your domain is allowed
- **Clear Cache**: Try refreshing the page

#### Upload/Download Issues
- **File Size**: Check S3 file size limits
- **Permissions**: Verify bucket permissions
- **Network**: Check internet connection

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Access Denied" | Insufficient permissions | Check IAM policy |
| "CORS Error" | Missing CORS config | Configure bucket CORS |
| "Bucket Not Found" | Wrong bucket name/region | Verify bucket details |
| "Invalid Credentials" | Wrong AWS keys | Check Access Key ID/Secret |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/yourusername/clouddeck/issues)
3. Create a new issue with detailed information

---

**Made with ❤️ by the CloudDeck Team**+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
