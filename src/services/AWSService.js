const S3 = require('aws-s3');
const Aws = require('../config/aws-config');

class AwsService {
    constructor(filepath="./") {
        this.S3Client = new S3(Aws.config(filepath));
    };

    async uploadFile(file, filename) {
        try{

            await this.S3Client
                .uploadFile(file, filename)
                .then(bucket => {return bucket});

        } catch(error) {
            console.log(`AWS Error: \n${error}`);
            throw Error(`AWS Upload Error: \n${error}`);
        }
    }

    async deleteFile(filename) {
        try{

            await this.S3Client
                .deleteFile(filename)
                .then(bucket => {return bucket});

        } catch(error) {
            console.log(`AWS Error: \n${error}`);
            throw Error(`AWS Delete Error: \n${error}`);
        }
    }


}