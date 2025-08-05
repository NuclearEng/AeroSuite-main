module.exports = {
  renderHook: jest.fn(() => ({ result: { current: {} } })),
  act: jest.fn((cb) => cb())
}; 