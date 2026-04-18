import App from './App';

test('App module exports a component', () => {
  expect(App).toBeDefined();
  expect(typeof App).toBe('function');
});
