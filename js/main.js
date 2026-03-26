/**
 * Main JavaScript for Personal Website
 * Handles all page functionality including content loading, theme switching, and interactions
 * 
 * Wrapped in IIFE to avoid polluting global scope
 */
(function() {
    'use strict';

    /**
     * ===================================================================
     *                    SUPABASE CONFIGURATION
     * ===================================================================
     */
    const SUPABASE_URL  = 'https://pcqaiztmkdrcsplwbvej.supabase.co';
    const SUPABASE_ANON = 'sb_publishable_87vzWy_5tTOm9hw5luhsgA_2YBixaE7';

    /**
     * ===================================================================
     *                    CONFIGURATION LOADING
     * ===================================================================
     */

    // Cache for the loaded YAML config
    let siteConfig = null;

    /**
     * Load and parse the YAML configuration file
     * @returns {Promise<object>} Parsed configuration object
     */
    async function loadConfig() {
        if (siteConfig) {
            return siteConfig;
        }
        
        try {
            // Determine the correct path based on current location
            const configPath = window.BLOG_POST_ID ? '../content/site/config.yaml' : 'content/site/config.yaml';
            const response = await fetch(configPath, { cache: 'no-store' });
            const yamlText = await response.text();
            siteConfig = jsyaml.load(yamlText);
            return siteConfig;
        } catch (error) {
            console.error('Error loading config:', error);
            return null;
        }
    }

    /**
     * Load and parse a YAML content file
     * @param {string} path - Path to YAML file
     * @returns {Promise<object|array>} Parsed YAML data
     */
    async function loadYaml(path) {
        try {
            // If we're in a blog post (has BLOG_POST_ID) and path starts with 'blogs/',
            // the path is already correct (we're in blogs/ directory)
            let adjustedPath = path;
            if (window.BLOG_POST_ID && path.startsWith('blogs/')) {
                adjustedPath = path.substring('blogs/'.length);
            }
            const response = await fetch(adjustedPath, { cache: 'no-store' });
            const yamlText = await response.text();
            return jsyaml.load(yamlText);
        } catch (error) {
            console.error(`Error loading YAML from ${path}:`, error);
            return null;
        }
    }

    /**
     * ===================================================================
     *                    UTILITY FUNCTIONS
     * ===================================================================
     */

    /**
     * Format a date string into human-readable format
     * @param {string} dateString - ISO date string
     * @param {object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date string
     */
    function formatDate(dateString, options = { year: 'numeric', month: 'long', day: 'numeric' }) {
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    /**
     * Convert basic markdown formatting to HTML
     * Handles bold text, links, and paragraph breaks
     * @param {string} markdown - Raw markdown text
     * @returns {string} HTML formatted text
     */
    function convertSimpleMarkdownToHtml(markdown) {
        return markdown
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')  // Bold text
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')  // Links
            .replace(/\n\n+/g, '</p><p>')  // Paragraph breaks
            .replace(/^/, '<p>')  // Start with paragraph
            .replace(/$/, '</p>');  // End with paragraph
    }

    /**
     * Apply inline markdown formatting (bold, italic, links)
     * Used for single-line text like titles and descriptions
     * @param {string} text - Text with markdown formatting
     * @returns {string} HTML formatted text
     */
    function formatInlineMarkdown(text) {
        return text
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')  // Links
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')  // Bold
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');  // Italic
    }

/**
 * Parse markdown to HTML for blog posts
 * Handles headings, links, bold, italic, and paragraphs
 * @param {string} markdown - Raw markdown text
 * @returns {string} HTML formatted text
 */
function parseMarkdown(markdown) {
    // Remove frontmatter (YAML between ---)
    markdown = markdown.replace(/^---[\s\S]*?---\n/, '');

    // Replace {{TOC}} placeholder with a DOM anchor the TOC generator will find
    markdown = markdown.replace(/\{\{TOC\}\}/g, '<div id="toc-placeholder"></div>');

    let html = markdown;

    const escapeHtml = (text) => text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Extract fenced code blocks first so markdown formatting doesn't alter them
    const codeBlocks = [];
    html = html.replace(/```([\s\S]*?)```/g, (match, innerContent) => {
        let language = '';
        let code = '';

        const normalized = (innerContent || '').replace(/^\n/, '');

        if (normalized.includes('\n')) {
            const lines = normalized.split('\n');
            const firstLine = (lines[0] || '').trim();

            if (/^[A-Za-z0-9_-]+$/.test(firstLine)) {
                language = firstLine;
                code = lines.slice(1).join('\n');
            } else {
                code = normalized;
            }
        } else {
            const singleLine = normalized.trim();
            const inlineMatch = singleLine.match(/^([A-Za-z0-9_-]+)\s+([\s\S]+)$/);

            if (inlineMatch) {
                language = inlineMatch[1];
                code = inlineMatch[2];
            } else {
                code = singleLine;
            }
        }

        const blockIndex = codeBlocks.length;
        codeBlocks.push({
            language,
            code: code.replace(/\n$/, '')
        });
        return `@@CODEBLOCK_${blockIndex}@@`;
    });
    
    // Parse headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Parse links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Unescape markdown-escaped punctuation outside fenced code blocks
    html = html.replace(/\\([\\`*_{}\[\]()#+\-.!])/g, '$1');
    
    // Parse bold **text** or __text__
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Parse italic *text* (avoid matching list bullets like "* item")
    html = html.replace(/\*(\S(?:[^*\n]*\S)?)\*/g, '<em>$1</em>');

    // Parse inline code `code`
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    
    // Parse lists - handle both unordered (-) and ordered (1.)
    const blocks = html.split(/\n\n+/);
    html = blocks.map(block => {
        block = block.trim();
        if (!block) return '';
        
        // Check for unordered list (lines starting with - or *)
        const isUnorderedList = block.split('\n').every(line => 
            line.trim().match(/^[-*]\s/) || line.trim() === ''
        );
        
        if (isUnorderedList && block.match(/^\s*[-*]\s/m)) {
            const listItems = block.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const match = line.match(/^\s*[-*]\s+(.+)$/);
                    return match ? `<li>${match[1]}</li>` : '';
                })
                .join('\n');
            return `<ul>\n${listItems}\n</ul>`;
        }
        
        // Check for ordered list (lines starting with numbers)
        const isOrderedList = block.split('\n').every(line => 
            line.trim().match(/^\d+\.\s/) || line.trim() === ''
        );
        
        if (isOrderedList && block.match(/^\s*\d+\.\s/m)) {
            const listItems = block.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const match = line.match(/^\s*\d+\.\s+(.+)$/);
                    return match ? `<li>${match[1]}</li>` : '';
                })
                .join('\n');
            return `<ol>\n${listItems}\n</ol>`;
        }
        
        // Don't wrap if it's already an HTML tag
        if (block.match(/^@@CODEBLOCK_\d+@@$/)) {
            return block;
        }

        if (block.startsWith('<h') || block.startsWith('<figure') ||
            block.startsWith('<ul') || block.startsWith('<ol') ||
            block.startsWith('<div') || block.startsWith('</')) {
            return block;
        }
        return '<p>' + block.replace(/\n/g, '<br>\n') + '</p>';
    }).join('\n');

    // Restore code blocks at the end to preserve exact formatting
    html = html.replace(/@@CODEBLOCK_(\d+)@@/g, (match, index) => {
        const block = codeBlocks[Number(index)];
        if (!block) return '';

        const languageClass = block.language ? ` class="language-${block.language}"` : '';
        const languageAttribute = block.language ? ` data-language="${escapeHtml(block.language)}"` : '';
        return `<pre${languageAttribute}><code${languageClass}>${escapeHtml(block.code)}</code></pre>`;
    });
    
    return html;
}

/**
 * Initialize theme toggle functionality
 * Handles dark/light mode switching and persistence
 */
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    if (!themeToggle) return;
    
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    // Apply saved theme
    if (savedTheme === 'dark') {
        htmlElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
    } else {
        htmlElement.setAttribute('data-theme', 'light');
        themeToggle.textContent = '🌙';
    }
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
}


/**
 * ===================================================================
 *                    TIMELINE FUNCTIONS
 * ===================================================================
 */

/**
 * Load timeline from JSON
 * Displays timeline items sorted by date (most recent first)
 */
async function loadTimeline() {
    try {
        const timeline = await loadYaml('content/timeline/timeline.yaml');
        const listContainer = document.getElementById('timeline-list');
        
        if (!listContainer || !timeline) return;
        
        // Sort by start date (most recent first)
        timeline.sort((a, b) => {
            const dateA = new Date(a.start_date);
            const dateB = new Date(b.start_date);
            return dateB - dateA;
        });
        
        const timelineItems = timeline.map(item => {
            const startDate = new Date(item.start_date);
            const startYear = startDate.getFullYear();
            
            let endYear = '';
            if (item.end_date) {
                if (item.end_date.toLowerCase() === 'present') {
                    endYear = 'Present';
                } else {
                    const endDate = new Date(item.end_date);
                    endYear = endDate.getFullYear();
                }
            }
            
            const yearRange = endYear ? `${startYear} - ${endYear}` : `${startYear} -`;
            
            // Format description with markdown support and paragraph breaks
            let formattedDescription = item.description || '';
            formattedDescription = formatInlineMarkdown(formattedDescription);
            // Support paragraph breaks with \n\n
            formattedDescription = formattedDescription.replace(/\n\n/g, '</p><p class="timeline-description">');

            // Always start timeline entry with the position title
            const formattedTitle = formatInlineMarkdown(item.title || '');
            
            // Make logo clickable if URL exists
            const logoHTML = item.url 
                ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="timeline-logo-link"><img src="${item.logo}" alt="${item.organization} logo" class="timeline-logo"></a>`
                : `<img src="${item.logo}" alt="${item.organization} logo" class="timeline-logo">`;
            
            return `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-year">${yearRange}</div>
                ${logoHTML}
                <div class="timeline-content">
                    <p class="timeline-title">${formattedTitle}</p>
                    <p class="timeline-description">${formattedDescription}</p>
                </div>
            </div>
            `;
        });
        
        listContainer.innerHTML = timelineItems.join('');
    } catch (error) {
        console.error('Error loading timeline:', error);
    }
}


/**
 * ===================================================================
 *                    MEDIA FUNCTIONS
 * ===================================================================
 */

/**
 * Load and display media/highlights from media.json
 * Creates YouTube embed iframes with optional timestamps
 */
async function loadMedia() {
    try {
        const mediaItems = await loadYaml('content/media/media.yaml');
        
        const container = document.getElementById('media-list');
        if (!container || !mediaItems) return;

        const sortedItems = [...mediaItems].sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
        });

        const hasVideos = sortedItems.some(item => item.video_id);
        container.classList.toggle('news-list', !hasVideos);
        
        const mediaCards = sortedItems.map(item => {
            const formattedTitle = formatInlineMarkdown(item.title || '');
            const formattedDescription = formatInlineMarkdown(item.description || '');

            if (item.video_id) {
                const videoUrl = item.timestamp
                    ? `https://www.youtube.com/embed/${item.video_id}?start=${item.timestamp}`
                    : `https://www.youtube.com/embed/${item.video_id}`;

                return `
                <div class="media-item">
                    <div class="media-thumbnail">
                        <iframe 
                            src="${videoUrl}" 
                            title="${item.title}"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    <div class="media-info">
                        <h3>${formattedTitle}</h3>
                        <p>${formattedDescription}</p>
                    </div>
                </div>
                `;
            }

            const dateLine = item.date ? formatDate(item.date) : '';

            // Format title and description with markdown support
            return `
                <article class="media-item news-item">
                <div class="media-info">
                    <p class="news-date">${dateLine}</p>
                    <h3>${formattedTitle}</h3>
                    <p>${formattedDescription}</p>
                </div>
                </article>
            `;
        });
        
        container.innerHTML = mediaCards.join('');
        
    } catch (error) {
        console.error('Error loading media:', error);
    }
}


/**
 * ===================================================================
 *                    MAIN PAGE FUNCTIONS (index.html)
 * ===================================================================
 */

/**
 * Load site metadata (name, role, affiliation) from site.json
 * Updates the site name, role title, affiliation, and footer name
 */
async function loadSiteMetadata() {
    try {
        const config = await loadConfig();
        if (!config) return;
        
        // Update site name in header
        const siteNameElement = document.getElementById('site-name');
        if (siteNameElement && config.site?.name) {
            siteNameElement.textContent = config.site.name;
        }
        
        // Update page title
        const pageTitleElement = document.getElementById('page-title');
        if (pageTitleElement && config.site?.page_title) {
            pageTitleElement.textContent = config.site.page_title;
        }
        
        // Update nationality flags (optional)
        const nationalityFlagsElement = document.getElementById('nationality-flags');
        if (nationalityFlagsElement && config.site?.nationality_flags) {
            nationalityFlagsElement.textContent = config.site.nationality_flags;
        }
        
        // Update role information
        const roleTitleElement = document.getElementById('role-title');
        const roleAffiliationElement = document.getElementById('role-affiliation');
        if (roleTitleElement && config.site?.role?.title) {
            roleTitleElement.textContent = config.site.role.title;
        }
        if (roleAffiliationElement && config.site?.role?.affiliation) {
            roleAffiliationElement.textContent = config.site.role.affiliation;
        }
        
        // Update footer name
        const footerNameElement = document.getElementById('footer-name');
        if (footerNameElement && config.site?.footer_name) {
            footerNameElement.textContent = config.site.footer_name;
        }
    } catch (error) {
        console.error('Error loading site metadata:', error);
    }
}

/**
 * Load layout configuration for navigation and section titles
 * Updates navigation links, section headings, and footer content
 */
async function loadLayoutConfiguration() {
    try {
        const config = await loadConfig();
        if (!config) return;
        
        // Build navigation menu
        const navLinksElement = document.getElementById('nav-links');
        if (navLinksElement && config.layout?.header?.navigation) {
            // Preserve theme toggle button
            const themeButton = navLinksElement.querySelector('#theme-toggle');
            navLinksElement.innerHTML = '';
            
            // Add navigation links
            config.layout.header.navigation.forEach(navItem => {
                const linkElement = document.createElement('a');
                let href = navItem.href;
                
                // Replace {{cv_url}} placeholder with actual CV URL
                if (href.includes('{{cv_url}}') && config.site?.cv_url) {
                    href = href.replace('{{cv_url}}', config.site.cv_url);
                }
                
                linkElement.href = href;
                linkElement.innerHTML = navItem.label;
                
                // Add target="_blank" for external links (like CV)
                if (navItem.is_external) {
                    linkElement.target = '_blank';
                    linkElement.rel = 'noopener noreferrer';
                }
                
                navLinksElement.appendChild(linkElement);
            });
            
            // Re-add theme toggle button
            if (themeButton) {
                navLinksElement.appendChild(themeButton);
            }
        }
        
        // Update section titles
        const updateSectionTitle = (elementId, title) => {
            const element = document.getElementById(elementId);
            if (element && title) {
                element.innerHTML = title;
            }
        };
        
        updateSectionTitle('publications-heading', config.layout?.sections?.publications?.title);
        updateSectionTitle('blog-heading', config.layout?.sections?.blog?.title);
        updateSectionTitle('media-heading', config.layout?.sections?.media?.title);
        
        // Update blog subtitle
        const blogSubtitleElement = document.getElementById('blog-subtitle');
        if (blogSubtitleElement && config.layout?.sections?.blog?.subtitle) {
            blogSubtitleElement.textContent = config.layout.sections.blog.subtitle;
        }
        
        // Update publications note with Google Scholar link
        const publicationsNoteElement = document.querySelector('.publications-note');
        if (publicationsNoteElement && config.layout?.sections?.publications?.note && config.site?.google_scholar_url) {
            const noteHtml = config.layout.sections.publications.note.replace('{{google_scholar_url}}', config.site.google_scholar_url);
            publicationsNoteElement.innerHTML = noteHtml;
        }
        
        // Update footer content
        const footerTaglineElement = document.getElementById('footer-tagline');
        const footerYearElement = document.getElementById('footer-year');
        const footerLicenseElement = document.getElementById('footer-license');
        
        if (footerTaglineElement && config.layout?.footer?.tagline) {
            footerTaglineElement.textContent = config.layout.footer.tagline;
        }
        if (footerYearElement && config.layout?.footer?.year) {
            footerYearElement.textContent = config.layout.footer.year;
        }
        if (footerLicenseElement && config.layout?.footer?.license_text) {
            const licenseUrl = config.layout.footer.license_url || '#';
            footerLicenseElement.href = licenseUrl;
            footerLicenseElement.textContent = config.layout.footer.license_text;
        }
    } catch (error) {
        console.error('Error loading layout configuration:', error);
    }
}

/**
 * Load profile content from config or fallback to bio.md
 * Converts markdown formatting to HTML for display
 */
async function loadProfileContent() {
    try {
        const config = await loadConfig();
        let markdownContent;
        
        if (config?.site?.profile) {
            // Use profile content from config
            markdownContent = config.site.profile;
        } else {
            // Fallback to bio.md file
            const bioResponse = await fetch('content/site/bio.md', { cache: 'no-store' });
            markdownContent = await bioResponse.text();
        }
        
        // Convert markdown to HTML (supports lists, links, emphasis, paragraphs)
        const htmlContent = parseMarkdown(markdownContent);
        const profileElement = document.getElementById('profile-content');
        if (profileElement) {
            profileElement.innerHTML = htmlContent;
        }
        
    } catch (error) {
        console.error('Error loading profile content:', error);
    }
}

/**
 * Load social links from config and create clickable icons
 * Handles both emoji and image-based social icons
 */
async function loadSocialLinks() {
    try {
        const config = await loadConfig();
        if (!config) return;
        
        const contacts = config.contacts;
        const socialsContainer = document.getElementById('profile-socials');
        
        if (!socialsContainer || !contacts) return;
        
        contacts.forEach(contact => {
            const socialLink = document.createElement('a');
            socialLink.href = contact.url;
            socialLink.target = '_blank';
            socialLink.rel = 'noopener noreferrer';
            socialLink.className = 'social-link';
            socialLink.title = contact.name;
            
            if (contact.is_image) {
                socialLink.innerHTML = `<img src="${contact.icon}" alt="${contact.name}" class="social-icon-img">`;
            } else {
                socialLink.innerHTML = `<span class="social-icon">${contact.icon}</span>`;
            }
            
            socialsContainer.appendChild(socialLink);
        });
    } catch (error) {
        console.error('Error loading social links:', error);
    }
}

/**
 * Load publications from publications.json and render publication cards
 * Creates interactive publication entries with available resource buttons
 */
async function loadPublications() {
    try {
        const config = await loadConfig();
        const publications = await loadYaml('content/publications/publications.yaml');
        const listContainer = document.getElementById('publications-list');
        
        if (!listContainer || !publications) return;
        
        const publicationCards = publications.map(pub => {
            // Build buttons HTML for available resources
            const buttons = [
                { key: 'paper', label: 'Paper', url: pub.paper || pub.link },
                { key: 'code', label: 'Code', url: pub.code },
                { key: 'poster', label: 'Poster', url: pub.poster },
                { key: 'slides', label: 'Slides', url: pub.slides },
                { key: 'video', label: 'Video', url: pub.video },
                { key: 'demo', label: 'Demo', url: pub.demo }
            ];
            
            const availableButtons = buttons.filter(btn => btn.url);
            const buttonsHTML = availableButtons.length > 0
                ? '<div class="pub-buttons">' + 
                  availableButtons.map(btn => 
                      `<a href="${btn.url}" class="pub-button" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${btn.label}</a>`
                  ).join('') + 
                  '</div>'
                : '';
            
            // Bold author name using pattern from config
            const authorPattern = config.site?.author_name_pattern || 'F. Fehr';
            const regex = new RegExp(`\\b${authorPattern.replace('.', '\\.')}\\b`, 'g');
            const formattedAuthors = pub.authors.replace(regex, `<strong>${authorPattern}</strong>`);
            
            return `
            <div class="publication" onclick="window.open('${pub.paper || pub.link}', '_blank', 'noopener,noreferrer')">
                <div class="pub-image">
                    <img src="${pub.image}" alt="${pub.title} thumbnail">
                </div>
                <div class="pub-description">
                    <h2>${pub.title}</h2>
                    <p>${formattedAuthors}</p>
                    <p>${pub.venue}</p>
                    <p><b class='pub-conference'>${pub.conference}</b></p>
                    ${buttonsHTML}
                </div>
            </div>
            `;
        });
        
        listContainer.innerHTML = publicationCards.join('');
    } catch (error) {
        console.error('Error loading publications:', error);
    }
}

/**
 * Load blog posts from blogs.json and create blog post previews
 * Renders blog cards with titles, dates, and excerpts
 */
async function loadBlogs() {
    try {
        let blogs = [];
        const listContainer = document.getElementById('blog-list');

        try {
            const response = await fetch('blogs/blogs-index.json', { cache: 'no-store' });
            if (response.ok) {
                blogs = await response.json();
            }
        } catch (_) {
            blogs = [];
        }

        if (!Array.isArray(blogs) || blogs.length === 0) {
            blogs = await loadYaml('blogs/blogs.yaml');
        }
        
        if (!listContainer || !blogs) return;
        
        const blogCards = blogs.map(blog => {
            const formattedDate = formatDate(blog.date);
            const dateLine = formattedDate + (blog.reading_time ? ' · ' + blog.reading_time : '');
            const link = blog.url || `blogs/${blog.id}.html`;

            return `
            <a href="${link}" style="text-decoration:none;">
            <div class="blog-post">
                <div class="blog-image">
                    <img src="${blog.thumbnail}" alt="${blog.title} cover image">
                </div>
                <div class="blog-description">
                    <h2>${blog.title}</h2>
                    <p class="blog-date">${dateLine}</p>
                    <p>${blog.excerpt}</p>
                </div>
            </div>
            </a>
            `;
        });
        
        listContainer.innerHTML = blogCards.join('');
    } catch (error) {
        console.error('Error loading blogs:', error);
    }
}

/**
 * Load design configuration and apply CSS custom properties
 * Sets layout variables, typography, and image sizing from config.yaml
 */
async function loadDesignConfiguration() {
    try {
        const config = await loadConfig();
        if (!config?.design) return;
        const design = config.design;
        
        // Layout variables
        if (design.layout?.max_width) {
            document.documentElement.style.setProperty('--maxw', design.layout.max_width);
        }
        if (design.layout?.padding?.horizontal) {
            document.documentElement.style.setProperty('--padding-horizontal', design.layout.padding.horizontal);
        }
        
        // Typography variables
        if (design.typography?.body?.line_height) {
            document.documentElement.style.setProperty(
                '--body-line-height', 
                design.typography.body.line_height
            );
        }
        
        // Image variables
        const pubThumbnail = design.images?.publication_thumbnail;
        if (pubThumbnail) {
            const width = pubThumbnail.width;
            const height = pubThumbnail.height;
            const borderRadius = pubThumbnail.border_radius || '4px';
            
            if (width) document.documentElement.style.setProperty('--pub-thumb-width', `${width}px`);
            if (height) document.documentElement.style.setProperty('--pub-thumb-height', `${height}px`);
            document.documentElement.style.setProperty('--pub-thumb-radius', borderRadius);
        }
    } catch (error) {
        console.error('Error loading design configuration:', error);
    }
}

/**
 * Initialize main page
 * Loads all content sections in the correct order
 */
function initializeMainPage() {
    // Load configurations first so CSS variables are available
    loadLayoutConfiguration();
    loadSiteMetadata();
    loadDesignConfiguration();
    
    // Load content
    loadProfileContent();
    loadSocialLinks();
    loadPublications();
    loadBlogs();
    loadTimeline();
    loadMedia();
}


    /**
     * ===================================================================
     *                    BLOG PAGE FUNCTIONS
     * ===================================================================
     *//**
 * Load site metadata for blog page (simpler version)
 */
async function loadBlogSiteMetadata() {
    try {
        const config = await loadConfig();
        if (!config) return;
        
        const siteNameElement = document.getElementById('site-name');
        const footerNameElement = document.getElementById('footer-name');
        
        if (siteNameElement && config.site?.name) {
            siteNameElement.textContent = config.site.name;
        }
        if (footerNameElement && config.site?.footer_name) {
            footerNameElement.textContent = config.site.footer_name;
        }
    } catch (error) {
        console.error('Error loading site metadata:', error);
    }
}

/**
 * Load layout configuration for blog page (navigation and footer)
 */
async function loadBlogLayoutConfiguration() {
    try {
        const config = await loadConfig();
        if (!config) return;
        
        // Build navigation menu (without internal page anchors)
        const navLinksElement = document.getElementById('nav-links');
        if (navLinksElement) {
            // Preserve theme toggle button
            const themeButton = navLinksElement.querySelector('#theme-toggle');
            
            // Clear and rebuild nav (keeping only theme toggle)
            navLinksElement.innerHTML = '';
            
            // Re-add theme toggle button
            if (themeButton) {
                navLinksElement.appendChild(themeButton);
            }
        }
        
        const footerYearElement = document.getElementById('footer-year');
        const footerTaglineElement = document.getElementById('footer-tagline');
        const footerLicenseElement = document.getElementById('footer-license');
        
        if (footerYearElement && config.layout?.footer?.year) {
            footerYearElement.textContent = config.layout.footer.year;
        }
        if (footerTaglineElement && config.layout?.footer?.tagline) {
            footerTaglineElement.textContent = config.layout.footer.tagline;
        }
        if (footerLicenseElement && config.layout?.footer?.license_text) {
            const licenseUrl = config.layout.footer.license_url || '#';
            footerLicenseElement.href = licenseUrl;
            footerLicenseElement.textContent = config.layout.footer.license_text;
        }
    } catch (error) {
        console.error('Error loading layout configuration:', error);
    }
}

/**
 * Load and render a single blog post
 * Fetches blog content, parses markdown, and generates table of contents
 */
async function loadBlogPost() {
    try {
        // Get blog ID from window variable (for individual blog HTML files) or URL query parameter
        let blogId = window.BLOG_POST_ID || null;
        
        if (!blogId) {
            const urlParams = new URLSearchParams(window.location.search);
            blogId = urlParams.get('id');
        }
        
        const blogBodyElement = document.getElementById('blog-body');
        
        if (!blogId) {
            if (blogBodyElement) {
                blogBodyElement.innerHTML = '<p>No blog post specified.</p>';
            }
            return;
        }
        
        // Determine the correct path to blogs.yaml based on current location
        const blogsYamlPath = window.BLOG_POST_ID ? 'blogs.yaml' : 'blogs/blogs.yaml';
        
        // Load blogs.yaml to find the content file
        const blogs = await loadYaml(blogsYamlPath);
        
        const blog = blogs?.find(b => b.id === blogId);
        
        if (!blog) {
            if (blogBodyElement) {
                blogBodyElement.innerHTML = '<p>Blog post not found.</p>';
            }
            return;
        }
        
        // Set title and date
        const titleElement = document.getElementById('blog-title');
        const dateElement = document.getElementById('blog-date');
        const pageTitleElement = document.getElementById('page-title');
        
        if (titleElement) titleElement.textContent = blog.title;
        if (pageTitleElement) pageTitleElement.textContent = blog.title;
        wireShareButtons(blog.title);
        const headerTitleElement = document.getElementById('blog-header-title');
        if (headerTitleElement) {
            headerTitleElement.textContent =
                (window.BLOG_POST_DATA && window.BLOG_POST_DATA.short_title)
                    ? window.BLOG_POST_DATA.short_title
                    : blog.title;
        }
        if (dateElement) {
            const readingTime = blog.reading_time || (window.BLOG_POST_DATA && window.BLOG_POST_DATA.reading_time);
            dateElement.textContent = formatDate(blog.date) + (readingTime ? ' · ' + readingTime : '');
        }
        
        // Load and parse content
        let htmlContent;
        
        // Check if we have embedded blog data (new format)
        if (window.BLOG_POST_DATA) {
            htmlContent = parseMarkdown(window.BLOG_POST_DATA.content);
        } else if (blog.content_file) {
            // Legacy: Load from separate JSON file
            let contentPath = blog.content_file;
            if (window.BLOG_POST_ID) {
                contentPath = blog.content_file.replace('blogs/', '');
            }
            
            const contentResponse = await fetch(contentPath);
            const contentData = await contentResponse.json();
            htmlContent = parseMarkdown(contentData.content);
        } else if (blog.markdown_file) {
            // Legacy: Load markdown file (for backward compatibility)
            const markdownResponse = await fetch(blog.markdown_file);
            const markdownText = await markdownResponse.text();
            htmlContent = parseMarkdown(markdownText);
        } else {
            throw new Error('No content available');
        }
        
        if (blogBodyElement) {
            blogBodyElement.innerHTML = htmlContent;
            
            // Fix relative image paths for blog content
            // Images in markdown are relative to blogs/ directory
            const images = blogBodyElement.querySelectorAll('img');
            images.forEach(img => {
                const src = img.getAttribute('src');
                // Only fix relative paths that don't already start with http or /
                if (src && !src.startsWith('http') && !src.startsWith('/')) {
                    // If we're in a blog HTML file (has BLOG_POST_ID), paths are already relative to blogs/
                    // If we're not, we need to prepend the path
                    if (!window.BLOG_POST_ID && !src.includes('blogs/')) {
                        img.setAttribute('src', `blogs/${src}`);
                    }
                }
            });
        }
        
        // Generate table of contents
        generateTableOfContents();

        // Initialize like button
        await initSunLike(blogId);

    } catch (error) {
        console.error('Error loading blog post:', error);
        const blogBodyElement = document.getElementById('blog-body');
        if (blogBodyElement) {
            blogBodyElement.innerHTML = '<p>Error loading blog post.</p>';
        }
    }
}

/**
 * Generate table of contents from h2 and h3 headings in blog post
 * Creates interactive TOC with scroll highlighting
 */
function generateTableOfContents() {
    const blogBody = document.getElementById('blog-body');
    const headerNav = document.getElementById('blog-header-nav');
    if (!blogBody) return;

    const headings = blogBody.querySelectorAll('h2, h3');

    // Assign IDs and group by h2
    const groups = [];
    let currentGroup = null;
    headings.forEach((heading, index) => {
        heading.id = `section-${index}`;
        if (heading.tagName === 'H2') {
            currentGroup = { h2: heading, h3s: [] };
            groups.push(currentGroup);
        } else {
            if (!currentGroup) { currentGroup = { h2: null, h3s: [] }; groups.push(currentGroup); }
            currentGroup.h3s.push(heading);
        }
    });

    // --- INLINE TOC (h2s only, only when {{TOC}} placeholder present) ---
    const h2Headings = [...headings].filter(h => h.tagName === 'H2');
    const tocPlaceholder = blogBody.querySelector('#toc-placeholder');
    const tocBtn = document.getElementById('blog-toc-btn');

    if (tocPlaceholder && h2Headings.length > 0) {
        const inlineToc = document.createElement('div');
        inlineToc.className = 'blog-inline-toc';
        inlineToc.id = 'blog-inline-toc';
        inlineToc.innerHTML = '<h3 class="blog-toc-heading">Table of Contents</h3>';
        const ul = document.createElement('ul');
        h2Headings.forEach(h2 => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${h2.id}`;
            a.textContent = h2.textContent;
            a.addEventListener('click', e => {
                e.preventDefault();
                h2.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.pushState(null, '', `#${h2.id}`);
            });
            li.appendChild(a);
            ul.appendChild(li);
        });
        inlineToc.appendChild(ul);
        tocPlaceholder.replaceWith(inlineToc);

        // Button scrolls to TOC
        if (tocBtn) {
            tocBtn.addEventListener('click', e => {
                e.preventDefault();
                const header = document.querySelector('.site-header, .blog-header, header');
                const headerHeight = header ? header.getBoundingClientRect().height : 0;
                const tocTop = inlineToc.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
                window.scrollTo({ top: tocTop, behavior: 'smooth' });
            });
        }
    } else {
        // No {{TOC}} — remove orphaned placeholder if present, make button scroll to top
        if (tocPlaceholder) tocPlaceholder.remove();
        if (tocBtn) {
            tocBtn.textContent = '↑ Top';
            tocBtn.setAttribute('aria-label', 'Back to top');
            tocBtn.addEventListener('click', e => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    // --- READING PROGRESS PILL ---
    const progressPill = document.createElement('div');
    progressPill.className = 'blog-progress';
    progressPill.id = 'blog-progress';
    document.body.appendChild(progressPill);

    // --- CURRENT SECTION INDICATOR ---
    let h2Indicator = null;
    let h3Indicator = null;
    if (headerNav) {
        h2Indicator = document.createElement('span');
        h2Indicator.className = 'blog-current-h2';
        h2Indicator.id = 'blog-current-section'; // keep for any external refs

        h3Indicator = document.createElement('span');
        h3Indicator.className = 'blog-current-h3';

        headerNav.appendChild(h2Indicator);
        headerNav.appendChild(h3Indicator);
        headerNav.style.display = 'none';
    }

    window.addEventListener('scroll', () => {
        let currentH2 = null;
        let currentH3 = null;
        headings.forEach(h => {
            if (h.getBoundingClientRect().top <= 120) {
                if (h.tagName === 'H2') {
                    currentH2 = h;
                    currentH3 = null;
                } else if (h.tagName === 'H3') {
                    currentH3 = h;
                }
            }
        });

        if (headerNav && h2Indicator && h3Indicator) {
            h2Indicator.textContent = currentH2 ? currentH2.textContent : '';
            h3Indicator.textContent = currentH3 ? currentH3.textContent : '';
            headerNav.style.display = currentH2 ? '' : 'none';
        }

        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const scrollable = Math.max(1, scrollHeight - clientHeight);
        const pct = Math.round((scrollTop / scrollable) * 100);
        progressPill.textContent = pct + '%';
        progressPill.style.setProperty('--fill', pct + '%');
        progressPill.classList.toggle('visible', pct > 0);
    });
}

/**
 * Wire share buttons with the current page URL and post title
 */
function wireShareButtons(title) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);

    const li = document.getElementById('share-linkedin');
    const x  = document.getElementById('share-x');
    const em = document.getElementById('share-email');

    if (li) li.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    if (x)  x.href  = `https://x.com/intent/tweet?url=${url}&text=${text}`;
    if (em) em.href = `mailto:?subject=${text}&body=${url}`;
}

