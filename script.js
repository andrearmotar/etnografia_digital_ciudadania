document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const body = document.body;

    // --- Check if essential elements exist ---
    if (!menuToggle || !mainNav) {
        console.error("Menu toggle button or navigation element not found. Cannot initialize mobile menu.");
        // Don't return here if other parts of the script need to run
        // Only return if the *entire* script relies on these elements
    }

    const toggleIcon = menuToggle?.querySelector('i'); // Optional chaining for safety
    let isTransitioning = false;
    const transitionDuration = 400; // Match CSS --nav-transition-duration in ms

    // --- Helper function to find focusable elements ---
    const getFocusableElements = (parent) => {
        if (!parent) return [];
        return Array.from(
            parent.querySelectorAll(
                'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), input[type="text"]:not([disabled]):not([tabindex="-1"]), input[type="radio"]:not([disabled]):not([tabindex="-1"]), input[type="checkbox"]:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1])'
            )
        );
    };

    // --- Function to Open Menu (Mobile Only Logic) ---
    const openMenu = () => {
        if (isTransitioning || !mainNav || !menuToggle) return; // Check elements again
        isTransitioning = true;

        // **Important:** Set display for transition calculation, but rely on CSS for base state
        mainNav.style.display = 'flex'; // Temporarily ensure it's flex for transition
        mainNav.offsetHeight; // Force reflow

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
        if (isTransitioning || !mainNav || !menuToggle) return; // Check elements again
        isTransitioning = true;

        mainNav.classList.remove('nav-open'); // CSS transitions will hide it visually
        menuToggle.setAttribute('aria-expanded', 'false');
        body.classList.remove('body-no-scroll');

        if (toggleIcon) {
            toggleIcon.classList.remove('fa-times');
            toggleIcon.classList.add('fa-bars');
        }

        document.removeEventListener('keydown', handleEscapeKey);
        document.removeEventListener('click', handleClickOutside, true);

        menuToggle.focus();

        // **Important:** Remove the part that sets display:none AFTER transition
        // Let the CSS handle the final collapsed state (max-height: 0, opacity: 0 etc)
        setTimeout(() => {
            // Reset display style ONLY if it was set by openMenu
            // We check if it's mobile view implicitly by checking if toggle is visible
            if (window.getComputedStyle(menuToggle).display !== 'none') {
                 mainNav.style.display = ''; // Reset inline style, let CSS rule take over
            }
            isTransitioning = false;
        }, transitionDuration);
    };

    // --- Event Handler for Toggle Button Click ---
    // Only add listener if the toggle button exists
    if (menuToggle) {
        menuToggle.addEventListener('click', (event) => {
             // No need to check isTransitioning here, open/close functions handle it
            const isNavOpen = mainNav?.classList.contains('nav-open'); // Use optional chaining
            if (isNavOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }

    // --- Event Handler for Escape Key ---
    const handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
            if (mainNav?.classList.contains('nav-open')) { // Optional chaining
                 closeMenu();
            }
        }
    };

    // --- Event Handler for Click Outside ---
    const handleClickOutside = (event) => {
        if (mainNav?.classList.contains('nav-open') && // Optional chaining
            !mainNav.contains(event.target) &&
            !menuToggle?.contains(event.target)) // Optional chaining
        {
             closeMenu();
             // Consider stopping propagation only if necessary
             // event.stopPropagation();
             // event.preventDefault();
        }
    };

    // --- Initial Setup (REVISED) ---
    // Let CSS handle initial state based on screen size.
    // We just ensure ARIA attributes and listeners are clean on load.
    if (mainNav && menuToggle) { // Only run if elements exist
        mainNav.classList.remove('nav-open'); // Ensure class is not present initially
        mainNav.style.display = ''; // REMOVE initial inline style override
        menuToggle.setAttribute('aria-expanded', 'false');
        if (toggleIcon) {
            toggleIcon.classList.remove('fa-times');
            toggleIcon.classList.add('fa-bars');
        }
        body.classList.remove('body-no-scroll');
        // Remove any stray listeners
        document.removeEventListener('keydown', handleEscapeKey);
        document.removeEventListener('click', handleClickOutside, true);
    }


    // ======================================================
    // ===== POST LOADING & SORTING LOGIC (Unaffected) =====
    // ======================================================
    const postList = document.getElementById('postList');
    const paginationControls = document.getElementById('paginationControls');
    const postTemplate = document.getElementById('postTemplate');
    const sortSelect = document.getElementById('sort');
    const postsData = [];
    const POSTS_PER_PAGE = 20;
    let currentPage = 1;

    // const JSON_URL = "https://andrearmotar.github.io/etnografia_digital_ciudadania/data/Topic_CRBA/Expats/expats_CRBA_latest_28_posts.json";
    const JSON_URL = "data/Topic_CRBA/Expats/expats_CRBA_latest_28_posts.json"
    const MAX_CONTENT_HEIGHT_BEFORE_READ_MORE = 400; // Adjust as needed based on CSS

    async function fetchData() {
        // Check if elements needed for post display exist
        if (!postList || !paginationControls || !postTemplate || !sortSelect) {
            console.warn("One or more elements required for post display are missing.");
            // Decide how to handle this - maybe display a message?
            if (postList) postList.innerHTML = '<p style="text-align: center; color: orange;">Required page elements missing.</p>';
            return;
        }

        try {
            const response = await fetch(JSON_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Assuming data itself is the array now, based on previous usage
            if (data && Array.isArray(data)) {
                 postsData.length = 0; // Clear previous data
                 postsData.push(...data);
                 sortPostsData('comments_high'); // Default sort
                 sortSelect.value = 'comments_high'; // Set dropdown to default
                 renderPage(1); // Start on page 1
            } else {
                 console.error("Fetched data is not in the expected array format.", data);
                 postList.innerHTML = '<p style="color: red; text-align: center;">Error en el formato de los datos recibidos.</p>';
            }

        } catch (error) {
            console.error("Could not fetch posts:", error);
            postList.innerHTML = '<p style="color: red; text-align: center;">Fallo la carga de los Posts.</p>';
        }
    }

    function renderPage(page) {
        // Ensure elements exist before proceeding
        if (!postList || !paginationControls) return;

        currentPage = page;
        postList.innerHTML = ''; // Clear previous posts

        if (postsData.length === 0) {
             postList.innerHTML = '<p style="text-align: center;">No posts to display.</p>'; // Provide feedback
             renderPaginationControls(); // Render (empty) controls or hide them
             return;
        }

        const start = (page - 1) * POSTS_PER_PAGE;
        const end = start + POSTS_PER_PAGE;
        const postsToRender = postsData.slice(start, end);

        postsToRender.forEach((post, index) => {
            const overallPostNumber = start + index + 1;
            if (post && typeof post === 'object') { // Basic check for valid post object
                const postElement = createPostElement(post, overallPostNumber);
                if (postElement) { // Check if element creation was successful
                     postList.appendChild(postElement);
                }
            } else {
                console.warn(`Skipping invalid post data at index ${start + index}:`, post);
            }
        });

        // Delay slightly to ensure elements are in the DOM for height checks
        setTimeout(() => {
             checkAndEnableReadMore();
        }, 50); // A small delay


        renderPaginationControls();
        // Scroll to top unless navigating via history (back/forward button)
        if (!window.history.state || !window.history.state.manual) {
             window.scrollTo(0, 0);
        }
    }

    function createPostElement(postData, postNumber) {
         // Ensure template exists
        if (!postTemplate) return null;

        try {
            const clone = postTemplate.content.cloneNode(true);
            const postItem = clone.querySelector('.post-item');
            // Ensure main elements exist in the template clone
             if (!postItem || !clone.querySelector('.post-content')) {
                 console.error("Template is missing required elements (.post-item or .post-content)");
                 return null;
             }


            (clone.querySelector('.post-number') || {}).textContent = postNumber;
            (clone.querySelector('.post-title') || {}).textContent = postData.title || 'No Title';

            const postBody = clone.querySelector('.post-body');
            if (postBody) {
                postBody.innerHTML = postData.selftext || ''; // Use innerHTML carefully if data source isn't trusted
                postBody.dataset.fulltext = postData.selftext || ''; // Store original for potential use

                // Initial setup for truncation - let checkAndEnableReadMore handle visibility
                // postBody.style.maxHeight = `${MAX_CONTENT_HEIGHT_BEFORE_READ_MORE}px`;
                // postBody.style.overflow = 'hidden';
            }

            // Safely access nested properties and elements
            const metaCommentsSpan = clone.querySelector('.meta-comments span');
            if (metaCommentsSpan) metaCommentsSpan.textContent = postData.num_comments ?? 'N/A'; // Use nullish coalescing

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

            // Add Archive Tag Logic Here if needed
            const archiveTag = clone.querySelector('.archive-tag');
            if (archiveTag) {
                if (postData.is_archived) { // Assuming your data has an 'is_archived' field
                     archiveTag.style.display = 'inline-block'; // Or 'block' depending on CSS
                     archiveTag.textContent = postData.archive_reason || 'Archived'; // Customize text
                } else {
                    archiveTag.style.display = 'none';
                }
            }


            return postItem;
        } catch (error) {
            console.error("Error creating post element:", error, "Post Data:", postData);
            return null; // Return null if creation fails
        }
    }

     function checkAndEnableReadMore() {
         if (!postList) return;
        const postBodies = postList.querySelectorAll('.post-body');
        postBodies.forEach(body => {
            const readMoreLink = body.nextElementSibling;
            // Verify it's the correct link
            if (!readMoreLink || !readMoreLink.classList.contains('read-more')) {
                // console.warn("Read more link not found or incorrect element after post body.");
                 return;
            }

            // Reset styles temporarily to measure full height accurately
            const wasTruncated = body.classList.contains('truncated');
            const wasExpanded = body.classList.contains('expanded');
            body.classList.remove('truncated', 'expanded'); // Remove state classes
            body.style.maxHeight = 'none'; // Allow full height measurement

            const scrollHeight = body.scrollHeight; // Actual content height
            const isOverflowing = scrollHeight > MAX_CONTENT_HEIGHT_BEFORE_READ_MORE;

            // console.log(`Checking body: scrollHeight=${scrollHeight}, MAX=${MAX_CONTENT_HEIGHT_BEFORE_READ_MORE}, overflowing=${isOverflowing}, wasExpanded=${wasExpanded}`);


            if (isOverflowing) {
                if (wasExpanded) {
                    // Re-apply expanded state (no max-height)
                    body.classList.add('expanded');
                     body.style.maxHeight = 'none'; // Explicitly keep full height
                    readMoreLink.style.display = 'inline-block';
                    readMoreLink.textContent = 'Leer Menos';
                     body.classList.remove('truncated'); // Ensure not truncated
                } else {
                     // Apply truncated state
                     body.style.maxHeight = `${MAX_CONTENT_HEIGHT_BEFORE_READ_MORE}px`;
                     body.classList.add('truncated');
                     readMoreLink.style.display = 'inline-block';
                     readMoreLink.textContent = 'Leer Mas';
                     body.classList.remove('expanded'); // Ensure not expanded
                }
            } else {
                 // Not overflowing, hide the link and ensure full visibility
                 body.style.maxHeight = 'none'; // Ensure full height visible
                 body.classList.remove('truncated', 'expanded');
                 readMoreLink.style.display = 'none';
            }
        });
    }


    function renderPaginationControls() {
        if (!paginationControls) return;
        paginationControls.innerHTML = '';
        if (!postsData || postsData.length === 0) return;

        const totalPages = Math.ceil(postsData.length / POSTS_PER_PAGE);
        if (totalPages <= 1) return; // No controls needed for one page

        const createButton = (text, page, disabled = false) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.disabled = disabled;
            button.type = 'button'; // Explicitly set type
            button.addEventListener('click', () => {
                 // Optional: Add state for history API if needed
                 // window.history.pushState({ manual: true }, '', `?page=${page}`);
                 renderPage(page);
            });
            return button;
        };

        // Previous Button
        paginationControls.appendChild(createButton('Anterior', currentPage - 1, currentPage === 1));

        // Page Info Span
        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        paginationControls.appendChild(pageInfo);

        // Next Button
        paginationControls.appendChild(createButton('Siguiente', currentPage + 1, currentPage === totalPages));
    }

    // Event delegation for Read More links
     if (postList) {
        postList.addEventListener('click', (event) => {
            if (event.target.classList.contains('read-more')) {
                event.preventDefault();
                const link = event.target;
                // Find the previous sibling that is the post-body
                let postBody = link.previousElementSibling;
                while (postBody && !postBody.classList.contains('post-body')) {
                     postBody = postBody.previousElementSibling;
                }


                if (postBody) {
                    postBody.classList.toggle('expanded');
                    // Rerun check to update the button text and body state correctly
                    checkAndEnableReadMore(); // This might need refinement if check causes issues
                } else {
                    console.error("Could not find post-body element preceding read-more link.");
                }
            }
        });
     }

     function parseDate(dateString) {
        if (!dateString) return 0;
        try {
            // Attempt direct parsing first
             let date = new Date(dateString);
             // Check if parsing resulted in a valid date
             if (!isNaN(date.getTime())) {
                 return date.getTime();
             }
             // Add fallback parsing if needed (e.g., specific formats)
             // Example: const parts = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
             // if (parts) { date = new Date(parts[3], parts[1] - 1, parts[2]); }

             if (isNaN(date.getTime())) {
                  console.warn(`Could not parse date string: ${dateString}`);
                  return 0; // Return 0 or Date.now() or some default?
             }
             return date.getTime(); // Should be valid here if not NaN
        } catch (e) {
            console.error(`Error parsing date string: ${dateString}`, e);
            return 0; // Return 0 on error
        }
    }

    function sortPostsData(sortBy) {
        // Defensive copy before sorting if original order might be needed elsewhere
        // const sortedData = [...postsData];
        postsData.sort((a, b) => {
            // Handle null/undefined posts gracefully
            if (!a && !b) return 0;
            if (!a) return 1; // Sort nulls/undefined to the end
            if (!b) return -1;

            // Helper functions for safe access and parsing
            const safeNumComments = (post) => Number(post?.num_comments ?? 0); // Ensure number
            const safePresident = (post) => post?.us_president?.trim() ?? ''; // Trim whitespace
            const safeDate = (post) => parseDate(post?.created_readable_utc);

            try {
                switch (sortBy) {
                    case 'comments_high':
                        return safeNumComments(b) - safeNumComments(a);
                    case 'comments_low':
                        return safeNumComments(a) - safeNumComments(b);
                    case 'date_newer': // Most recent first
                        return safeDate(b) - safeDate(a); // Corrected order
                    case 'date_older': // Oldest first
                        return safeDate(a) - safeDate(b); // Corrected order
                    case 'president_one': { // Use block scope for const
                        const presA1 = safePresident(a) === 'Joe Biden';
                        const presB1 = safePresident(b) === 'Joe Biden';
                         // Prioritize Biden posts, otherwise maintain relative order (0)
                        if (presA1 && !presB1) return -1; // a comes first
                        if (!presA1 && presB1) return 1;  // b comes first
                        return 0; // Both are or aren't Biden
                    }
                    case 'president_two': { // Use block scope for const
                         const presA2 = safePresident(a) === 'Donald Trump';
                         const presB2 = safePresident(b) === 'Donald Trump';
                        // Prioritize Trump posts
                        if (presA2 && !presB2) return -1;
                        if (!presA2 && presB2) return 1;
                        return 0;
                    }
                    default:
                        return 0; // No sorting if criteria is unknown
                }
            } catch (sortError) {
                console.error("Error during sorting:", sortError, "Criteria:", sortBy, "Posts:", a, b);
                return 0; // Prevent breaking on sort error
            }
        });
    }

    // Add event listener only if sortSelect exists
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const sortBy = sortSelect.value;
            sortPostsData(sortBy);
            renderPage(1); // Go back to first page after sorting
        });
    } else {
        console.warn("Sort select element not found.");
    }

    // Initial data fetch
    fetchData();

}); // End DOMContentLoaded