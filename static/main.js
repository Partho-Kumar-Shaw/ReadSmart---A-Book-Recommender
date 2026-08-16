/* =========================================================
   READSMART INTERACTIVE JS SYSTEM
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    initNavbarState();
    initInfiniteTicker();
    initModalSystem();
    initFavoritesSystem();
    initCategoryTabs();
    initLiveSearch();
    initSurpriseMe();
});

// State Store
const ReadSmartState = {
    books: [],
    favorites: JSON.parse(localStorage.getItem('readsmart_favs') || '[]')
};

/* NAVBAR ACTIVE LINK HIGHLIGHT */
function initNavbarState() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
    updateFavoritesBadge();
}

/* FETCH BOOKS & POPULATE INFINITE TICKER */
async function initInfiniteTicker() {
    const tickerContainers = document.querySelectorAll('.carousel1 .group1');
    if (tickerContainers.length === 0) return;

    try {
        const response = await fetch('/api/books');
        if (!response.ok) return;
        const books = await response.json();
        ReadSmartState.books = books;

        // Take top 12 books for the ticker loop
        const tickerBooks = books.slice(0, 12);
        
        let htmlContent = '';
        tickerBooks.forEach(book => {
            htmlContent += `
                <div class="ticker-card" onclick="openBookModal('${encodeURIComponent(JSON.stringify(book))}')">
                    <img src="${book.image}" alt="${book.title}" class="ticker-img" onerror="this.src='https://via.placeholder.com/60x86?text=Book'">
                    <div class="ticker-info">
                        <div class="ticker-title">${escapeHtml(book.title)}</div>
                        <div class="ticker-author">✍️ ${escapeHtml(book.author)}</div>
                        <div class="ticker-meta">
                            <span class="ticker-rating">⭐ ${book.rating}</span>
                            <span class="ticker-tag">${book.tag}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        tickerContainers.forEach(container => {
            container.innerHTML = htmlContent;
        });

    } catch (err) {
        console.warn('Ticker loading error:', err);
    }
}

/* MODAL SYSTEM */
function initModalSystem() {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';
    backdrop.id = 'bookModalBackdrop';
    backdrop.innerHTML = `
        <div class="custom-modal">
            <button class="modal-close-btn" onclick="closeBookModal()">&times;</button>
            <div class="modal-grid" id="modalContent">
                <!-- Dynamic Content -->
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeBookModal();
    });
}

function openBookModal(encodedBook) {
    const book = typeof encodedBook === 'string' ? JSON.parse(decodeURIComponent(encodedBook)) : encodedBook;
    const isFav = isBookmarked(book.title);

    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div>
            <img src="${book.image}" alt="${book.title}" class="modal-img" onerror="this.src='https://via.placeholder.com/180x250?text=No+Cover'">
        </div>
        <div class="modal-details">
            <div class="modal-badges">
                <span class="modal-tag">${book.tag || '🔥 Trending'}</span>
                <span class="rating-badge">⭐ ${book.rating || '4.8'} / 5</span>
                <span class="votes-badge">🗳️ ${book.votes || '500+'} Votes</span>
            </div>
            <h2>${escapeHtml(book.title)}</h2>
            <p class="author">✍️ By <strong>${escapeHtml(book.author)}</strong></p>
            <p style="font-size:14px; color:rgba(255,255,255,0.7); margin-bottom:20px; line-height:1.6;">
                Discover why readers love <em>${escapeHtml(book.title)}</em>. Get instant AI-powered recommendations based on this title, save it to your reading list, or explore similar top-rated reads.
            </p>
            <div class="modal-actions">
                <form action="/recommend_books" method="post" style="margin:0;">
                    <input type="hidden" name="user_input" value="${escapeHtml(book.title)}">
                    <button type="submit" class="btn-primary-custom">
                        ✨ Find Similar Books
                    </button>
                </form>
                <button class="btn-secondary-custom" onclick="toggleBookmark('${escapeHtml(book.title)}', '${escapeHtml(book.author)}', '${escapeHtml(book.image)}')">
                    ${isFav ? '❤️ Saved' : '🤍 Bookmark'}
                </button>
            </div>
        </div>
    `;

    document.getElementById('bookModalBackdrop').classList.add('active');
}

function closeBookModal() {
    document.getElementById('bookModalBackdrop').classList.remove('active');
}

/* FAVORITES & BOOKMARKS SYSTEM */
function initFavoritesSystem() {
    // Create Floating Action Buttons (Surprise Me + Favorites)
    const floatingDiv = document.createElement('div');
    floatingDiv.className = 'floating-actions';
    floatingDiv.innerHTML = `
        <button class="floating-btn" onclick="triggerSurpriseMe()" title="Surprise Me!">
            🎲 Surprise Me!
        </button>
        <button class="floating-btn" onclick="openFavoritesModal()" title="Saved Books">
            ❤️ Saved Books <span id="favBtnCount" class="fav-badge">${ReadSmartState.favorites.length}</span>
        </button>
    `;
    document.body.appendChild(floatingDiv);

    // Create Favorites Modal
    const favBackdrop = document.createElement('div');
    favBackdrop.className = 'custom-modal-backdrop';
    favBackdrop.id = 'favModalBackdrop';
    favBackdrop.innerHTML = `
        <div class="custom-modal" style="max-width:550px;">
            <button class="modal-close-btn" onclick="closeFavoritesModal()">&times;</button>
            <h3 style="font-size:22px; font-weight:800; margin-bottom:20px;">❤️ Your Reading List</h3>
            <div id="favListContainer" style="max-height:350px; overflow-y:auto; padding-right:5px;">
                <!-- Fav items -->
            </div>
        </div>
    `;
    document.body.appendChild(favBackdrop);

    favBackdrop.addEventListener('click', (e) => {
        if (e.target === favBackdrop) closeFavoritesModal();
    });
}

function isBookmarked(title) {
    return ReadSmartState.favorites.some(item => item.title.toLowerCase() === title.toLowerCase());
}

function toggleBookmark(title, author, image) {
    const index = ReadSmartState.favorites.findIndex(item => item.title.toLowerCase() === title.toLowerCase());
    if (index >= 0) {
        ReadSmartState.favorites.splice(index, 1);
        showToast(`Removed "${title}" from favorites`);
    } else {
        ReadSmartState.favorites.push({ title, author, image });
        showToast(`❤️ Added "${title}" to your saved reading list!`);
    }
    localStorage.setItem('readsmart_favs', JSON.stringify(ReadSmartState.favorites));
    updateFavoritesBadge();
    
    // Refresh modal if active
    const modalBackdrop = document.getElementById('bookModalBackdrop');
    if (modalBackdrop && modalBackdrop.classList.contains('active')) {
        closeBookModal();
    }
}

function updateFavoritesBadge() {
    const count = ReadSmartState.favorites.length;
    const badge = document.getElementById('favBtnCount');
    if (badge) badge.innerText = count;

    const navFavCount = document.getElementById('navFavCount');
    if (navFavCount) navFavCount.innerText = count;
}

function openFavoritesModal() {
    const container = document.getElementById('favListContainer');
    if (ReadSmartState.favorites.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px 10px; color:rgba(255,255,255,0.6);">
                <p style="font-size:36px; margin-bottom:10px;">📖</p>
                <p>Your reading list is empty!</p>
                <p style="font-size:13px;">Click the heart icon on any book card to save it here.</p>
            </div>
        `;
    } else {
        container.innerHTML = ReadSmartState.favorites.map(item => `
            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:10px 14px; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${item.image}" alt="${item.title}" style="width:40px; height:56px; object-fit:cover; border-radius:6px;">
                    <div>
                        <div style="font-weight:700; font-size:14px; color:white;">${escapeHtml(item.title)}</div>
                        <div style="font-size:12px; color:rgba(255,255,255,0.6);">✍️ ${escapeHtml(item.author)}</div>
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    <form action="/recommend_books" method="post" style="margin:0;">
                        <input type="hidden" name="user_input" value="${escapeHtml(item.title)}">
                        <button type="submit" class="btn-primary-custom" style="padding:6px 12px; font-size:12px;">✨ Rec</button>
                    </form>
                    <button class="btn-secondary-custom" style="padding:6px 10px; font-size:12px;" onclick="toggleBookmark('${escapeHtml(item.title)}', '', '')">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    document.getElementById('favModalBackdrop').classList.add('active');
}

function closeFavoritesModal() {
    document.getElementById('favModalBackdrop').classList.remove('active');
}

/* CATEGORY TAB FILTERS */
function initCategoryTabs() {
    const tabs = document.querySelectorAll('.filter-tab');
    if (tabs.length === 0) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const category = tab.dataset.category;
            filterBookCards(category);
        });
    });
}

function filterBookCards(category) {
    const bookCols = document.querySelectorAll('.book-col');
    bookCols.forEach(col => {
        const ratingText = col.querySelector('.rating-badge')?.innerText || '0';
        const ratingVal = parseFloat(ratingText.replace(/[^0-9.]/g, '')) || 0;
        const tagText = col.dataset.tag || '';

        if (category === 'all') {
            col.style.display = 'block';
        } else if (category === 'top_rated' && ratingVal >= 4.5) {
            col.style.display = 'block';
        } else if (category === 'viral' && (tagText.includes('BookTok') || ratingVal >= 4.6)) {
            col.style.display = 'block';
        } else if (category === 'classics' && (tagText.includes('Classic') || tagText.includes('Must'))) {
            col.style.display = 'block';
        } else if (category === tagText) {
            col.style.display = 'block';
        } else {
            col.style.display = 'none';
        }
    });
}

/* LIVE CLIENT SEARCH */
function initLiveSearch() {
    const liveSearchInput = document.getElementById('liveSearchInput');
    if (!liveSearchInput) return;

    liveSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const bookCols = document.querySelectorAll('.book-col');

        bookCols.forEach(col => {
            const title = col.querySelector('.book-title')?.innerText.toLowerCase() || '';
            const author = col.querySelector('.book-author')?.innerText.toLowerCase() || '';

            if (title.includes(query) || author.includes(query)) {
                col.style.display = 'block';
            } else {
                col.style.display = 'none';
            }
        });
    });
}

/* SURPRISE ME RANDOM BOOK PICKER */
async function initSurpriseMe() {}

async function triggerSurpriseMe() {
    showToast("🎲 Picking a viral bestseller for you...");
    try {
        const response = await fetch('/api/random');
        if (response.ok) {
            const book = await response.json();
            setTimeout(() => {
                openBookModal(book);
            }, 400);
        }
    } catch (err) {
        showToast("⚠ Could not pick random book");
    }
}

/* TOAST NOTIFICATION UTILITY */
function showToast(message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ESCAPE HTML HELPER */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
