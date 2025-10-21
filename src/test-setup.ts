// Global test setup to handle cleanup
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

// Handle unhandled promise rejections that might keep the process alive
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
