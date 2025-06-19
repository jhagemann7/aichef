const contentful = require('contentful');

const client = contentful.createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

// Manual rich text renderer
function renderRichText(node) {
  if (!node) return '';

  if (Array.isArray(node)) {
    return node.map(renderRichText).join('');
  }

  switch (node.nodeType) {
    case 'document':
      return renderRichText(node.content);
    case 'paragraph':
      return `<p>${renderRichText(node.content)}</p>`;
    case 'heading-1':
      return `<h1>${renderRichText(node.content)}</h1>`;
    case 'heading-2':
      return `<h2>${renderRichText(node.content)}</h2>`;
    case 'heading-3':
      return `<h3>${renderRichText(node.content)}</h3>`;
    case 'unordered-list':
      return `<ul>${renderRichText(node.content)}</ul>`;
    case 'ordered-list':
      return `<ol>${renderRichText(node.content)}</ol>`;
    case 'list-item':
      return `<li>${renderRichText(node.content)}</li>`;
    case 'hyperlink':
      return `<a href="${node.data.uri}" target="_blank" rel="noopener noreferrer">${renderRichText(node.content)}</a>`;
    case 'text':
      let text = node.value;
      if (node.marks && node.marks.length) {
        node.marks.forEach((mark) => {
          if (mark.type === 'bold') text = `<strong>${text}</strong>`;
          if (mark.type === 'italic') text = `<em>${text}</em>`;
          if (mark.type === 'underline') text = `<u>${text}</u>`;
        });
      }
      return text;
    default:
      return node.content ? renderRichText(node.content) : '';
  }
}

exports.handler = async function(event, context) {
  const { slug } = event.queryStringParameters;

  if (!slug) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing slug parameter' }),
    };
  }

  try {
    const entries = await client.getEntries({
      content_type: 'blogPost',
      'fields.slug': slug,
      limit: 1,
    });

    if (!entries.items.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Post not found' }),
      };
    }

    const item = entries.items[0].fields;

    const bodyHtml = renderRichText(item.bodyContent);

    const post = {
      title: item.title,
      slug: item.slug,
      author: item.author,
      publishDate: item.publishDate,
      excerpt: item.excerpt,
      featuredImageUrl: item.featuredImage?.fields.file.url || null,
      bodyHtml: bodyHtml,
      seoMetaTitle: item.seoMetaTitle,
      seoMetaDesc: item.seoMetaDesc,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ post }),
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
