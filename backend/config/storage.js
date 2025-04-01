import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();
const privateKey = process.env.GCLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!privateKey) {
  console.error('Private key is missing or not formatted correctly.');
} else {
  console.log('Private key loaded successfully.'); 
}

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT,
  credentials: {
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GCLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

export { bucket, uuidv4 };
