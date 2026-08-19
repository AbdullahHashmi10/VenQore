import { SEMANTIC_TOKENS, REQUIRED_ROLES } from '../../theme/contract.js';

export const tokens = {
  // Map semantic tokens to their CSS custom properties
  colors: SEMANTIC_TOKENS.reduce((acc, token) => {
    acc[token] = `var(--vq-${token})`;
    return acc;
  }, {}),
  
  roles: REQUIRED_ROLES.reduce((acc, role) => {
    acc[role] = `var(--vq-color-${role})`;
    return acc;
  }, {}),
  
  // Custom spacing and layout tokens
  spacing: {
    appPadding: 'var(--vq-spacing-app-padding, 1.5rem)',
    cardRadius: 'var(--vq-radius-card, 0.5rem)',
    buttonRadius: 'var(--vq-radius-button, 0.375rem)',
  }
};

export default tokens;
