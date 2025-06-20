const contentful = require('contentful');
const fs = require('fs');
const path = require('path');

const client = contentful.createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

const navbarHtml = `
<nav class="navbar" role="navigation" aria-label="Main navigation">
  <div class="navbar-left">
    <a href="/" class="site-brand">
      <img src="/static/favicon.ico" alt="Pantry Pal Ai" class="favicon" />
      <span class="site-title">Pantry Pal Ai</span>
    </a>
  </div>

  <button class="navbar-toggle" aria-label="Toggle navigation" aria-expanded="false">
    &#9776;
  </button>

  <ul class="navbar-links">
    <li><a href="/blog">Blog</a></li>
    <li><a href="/faq">FAQ</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
`;

const navbarStyles = `
<style>
  html, body {
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Comfortaa', cursive, sans-serif;
    margin: 0;
    padding: 0;
    background: #fff8f0;
    color: #4a2c2a;
  }

  .site-brand {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: #4a2c2a;
    font-weight: 700;
    font-size: 1.2rem;
  }

  .site-brand:hover {
    color: #d2691e;
  }

  .favicon {
    height: 30px;
    width: 30px;
    margin-right: 8px;
  }

  .site-title {
    font-weight: 700;
    font-size: 1.2rem;
  }

  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #fff8f0;
    border-bottom: 3px solid #d2691e;
    padding: 0 20px;
    height: 50px;
    box-sizing: border-box;
    flex-shrink: 0;
    width: 100%;
  }

  .navbar-left {
    display: flex;
    align-items: center;
  }

  .navbar-links {
    list-style: none;
    display: flex;
    margin: 0;
    padding: 0;
    gap: 20px;
  }
  
  .navbar-links li {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 0;
  }
  
  .navbar-links li a {
    text-decoration: none;
    color: #4a2c2a;
    font-weight: 600;
    font-size: 1rem;
    /* Option A: flex centering */
    display: flex;
    align-items: center;
    /* line-height can be 1 or omitted */
    line-height: 1;
    /* remove vertical-align */
    /* vertical-align: middle;  -- remove this */
  }
  
  .navbar-links li a:hover {
    color: #d2691e;
  }

  .navbar-toggle {
    display: none;
    font-size: 1.8rem;
    background: none;
    border: none;
    cursor: pointer;
    color: #4a2c2a;
  }

  @media (max-width: 600px) {
    .post-hero h1 {
    font-size: 1.5rem;
    }
    .navbar {
      flex-wrap: wrap;
      height: auto;
      padding: 10px 20px;
    }

    .navbar-toggle {
      display: block;
    }

    .navbar-links {
      width: 100%;
      flex-direction: column;
      display: none;
      margin-top: 10px;
      gap: 10px;
    }

    .navbar-links.show {
      display: flex;
    }

    .container {
      max-width: 900px;
      margin: 40px auto;
      padding: 0 20px;
    }
  }
</style>
`;


const navbarScript = `
<script>
  const toggleButton = document.querySelector(".navbar-toggle");
  const navbarLinks = document.querySelector(".navbar-links");
  toggleButton.addEventListener("click", () => {
    const expanded = toggleButton.getAttribute("aria-expanded") === "true";
    toggleButton.setAttribute("aria-expanded", !expanded);
    navbarLinks.classList.toggle("show");
  });
</script>
`;


// Helper to render rich text (simplified, you can adapt yours)
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

// Helper to write a file, ensuring the folder exists
async function writeFile(filepath, content) {
  await fs.promises.mkdir(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, content, 'utf-8');
}

