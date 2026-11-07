export default {
  name: 'seo',
  title: 'SEO & Social Metadata',
  type: 'object',
  fields: [
    {
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'Optimal length: 50-60 characters',
      validation: Rule => Rule.max(70).warning('Titles longer than 70 characters may be truncated by search engines')
    },
    {
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Optimal length: 140-160 characters',
      validation: Rule => Rule.max(160).warning('Descriptions longer than 160 characters may be truncated')
    },
    {
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      description: 'The preferred URL of this page'
    },
    {
      name: 'ogImage',
      title: 'Open Graph Image (Social Sharing)',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text'
        }
      ]
    },
    {
      name: 'noIndex',
      title: 'Disallow Search Indexing (noindex)',
      type: 'boolean',
      initialValue: false,
      description: 'Prevent search engines from indexing this page'
    },
    {
      name: 'noFollow',
      title: 'Disallow Following Links (nofollow)',
      type: 'boolean',
      initialValue: false,
      description: 'Prevent search engines from crawling links on this page'
    }
  ]
};
