import React from 'react';
import { Link } from 'react-router-dom';

const SetupGuide = () => {
  const corsConfiguration = `
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
  `.trim();

  return (
    <div className="bg-primary-bg min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto bg-neutral-white rounded-lg shadow-lg p-6 sm:p-8 md:p-12 border border-neutral-borders">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-6 sm:mb-8 text-center">CloudDeck Setup Guide</h1>
        
        <p className="text-md sm:text-lg text-text-secondary mb-8 sm:mb-10 text-center">
          Follow these steps to connect your AWS account and start managing your S3 buckets seamlessly.
        </p>
        
        <div className="space-y-10 sm:space-y-12">
          
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-5 sm:mb-6 border-b pb-3">1. Getting Your AWS Credentials</h2>
            <p className="text-text-secondary mb-6">
              To connect to your account, CloudDeck needs an AWS Access Key. For security, we recommend creating a dedicated IAM user with specific permissions.
            </p>
            <ol className="list-decimal list-inside space-y-4 text-text-secondary">
              <li>Sign in to the <a href="https://aws.amazon.com/console/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">AWS Management Console</a> and navigate to the <strong>IAM</strong> service.</li>
              <li>Go to the <strong>Users</strong> page in the sidebar and click the <strong>"Create user"</strong> button.</li>
              <li>Enter a descriptive user name, like <code>CloudDeck-User</code>, and click <strong>"Next"</strong>.</li>
              <li>In the permissions step, select <strong>"Attach policies directly"</strong>.</li>
              <li>Search for the <code>AmazonS3FullAccess</code> policy, check the box next to it, and click <strong>"Next"</strong>.</li>
              <li>Review the details and click <strong>"Create user"</strong>.</li>
              <li>Open the new user's page, and go to the <strong>"Security credentials"</strong> tab.</li>
              <li>Scroll down to <strong>"Access keys"</strong> and click <strong>"Create access key"</strong>.</li>
              <li>Select <strong>"Third-party service"</strong> as the use case, confirm the recommendation, and click <strong>"Next"</strong>.</li>
              <li>Click <strong>"Create access key"</strong>. AWS will now show you the <strong>Access Key ID</strong> and the <strong>Secret Access Key</strong>.</li>
              <li className="p-4 bg-yellow-50 border border-yellow-300 rounded-md">
                <strong>Important:</strong> This is your only opportunity to view and save the <strong>Secret Access Key</strong>. Copy both keys and store them in a secure location.
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-5 sm:mb-6 border-b pb-3">2. Configuring Your S3 Bucket for Web Access (CORS)</h2>
            <p className="text-text-secondary mb-6">
              This step is required to allow the CloudDeck web application to securely interact with the files in your S3 bucket directly from your browser.
            </p>
            <ol className="list-decimal list-inside space-y-4 text-text-secondary">
              <li>In the AWS Console, navigate to the <strong>Amazon S3</strong> service.</li>
              <li>Click on the name of the bucket you want to manage with CloudDeck.</li>
              <li>Go to the <strong>"Permissions"</strong> tab.</li>
              <li>Scroll down to the <strong>"Cross-origin resource sharing (CORS)"</strong> section and click <strong>"Edit"</strong>.</li>
              <li>Copy the JSON configuration below and paste it into the text editor:</li>
              <pre className="bg-gray-50 p-4 rounded-md mt-2 border border-neutral-borders text-sm text-left overflow-x-auto"><code>{corsConfiguration}</code></pre>
              <li className="p-4 bg-blue-50 border border-blue-300 rounded-md">
                <strong>Security Note:</strong> For production use, it is recommended to replace <code>"*"</code> in <code>AllowedOrigins</code> with the specific domain where you are hosting CloudDeck.
              </li>
              <li>Click <strong>"Save changes"</strong>.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-5 sm:mb-6 border-b pb-3">3. Connecting to CloudDeck</h2>
            <p className="text-text-secondary mb-6">
              With your credentials and CORS policy in place, you are ready to connect.
            </p>
            <ol className="list-decimal list-inside space-y-4 text-text-secondary">
              <li>Return to the CloudDeck application home page.</li>
              <li>Click the <strong>"Add your bucket"</strong> button.</li>
              <li>Enter the <strong>Access Key ID</strong> and <strong>Secret Access Key</strong> you saved from Step 1 into the connection modal.</li>
              <li>Click <strong>"Connect"</strong> to initialize the connection and begin managing your files.</li>
            </ol>
          </div>

        </div>
        <div className="text-center mt-12">
          <Link to="/">
            <button 
              className="w-full sm:w-auto bg-text-primary text-neutral-white text-[16px] sm:text-[18px] md:text-[24px] font-[600] px-6 py-3 sm:px-8 sm:py-4 md:px-12 md:py-6 rounded-[32px] border-none cursor-pointer transition-all duration-300 hover:bg-[#333333] transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-text-primary/30 shadow-lg hover:shadow-xl"
            >
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;