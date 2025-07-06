# CloudDeck - AWS S3 File Manager

CloudDeck is a modern, user-friendly web application for managing files in AWS S3 buckets. It provides an intuitive interface for uploading, downloading, organizing, and sharing files.

## ✨ Features

- **🔒 Secure AWS S3 Integration**: Connect directly to your S3 bucket with AWS credentials.
- **📁 File Management**: Upload, download, rename, delete, and organize files and folders.
- **🔍 Smart Search & Filtering**: Find files quickly with search and filtering capabilities.
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices.
- **🎨 Modern UI**: Clean, intuitive interface designed for a great user experience.
- **⚡ Fast Performance**: Optimized for speed with modern web technologies.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following:

1.  **Node.js** (version 18 or higher)
2.  **npm** or **yarn** package manager
3.  An **AWS Account** with S3 access
4.  An **AWS S3 Bucket** configured with proper permissions

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/clouddeck.git
    cd clouddeck/frontend
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**

    Create a `.env` file in the `frontend` directory and add your AWS credentials. This is the recommended way to manage your keys securely.

    ```
    VITE_AWS_REGION=your-s3-bucket-region
    VITE_AWS_ACCESS_KEY_ID=your-aws-access-key-id
    VITE_AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
    VITE_S3_BUCKET_NAME=your-s3-bucket-name
    ```

4.  **Start the development server**
    ```bash
    npm run dev
    ```

5.  **Open your browser**
    Navigate to `http://localhost:5173` to access CloudDeck.

## 🔧 AWS S3 Configuration

### Step 1: Create an S3 Bucket

1.  Log into your AWS Console.
2.  Navigate to the S3 service.
3.  Click "Create bucket".
4.  Choose a unique bucket name and select your preferred region.
5.  Configure the remaining bucket settings as needed.

### Step 2: Create an IAM User with S3 Permissions

For security, it's best to create a dedicated IAM user with limited permissions instead of using your root account.

1.  Navigate to **IAM** in the AWS Console.
2.  Click **Users** → **Create user**.
3.  Choose a username (e.g., "clouddeck-user").
4.  On the **Set permissions** page, select **Attach policies directly**.
5.  Click **Create policy**. In the JSON editor, paste the following policy, replacing `"your-bucket-name"` with your actual bucket name.

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
                    "s3:ListBucket"
                ],
                "Resource": [
                    "arn:aws:s3:::your-bucket-name/*",
                    "arn:aws:s3:::your-bucket-name"
                ]
            }
        ]
    }
    ```

6.  After creating the policy, attach it to your new user.
7.  Continue to the user's details page, go to the **Security credentials** tab, and create an **Access key**.
8.  Choose **Application running outside AWS** and save the **Access Key ID** and **Secret Access Key**.

### Step 3: Configure CORS

CloudDeck needs CORS configuration to access your S3 bucket from the browser.

1.  Go to your S3 bucket in the AWS Console.
2.  Navigate to **Permissions** → **Cross-origin resource sharing (CORS)**.
3.  Add the following configuration:

    ```json
    [
        {
            "AllowedHeaders": [
                "*"
            ],
            "AllowedMethods": [
                "GET",
                "PUT",
                "POST",
                "DELETE",
                "HEAD"
            ],
            "AllowedOrigins": [
                "http://localhost:5173",
                "http://localhost:5174"
            ],
            "ExposeHeaders": [
                "ETag"
            ]
        }
    ]
    ```

> ⚠️ **Security Note**: For production use, replace the `AllowedOrigins` with your specific application domain (e.g., `"https://yourdomain.com"`).

## 📖 User Guide

### File Operations

-   **Uploading Files**: Drag and drop files directly into the interface or use the upload button.
-   **Downloading Files**: Select a file and click the download button in the toolbar.
-   **File Organization**: Create folders, move files by dragging them, and rename or delete items using the toolbar actions.

### Navigation

-   **Breadcrumb Navigation**: Click any folder in the breadcrumb trail to navigate up the directory tree.
-   **Search**: Use the search bar to quickly find files by name within the current directory.

## 🛠️ Technical Details

### Built With

-   **Frontend**: React 19, Vite, Tailwind CSS
-   **Animations**: Framer Motion, GSAP
-   **AWS SDK**: `@aws-sdk/client-s3` for all S3 interactions.

### Architecture

-   **Client-Side**: A Single Page Application (SPA) that communicates directly with AWS S3.
-   **Authentication**: Uses AWS IAM credentials stored in environment variables.
-   **API**: Direct client-to-S3 API calls; no backend server is required.

## 🚨 Troubleshooting

### Common Issues

-   **Connection Failed**: Double-check that your AWS credentials and bucket information in the `.env` file are correct.
-   **CORS Errors**: Ensure the CORS policy on your S3 bucket is configured correctly and matches the origin from which you are accessing the application.
-   **Access Denied**: Verify that the IAM user's policy grants the necessary permissions for the actions you are trying to perform.

| Error                | Cause                               | Solution                                     |
| -------------------- | ----------------------------------- | -------------------------------------------- |
| "Access Denied"      | Insufficient IAM permissions        | Check and update the IAM policy              |
| "CORS Error"         | Missing or incorrect CORS config    | Configure the bucket's CORS policy correctly |
| "Bucket Not Found"   | Wrong bucket name or region         | Verify bucket details in your `.env` file    |
| "Invalid Credentials"| Incorrect AWS keys in `.env` file   | Verify the Access Key ID and Secret Key      |

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.