/**
 * ===================================================================
 *                    SUN LIKE BUTTON
 * ===================================================================
 */

/**
 * Initialize the sun like button for a blog post.
 * Fetches current like count, handles click (increment + optimistic UI),
 * and persists liked state in localStorage.
 * @param {string} postId - The blog post ID
 */
async function initSunLike(postId) {
    const btn   = document.getElementById('sun-like-btn');
    const count = document.getElementById('sun-like-count');
    if (!btn || !count) return;

    const storageKey = `liked:${postId}`;
    const alreadyLiked = localStorage.getItem(storageKey) === '1';

    // Fetch current count
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/blog_stats?post_id=eq.${encodeURIComponent(postId)}&select=likes`,
            { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
        );
        if (res.ok) {
            const rows = await res.json();
            const likes = rows.length > 0 ? rows[0].likes : 0;
            count.textContent = likes > 0 ? likes : '';
        }
    } catch (_) { /* network error — show no count */ }

    if (alreadyLiked) {
        btn.classList.add('liked');
        btn.disabled = true;
    }

    btn.addEventListener('click', async () => {
        if (btn.disabled) return;
        btn.disabled = true;
        btn.classList.add('liked');
        localStorage.setItem(storageKey, '1');

        // Optimistic increment
        const prev = parseInt(count.textContent, 10) || 0;
        count.textContent = prev + 1;

        try {
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/rpc/increment_like`,
                {
                    method: 'POST',
                    headers: {
                        apikey: SUPABASE_ANON,
                        Authorization: `Bearer ${SUPABASE_ANON}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ p_post_id: postId }),
                }
            );
            if (res.ok) {
                const newCount = await res.json();
                count.textContent = newCount > 0 ? newCount : prev + 1;
            }
        } catch (_) {
            // Silent rollback on network failure
            count.textContent = prev || '';
            btn.classList.remove('liked');
            btn.disabled = false;
            localStorage.removeItem(storageKey);
        }
    });
}

/**
 * Initialize blog page
 * Loads metadata and blog post content
 */
function initializeBlogPage() {
    loadBlogLayoutConfiguration();
    loadBlogSiteMetadata();
    loadBlogPost();
}


/**
 * ===================================================================
 *                    PAGE DETECTION AND INITIALIZATION
 * ===================================================================
 */

// Initialize the appropriate page when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeThemeToggle();
        
        // Detect which page we're on
        if (document.getElementById('blog-body')) {
            // We're on the blog detail page
            initializeBlogPage();
        } else if (document.getElementById('profile-content')) {
            // We're on the main page
            initializeMainPage();
        }
    });
} else {
    initializeThemeToggle();
    
    // Detect which page we're on
    if (document.getElementById('blog-body')) {
        initializeBlogPage();
    } else if (document.getElementById('profile-content')) {
        initializeMainPage();
    }
}

})(); // End of IIFE
