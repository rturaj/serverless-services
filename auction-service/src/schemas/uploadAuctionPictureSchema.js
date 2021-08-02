export default {
  type: 'object',
  properties: {
    body: {
      type: 'string',
      minLength: 1,
      pattern: '=$',
    },
  },
  required: ['body'],
};
