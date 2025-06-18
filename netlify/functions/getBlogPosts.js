const contentful = require('contentful');

const client = contentful.createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

exports.handler = async function(event, context) {
  try {
    const entries = await client.getEntries({
      content_type: 'blogPost',
      order: '-fields.publishDate',
    });

    // Map entries to a simple JSON structure
    const posts = entries.items.map(item => ({
      title: item.fields.title,
      slug: item.fields.slug,
      author: item.fields.author,
      publishDate: item.fields.publishDate,
      excerpt: item.fields.excerpt,
      featuredImageUrl: item.fields.featuredImage?.fields.file.url || null,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ posts }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
