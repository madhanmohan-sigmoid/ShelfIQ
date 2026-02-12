// Converted from vitest to jest syntax
describe('Dummy Test Suite', () => {
  it('should pass - basic arithmetic', () => {
    expect(2 + 2).toBe(4);
  });

  it('should pass - string comparison', () => {
    expect('hello').toBe('hello');
  });

  it('should pass - array length', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
  });
});
