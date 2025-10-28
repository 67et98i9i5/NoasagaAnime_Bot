import { connectDB } from './mongo.js';
import UserData from './models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDB();

try {
  const users = await UserData.find({}).lean();
  const outputPath = path.resolve(__dirname, '../../data/db_export.js');
  const fileContent = `export const dbData = ${JSON.stringify(users, null, 2)};`;

  fs.writeFileSync(outputPath, fileContent);
  console.log(`Data exported to ${outputPath}`);
  process.exit(0);
} catch (err) {
  console.error('Error exporting data:', err);
  process.exit(1);
}
