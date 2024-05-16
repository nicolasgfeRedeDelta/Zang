import fs from 'fs';
import { join } from 'path';

interface Request {
  media: any;
}

const RemoveMediaService = async (media: any) => {
  await fs.promises.unlink(join(__dirname, '..', '..', '..', 'public', media));
  return
};

export default RemoveMediaService;
