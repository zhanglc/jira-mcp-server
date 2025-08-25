import * as dotenv from 'dotenv';

dotenv.config();

global.beforeEach(() => {
  jest.clearAllMocks();
});

export {};