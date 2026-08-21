'use strict';

(function () {
    var DOMAIN = 'https://www.kestrelmetal.com';
    var DEFAULT_IMAGE = DOMAIN + '/images/og-default.jpg';

    function getMetaContent(name, attr) {
        attr = attr || 'name';
        var el = document.querySelector('meta[' + attr + '="' + name + '"]');
        return el ? el.getAttribute('content') : '';
    }

    function injectMeta(attrs) {
        var key;
        for (key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                var existing = document.querySelector('meta[' + key + '="' + attrs[key] + '"]');
                if (existing && existing.getAttribute('content') === attrs.content) {
                    return;
                }
            }
        }
        var tag = document.createElement('meta');
        for (key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                tag.setAttribute(key, attrs[key]);
            }
        }
        document.head.appendChild(tag);
    }

    function injectJsonLd(data) {
        var script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data, null, 2);
        document.head.appendChild(script);
    }

    function getCanonicalPath() {
        var path = window.location.pathname;
        if (path === '/' || path.indexOf('index.html') !== -1) {
            return '/';
        }
        return path;
    }

    function getPageType(pathname) {
        if (pathname === '/' || pathname.indexOf('index.html') !== -1) {
            return 'website';
        }
        if (pathname.indexOf('blog-') !== -1 && pathname.indexOf('.html') !== -1) {
            return 'article';
        }
        var productPatterns = [
            'fence', 'mesh', 'wire', 'panel', 'post', 'gate', 'barrier',
            'screen', 'roll', 'netting', 'coil', 'fastener', 'tie'
        ];
        var lowerPath = pathname.toLowerCase();
        for (var i = 0; i < productPatterns.length; i++) {
            if (lowerPath.indexOf(productPatterns[i]) !== -1) {
                return 'product';
            }
        }
        return 'website';
    }

    function getPageTitle() {
        var titleEl = document.querySelector('title');
        return titleEl ? titleEl.textContent.trim() : '';
    }

    function getPageDescription() {
        return getMetaContent('description');
    }

    function getPageNameFromPath(pathname) {
        var segments = pathname.split('/');
        var filename = segments[segments.length - 1];
        if (!filename || filename === '/') {
            return 'Home';
        }
        filename = filename.replace('.html', '').replace(/-/g, ' ');
        filename = filename.replace(/\b\w/g, function (c) {
            return c.toUpperCase();
        });
        return filename;
    }

    function injectCanonical(pathname) {
        if (document.querySelector('link[rel="canonical"]')) {
            return;
        }
        var link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', DOMAIN + pathname);
        document.head.appendChild(link);
    }

    function injectOpenGraph(pathname, title, description, pageType) {
        var existingOgImage = document.querySelector('meta[property="og:image"]');
        var ogImage = existingOgImage ? existingOgImage.getAttribute('content') : DEFAULT_IMAGE;
        var ogTags = [
            { property: 'og:title', content: title },
            { property: 'og:description', content: description },
            { property: 'og:url', content: DOMAIN + pathname },
            { property: 'og:type', content: pageType },
            { property: 'og:image', content: ogImage },
            { property: 'og:site_name', content: 'Kestrel Metal' },
            { property: 'og:locale', content: 'en_US' }
        ];
        for (var i = 0; i < ogTags.length; i++) {
            injectMeta({ property: ogTags[i].property, content: ogTags[i].content });
        }
    }

    function injectTwitterCard(title, description) {
        var twitterTags = [
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:description', content: description },
            { name: 'twitter:image', content: DEFAULT_IMAGE }
        ];
        for (var i = 0; i < twitterTags.length; i++) {
            injectMeta({ name: twitterTags[i].name, content: twitterTags[i].content });
        }
    }

    function injectOrganizationSchema() {
        var schema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Kestrel Metal",
            "url": DOMAIN,
            "logo": DOMAIN + "/images/logo.png",
            "description": "Kestrel Metal is a China-based manufacturer of security fences, wire mesh, gabions, razor wire, and barbed wire. Based in Anping, Hebei since 2014, with 200+ projects in 50+ countries.",
            "foundingDate": "2014",
            "numberOfEmployees": { "@type": "QuantitativeValue", "minValue": 60 },
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Anping Industrial Zone",
                "addressLocality": "Anping",
                "addressRegion": "Hebei",
                "addressCountry": "CN"
            },
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+86-17832383339",
                "contactType": "sales",
                "email": "sales@kestrelmetal.com",
                "availableLanguage": ["English", "Chinese"]
            },
            "knowsAbout": [
                "Security fence manufacturing",
                "Wire mesh production",
                "Gabion boxes and mattresses",
                "NATO-22 razor wire",
                "Barbed wire",
                "3D welded wire panels",
                "Chain link fencing",
                "Hot-dip galvanized steel",
                "PVC coated wire mesh"
            ],
            "areaServed": [
                { "@type": "Country", "name": "Australia" },
                { "@type": "Country", "name": "United States" },
                { "@type": "Country", "name": "United Kingdom" },
                { "@type": "Country", "name": "Germany" },
                { "@type": "Country", "name": "Canada" },
                { "@type": "Country", "name": "New Zealand" }
            ],
            "sameAs": [
                "https://www.facebook.com/kestrelmetal",
                "https://www.linkedin.com/company/kestrelmetal"
            ]
        };
        injectJsonLd(schema);
    }

    function injectBreadcrumbSchema(pathname, pageTitle) {
        if (pathname === '/' || pathname.indexOf('index.html') !== -1) {
            return;
        }

        var breadcrumbs = [];
        var breadcrumbLinks = document.querySelectorAll('.breadcrumb a, .breadcrumb-nav a');

        if (breadcrumbLinks.length > 0) {
            for (var i = 0; i < breadcrumbLinks.length; i++) {
                var link = breadcrumbLinks[i];
                var text = link.textContent.trim();
                var href = link.getAttribute('href');
                var url = href.indexOf('http') === 0 ? href : DOMAIN + href;
                breadcrumbs.push({
                    "@type": "ListItem",
                    "position": i + 1,
                    "name": text,
                    "item": url
                });
            }
        } else {
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": DOMAIN
            });
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": pageTitle,
                "item": DOMAIN + pathname
            });
        }

        if (breadcrumbs.length > 0) {
            var schema = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbs
            };
            injectJsonLd(schema);
        }
    }

    function injectWebsiteSchema() {
        var schema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Kestrel Metal",
            "url": DOMAIN
        };
        injectJsonLd(schema);
    }

    function injectLocalBusinessSchema() {
        var schema = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Kestrel Metal",
            "description": "Professional metal products manufacturer specializing in wire mesh, fencing, and gabion products.",
            "image": DOMAIN + "/images/factory.jpg",
            "url": DOMAIN,
            "telephone": "+86-17832383339",
            "email": "sales@kestrelmetal.com",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Anping",
                "addressRegion": "Hebei",
                "addressCountry": "CN"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": "38.2346",
                "longitude": "115.4903"
            },
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "08:00",
                "closes": "18:00"
            },
            "sameAs": [
                "https://www.facebook.com/kestrelmetal",
                "https://www.linkedin.com/company/kestrelmetal"
            ]
        };
        injectJsonLd(schema);
    }

    function injectServiceSchema() {
        var title = getPageTitle();
        var description = getPageDescription();
        var schema = {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": title || "Kestrel Metal Service",
            "description": description || "Professional metal products service from Kestrel Metal.",
            "provider": {
                "@type": "Organization",
                "name": "Kestrel Metal",
                "url": DOMAIN
            },
            "areaServed": "Worldwide",
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Metal Products Services",
                "itemListElement": [
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": title || "Metal Products Service"
                        }
                    }
                ]
            }
        };
        injectJsonLd(schema);
    }

    function extractProductCategory(pathname, pageContent) {
        var categoryMap = {
            'fence': 'Fencing',
            'mesh': 'Wire Mesh',
            'wire': 'Wire Products',
            'panel': 'Panels',
            'gate': 'Gates',
            'barrier': 'Barriers',
            'screen': 'Screens',
            'gabion': 'Gabion Products',
            'netting': 'Netting',
            'coil': 'Coils',
            'fastener': 'Fasteners',
            'tie': 'Tie Wire'
        };
        var lowerPath = pathname.toLowerCase();
        var keys = Object.keys(categoryMap);
        for (var i = 0; i < keys.length; i++) {
            if (lowerPath.indexOf(keys[i]) !== -1) {
                return categoryMap[keys[i]];
            }
        }
        return 'Metal Products';
    }

    function extractProductSpecs() {
        var specs = [];
        var specElements = document.querySelectorAll('.spec-item, .tech-spec');
        for (var i = 0; i < specElements.length; i++) {
            var nameEl = specElements[i].querySelector('.spec-name, .spec-label, dt, th, strong, b');
            var valueEl = specElements[i].querySelector('.spec-value, .spec-detail, dd, td, span:last-child');
            var name = nameEl ? nameEl.textContent.trim() : '';
            var value = valueEl ? valueEl.textContent.trim() : '';
            if (name && value) {
                specs.push({
                    "@type": "PropertyValue",
                    "name": name,
                    "value": value
                });
            }
        }
        if (specs.length === 0) {
            var rows = document.querySelectorAll('table tr, .specs-table tr, .specifications tr');
            for (var j = 0; j < rows.length; j++) {
                var cells = rows[j].querySelectorAll('td, th');
                if (cells.length >= 2) {
                    var rowName = cells[0].textContent.trim();
                    var rowValue = cells[1].textContent.trim();
                    if (rowName && rowValue) {
                        specs.push({
                            "@type": "PropertyValue",
                            "name": rowName,
                            "value": rowValue
                        });
                    }
                }
            }
        }
        return specs.length > 0 ? specs : undefined;
    }

    function injectProductSchema() {
        var canonicalUrl = getCanonicalPath();
        var productEl = document.querySelector('.product, .product-detail, .product-info, [data-product]');
        var nameEl, descriptionEl, imageEl;
        var name, description, image;

        if (!productEl) {
            nameEl = document.querySelector('h1, .product-name, .product-title');
            descriptionEl = document.querySelector('.product-description, .description, .product-desc');
            imageEl = document.querySelector('.product-image img, .product-img img');
        } else {
            nameEl = productEl.querySelector('h1, .product-name, .product-title');
            descriptionEl = productEl.querySelector('.product-description, .description');
            imageEl = productEl.querySelector('.product-image img, .product-img img');
        }

        name = nameEl ? nameEl.textContent.trim() : getPageTitle();
        description = descriptionEl ? descriptionEl.textContent.trim() : getPageDescription();
        image = imageEl ? imageEl.getAttribute('src') : DEFAULT_IMAGE;

        if (image && image.indexOf('http') !== 0) {
            image = DOMAIN + image;
        }

        var category = extractProductCategory(canonicalUrl, document.body.textContent);
        var specs = extractProductSpecs();

        var schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": name,
            "description": description || "High quality metal products from Kestrel Metal.",
            "image": image,
            "brand": {
                "@type": "Brand",
                "name": "Kestrel Metal"
            },
            "manufacturer": {
                "@type": "Organization",
                "name": "Kestrel Metal",
                "url": DOMAIN
            },
            "category": category,
            "additionalProperty": (specs || []).concat([
                { "@type": "PropertyValue", "name": "Lead Time", "value": "15-25 days" },
                { "@type": "PropertyValue", "name": "MOQ", "value": "100 panels" },
                { "@type": "PropertyValue", "name": "Certification", "value": "ISO 9001:2015, CE, UKCA" },
                { "@type": "PropertyValue", "name": "Incoterms", "value": "FOB Tianjin / Shanghai" },
                { "@type": "PropertyValue", "name": "Payment", "value": "T/T, L/C at sight" }
            ]),
            "offers": {
                "@type": "Offer",
                "url": DOMAIN + canonicalUrl,
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "seller": {
                    "@type": "Organization",
                    "name": "Kestrel Metal"
                }
            }
        };

        if (specs) {
            schema.additionalProperty = specs;
        }

        var prodPrice = productEl ? productEl.querySelector('.price, .product-price') : document.querySelector('.price, .product-price');
        if (prodPrice) {
            var priceValue = prodPrice.textContent.trim().replace(/[^0-9.]/g, '');
            if (priceValue) {
                schema.offers.price = priceValue;
            }
        }

        injectJsonLd(schema);
    }

    function injectFaqSchema() {
        var faqItems = document.querySelectorAll('.faq-item');
        if (faqItems.length === 0) {
            return;
        }

        var mainEntity = [];
        for (var i = 0; i < faqItems.length; i++) {
            var item = faqItems[i];
            var questionEl = item.querySelector('.faq-question, h3, h4, .question');
            var answerEl = item.querySelector('.faq-answer, .answer, p');

            if (questionEl && answerEl) {
                mainEntity.push({
                    "@type": "Question",
                    "name": questionEl.textContent.trim(),
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": answerEl.textContent.trim()
                    }
                });
            }
        }

        if (mainEntity.length > 0) {
            var schema = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": mainEntity
            };
            injectJsonLd(schema);
        }
    }

    function injectArticleSchema(title, description, pathname) {
        var dateEl = document.querySelector('time, .post-date, .article-date, [datetime]');
        var dateStr = dateEl ? (dateEl.getAttribute('datetime') || dateEl.textContent.trim()) : '2024-01-01';

        var schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description || "",
            "author": {
                "@type": "Organization",
                "name": "Kestrel Metal"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Kestrel Metal",
                "logo": {
                    "@type": "ImageObject",
                    "url": DOMAIN + "/images/logo.png"
                }
            },
            "url": DOMAIN + pathname,
            "datePublished": dateStr,
            "image": DEFAULT_IMAGE
        };
        injectJsonLd(schema);
    }

    function init() {
        var pathname = getCanonicalPath();
        var title = getPageTitle();
        var description = getPageDescription();
        var pageType = getPageType(pathname);
        var pageTitle = getPageNameFromPath(pathname);

        injectCanonical(pathname);
        injectOpenGraph(pathname, title, description, pageType);
        injectTwitterCard(title, description);

        injectOrganizationSchema();
        injectBreadcrumbSchema(pathname, pageTitle);

        if (pathname === '/' || pathname.indexOf('index.html') !== -1) {
            injectWebsiteSchema();
            injectLocalBusinessSchema();
        }

        if (pathname.indexOf('service-') !== -1) {
            injectServiceSchema();
        }

        if (pageType === 'product') {
            injectProductSchema();
        }

        if (pathname.indexOf('faq.html') !== -1 || document.querySelectorAll('.faq-item, .faq-question').length > 0) {
            injectFaqSchema();
        }

        if (pageType === 'article') {
            injectArticleSchema(title, description, pathname);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();