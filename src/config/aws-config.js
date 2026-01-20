const { AWS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_URL, AWS_BUCKET_NAME } = require("../../envVars")

class Aws {

    static config(filepath='./') {
        return {
            bucketName: AWS_BUCKET_NAME || "task-management-api-uploads",
            dirName: filepath, /* optional */
            region: 'eu-west-1',
            accessKeyId: AWS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
            s3Url: AWS_S3_URL /* optional */
        }
        
    }
}

module.exports = Aws;