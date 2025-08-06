import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
});

afterAll(async () => {
  jest.clearAllTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
});