const contentful = require('contentful');

const client = contentful.createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

exports.handler = async function(event, context) {
  try {
    const entries = await client.getEntries({
      content_type: 'blogPost',
    });

    const posts = entries.items;

    const latestPostDate = posts.length
    ? new Date(posts[0].sys.updatedAt).toISOString().split('T')[0]
    : '2025-06-20';

    const urls = posts.map(item => {
      return `<url>
        <loc>https://pantrypalai.com/blog/${item.fields.slug}</loc>
        <lastmod>${new Date(item.sys.updatedAt).toISOString().split('T')[0]}</lastmod>
        <priority>0.7</priority>
      </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
          <loc>https://pantrypalai.com/</loc>
          <lastmod>2025-06-20</lastmod>
          <priority>1.0</priority>
        </url>
        <url>
          <loc>https://pantrypalai.com/blog</loc>
          <lastmod>${latestPostDate}</lastmod>
          <priority>1.0</priority>
        </url>
        <url>
          <loc>https://pantrypalai.com/faq</loc>
          <lastmod>2025-06-20</lastmod>
          <priority>1.0</priority>
        </url>
        <url>
          <loc>https://pantrypalai.com/contact</loc>
          <lastmod>2025-06-20</lastmod>
          <priority>1.0</priority>
        </url>
        ${urls}
      </urlset>
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
      body: sitemap,
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: `Error generating sitemap: ${error.message}`,
    };
  }
};
