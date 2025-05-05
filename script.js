

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const body = document.body;

    // --- Check if essential elements exist ---
    if (!menuToggle || !mainNav) {
        console.error("Menu toggle button or navigation element not found. Cannot initialize mobile menu.");
    }

    const toggleIcon = menuToggle?.querySelector('i');
    let isTransitioning = false;
    const transitionDuration = 400;

    // --- Helper function to find focusable elements ---
    const getFocusableElements = (parent) => {
        // ... (keep existing function)
        if (!parent) return [];
        return Array.from(
            parent.querySelectorAll(
                'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), input[type="text"]:not([disabled]):not([tabindex="-1"]), input[type="radio"]:not([disabled]):not([tabindex="-1"]), input[type="checkbox"]:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1])'
            )
        );
    };

    // --- Function to Open Menu (Mobile Only Logic) ---
    const openMenu = () => {
        // ... (keep existing function)
        if (isTransitioning || !mainNav || !menuToggle) return;
        isTransitioning = true;

        mainNav.style.display = 'flex';
        mainNav.offsetHeight;

        mainNav.classList.add('nav-open');
        menuToggle.setAttribute('aria-expanded', 'true');
        body.classList.add('body-no-scroll');

        if (toggleIcon) {
            toggleIcon.classList.remove('fa-bars');
            toggleIcon.classList.add('fa-times');
        }

        document.addEventListener('keydown', handleEscapeKey);
        document.addEventListener('click', handleClickOutside, true);

        setTimeout(() => {
            const focusableElements = getFocusableElements(mainNav);
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
            isTransitioning = false;
        }, transitionDuration);
    };

    // --- Function to Close Menu (Mobile Only Logic) ---
    const closeMenu = () => {
        // ... (keep existing function)
        if (isTransitioning || !mainNav || !menuToggle) return;
        isTransitioning = true;

        mainNav.classList.remove('nav-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        body.classList.remove('body-no-scroll');

        if (toggleIcon) {
            toggleIcon.classList.remove('fa-times');
            toggleIcon.classList.add('fa-bars');
        }

        document.removeEventListener('keydown', handleEscapeKey);
        document.removeEventListener('click', handleClickOutside, true);

        menuToggle.focus();

        setTimeout(() => {
            if (window.getComputedStyle(menuToggle).display !== 'none') {
                 mainNav.style.display = '';
            }
            isTransitioning = false;
        }, transitionDuration);
    };

    // --- Event Handler for Toggle Button Click ---
    if (menuToggle) {
        menuToggle.addEventListener('click', (event) => {
            // ... (keep existing function)
            const isNavOpen = mainNav?.classList.contains('nav-open');
            if (isNavOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }

    // --- Event Handler for Escape Key ---
    const handleEscapeKey = (event) => {
        // ... (keep existing function)
        if (event.key === 'Escape') {
            if (mainNav?.classList.contains('nav-open')) {
                 closeMenu();
            }
        }
    };

    // --- Event Handler for Click Outside ---
    const handleClickOutside = (event) => {
        // ... (keep existing function)
        if (mainNav?.classList.contains('nav-open') &&
            !mainNav.contains(event.target) &&
            !menuToggle?.contains(event.target))
        {
             closeMenu();
        }
    };

    // --- Initial Setup (REVISED) ---
    if (mainNav && menuToggle) {
        // ... (keep existing function)
        mainNav.classList.remove('nav-open');
        mainNav.style.display = '';
        menuToggle.setAttribute('aria-expanded', 'false');
        if (toggleIcon) {
            toggleIcon.classList.remove('fa-times');
            toggleIcon.classList.add('fa-bars');
        }
        body.classList.remove('body-no-scroll');
        document.removeEventListener('keydown', handleEscapeKey);
        document.removeEventListener('click', handleClickOutside, true);
    }


    // ======================================================
    // ===== POST LOADING & SORTING LOGIC (MODIFIED) =====
    // ======================================================
    const postList = document.getElementById('postList');
    const paginationControls = document.getElementById('paginationControls');
    const postTemplate = document.getElementById('postTemplate');
    const sortSelect = document.getElementById('sort');
    const topicNav = document.getElementById('topicNav'); // Get the topic nav container

    const postsData = [];
    const POSTS_PER_PAGE = 20;
    let currentPage = 1;
    const MAX_CONTENT_HEIGHT_BEFORE_READ_MORE = 120; // Adjusted to match CSS

    // --- Define Data Sources ---
    const topicDataSources = {
        "expats": "data/Topic_CRBA/Expats/expats_CRBA_latest_28_posts.json",
        "expatsmexico": "", // No source specified
        "immigration": "data/Topic_CRBA/Immigration/Immigration_CRBA.json",
        "uscis": "data/Topic_CRBA/USCIS/USCIS_CRBA_latest.json"
    };

    // --- Function to Fetch Data (Modified to accept URL) ---
    async function fetchData(url) {
        if (!url) {
            console.warn("No URL provided to fetchData.");
            if (postList) postList.innerHTML = '<p style="text-align: center; color: orange;">No data source selected.</p>';
            if (paginationControls) paginationControls.innerHTML = ''; // Clear pagination
            postsData.length = 0; // Clear data array
            return;
        }

        // Check if elements needed for post display exist
        if (!postList || !paginationControls || !postTemplate || !sortSelect) {
            console.warn("One or more elements required for post display are missing.");
            if (postList) postList.innerHTML = '<p style="text-align: center; color: orange;">Required page elements missing.</p>';
             if (paginationControls) paginationControls.innerHTML = '';
            return;
        }

        // Show loading state
        postList.innerHTML = '<p style="text-align: center; color: var(--text-light);">Cargando posts...</p>';
        paginationControls.innerHTML = ''; // Clear pagination during load

        try {
            console.log(`Fetching data from: ${url}`); // Log the URL being fetched
            const response = await fetch(url);
            if (!response.ok) {
                 // Provide more specific error messages
                 let errorMsg = `HTTP error! status: ${response.status}`;
                 if (response.status === 404) {
                     errorMsg = `Error: Data file not found at ${url}`;
                 }
                 throw new Error(errorMsg);
            }
            const data = await response.json();

            if (data && Array.isArray(data)) {
                 postsData.length = 0; // Clear previous data
                 postsData.push(...data);
                 console.log(`Fetched ${postsData.length} posts.`);
                 sortPostsData(sortSelect.value); // Apply current sort
                 renderPage(1); // Start on page 1 of the new data
            } else {
                 console.error("Fetched data is not in the expected array format.", data);
                 postList.innerHTML = '<p style="color: red; text-align: center;">Error en el formato de los datos recibidos.</p>';
                 postsData.length = 0; // Clear data array on format error
            }

        } catch (error) {
            console.error("Could not fetch posts:", error);
            postList.innerHTML = `<p style="color: red; text-align: center;">Fallo la carga de los Posts. ${error.message || ''}</p>`;
            postsData.length = 0; // Clear data array on fetch error
        }
    }

    // --- Function to Render a Page ---
    function renderPage(page) {
        // ... (keep existing function, but ensure it handles empty postsData gracefully)
        if (!postList || !paginationControls) return;

        currentPage = page;
        postList.innerHTML = ''; // Clear previous posts

        if (!postsData || postsData.length === 0) {
             // Display message if it wasn't already set by fetchData error/no data
             if (!postList.querySelector('p')) { // Avoid overwriting specific error messages
                 postList.innerHTML = '<p style="text-align: center;">No hay posts para mostrar para este tema.</p>';
             }
             renderPaginationControls(); // Render empty controls
             return;
        }

        const start = (page - 1) * POSTS_PER_PAGE;
        const end = start + POSTS_PER_PAGE;
        const postsToRender = postsData.slice(start, end);

        postsToRender.forEach((post, index) => {
            const overallPostNumber = start + index + 1;
            if (post && typeof post === 'object') {
                const postElement = createPostElement(post, overallPostNumber);
                if (postElement) {
                     postList.appendChild(postElement);
                }
            } else {
                console.warn(`Skipping invalid post data at index ${start + index}:`, post);
            }
        });

        setTimeout(() => {
             checkAndEnableReadMore();
        }, 50);


        renderPaginationControls();
        if (!window.history.state || !window.history.state.manual) {
             window.scrollTo(0, 0);
        }
    }

    // --- Function to Create Post Element ---
    function createPostElement(postData, postNumber) {
        // ... (keep existing function)
        if (!postTemplate) return null;

        try {
            const clone = postTemplate.content.cloneNode(true);
            const postItem = clone.querySelector('.post-item');
             if (!postItem || !clone.querySelector('.post-content')) {
                 console.error("Template is missing required elements (.post-item or .post-content)");
                 return null;
             }


            (clone.querySelector('.post-number') || {}).textContent = postNumber;
            (clone.querySelector('.post-title') || {}).textContent = postData.title || 'No Title';

            const postBody = clone.querySelector('.post-body');
            if (postBody) {
                // Basic text sanitization (replace potential HTML tags with entities)
                // If you trust the source or need HTML, use innerHTML carefully
                // postBody.innerHTML = postData.selftext || '';
                const textContent = postData.selftext || '';
                // Simple check to prevent injecting script tags if using innerHTML is desired
                // const sanitizedText = textContent.replace(/<script.*?>.*?<\/script>/gi, '');
                // postBody.innerHTML = sanitizedText;
                postBody.textContent = textContent; // Safer default
                postBody.dataset.fulltext = textContent;

                // Initial style for truncation check
                postBody.style.maxHeight = `${MAX_CONTENT_HEIGHT_BEFORE_READ_MORE}px`;
                postBody.style.overflow = 'hidden';
            }

            const metaCommentsSpan = clone.querySelector('.meta-comments span');
            if (metaCommentsSpan) metaCommentsSpan.textContent = postData.num_comments ?? 'N/A';

            const metaLocationSpan = clone.querySelector('.meta-location span');
            if (metaLocationSpan) {
                 let locationText = 'N/A';
                const country = postData.location?.country;
                const state = postData.location?.state;
                if (state && country) locationText = `${state}, ${country}`;
                else if (state || country) locationText = state || country;
                metaLocationSpan.textContent = locationText;
            }


            const metaSexSpan = clone.querySelector('.meta-sex span');
            if (metaSexSpan) metaSexSpan.textContent = postData.sex || 'N/A';

            const metaPresidentSpan = clone.querySelector('.meta-president span');
             if (metaPresidentSpan) metaPresidentSpan.textContent = postData.us_president || 'N/A';

            const metaDocumentSpan = clone.querySelector('.meta-document span');
            if (metaDocumentSpan) metaDocumentSpan.textContent = postData.document || 'N/A';

            const metaCreatedSpan = clone.querySelector('.meta-created span');
            if (metaCreatedSpan) metaCreatedSpan.textContent = postData.created_readable_utc || 'N/A';

            const archiveTag = clone.querySelector('.archive-tag');
            if (archiveTag) {
                if (postData.is_archived) {
                     archiveTag.style.display = 'inline-block';
                     archiveTag.textContent = postData.archive_reason || 'Archived';
                } else {
                    archiveTag.style.display = 'none';
                }
            }
            return postItem;
        } catch (error) {
            console.error("Error creating post element:", error, "Post Data:", postData);
            return null;
        }
    }

     // --- Function to Check and Enable Read More ---
     function checkAndEnableReadMore() {
        // ... (keep existing function, ensure MAX_CONTENT_HEIGHT_BEFORE_READ_MORE is correct)
         if (!postList) return;
        const postBodies = postList.querySelectorAll('.post-body');
        postBodies.forEach(body => {
            const readMoreLink = body.nextElementSibling;
            if (!readMoreLink || !readMoreLink.classList.contains('read-more')) {
                 return;
            }

            const wasExpanded = body.classList.contains('expanded');
            body.classList.remove('truncated', 'expanded');
            body.style.maxHeight = 'none'; // Measure full height

            const scrollHeight = body.scrollHeight;
            const isOverflowing = scrollHeight > MAX_CONTENT_HEIGHT_BEFORE_READ_MORE;

            if (isOverflowing) {
                readMoreLink.style.display = 'inline-block'; // Always show if overflowing
                if (wasExpanded) {
                    body.classList.add('expanded');
                    body.style.maxHeight = 'none'; // Keep expanded
                    readMoreLink.textContent = 'Leer Menos';
                } else {
                    body.classList.add('truncated');
                    body.style.maxHeight = `${MAX_CONTENT_HEIGHT_BEFORE_READ_MORE}px`; // Apply truncation
                    readMoreLink.textContent = 'Leer Mas';
                }
            } else {
                 // Not overflowing, hide link, ensure full visibility
                 body.style.maxHeight = 'none';
                 body.classList.remove('truncated', 'expanded');
                 readMoreLink.style.display = 'none';
            }
        });
    }

    // --- Function to Render Pagination Controls ---
    function renderPaginationControls() {
        // ... (keep existing function)
        if (!paginationControls) return;
        paginationControls.innerHTML = '';
        if (!postsData || postsData.length === 0) return; // Don't render if no data

        const totalPages = Math.ceil(postsData.length / POSTS_PER_PAGE);
        if (totalPages <= 1) return;

        const createButton = (text, page, disabled = false) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.disabled = disabled;
            button.type = 'button';
            button.addEventListener('click', () => {
                 renderPage(page);
            });
            return button;
        };

        paginationControls.appendChild(createButton('Anterior', currentPage - 1, currentPage === 1));

        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        paginationControls.appendChild(pageInfo);

        paginationControls.appendChild(createButton('Siguiente', currentPage + 1, currentPage === totalPages));
    }

    // --- Event delegation for Read More links ---
     if (postList) {
         // ... (keep existing function)
        postList.addEventListener('click', (event) => {
            if (event.target.classList.contains('read-more')) {
                event.preventDefault();
                const link = event.target;
                let postBody = link.previousElementSibling;
                while (postBody && !postBody.classList.contains('post-body')) {
                     postBody = postBody.previousElementSibling;
                }

                if (postBody) {
                    const isCurrentlyExpanded = postBody.classList.contains('expanded');
                     // Toggle expanded state first
                     postBody.classList.toggle('expanded', !isCurrentlyExpanded);
                     postBody.classList.toggle('truncated', isCurrentlyExpanded); // Add truncated if it was expanded

                     // Then re-run check to update styles and text correctly
                     checkAndEnableReadMore(); // This will set maxHeight and button text
                } else {
                    console.error("Could not find post-body element preceding read-more link.");
                }
            }
        });
     }

     // --- Function to Parse Date ---
     function parseDate(dateString) {
        // ... (keep existing function)
         if (!dateString) return 0;
         try {
              let date = new Date(dateString);
              if (!isNaN(date.getTime())) {
                  return date.getTime();
              }
              // Add fallbacks if needed
              console.warn(`Could not parse date string: ${dateString}`);
              return 0;
         } catch (e) {
             console.error(`Error parsing date string: ${dateString}`, e);
             return 0;
         }
     }

    // --- Function to Sort Posts ---
    function sortPostsData(sortBy) {
        // ... (keep existing function)
        // Ensure sorting happens only if there's data
        if (!postsData || postsData.length === 0) return;

        postsData.sort((a, b) => {
            if (!a && !b) return 0;
            if (!a) return 1;
            if (!b) return -1;

            const safeNumComments = (post) => Number(post?.num_comments ?? 0);
            const safePresident = (post) => post?.us_president?.trim() ?? '';
            const safeDate = (post) => parseDate(post?.created_readable_utc);

            try {
                switch (sortBy) {
                    case 'comments_high':
                        return safeNumComments(b) - safeNumComments(a);
                    case 'comments_low':
                        return safeNumComments(a) - safeNumComments(b);
                    case 'date_newer': // Newer dates (higher timestamp) first
                        return safeDate(b) - safeDate(a);
                    case 'date_older': // Older dates (lower timestamp) first
                        return safeDate(a) - safeDate(b);
                    case 'president_one': {
                        const presA1 = safePresident(a) === 'Joe Biden';
                        const presB1 = safePresident(b) === 'Joe Biden';
                        if (presA1 && !presB1) return -1;
                        if (!presA1 && presB1) return 1;
                        return 0;
                    }
                    case 'president_two': {
                         const presA2 = safePresident(a) === 'Donald Trump';
                         const presB2 = safePresident(b) === 'Donald Trump';
                        if (presA2 && !presB2) return -1;
                        if (!presA2 && presB2) return 1;
                        return 0;
                    }
                    default:
                        return 0;
                }
            } catch (sortError) {
                console.error("Error during sorting:", sortError, "Criteria:", sortBy, "Posts:", a, b);
                return 0;
            }
        });
    }

    // --- Event Listener for Sorting Dropdown ---
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const sortBy = sortSelect.value;
            sortPostsData(sortBy);
            renderPage(1); // Go back to first page after sorting
        });
    } else {
        console.warn("Sort select element not found.");
    }

    // --- Event Listener for Topic Navigation ---
    if (topicNav) {
        topicNav.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default anchor link behavior

            const clickedLink = event.target.closest('a'); // Find the nearest anchor parent
            if (!clickedLink || !topicNav.contains(clickedLink)) {
                return; // Exit if click wasn't on a link within the nav
            }

            const currentActive = topicNav.querySelector('a.active');
            if (clickedLink === currentActive) {
                return; // Do nothing if the already active link is clicked
            }

            const topicKey = clickedLink.dataset.topic;
            if (!topicKey) {
                console.warn("Clicked topic link is missing data-topic attribute.");
                return;
            }

            const newUrl = topicDataSources[topicKey];

            // Update active state
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            clickedLink.classList.add('active');

            // Reset sorting to default and current page
            sortSelect.value = 'comments_high'; // Reset dropdown to default
            currentPage = 1;

            // Fetch data for the new topic
            if (newUrl) {
                 fetchData(newUrl);
                 sortSelect.disabled = false; // Re-enable sort if it was disabled
            } else {
                 console.log(`No data source defined for topic: ${topicKey}`);
                 postsData.length = 0; // Clear data
                 postList.innerHTML = `<p style="text-align: center;">No hay posts disponibles para el tema: ${clickedLink.textContent}.</p>`;
                 paginationControls.innerHTML = ''; // Clear pagination
                 sortSelect.disabled = true; // Disable sort if no data
            }
        });
    } else {
        console.warn("Topic navigation element (#topicNav) not found.");
    }


    // --- Initial Data Fetch ---
    // Find the initially active topic link and fetch its data
    const initialActiveTopicLink = topicNav?.querySelector('a.active');
    const initialTopicKey = initialActiveTopicLink?.dataset.topic || 'expats'; // Default to 'expats' if none active
    const initialUrl = topicDataSources[initialTopicKey] || topicDataSources['expats']; // Fallback
    fetchData(initialUrl); // Fetch initial data

}); // End DOMContentLoaded
