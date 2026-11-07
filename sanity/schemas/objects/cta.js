export default {
  name: 'cta',
  title: 'Call to Action Button',
  type: 'object',
  fields: [
    {
      name: 'label',
      title: 'Button Label',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'url',
      title: 'Target URL',
      type: 'string',
      description: 'e.g. /studio.html, https://instagram.com, or #pricing',
      validation: Rule => Rule.required()
    },
    {
      name: 'style',
      title: 'Visual Style',
      type: 'string',
      options: {
        list: [
          { title: 'Primary (Gradient Glow)', value: 'primary' },
          { title: 'Secondary (Subtle Glass)', value: 'secondary' },
          { title: 'Outline', value: 'outline' }
        ],
        layout: 'radio'
      },
      initialValue: 'primary'
    },
    {
      name: 'isExternal',
      title: 'Open in New Window / Tab',
      type: 'boolean',
      initialValue: false
    }
  ]
};
