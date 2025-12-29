const React = require("react");

// Manual mock para @heroui/ripple
module.exports = {
  Ripple: ({ children }) => children,
  useRipple: () => ({
    ripples: [],
    onRipplePressHandler: (e) => {
      // Simplemente retornar el evento sin procesar
      if (e && typeof e === 'object' && 'persist' in e) {
        e.persist?.();
      }
      return e;
    },
    onClear: jest.fn(),
  }),
};
