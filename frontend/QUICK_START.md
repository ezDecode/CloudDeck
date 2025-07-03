# 🚀 CloudDeck Quick Start Guide

Get up and running with CloudDeck in 5 minutes! This guide will help you set up and connect to your AWS S3 bucket.

## 📋 Before You Start

You'll need:
- An AWS account
- Basic knowledge of S3 (helpful but not required)

## 🎯 Step 1: Create an S3 Bucket

1. **Log into AWS Console**
   - Go to [aws.amazon.com](https://aws.amazon.com)
   - Sign in to your account

2. **Navigate to S3**
   - Search for "S3" in the services menu
   - Click on "S3"

3. **Create a New Bucket**
   - Click "Create bucket"
   - Choose a unique name (e.g., `my-clouddeck-files`)
   - Select your preferred region
   - Leave other settings as default
   - Click "Create bucket"

## 🔑 Step 2: Create Access Credentials

1. **Go to IAM**
   - Search for "IAM" in AWS services
   - Click on "IAM"

2. **Create a New User**
   - Click "Users" in the left sidebar
   - Click "Add user"
   - Username: `clouddeck-user`
   - Access type: ✅ "Programmatic access"
   - Click "Next: Permissions"

3. **Set Permissions**
   - Click "Attach existing policies directly"
   - Search for "S3FullAccess"
   - ✅ Check "AmazonS3FullAccess"
   - Click "Next: Tags" → "Next: Review" → "Create user"

4. **Save Your Credentials**
   - ⚠️ **Important**: Copy and save these immediately!
   - **Access Key ID**: `AKIA...` (copy this)
   - **Secret Access Key**: `...` (copy this)
   - You won't be able to see the secret key again!

## 🌐 Step 3: Configure CORS

1. **Go Back to S3**
   - Navigate to S3 service
   - Click on your bucket name

2. **Configure CORS**
   - Click "Permissions" tab
   - Scroll to "Cross-origin resource sharing (CORS)"
   - Click "Edit"
   - Paste this configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
    }
]
```

3. **Save CORS Settings**
   - Click "Save changes"

## 🎉 Step 4: Connect to CloudDeck

1. **Open CloudDeck**
   - Visit [your-clouddeck-url.com](https://your-clouddeck-url.com)
   - Or run locally: `npm run dev` and go to `http://localhost:5173`

2. **Enter Your Credentials**
   - **Access Key ID**: Paste from Step 2
   - **Secret Access Key**: Paste from Step 2  
   - **Bucket Name**: Your bucket name from Step 1
   - **Region**: Select the region you chose

3. **Connect**
   - Click "Connect to AWS"
   - You should see your bucket contents (empty if new)

## ✅ You're All Set!

Congratulations! You can now:

- 📤 **Upload files**: Drag & drop or click upload
- 📁 **Create folders**: Click the "+" button
- 🔍 **Search files**: Use the search bar
- 👥 **Share with team**: Create a team and share the link

## 🚨 Troubleshooting

### ❌ "Access Denied" Error
- Double-check your Access Key ID and Secret Key
- Make sure the IAM user has S3 permissions
- Verify the bucket name is correct

### ❌ "CORS Error"
- Make sure you configured CORS in Step 3
- Check that you saved the CORS configuration
- Try refreshing the page

### ❌ "Bucket Not Found"
- Verify the bucket name (no spaces, lowercase)
- Check that you selected the correct region
- Make sure the bucket exists in your AWS account

### ❌ Connection Timeout
- Check your internet connection
- Verify AWS credentials are not expired
- Make sure you're using the correct region

## 🎯 Next Steps

### For Individual Use
- Start uploading your files
- Organize with folders
- Use search and filters to find files

### For Team Use
1. Click "Create Team" instead of "Individual"
2. Enter a team name
3. Fill in your AWS credentials
4. Generate a team link
5. Share the link with team members

## 💡 Pro Tips

### Security
- For production, restrict CORS origins to your domain
- Use IAM policies with minimal required permissions
- Never share your AWS credentials

### Organization
- Use meaningful folder names
- Keep file names descriptive
- Use the filter feature to find specific file types

### Performance
- Upload multiple files at once
- Use appropriate file names for easy searching
- Organize files into logical folder structures

## 📞 Need Help?

- 📖 Check the [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/yourusername/clouddeck/issues)
- 💬 Join our community discussions
- 📧 Email support for urgent issues

---

**🎊 Happy file managing with CloudDeck!**

*This guide should take about 5-10 minutes to complete. If you run into any issues, don't hesitate to reach out for help!*
