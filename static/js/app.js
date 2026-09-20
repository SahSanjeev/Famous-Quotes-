/**
 * QuoteVerse - Modern Vanilla JavaScript Application
 * Handles API integration, search/filter logic, random quote generation,
 * favorites persistence, speech synthesis, and animations.
 */

(function () {
  'use strict';

  // State
  const state = {
    allQuotes: [],
    currentSpotlightQuote: null,
    categories: [],
    authors: [],
    selectedCategory: 'all',
    selectedAuthor: 'all',
    searchQuery: '',
    favorites: JSON.parse(localStorage.getItem('qv_favorites') || '[]'),
    theme: localStorage.getItem('qv_theme') || 'dark',
    isSpeaking: false,
    synth: window.speechSynthesis || null
  };

  // DOM Element References
  const dom = {
    // Theme & Header
    themeToggleBtn: document.getElementById('btn-theme-toggle'),
    iconSun: document.getElementById('icon-sun'),
    iconMoon: document.getElementById('icon-moon'),
    headerQuoteCount: document.getElementById('header-quote-count'),
    favoritesDrawerBtn: document.getElementById('btn-favorites-drawer'),
    favoritesBadge: document.getElementById('favorites-count-badge'),

    // Spotlight
    spotlightCard: document.getElementById('spotlight-card'),
    spotlightText: document.getElementById('spotlight-text'),
    spotlightAuthor: document.getElementById('spotlight-author'),
    spotlightProfession: document.getElementById('spotlight-profession'),
    spotlightCategory: document.getElementById('spotlight-category'),
    spotlightYear: document.getElementById('spotlight-year'),
    spotlightId: document.getElementById('spotlight-id'),
    spotlightAvatar: document.getElementById('spotlight-avatar'),
    btnRandomQuote: document.getElementById('btn-random-quote'),
    btnCopyQuote: document.getElementById('btn-copy-quote'),
    btnSpeakQuote: document.getElementById('btn-speak-quote'),
    speakBtnText: document.getElementById('speak-btn-text'),
    btnFavoriteQuote: document.getElementById('btn-favorite-quote'),
    spotlightHeartIcon: document.getElementById('spotlight-heart-icon'),
    favoriteBtnText: document.getElementById('favorite-btn-text'),
    btnShareTwitter: document.getElementById('btn-share-twitter'),

    // Search & Filter
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    authorSelect: document.getElementById('author-select'),
    categoryPillsList: document.getElementById('category-pills-list'),
    pillAll: document.getElementById('pill-all'),
    displayedCount: document.getElementById('displayed-count'),
    totalPoolCount: document.getElementById('total-pool-count'),
    activeFilterIndicator: document.getElementById('active-filter-indicator'),

    // Grid & Empty State
    quotesGrid: document.getElementById('quotes-grid'),
    emptyState: document.getElementById('empty-state'),
    btnResetFilters: document.getElementById('btn-reset-filters'),

    // Favorites Drawer
    favoritesDrawer: document.getElementById('favorites-drawer'),
    drawerOverlay: document.getElementById('drawer-overlay'),
    btnCloseDrawer: document.getElementById('btn-close-drawer'),
    drawerFavoritesCount: document.getElementById('drawer-favorites-count'),
    favoritesList: document.getElementById('favorites-list'),
    btnClearFavorites: document.getElementById('btn-clear-favorites'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
    toastIcon: document.getElementById('toast-icon')
  };

  let toastTimeout = null;

  // =========================================================================
  // Initialization
  // =========================================================================
  async function init() {
    applyTheme(state.theme);
    updateFavoritesBadge();
    bindEvents();

    try {
      // Parallel initial data loads
      await Promise.all([
        loadCategories(),
        loadAuthors(),
        loadAllQuotes()
      ]);

      // Load initial random spotlight quote
      loadRandomSpotlightQuote();
    } catch (err) {
      console.error('Initialization error:', err);
      showToast('Could not connect to backend server', '⚠️');
    }
  }

  // =========================================================================
  // Theme Toggle
  // =========================================================================
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('qv_theme', theme);

    if (theme === 'light') {
      dom.iconSun.classList.remove('hidden');
      dom.iconMoon.classList.add('hidden');
    } else {
      dom.iconSun.classList.add('hidden');
      dom.iconMoon.classList.remove('hidden');
    }
  }

  function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    showToast(`Switched to ${newTheme} mode`, '🌓');
  }

  // =========================================================================
  // Data Fetching
  // =========================================================================
  async function loadAllQuotes() {
    const res = await fetch('/api/quotes');
    const data = await res.json();
    if (data.success) {
      state.allQuotes = data.quotes;
      dom.headerQuoteCount.textContent = `${data.total} Quotes`;
      dom.totalPoolCount.textContent = data.total;
      renderQuotesGrid();
    }
  }

  async function loadCategories() {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.success) {
      state.categories = data.categories;
      renderCategoryPills();
    }
  }

  async function loadAuthors() {
    const res = await fetch('/api/authors');
    const data = await res.json();
    if (data.success) {
      state.authors = data.authors;
      renderAuthorOptions();
    }
  }

  async function loadRandomSpotlightQuote(category = null, author = null) {
    dom.btnRandomQuote.classList.add('rolling');
    setTimeout(() => dom.btnRandomQuote.classList.remove('rolling'), 600);

    const cat = category !== null ? category : state.selectedCategory;
    const auth = author !== null ? author : state.selectedAuthor;

    const params = new URLSearchParams();
    if (cat && cat !== 'all') params.append('category', cat);
    if (auth && auth !== 'all') params.append('author', auth);

    const url = `/api/quotes/random?${params.toString()}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.quote) {
        displaySpotlightQuote(data.quote);
      } else {
        showToast('No quotes found matching criteria', 'ℹ️');
      }
    } catch (err) {
      console.error('Error fetching random quote:', err);
    }
  }

  // =========================================================================
  // Spotlight Rendering
  // =========================================================================
  function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function displaySpotlightQuote(quote) {
    state.currentSpotlightQuote = quote;

    // Smooth transition
    dom.spotlightQuoteAnimation(quote);
  }

  dom.spotlightQuoteAnimation = function (quote) {
    dom.spotlightText.style.opacity = '0';
    dom.spotlightText.style.transform = 'translateY(10px)';

    setTimeout(() => {
      dom.spotlightText.textContent = `"${quote.quote}"`;
      dom.spotlightAuthor.textContent = quote.author;
      dom.spotlightProfession.textContent = quote.profession || 'Historical Figure';
      dom.spotlightCategory.textContent = quote.category;
      dom.spotlightYear.textContent = quote.year || '';
      dom.spotlightId.textContent = `#${quote.id}`;
      dom.spotlightAvatar.textContent = getInitials(quote.author);

      updateSpotlightFavoriteState(quote.id);

      dom.spotlightText.style.opacity = '1';
      dom.spotlightText.style.transform = 'translateY(0)';
    }, 180);
  };

  function updateSpotlightFavoriteState(quoteId) {
    const isFav = isFavorited(quoteId);
    if (isFav) {
      dom.btnFavoriteQuote.classList.add('active-favorite');
      dom.spotlightHeartIcon.setAttribute('fill', '#f43f5e');
      dom.spotlightHeartIcon.setAttribute('stroke', '#f43f5e');
      dom.favoriteBtnText.textContent = 'Favorited';
    } else {
      dom.btnFavoriteQuote.classList.remove('active-favorite');
      dom.spotlightHeartIcon.setAttribute('fill', 'none');
      dom.spotlightHeartIcon.setAttribute('stroke', 'currentColor');
      dom.favoriteBtnText.textContent = 'Favorite';
    }
  }

  // =========================================================================
  // Categories & Authors Rendering
  // =========================================================================
  function renderCategoryPills() {
    // Preserve "All" button
    const fragment = document.createDocumentFragment();

    state.categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-pill';
      btn.setAttribute('data-category', cat.name);
      btn.innerHTML = `${escapeHtml(cat.name)} <span class="pill-count">${cat.count}</span>`;
      btn.addEventListener('click', () => selectCategory(cat.name));
      fragment.appendChild(btn);
    });

    dom.categoryPillsList.appendChild(fragment);
  }

  function renderAuthorOptions() {
    const fragment = document.createDocumentFragment();

    state.authors.forEach(auth => {
      const option = document.createElement('option');
      option.value = auth.name;
      option.textContent = `${auth.name} (${auth.count})`;
      fragment.appendChild(option);
    });

    dom.authorSelect.appendChild(fragment);
  }

  function selectCategory(catName) {
    state.selectedCategory = catName;

    // Update active pill styling
    const allPills = dom.categoryPillsList.querySelectorAll('.category-pill');
    allPills.forEach(pill => {
      if (pill.getAttribute('data-category').toLowerCase() === catName.toLowerCase()) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    updateFilterIndicator();
    renderQuotesGrid();
  }

  function selectAuthor(authorName) {
    state.selectedAuthor = authorName;
    dom.authorSelect.value = authorName;
    updateFilterIndicator();
    renderQuotesGrid();
  }

  function updateFilterIndicator() {
    const activeFilters = [];
    if (state.selectedCategory && state.selectedCategory !== 'all') {
      activeFilters.push(`Category: ${state.selectedCategory}`);
    }
    if (state.selectedAuthor && state.selectedAuthor !== 'all') {
      activeFilters.push(`Author: ${state.selectedAuthor}`);
    }
    if (state.searchQuery) {
      activeFilters.push(`Query: "${state.searchQuery}"`);
    }

    if (activeFilters.length > 0) {
      dom.activeFilterIndicator.textContent = activeFilters.join(' • ');
      dom.activeFilterIndicator.classList.remove('hidden');
    } else {
      dom.activeFilterIndicator.classList.add('hidden');
    }
  }

  // =========================================================================
  // Quotes Grid Rendering & Search Logic
  // =========================================================================
  function getFilteredQuotes() {
    let list = state.allQuotes;

    if (state.selectedCategory && state.selectedCategory !== 'all') {
      const catLower = state.selectedCategory.toLowerCase();
      list = list.filter(q => q.category.toLowerCase() === catLower);
    }

    if (state.selectedAuthor && state.selectedAuthor !== 'all') {
      const authLower = state.selectedAuthor.toLowerCase();
      list = list.filter(q => q.author.toLowerCase().includes(authLower));
    }

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      list = list.filter(q =>
        q.quote.toLowerCase().includes(query) ||
        q.author.toLowerCase().includes(query) ||
        (q.profession && q.profession.toLowerCase().includes(query)) ||
        q.category.toLowerCase().includes(query)
      );
    }

    return list;
  }

  function renderQuotesGrid() {
    const filtered = getFilteredQuotes();
    dom.displayedCount.textContent = filtered.length;

    if (filtered.length === 0) {
      dom.quotesGrid.innerHTML = '';
      dom.emptyState.classList.remove('hidden');
      return;
    }

    dom.emptyState.classList.add('hidden');

    const html = filtered.map(quote => {
      const isFav = isFavorited(quote.id);
      const heartFill = isFav ? '#f43f5e' : 'none';
      const heartStroke = isFav ? '#f43f5e' : 'currentColor';
      const favClass = isFav ? 'favorited' : '';

      return `
        <article class="quote-card" data-id="${quote.id}">
          <div class="quote-card-header">
            <span class="card-category-badge">${escapeHtml(quote.category)}</span>
            <div class="card-actions-quick">
              <button class="btn-card-icon btn-card-copy" data-id="${quote.id}" title="Copy quote" aria-label="Copy quote">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button class="btn-card-icon btn-card-fav ${favClass}" data-id="${quote.id}" title="Favorite quote" aria-label="Favorite quote">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="quote-card-body">
            <p class="card-quote-text">"${escapeHtml(quote.quote)}"</p>
          </div>

          <div class="quote-card-footer">
            <div class="card-author-info">
              <span class="card-author-name">${escapeHtml(quote.author)}</span>
              <span class="card-author-profession">${escapeHtml(quote.profession || '')}</span>
            </div>
            <button class="btn-spotlight-jump" data-id="${quote.id}" title="View in Spotlight">
              Spotlight ↗
            </button>
          </div>
        </article>
      `;
    }).join('');

    dom.quotesGrid.innerHTML = html;
  }

  // =========================================================================
  // Favorites Management (LocalStorage)
  // =========================================================================
  function isFavorited(quoteId) {
    return state.favorites.includes(quoteId);
  }

  function toggleFavorite(quoteId) {
    const id = parseInt(quoteId, 10);
    const index = state.favorites.indexOf(id);

    if (index === -1) {
      state.favorites.push(id);
      showToast('Saved to favorites! ❤️', '✓');
    } else {
      state.favorites.splice(index, 1);
      showToast('Removed from favorites', '✕');
    }

    localStorage.setItem('qv_favorites', JSON.stringify(state.favorites));
    updateFavoritesBadge();

    // Update spotlight UI if current quote matches
    if (state.currentSpotlightQuote && state.currentSpotlightQuote.id === id) {
      updateSpotlightFavoriteState(id);
    }

    // Update grid card heart icon
    renderQuotesGrid();
    renderFavoritesDrawer();
  }

  function updateFavoritesBadge() {
    const count = state.favorites.length;
    dom.drawerFavoritesCount.textContent = count;

    if (count > 0) {
      dom.favoritesBadge.textContent = count;
      dom.favoritesBadge.classList.remove('hidden');
    } else {
      dom.favoritesBadge.classList.add('hidden');
    }
  }

  function renderFavoritesDrawer() {
    if (state.favorites.length === 0) {
      dom.favoritesList.innerHTML = `
        <div class="empty-state" style="padding: 2.5rem 1rem;">
          <div class="empty-icon">💔</div>
          <h3>No favorite quotes yet</h3>
          <p>Click the heart icon on any quote to save it here for quick access.</p>
        </div>
      `;
      return;
    }

    const favQuotes = state.allQuotes.filter(q => state.favorites.includes(q.id));

    dom.favoritesList.innerHTML = favQuotes.map(quote => `
      <div class="favorite-card">
        <p class="favorite-quote-text">"${escapeHtml(quote.quote)}"</p>
        <div class="favorite-footer">
          <span class="favorite-author">${escapeHtml(quote.author)}</span>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button class="btn-spotlight-jump" data-id="${quote.id}">View ↗</button>
            <button class="btn-remove-fav" data-id="${quote.id}" title="Remove favorite" aria-label="Remove favorite">✕</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function openFavoritesDrawer() {
    renderFavoritesDrawer();
    dom.favoritesDrawer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeFavoritesDrawer() {
    dom.favoritesDrawer.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function clearAllFavorites() {
    if (state.favorites.length === 0) return;
    if (confirm('Are you sure you want to clear all favorite quotes?')) {
      state.favorites = [];
      localStorage.setItem('qv_favorites', JSON.stringify([]));
      updateFavoritesBadge();
      if (state.currentSpotlightQuote) {
        updateSpotlightFavoriteState(state.currentSpotlightQuote.id);
      }
      renderQuotesGrid();
      renderFavoritesDrawer();
      showToast('All favorites cleared', '✕');
    }
  }

  // =========================================================================
  // Clipboard Copy & Speech Synthesis
  // =========================================================================
  async function copyQuoteToClipboard(text, author) {
    const formatted = `"${text}" — ${author}`;
    try {
      await navigator.clipboard.writeText(formatted);
      showToast('Quote copied to clipboard! 📋', '✓');
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = formatted;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Quote copied to clipboard! 📋', '✓');
    }
  }

  function speakQuote(text, author) {
    if (!state.synth) {
      showToast('Speech synthesis not supported in this browser', '⚠️');
      return;
    }

    if (state.isSpeaking) {
      state.synth.cancel();
      state.isSpeaking = false;
      dom.btnSpeakQuote.classList.remove('speaking');
      dom.speakBtnText.textContent = 'Listen';
      return;
    }

    const utterance = new SpeechSynthesisUtterance(`"${text}" by ${author}`);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      state.isSpeaking = true;
      dom.btnSpeakQuote.classList.add('speaking');
      dom.speakBtnText.textContent = 'Stop';
    };

    utterance.onend = utterance.onerror = () => {
      state.isSpeaking = false;
      dom.btnSpeakQuote.classList.remove('speaking');
      dom.speakBtnText.textContent = 'Listen';
    };

    state.synth.speak(utterance);
  }

  function shareOnTwitter(text, author) {
    const tweetText = `"${text}" — ${author}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&hashtags=Quotes,Inspiration,Wisdom`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  }

  // =========================================================================
  // Toast Notification
  // =========================================================================
  function showToast(message, icon = '✓') {
    if (toastTimeout) clearTimeout(toastTimeout);
    dom.toastMessage.textContent = message;
    dom.toastIcon.textContent = icon;
    dom.toast.classList.remove('hidden');

    toastTimeout = setTimeout(() => {
      dom.toast.classList.add('hidden');
    }, 2800);
  }

  // =========================================================================
  // Helpers
  // =========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function resetAllFilters() {
    state.selectedCategory = 'all';
    state.selectedAuthor = 'all';
    state.searchQuery = '';

    dom.searchInput.value = '';
    dom.btnClearSearch.classList.add('hidden');
    dom.authorSelect.value = 'all';

    const allPills = dom.categoryPillsList.querySelectorAll('.category-pill');
    allPills.forEach(pill => {
      if (pill.getAttribute('data-category') === 'all') pill.classList.add('active');
      else pill.classList.remove('active');
    });

    updateFilterIndicator();
    renderQuotesGrid();
    showToast('Filters reset', '↺');
  }

  // =========================================================================
  // Event Bindings
  // =========================================================================
  function bindEvents() {
    // Theme toggle
    dom.themeToggleBtn.addEventListener('click', toggleTheme);

    // Spotlight Action buttons
    dom.btnRandomQuote.addEventListener('click', () => {
      loadRandomSpotlightQuote();
    });

    dom.btnCopyQuote.addEventListener('click', () => {
      if (state.currentSpotlightQuote) {
        copyQuoteToClipboard(state.currentSpotlightQuote.quote, state.currentSpotlightQuote.author);
      }
    });

    dom.btnSpeakQuote.addEventListener('click', () => {
      if (state.currentSpotlightQuote) {
        speakQuote(state.currentSpotlightQuote.quote, state.currentSpotlightQuote.author);
      }
    });

    dom.btnFavoriteQuote.addEventListener('click', () => {
      if (state.currentSpotlightQuote) {
        toggleFavorite(state.currentSpotlightQuote.id);
      }
    });

    dom.btnShareTwitter.addEventListener('click', () => {
      if (state.currentSpotlightQuote) {
        shareOnTwitter(state.currentSpotlightQuote.quote, state.currentSpotlightQuote.author);
      }
    });

    // Search input with debounce
    let searchDebounce = null;
    dom.searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      state.searchQuery = val;

      if (val.length > 0) {
        dom.btnClearSearch.classList.remove('hidden');
      } else {
        dom.btnClearSearch.classList.add('hidden');
      }

      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        updateFilterIndicator();
        renderQuotesGrid();
      }, 150);
    });

    dom.btnClearSearch.addEventListener('click', () => {
      dom.searchInput.value = '';
      state.searchQuery = '';
      dom.btnClearSearch.classList.add('hidden');
      updateFilterIndicator();
      renderQuotesGrid();
      dom.searchInput.focus();
    });

    // Author select change
    dom.authorSelect.addEventListener('change', (e) => {
      selectAuthor(e.target.value);
    });

    // Category Pill "All"
    dom.pillAll.addEventListener('click', () => {
      selectCategory('all');
    });

    // Reset filters
    dom.btnResetFilters.addEventListener('click', resetAllFilters);

    // Grid delegations: copy, favorite, and jump to spotlight
    dom.quotesGrid.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.btn-card-copy');
      if (copyBtn) {
        const id = parseInt(copyBtn.getAttribute('data-id'), 10);
        const q = state.allQuotes.find(item => item.id === id);
        if (q) copyQuoteToClipboard(q.quote, q.author);
        return;
      }

      const favBtn = e.target.closest('.btn-card-fav');
      if (favBtn) {
        const id = parseInt(favBtn.getAttribute('data-id'), 10);
        toggleFavorite(id);
        return;
      }

      const jumpBtn = e.target.closest('.btn-spotlight-jump');
      if (jumpBtn) {
        const id = parseInt(jumpBtn.getAttribute('data-id'), 10);
        const q = state.allQuotes.find(item => item.id === id);
        if (q) {
          displaySpotlightQuote(q);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          showToast(`Spotlight: ${q.author}`, '✦');
        }
        return;
      }
    });

    // Favorites Drawer open/close
    dom.favoritesDrawerBtn.addEventListener('click', openFavoritesDrawer);
    dom.btnCloseDrawer.addEventListener('click', closeFavoritesDrawer);
    dom.drawerOverlay.addEventListener('click', closeFavoritesDrawer);
    dom.btnClearFavorites.addEventListener('click', clearAllFavorites);

    // Favorites list delegations
    dom.favoritesList.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.btn-remove-fav');
      if (removeBtn) {
        const id = parseInt(removeBtn.getAttribute('data-id'), 10);
        toggleFavorite(id);
        return;
      }

      const viewBtn = e.target.closest('.btn-spotlight-jump');
      if (viewBtn) {
        const id = parseInt(viewBtn.getAttribute('data-id'), 10);
        const q = state.allQuotes.find(item => item.id === id);
        if (q) {
          displaySpotlightQuote(q);
          closeFavoritesDrawer();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });

    // Keyboard navigation (Escape closes drawer)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !dom.favoritesDrawer.classList.contains('hidden')) {
        closeFavoritesDrawer();
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
