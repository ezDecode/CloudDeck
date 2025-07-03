# CORS Setup Guide for CloudDeck

This guide provides detailed instructions for configuring Cross-Origin Resource Sharing (CORS) on your AWS S3 bucket to work with CloudDeck.

## 🎯 What is CORS?

Cross-Origin Resource Sharing (CORS) is a security feature implemented by web browsers that blocks web pages from making requests to a different domain, protocol, or port than the one serving the web page. Since CloudDeck runs in your browser and needs to communicate with AWS S3, we need to configure CORS to allow this communication.

## 🚨 Why Do You Need CORS?

Without proper CORS configuration, you'll see errors like:
- "Access to fetch at 'https://s3.amazonaws.com/...' has been blocked by CORS policy"
- "Cross-Origin Request Blocked"
- Connection timeouts or failures

## 🔧 Step-by-Step CORS Configuration

### Method 1: AWS Console (Recommended)

1. **Open AWS S3 Console**
   - Navigate to [AWS S3 Console](https://s3.console.aws.amazon.com/)
   - Sign in with your AWS credentials

2. **Select Your Bucket**
   - Click on your bucket name from the list
   - If you don't have a bucket, create one first

3. **Navigate to Permissions**
   - Click on the "Permissions" tab
   - Scroll down to "Cross-origin resource sharing (CORS)"

4. **Edit CORS Configuration**
   - Click "Edit" button
   - Replace any existing configuration with the following:

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
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-meta-custom-header"
        ],
        "MaxAgeSeconds": 3600
    }
]
```

5. **Save Changes**
   - Click "Save changes"
   - Wait for the configuration to take effect (usually instant)

### Method 2: AWS CLI

If you prefer using the command line:

1. **Create CORS Configuration File**
   ```bash
   cat > cors-config.json << EOF
   {
       "CORSRules": [
           {
               "AllowedHeaders": ["*"],
               "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
               "AllowedOrigins": ["*"],
               "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"],
               "MaxAgeSeconds": 3600
           }
       ]
   }
   EOF
   ```

2. **Apply Configuration**
   ```bash
   aws s3api put-bucket-cors --bucket YOUR_BUCKET_NAME --cors-configuration file://cors-config.json
   ```

### Method 3: CloudDeck Auto-Configuration

CloudDeck includes a helper to automatically generate the correct CORS configuration:

1. **Access CORS Helper**
   - Try to connect to your S3 bucket in CloudDeck
   - If CORS is not configured, you'll see a CORS error message
   - Click "Copy CORS Config" button in the error message

2. **Apply Configuration**
   - The configuration will be copied to your clipboard
   - Paste it into your S3 bucket's CORS settings

## 🔒 Production Security Considerations

The configuration above uses `"*"` for `AllowedOrigins`, which allows access from any domain. For production use, you should restrict this to your specific domain(s):

### Secure Production Configuration

```json
[
    {
        "AllowedHeaders": [
            "Authorization",
            "Content-Length",
            "Content-Type",
            "x-amz-content-sha256",
            "x-amz-date",
            "x-amz-security-token",
            "x-amz-user-agent"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "https://yourdomain.com",
            "https://www.yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3600
    }
]
```

Replace `yourdomain.com` with your actual domain where CloudDeck is hosted.

### Multiple Environment Configuration

For development and production environments:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://yourdomain.com",
            "https://staging.yourdomain.com"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
    }
]
```

## 🧪 Testing CORS Configuration

### Test in CloudDeck
1. Open CloudDeck in your browser
2. Enter your AWS credentials
3. Try to connect to your S3 bucket
4. If successful, CORS is configured correctly

### Test with Browser Developer Tools
1. Open browser developer tools (F12)
2. Go to Network tab
3. Try to connect in CloudDeck
4. Check for CORS-related errors in the console

### Test with curl
```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://YOUR_BUCKET_NAME.s3.YOUR_REGION.amazonaws.com/
```

You should see CORS headers in the response.

## 🚨 Common CORS Issues and Solutions

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:**
- Check that CORS is configured on your bucket
- Verify the `AllowedOrigins` includes your domain or `"*"`
- Make sure you saved the CORS configuration

### Issue: "Method not allowed"

**Solution:**
- Add the required HTTP method to `AllowedMethods`
- Common methods needed: `GET`, `PUT`, `POST`, `DELETE`, `HEAD`

### Issue: "Header not allowed"

**Solution:**
- Add the header to `AllowedHeaders`
- Use `"*"` to allow all headers (development only)

### Issue: CORS works in development but not production

**Solution:**
- Update `AllowedOrigins` to include your production domain
- Remove `localhost` origins in production CORS config
- Ensure HTTPS is used in production

## 🔍 CORS Configuration Explanation

| Field | Purpose | Example |
|-------|---------|---------|
| `AllowedHeaders` | Headers that browsers can send | `["*"]` or `["Authorization", "Content-Type"]` |
| `AllowedMethods` | HTTP methods allowed | `["GET", "PUT", "POST", "DELETE"]` |
| `AllowedOrigins` | Domains that can access the bucket | `["*"]` or `["https://yourdomain.com"]` |
| `ExposeHeaders` | Headers browsers can access | `["ETag"]` |
| `MaxAgeSeconds` | How long to cache CORS info | `3600` (1 hour) |

## 📋 CORS Checklist

- [ ] S3 bucket exists and is accessible
- [ ] CORS configuration is applied to the bucket
- [ ] `AllowedOrigins` includes your domain/localhost
- [ ] `AllowedMethods` includes `GET`, `PUT`, `POST`, `DELETE`, `HEAD`
- [ ] `AllowedHeaders` includes required headers
- [ ] Configuration has been saved in AWS console
- [ ] Browser cache has been cleared
- [ ] CloudDeck connection test passes

## 🆘 Still Having Issues?

If you're still experiencing CORS problems:

1. **Double-check your bucket name** in CloudDeck matches exactly
2. **Verify region selection** matches your bucket's region
3. **Clear browser cache** and try again
4. **Check AWS CloudTrail** for API call logs
5. **Try a different browser** to rule out browser-specific issues
6. **Contact support** with your CORS configuration and error messages

---

**Need help?** Check our [main README](README.md) or create an issue on GitHub.