async function generateBlogPosts() {
  console.log('Fetching blog posts from Contentful...');
  const entries = await client.getEntries({
    content_type: 'blogPost',
    order: '-fields.publishDate', // newest first
  });

  if (!entries.items.length) {
    console.log('No blog posts found.');
    return [];
  }

  console.log(`Found ${entries.items.length} blog posts.`);

  const posts = [];

  for (const item of entries.items) {
    const fields = item.fields;

    const slug = fields.slug;
    const title = fields.title;
    const author = fields.author;
    const publishDate = fields.publishDate;
    const excerpt = fields.excerpt;
    const featuredImageUrl = fields.featuredImage?.fields.file.url || null;
    const bodyHtml = renderRichText(fields.bodyContent);

    // Basic HTML template for each blog post
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${fields.seoMetaTitle || title} | Pantry Pal Ai</title>
  <meta name="description" content="${fields.seoMetaDesc || excerpt}" />
  <link rel="canonical" href="https://pantrypalai.com/blog/${slug}" />
  <link href="https://fonts.googleapis.com/css2?family=Comfortaa&display=swap" rel="stylesheet" />
  ${navbarStyles}
  <style>
    body {
      font-family: 'Comfortaa', cursive, sans-serif;
      margin: 0;
      padding: 0;
      color: #4a2c2a;
      background: #fff8f0;
    }
    h1 { color: #a0522d; }
    a { color: #d2691e; }
    .author-date { font-style: italic; font-size: 0.9rem; margin-bottom: 20px; }
    .featured-img {
      width: 100%;
      max-width: 900px;
      height: auto;
      border-radius: 8px;
      margin: 20px 0;
    }
    .post-hero {
      max-width: 900px;
      margin: 0 auto 40px;
      text-align: center;
    }
    .post-hero h1 {
      color: #a0522d;
      margin-bottom: 10px;
      font-size: 2rem;
      word-wrap: break-word;
    }
    .container {
      max-width: 900px;
      margin: 40px auto;
      padding: 0 20px;
    }
  </style>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "image": "${featuredImageUrl || ''}",
    "author": {
      "@type": "Person",
      "name": "${author}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Pantry Pal Ai",
      "logo": {
        "@type": "ImageObject",
        "url": "https://pantrypalai.com/static/favicon.ico"
      }
    },
    "datePublished": "${publishDate}",
    "description": "${fields.seoMetaDesc || excerpt}"
  }
  </script>
</head>
<body>
  ${navbarHtml}
  <div class="container">
  <a href="/blog">← Back to blog</a>

  <div class="post-hero">
    ${featuredImageUrl ? `<img src="${featuredImageUrl}" alt="${title}" class="featured-img" />` : ''}
    <h1>${title}</h1>
    <div class="author-date">By ${author} | ${new Date(publishDate).toLocaleDateString()}</div>
  </div>

  <article>${bodyHtml}</article>
  </div>
  ${navbarScript}
</body>
</html>`;

    // Write the HTML file: e.g., blog/slug/index.html
    const filepath = path.join(__dirname, 'blog', slug, 'index.html');
    await writeFile(filepath, html);

    posts.push({ slug, publishDate, title, featuredImageUrl });
  }

  return posts;
}

async function generateBlogIndex(posts) {
  console.log('Generating blog index page...');

  const baseUrl = 'https://pantrypalai.com';

  const postsList = posts
  .map(
    (post) => `
      <li>
        ${post.featuredImageUrl ? `<img src="${post.featuredImageUrl}" alt="${post.title}" style="max-width: 300px; height: auto; border-radius: 6px; display: block; margin-              bottom: 8px;" />` : ''}
        <a href="/blog/${post.slug}">${post.title}</a>
        <span class="date">— ${new Date(post.publishDate).toLocaleDateString()}</span>
      </li>`
  )
  .join('\n');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Blog | Pantry Pal Ai</title>
  <meta name="description" content="Explore the latest recipe tips, AI cooking ideas, and kitchen hacks from Pantry Pal Ai." />
  <link rel="canonical" href="${baseUrl}/blog" />
  <link href="https://fonts.googleapis.com/css2?family=Comfortaa&display=swap" rel="stylesheet" />
  ${navbarStyles}
  <style>
    body {
      font-family: 'Comfortaa', cursive, sans-serif;
      margin: 0;
      padding: 0;
      color: #4a2c2a;
      background: #fff8f0;
    }
  
    h1 {
      text-align: center;
      margin-bottom: 40px;
      color: #a0522d;
    }
  
    a {
      color: #d2691e;
      text-decoration: none;
    }
  
    a:hover {
      text-decoration: underline;
    }
  
    .container {
      max-width: 900px;
      margin: 40px auto;
      padding: 0 20px;
    }
  
    ul.posts-list {
      list-style: none;
      padding: 0;
      max-width: 1200px;
      margin: 0 auto 60px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
    }
    
    ul.posts-list li {
      border: 1px solid #d2691e;
      border-radius: 8px;
      padding: 16px;
      background: #fff;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      text-align: center;
    }
    
    ul.posts-list li img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      display: block;
      margin: 0 auto 8px;
    }
    
    ul.posts-list li a {
      display: block;
      font-size: 1.1rem;
      font-weight: 600;
      color: #4a2c2a;
      text-decoration: none;
      margin: 12px 0 6px;
      word-wrap: break-word;
    }
    
    ul.posts-list li a:hover {
      color: #d2691e;
    }
    
    ul.posts-list li .date {
      font-size: 0.85rem;
      color: #555;
    }
  </style>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Pantry Pal Ai Blog",
    "url": "${baseUrl}/blog",
    "description": "Explore the latest recipe tips, AI cooking ideas, and kitchen hacks from Pantry Pal Ai."
  }
  </script>
</head>
<body>
  ${navbarHtml}
  <div class="container">
  <h1>Pantry Pal Ai Blog</h1>
  <ul class="posts-list">
    ${postsList}
  </ul>
  </div>
  ${navbarScript}
</body>
</html>`;

  const filepath = path.join(__dirname, 'blog', 'index.html');
  await writeFile(filepath, html);
}

async function generateSitemap(posts) {
  console.log('Generating sitemap.xml...');
  const baseUrl = 'https://pantrypalai.com';

  // Base URLs for static pages
  const latestPostDate = posts.length
    ? new Date(posts[0].publishDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: baseUrl + '/', priority: 1.0 },
    { loc: baseUrl + '/faq', priority: 0.8 },
    { loc: baseUrl + '/contact', priority: 0.8 },
    {
      loc: baseUrl + '/blog',
      priority: 0.9,
      lastmod: latestPostDate,
    },
  ];

  const urlsXml = staticUrls
  .map(
    (page) => `
  <url>
    <loc>${page.loc}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n');

  // Add blog post URLs
  const blogUrlsXml = posts
    .map(
      (post) => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.publishDate).toISOString().split('T')[0]}</lastmod>
    <priority>0.7</priority>
  </url>`
    )
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
${blogUrlsXml}
</urlset>`;

  const filepath = path.join(__dirname, 'sitemap.xml');
  await writeFile(filepath, sitemap);
}

async function main() {
  try {
    const posts = await generateBlogPosts();
    await generateBlogIndex(posts);
    await generateSitemap(posts);
    console.log('Build complete! Files saved to project root (blog posts in /blog and sitemap.xml)');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main();
