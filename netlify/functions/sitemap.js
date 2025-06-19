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

    const urls = posts.map(item => {
      return `<url>
        <loc>https://pantrypalai.com/blog-post.html?slug=${item.fields.slug}</loc>
        <lastmod>${new Date(item.sys.updatedAt).toISOString()}</lastmod>
      </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
          <loc>https://pantrypalai.com/</loc>
        </url>
        <url>
          <loc>https://pantrypalai.com/blog</loc>
        </url>
        <url>
          <loc>https://pantrypalai.com/faq</loc>
        </url>
        <url>
          <loc>https://pantrypalai.com/contact</loc>
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
