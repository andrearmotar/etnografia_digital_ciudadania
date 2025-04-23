document.addEventListener('DOMContentLoaded', () => {
    const postList = document.getElementById('postList');
    const paginationControls = document.getElementById('paginationControls');
    const postTemplate = document.getElementById('postTemplate');
    const sortSelect = document.getElementById('sort');
    const postsData = [];
    const POSTS_PER_PAGE = 20;
    let currentPage = 1;

    const JSON_URL = 'data\Topic_CRBA\Expats\expats_CRBA_latest_28_posts.json';
    const MAX_CONTENT_HEIGHT_BEFORE_READ_MORE = 400;

    async function fetchData() {
        try {
            const response = await fetch(JSON_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data && Array.isArray(data.record)) {
                 postsData.push(...data.record);
                 sortPostsData('comments_high');
                 sortSelect.value = 'comments_high';
                 renderPage(currentPage);
            } else {
                 console.error("Fetched data is not in the expected format (missing 'record' array).", data);
                 postList.innerHTML = '<p style="color: red; text-align: center;">Error en el formato de los datos recibidos.</p>';
            }

        } catch (error) {
            console.error("Could not fetch posts:", error);
            postList.innerHTML = '<p style="color: red; text-align: center;">Fallo la carga de los Posts.</p>';
        }
    }

    function renderPage(page) {
        currentPage = page;
        postList.innerHTML = '';

        if (postsData.length === 0) {
             renderPaginationControls();
             return;
        }

        const start = (page - 1) * POSTS_PER_PAGE;
        const end = start + POSTS_PER_PAGE;
        const postsToRender = postsData.slice(start, end);

        postsToRender.forEach((post, index) => {
            const overallPostNumber = start + index + 1;
            if (post) {
                const postElement = createPostElement(post, overallPostNumber);
                postList.appendChild(postElement);
            } else {
                console.warn(`Skipping invalid post data at index ${start + index}`);
            }
        });

        setTimeout(() => {
             checkAndEnableReadMore();
        }, 0);


        renderPaginationControls();
         window.scrollTo(0, 0);
    }

    function createPostElement(postData, postNumber) {
        const clone = postTemplate.content.cloneNode(true);
        const postItem = clone.querySelector('.post-item');
        const postContentDiv = clone.querySelector('.post-content');

        clone.querySelector('.post-number').textContent = postNumber;
        clone.querySelector('.post-title').textContent = postData.title || 'No Title';

        const postBody = clone.querySelector('.post-body');
        postBody.innerHTML = postData.selftext || '';
        postBody.dataset.fulltext = postData.selftext || '';

        postBody.style.maxHeight = `${MAX_CONTENT_HEIGHT_BEFORE_READ_MORE}px`;
        postBody.style.overflow = 'hidden';

        const metaComments = clone.querySelector('.meta-comments span');
        metaComments.textContent = postData.num_comments !== undefined ? postData.num_comments : 'N/A';

        const metaLocation = clone.querySelector('.meta-location span');
        let locationText = 'N/A';
        if (postData.location) {
             const country = postData.location.country || '';
             const state = postData.location.state || '';
              if (state && country) {
                locationText = `${state}, ${country}`;
              } else if (state || country) {
                locationText = state || country;
              }
        }
        metaLocation.textContent = locationText;

        const metaSexContainer = clone.querySelector('.meta-sex');
        const metaSexIcon = metaSexContainer.querySelector('i');
        const metaSexTextSpan = metaSexContainer.querySelector('span');

        let sexIconText = '👤 Sexo del usuario: ';
        let sexText = postData.sex || 'N/A';

        if (postData.sex === "Hombre") {
            sexIconText = "👨🏻 Sexo del usuario: ";
            sexText = "Hombre";
        } else if (postData.sex === "Mujer") {
            sexIconText = "👩🏻 Sexo del usuario: ";
             sexText = "Mujer";
        }
        metaSexIcon.textContent = sexIconText;
        metaSexTextSpan.textContent = sexText;

        const metaPresident = clone.querySelector('.meta-president span');
        metaPresident.textContent = postData.us_president || 'N/A';

        const metaDocument = clone.querySelector('.meta-document span');
        metaDocument.textContent = postData.document || 'N/A';

        const metaCreated = clone.querySelector('.meta-created span');
        metaCreated.textContent = postData.created_readable_utc || 'N/A';

        return postItem;
    }

     function checkAndEnableReadMore() {
        const postBodies = postList.querySelectorAll('.post-body');
        postBodies.forEach(body => {
            const readMoreLink = body.nextElementSibling;

            body.classList.remove('truncated');
            body.style.maxHeight = 'none';

            const isOverflowing = body.scrollHeight > MAX_CONTENT_HEIGHT_BEFORE_READ_MORE;
            const isExpanded = body.classList.contains('expanded');

            if (isOverflowing && !isExpanded) {
                 body.style.maxHeight = `${MAX_CONTENT_HEIGHT_BEFORE_READ_MORE}px`;
                 body.classList.add('truncated');
                 if (readMoreLink && readMoreLink.classList.contains('read-more')) {
                     readMoreLink.style.display = 'inline-block';
                     readMoreLink.textContent = 'Leer Mas';
                 }
            } else if (isOverflowing && isExpanded) {
                 body.style.maxHeight = 'none';
                 body.classList.remove('truncated');
                 if (readMoreLink && readMoreLink.classList.contains('read-more')) {
                     readMoreLink.style.display = 'inline-block';
                     readMoreLink.textContent = 'Leer Menos';
                 }
            } else {
                body.style.maxHeight = 'none';
                body.classList.remove('truncated');
                if (readMoreLink && readMoreLink.classList.contains('read-more')) {
                    readMoreLink.style.display = 'none';
                }
            }
        });
    }

    function renderPaginationControls() {
        paginationControls.innerHTML = '';
        if (!postsData || postsData.length === 0) return;

        const totalPages = Math.ceil(postsData.length / POSTS_PER_PAGE);
        if (totalPages <= 1) return;

        const createButton = (text, page, disabled = false) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.disabled = disabled;
            button.addEventListener('click', () => renderPage(page));
            return button;
        };

        paginationControls.appendChild(createButton('Anterior', currentPage - 1, currentPage === 1));

        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        paginationControls.appendChild(pageInfo);

        paginationControls.appendChild(createButton('Siguiente', currentPage + 1, currentPage === totalPages));
    }

    postList.addEventListener('click', (event) => {
        if (event.target.classList.contains('read-more')) {
            event.preventDefault();
            const link = event.target;
            const postBody = link.previousElementSibling;

            if (postBody && postBody.classList.contains('post-body')) {
                postBody.classList.toggle('expanded');
                 checkAndEnableReadMore();
            }
        }
    });

     function parseDate(dateString) {
        if (!dateString) return 0;
        try {
            let date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                 return date.getTime();
            }
             console.warn(`Could not parse date string: ${dateString}`);
             return 0;
        } catch (e) {
            console.error(`Error parsing date string: ${dateString}`, e);
            return 0;
        }
    }

    function sortPostsData(sortBy) {
        postsData.sort((a, b) => {
            if (!a && !b) return 0;
            if (!a) return 1;
            if (!b) return -1;

            const safeNumComments = (post) => post?.num_comments ?? 0;
            const safePresident = (post) => post?.us_president ?? '';
            const safeDate = (post) => parseDate(post?.created_readable_utc);

            switch (sortBy) {
                case 'comments_high':
                    return safeNumComments(b) - safeNumComments(a);
                case 'comments_low':
                    return safeNumComments(a) - safeNumComments(b);
                case 'date_newer':
                    return safeDate(a) - safeDate(b);
                case 'date_older':
                    return safeDate(b) - safeDate(a);
                case 'president_one':
                    const presA1 = safePresident(a) === 'Joe Biden';
                    const presB1 = safePresident(b) === 'Joe Biden';
                    if (presA1 && !presB1) return -1;
                    if (!presA1 && presB1) return 1;
                     return 0;
                case 'president_two':
                     const presA2 = safePresident(a) === 'Donald Trump';
                     const presB2 = safePresident(b) === 'Donald Trump';
                     if (presA2 && !presB2) return -1;
                     if (!presA2 && presB2) return 1;
                     return 0;
                default:
                    return 0;
            }
        });
    }

    sortSelect.addEventListener('change', () => {
        const sortBy = sortSelect.value;
        sortPostsData(sortBy);
        renderPage(1);
    });

    fetchData();

});
