import dbConnect from '../src/lib/server/utils/db';
import { BiometricProfile } from '../src/lib/server/models';

async function clearBiometrics() {
  await dbConnect();
  const result = await BiometricProfile.deleteMany({});
  console.log('Deleted:', result.deletedCount, 'biometric records');
  process.exit(0);
}

clearBiometrics().catch(e => {
  console.error(e);
  process.exit(1);
});
