

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const body = document.body;

    // --- Mobile Menu Elements & Logic (No changes here unless related to error) ---
    if (menuToggle && mainNav) {
        const toggleIcon = menuToggle.querySelector('i');
        let isTransitioning = false;
        const transitionDuration = 400;

        const getFocusableElements = (parent) => {
            // ... (logic remains the same) ...
            if (!parent) return [];
            return Array.from(
                parent.querySelectorAll(
                    'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), input[type="text"]:not([disabled]):not([tabindex="-1"]), input[type="radio"]:not([disabled]):not([tabindex="-1"]), input[type="checkbox"]:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1])'
                )
            );
        };

        const openMenu = () => {
            // ... (logic remains the same) ...
            if (isTransitioning) return;
             isTransitioning = true;

             mainNav.style.display = 'flex';
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

        const closeMenu = () => {
            // ... (logic remains the same) ...
            if (isTransitioning) return;
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

             if (menuToggle) menuToggle.focus();

             setTimeout(() => {
                 // Only hide if still in mobile view
                 if (window.getComputedStyle(menuToggle).display !== 'none') {
                      mainNav.style.display = '';
                 }
                 isTransitioning = false;
             }, transitionDuration);
        };

        menuToggle.addEventListener('click', () => {
            const isNavOpen = mainNav.classList.contains('nav-open');
            if (isNavOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && mainNav.classList.contains('nav-open')) {
                closeMenu();
            }
        };

        const handleClickOutside = (event) => {
            if (mainNav.classList.contains('nav-open') &&
                !mainNav.contains(event.target) &&
                !menuToggle.contains(event.target)) {
                closeMenu();
            }
        };

        // Initial mobile menu setup
        mainNav.classList.remove('nav-open');
        mainNav.style.display = '';
        menuToggle.setAttribute('aria-expanded', 'false');
        if (toggleIcon) {
            toggleIcon.classList.remove('fa-times');
            toggleIcon.classList.add('fa-bars');
        }
        body.classList.remove('body-no-scroll');

    } else {
        console.warn("Mobile menu elements (menuToggle or mainNav) not found.");
    }
    // --- End Mobile Menu Logic ---


    // ======================================================
    // ===== POST LOADING & SORTING LOGIC ==================
    // ======================================================
    const postList = document.getElementById('postList');
    const paginationControls = document.getElementById('paginationControls');
    const postTemplate = document.getElementById('postTemplate');
    const sortSelect = document.getElementById('sort');
    const topicNav = document.getElementById('topicNav');
    const themeToggleContainer = document.getElementById('themeToggleContainer');

    // Check if ALL essential post-loading elements exist before proceeding
    if (!postList || !paginationControls || !postTemplate || !sortSelect || !topicNav || !themeToggleContainer) {
        console.error("One or more essential elements for post display/filtering are missing. Aborting script initialization.");
        if (postList) { // Attempt to display error to user
            postList.innerHTML = '<p style="color: red; text-align: center;">Error: Page components could not be loaded correctly.</p>';
        }
        return; // Stop script execution if core elements are missing
    }

    const postsData = [];
    const POSTS_PER_PAGE = 20;
    let currentPage = 1;
    const MAX_CONTENT_HEIGHT_BEFORE_READ_MORE = 120;

    // --- Define Data Sources Sets ---
    const crbaDataSources = {
        "expats": "data/Topic_CRBA/Expats/expats_CRBA_latest_28_posts.json",
        "expatsmexico": "", // Intentionally empty - handled in fetchData
        "immigration": "data/Topic_CRBA/Immigration/Immigration_CRBA.json",
        "uscis": "data/Topic_CRBA/USCIS/USCIS_CRBA_latest.json",
        "complete": "data/Topic_CRBA/complete.json"
    };

    const givenBirthDataSources = {
        "expats": "data/Topic_GivenBirthOnMexico/Expats/Expats_given birth in mexico_latest.json",
        "expatsmexico": "data/Topic_GivenBirthOnMexico/mexicoexpats/mexicoexpats_given birth in mexico_latest.json",
        "immigration": "data/Topic_GivenBirthOnMexico/Immigration/Immigration_given birth in mexico_latest.json",
        "uscis": "data/Topic_GivenBirthOnMexico/USCIS/USCIS_given birth in mexico_latest_posts.json",
        "complete": "data/Topic_GivenBirthOnMexico/complete.json"
    };

    let currentDataSources = crbaDataSources; // Start with CRBA data sources

    // --- Function to get current active theme name ---
    function getActiveThemeName() {
        const activeThemeButton = themeToggleContainer.querySelector('.active-theme');
        return activeThemeButton?.textContent?.trim() || 'selected theme';
    }

    // --- Function to get current active topic name ---
    function getActiveTopicName() {
        const activeTopicLink = topicNav.querySelector('a.active');
        return activeTopicLink?.textContent?.trim() || 'selected topic';
    }

    // --- Function to Fetch Data ---
    async function fetchData(url, scrollToTopOnRender = true) {
        const themeName = getActiveThemeName(); // Get current theme name
        const topicName = getActiveTopicName(); // Get current topic name

        // Handle empty URL case (e.g., expatsmexico for CRBA)
        if (!url) {
            console.warn(`No URL provided for topic "${topicName}" and theme "${themeName}".`);
            postList.innerHTML = `<p style="text-align: center; color: orange;">No hay datos disponibles para ${topicName} sobre ${themeName}.</p>`;
            paginationControls.innerHTML = '';
            postsData.length = 0;
            sortSelect.disabled = true;
            return;
        }

        // Show loading state
        postList.innerHTML = '<p style="text-align: center; color: var(--text-light);">Cargando posts...</p>';
        paginationControls.innerHTML = '';
        sortSelect.disabled = true; // Disable sort while loading

        try {
            console.log(`Fetching data from: ${url} (Theme: ${themeName}, Topic: ${topicName})`);
            const response = await fetch(url);

            if (!response.ok) {
                 let errorMsg = `HTTP error! status: ${response.status}`;
                 if (response.status === 404) {
                     errorMsg = `Error: Data file not found at ${url}`;
                 }
                 // Log detailed error before throwing
                 console.error(`Fetch error for ${url}: ${errorMsg}`);
                 throw new Error(errorMsg);
            }

            const data = await response.json();

            if (data && Array.isArray(data)) {
                 postsData.length = 0; // Clear previous data
                 postsData.push(...data);
                 console.log(`Fetched ${postsData.length} posts for theme "${themeName}".`);
                 sortPostsData(sortSelect.value); // Apply current sort
                 renderPage(1, scrollToTopOnRender); // Render page 1, respecting scroll preference
                 sortSelect.disabled = postsData.length === 0; // Enable sort only if posts exist
            } else {
                 console.error("Fetched data is not in the expected array format.", data);
                 postList.innerHTML = `<p style="color: red; text-align: center;">Error en el formato de los datos recibidos para ${themeName}.</p>`;
                 postsData.length = 0;
                 sortSelect.disabled = true;
            }

        } catch (error) {
            console.error(`Could not fetch or process posts from ${url}:`, error);
            // Provide a more informative error message to the user
            postList.innerHTML = `<p style="color: red; text-align: center;">Fallo la carga de los Posts para ${themeName}. (${error.message || 'Unknown error'})</p>`;
            postsData.length = 0;
            sortSelect.disabled = true;
        }
    }

    // --- Function to Render a Page ---
    function renderPage(page, scrollToTop = true) {
        currentPage = page;
        postList.innerHTML = ''; // Clear previous posts

        if (postsData.length === 0) {
            // Check if a specific fetch error isn't already displayed
            if (!postList.querySelector('p[style*="color: red"]') && !postList.querySelector('p[style*="color: orange"]')) {
                const topicName = getActiveTopicName();
                const themeName = getActiveThemeName();
                postList.innerHTML = `<p style="text-align: center;">No hay posts para mostrar para ${topicName} sobre ${themeName}.</p>`;
            }
            renderPaginationControls(); // Render (empty) controls even if no posts
            return;
        }

        const start = (page - 1) * POSTS_PER_PAGE;
        const end = start + POSTS_PER_PAGE;
        const postsToRender = postsData.slice(start, end);

        postsToRender.forEach((post, index) => {
            const overallPostNumber = start + index + 1;
            // Add extra check for post being a valid object
            if (post && typeof post === 'object' && post !== null) {
                const postElement = createPostElement(post, overallPostNumber);
                if (postElement) { // createPostElement returns null on error
                     postList.appendChild(postElement);
                }
            } else {
                console.warn(`Skipping invalid post data at index ${start + index}:`, post);
            }
        });

        // Delay slightly before enabling 'Read More' to ensure layout calculation
        setTimeout(checkAndEnableReadMore, 50);

        renderPaginationControls(); // Render pagination controls

        if (scrollToTop) {
             window.scrollTo({ top: 0, behavior: 'smooth' }); // Use smooth scroll
        }
    }

    // --- Function to Create Post Element (Added more null checks) ---
    function createPostElement(postData, postNumber) {
        // Template already checked for existence at the start
        try {
            const clone = postTemplate.content.cloneNode(true);
            const postItem = clone.querySelector('.post-item');

            // Check essential elements within the template clone
            const postContentDiv = clone.querySelector('.post-content');
            if (!postItem || !postContentDiv) {
                console.error("Template clone is missing required elements (.post-item or .post-content)");
                return null; // Return null if template structure is broken
            }

            // Safely set content using optional chaining and nullish coalescing
            const postNumberEl = clone.querySelector('.post-number');
            if (postNumberEl) postNumberEl.textContent = postNumber;

            const titleEl = clone.querySelector('.post-title');
            if (titleEl) titleEl.textContent = postData?.title ?? 'No Title';

            const postBodyEl = clone.querySelector('.post-body');
            if (postBodyEl) {
                const textContent = postData?.selftext ?? '';
                postBodyEl.textContent = textContent;
                postBodyEl.dataset.fulltext = textContent;
                // Initial styles for truncation check
                postBodyEl.style.maxHeight = `${MAX_CONTENT_HEIGHT_BEFORE_READ_MORE}px`;
                postBodyEl.style.overflow = 'hidden';
            } else {
                 console.warn("Post body element not found in template clone for post:", postData?.title);
            }

            // Meta Data - using helper function for clarity
            const setMeta = (selector, value) => {
                const span = clone.querySelector(selector + ' span');
                if (span) span.textContent = value ?? 'N/A';
            };

            setMeta('.meta-comments', postData?.num_comments);

            let locationText = 'N/A';
            const country = postData?.location?.country;
            const state = postData?.location?.state;
            if (state && country) locationText = `${state}, ${country}`;
            else if (state || country) locationText = state || country;
            setMeta('.meta-location', locationText);

            setMeta('.meta-sex', postData?.sex);
            setMeta('.meta-president', postData?.us_president);
            setMeta('.meta-document', postData?.document);
            setMeta('.meta-created', postData?.created_readable_utc);

            // Archive Tag
            const archiveTag = clone.querySelector('.archive-tag');
            if (archiveTag) {
                if (postData?.is_archived) {
                    archiveTag.style.display = 'inline-block';
                    archiveTag.textContent = postData?.archive_reason || 'Archived';
                } else {
                    archiveTag.style.display = 'none';
                }
            }

            return postItem; // Return the fully constructed element

        } catch (error) {
            console.error("Error creating post element:", error, "Post Data:", postData);
            return null; // Return null on error
        }
    }

     // --- Function to Check and Enable Read More (Improved robustness) ---
     function checkAndEnableReadMore() {
        // postList is checked at the start
        const postItems = postList.querySelectorAll('.post-item');

        postItems.forEach(item => {
             const body = item.querySelector('.post-body');
             const readMoreLink = item.querySelector('.read-more'); // Find link within the item

             // Ensure both body and link exist for this item
             if (!body || !readMoreLink) {
                 // console.warn("Missing post body or read more link in an item.");
                 return; // Skip this item
             }

             // Store current state before measurement
             const wasExpanded = body.classList.contains('expanded');

             // Reset styles for accurate measurement
             body.classList.remove('truncated', 'expanded');
             body.style.maxHeight = 'none';

             // Use offsetHeight for visibility, scrollHeight for content size
             const currentHeight = body.offsetHeight;
             const scrollHeight = body.scrollHeight;

             // Check if content significantly exceeds the limit
             const isOverflowing = scrollHeight > (MAX_CONTENT_HEIGHT_BEFORE_READ_MORE + 10); // Add tolerance

             if (isOverflowing) {
                 readMoreLink.style.display = 'inline-block'; // Show the link
                 if (wasExpanded) {
                     // Restore expanded state (no max-height limit)
                     body.classList.add('expanded');
                     body.style.maxHeight = 'none';
                     readMoreLink.textContent = 'Leer Menos';
                 } else {
                     // Apply truncated state
                     body.classList.add('truncated');
                     body.style.maxHeight = `${MAX_CONTENT_HEIGHT_BEFORE_READ_MORE}px`;
                     readMoreLink.textContent = 'Leer Mas';
                 }
             } else {
                 // Not overflowing or only slightly: hide link, ensure full visibility
                 readMoreLink.style.display = 'none';
                 body.style.maxHeight = 'none';
                 body.classList.remove('truncated', 'expanded');
             }
         });
     }

    // --- Function to Render Pagination Controls (No major changes needed) ---
    function renderPaginationControls() {
        // paginationControls is checked at the start
        paginationControls.innerHTML = '';
        if (!postsData || postsData.length === 0) return;

        const totalPages = Math.ceil(postsData.length / POSTS_PER_PAGE);
        if (totalPages <= 1) return;

        const createButton = (text, page, disabled = false, ariaLabel = '') => {
            const button = document.createElement('button');
            button.textContent = text;
            button.disabled = disabled;
            button.type = 'button';
            if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
            button.addEventListener('click', () => {
                 renderPage(page, true); // Always scroll to top on pagination click
            });
            return button;
        };

        // Previous Button
        paginationControls.appendChild(createButton(
            'Anterior',
             currentPage - 1,
             currentPage === 1,
            'Go to previous page'
        ));

        // Page Info Span
        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        pageInfo.setAttribute('aria-live', 'polite'); // Announce page changes
        paginationControls.appendChild(pageInfo);

        // Next Button
        paginationControls.appendChild(createButton(
            'Siguiente',
             currentPage + 1,
             currentPage === totalPages,
             'Go to next page'
         ));
    }

    // --- Event delegation for Read More links ---
    postList.addEventListener('click', (event) => {
        if (event.target.classList.contains('read-more')) {
            event.preventDefault();
            const link = event.target;
            const postBody = link.closest('.post-content')?.querySelector('.post-body'); // Find body within the same content div

            if (postBody) {
                const isCurrentlyExpanded = postBody.classList.contains('expanded');
                // Toggle classes directly
                postBody.classList.toggle('expanded', !isCurrentlyExpanded);
                postBody.classList.toggle('truncated', isCurrentlyExpanded);

                // Update link text immediately
                link.textContent = !isCurrentlyExpanded ? 'Leer Menos' : 'Leer Mas';

                 // Adjust max-height based on the new state
                 if (!isCurrentlyExpanded) {
                     postBody.style.maxHeight = '2000px'; // Set to large value for expansion
                 } else {
                     // Use timeout to allow transition *from* expanded state
                     setTimeout(() => {
                          postBody.style.maxHeight = `${MAX_CONTENT_HEIGHT_BEFORE_READ_MORE}px`;
                     }, 0);
                 }
            } else {
                console.error("Could not find post-body element for read-more link.");
            }
        }
    });

     // --- Function to Parse Date (Added slightly more robust check) ---
     function parseDate(dateString) {
         if (!dateString || typeof dateString !== 'string') return 0;
         try {
             const date = new Date(dateString.replace(' ', 'T') + 'Z'); // Assume UTC, handle potential space separator
             // Check if parsing resulted in a valid date number
             if (!isNaN(date.getTime())) {
                 return date.getTime();
             }
             console.warn(`Could not parse date string: ${dateString}`);
             return 0; // Return 0 for invalid dates
         } catch (e) {
             console.error(`Error parsing date string: ${dateString}`, e);
             return 0;
         }
     }

    // --- Function to Sort Posts (No changes needed, relies on safe parsing) ---
    function sortPostsData(sortBy) {
        // postsData is checked before calling renderPage
        if (postsData.length === 0) return;

        postsData.sort((a, b) => {
            // Handle potential non-object items in array, although unlikely if fetch/parse is correct
            if (typeof a !== 'object' || a === null) return 1;
            if (typeof b !== 'object' || b === null) return -1;

            const safeNumComments = (post) => Number(post?.num_comments ?? 0);
            const safePresident = (post) => post?.us_president?.trim() ?? '';
            const safeDate = (post) => parseDate(post?.created_readable_utc); // Uses the robust parseDate

            try {
                switch (sortBy) {
                    case 'comments_high':
                        return safeNumComments(b) - safeNumComments(a);
                    case 'comments_low':
                        return safeNumComments(a) - safeNumComments(b);
                    case 'date_newer': // More recent dates first (higher timestamp)
                        return safeDate(b) - safeDate(a);
                    case 'date_older': // Older dates first (lower timestamp)
                        return safeDate(a) - safeDate(b);
                    case 'president_one': { // Joe Biden first
                        const presA = safePresident(a) === 'Joe Biden';
                        const presB = safePresident(b) === 'Joe Biden';
                        if (presA === presB) return 0; // Both match or both don't, keep original relative order
                        return presA ? -1 : 1; // If A is Biden, it comes first (-1)
                    }
                    case 'president_two': { // Donald Trump first
                         const presA = safePresident(a) === 'Donald Trump';
                         const presB = safePresident(b) === 'Donald Trump';
                         if (presA === presB) return 0;
                         return presA ? -1 : 1;
                    }
                    default:
                        return 0; // No sorting for unknown criteria
                }
            } catch (sortError) {
                console.error("Error during sorting:", sortError, "Criteria:", sortBy, "Posts:", a, b);
                return 0; // Return 0 to avoid breaking the sort further
            }
        });
    }

    // --- Event Listener for Sorting Dropdown ---
    sortSelect.addEventListener('change', () => {
        const sortBy = sortSelect.value;
        sortPostsData(sortBy);
        renderPage(1, true); // Re-render page 1, scroll to top
    });

    // --- Function to get current active topic URL (More robust) ---
    function getCurrentTopicUrl() {
        const activeTopicLink = topicNav.querySelector('a.active');
        if (!activeTopicLink) {
             console.warn("No active topic link found when trying to get URL.");
             return ""; // No active topic, no URL
        }
        const currentTopicKey = activeTopicLink.dataset.topic;
        if (!currentTopicKey) {
             console.warn("Active topic link is missing data-topic attribute.");
             return ""; // Invalid active topic link
        }

        // Check if currentDataSources is set and has the key
        if (currentDataSources && typeof currentDataSources === 'object' && currentDataSources.hasOwnProperty(currentTopicKey)) {
             return currentDataSources[currentTopicKey] || ""; // Return URL or empty string if value is falsy
        } else {
            const themeName = getActiveThemeName();
            console.warn(`Current data source set ("${themeName}") does not have key: "${currentTopicKey}".`);
            return ""; // Key missing in current sources
        }
    }


    // --- Event Listener for Topic Navigation (Subreddits) ---
    topicNav.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link navigation

        const clickedLink = event.target.closest('a');
        // Check if the click was actually on a link within the nav, and it's not already active
        if (!clickedLink || !topicNav.contains(clickedLink) || clickedLink.classList.contains('active')) {
            return;
        }

        const topicKey = clickedLink.dataset.topic;
        if (!topicKey) {
            console.warn("Clicked topic link is missing data-topic attribute.");
            return;
        }

        // Deactivate previous link, activate clicked one
        const currentActive = topicNav.querySelector('a.active');
        if (currentActive) currentActive.classList.remove('active');
        clickedLink.classList.add('active');

        // Get URL based on the *current theme* and the *newly clicked topic*
        const newUrl = getCurrentTopicUrl(); // Will now use clickedLink as active

        // Reset sort and page, then fetch
        sortSelect.value = 'comments_high';
        currentPage = 1;
        fetchData(newUrl, false); // Fetch new topic data, don't scroll top
    });

    // --- Event Listener for the Theme Toggle Buttons (using delegation) ---
    themeToggleContainer.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('.theme-toggle-option');

        // Check if the click was on a theme button AND if it's NOT already active
        if (!clickedButton || clickedButton.classList.contains('active-theme')) {
            return; // Do nothing if not a button or already active
        }

        // Deactivate the current active button
        const currentActiveButton = themeToggleContainer.querySelector('.active-theme');
        if (currentActiveButton) {
            currentActiveButton.classList.remove('active-theme');
        } else {
            console.warn("Could not find the previously active theme button."); // Should not happen
        }

        // Activate the clicked button
        clickedButton.classList.add('active-theme');
        const newState = clickedButton.dataset.state; // Get state ('crba' or 'givenBirth')

        // Update the data source set based on the new state
        let themeSwitchedTo = '';
        if (newState === 'crba') {
            currentDataSources = crbaDataSources;
            themeSwitchedTo = 'CRBA';
        } else if (newState === 'givenBirth') {
            currentDataSources = givenBirthDataSources;
            themeSwitchedTo = 'Given Birth';
        } else {
            console.error("Unknown theme state encountered:", newState);
            // Fallback or error state? Revert to default?
             currentDataSources = crbaDataSources; // Revert to default
             // Optionally visually reset the buttons too
            return; // Stop processing if state is unknown
        }
        console.log(`Theme switched to ${themeSwitchedTo}`);

        // Reset sort dropdown and page number
        sortSelect.value = 'comments_high';
        currentPage = 1;

        // Re-fetch data for the *currently selected* subreddit using the *new* data source set
        const urlToFetch = getCurrentTopicUrl(); // Get URL based on active topic link and NEW source set
        fetchData(urlToFetch, false); // Fetch, but don't scroll to top when changing theme
    });


    // --- Initial Data Fetch ---
    function initializePage() {
         // Determine initial theme from HTML
         const initialActiveThemeButton = themeToggleContainer.querySelector('.theme-toggle-option.active-theme');
         const initialThemeState = initialActiveThemeButton?.dataset.state ?? 'crba'; // Default to crba if missing

         // Set initial data source based on the theme found in HTML
         if (initialThemeState === 'givenBirth') {
             currentDataSources = givenBirthDataSources;
         } else {
             currentDataSources = crbaDataSources; // Default to CRBA
         }
         console.log(`Initializing page with theme: ${getActiveThemeName()}`);

         // Find or set initial active topic link
         let initialActiveTopicLink = topicNav.querySelector('a.active');
         let initialTopicKey = 'expats'; // Default topic

         if (!initialActiveTopicLink) {
             // If no link has 'active' class, activate the first one
             initialActiveTopicLink = topicNav.querySelector('a');
             if (initialActiveTopicLink) {
                 initialActiveTopicLink.classList.add('active');
                 console.warn("No initial active topic link found, activating the first one.");
             } else {
                 console.error("No topic links found in #topicNav during initialization.");
                 // Display error to user?
                 postList.innerHTML = '<p style="color: red; text-align: center;">Error: No topics found.</p>';
                 return; // Cannot proceed without topics
             }
         }

         // Get topic key from the (now guaranteed) active link
         initialTopicKey = initialActiveTopicLink.dataset.topic ?? 'expats'; // Fallback if data-topic missing

         // Get initial URL using the determined theme and topic
         const initialUrl = getCurrentTopicUrl(); // Will use initial theme and topic

         console.log(`Initial Topic: ${getActiveTopicName()}. Initial URL: ${initialUrl || 'None'}`);
         fetchData(initialUrl, true); // Initial load *should* scroll to top
    }

    // Run initialization
    initializePage();

}); // End DOMContentLoaded

