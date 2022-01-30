import * as dotenv from 'dotenv';
// Support .env file
dotenv.config();


export const gathoApiUrl = process.env.GATHO_API_URL as string;
/**
 * Howto get access token:
 * https://webapps.stackexchange.com/questions/131056/how-to-get-an-access-token-for-element-riot-matrix
 */
export const accessToken = process.env.MATRIX_ACCESS_TOKEN as string;
export const homeserverUrl = process.env.MATRIX_HOMESERVER_URL as string;
export const username = process.env.MATRIX_BOT_USERNAME as string;
export const password = process.env.MATRIX_BOT_PASSWORD as string;

export const secret_matrix_bot_key = process.env.GATHO_API_SECRET_KEY as string;
if(gathoApiUrl === undefined) {
  console.error("GATHO_API_URL env variable is undefined");
  process.exit(1);
}
if(accessToken === undefined) {
  console.error("MATRIX_ACCESS_TOKEN env variable is undefined");
  process.exit(1);
}
if(homeserverUrl === undefined) {
  console.error("MATRIX_HOMESERVER_URL env variable is undefined");
  process.exit(1);
}
if(username === undefined) {
  console.error("MATRIX_BOT_USERNAME env variable is undefined");
  process.exit(1);
}
if(password === undefined) {
  console.error("MATRIX_BOT_PASSWORD env variable is undefined");
  process.exit(1);
}
if(secret_matrix_bot_key === undefined) {
  console.error("GATHO_API_SECRET_KEY env variable is undefined");
  process.exit(1);
}