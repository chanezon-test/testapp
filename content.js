// Movie Ratings Extension for Criterion Collection and Kanopy - Content Script

class MovieRatingsExtension {
  constructor() {
    this.apiKey = null;
    this.cache = new Map();
    this.observer = null;
    this.currentSite = this.detectSite();
    this.init();
  }

  detectSite() {
    const hostname = window.location.hostname;
    if (hostname.includes('criterionchannel.com')) {
      return 'criterion';
    } else if (hostname.includes('kanopy.com')) {
      return 'kanopy';
    }
    return 'unknown';
  }

  async init() {
    // Get API key from storage
    this.apiKey = await this.getApiKey();

    if (!this.apiKey) {
      console.log('Movie Ratings Extension: No OMDB API key configured. Please set one in the extension options.');
      return;
    }

    console.log(`Movie Ratings Extension: Running on ${this.currentSite}`);

    // Process existing movies
    this.processMovies();

    // Watch for dynamically loaded content
    this.setupObserver();
  }

  async getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['omdbApiKey'], (result) => {
        resolve(result.omdbApiKey || null);
      });
    });
  }

  setupObserver() {
    // Watch for new content being added to the page
    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
        }
      });

      if (shouldProcess) {
        // Debounce to avoid excessive processing
        clearTimeout(this.processTimeout);
        this.processTimeout = setTimeout(() => this.processMovies(), 500);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  findMovieElements() {
    let selectors = [];

    if (this.currentSite === 'criterion') {
      // Criterion Collection specific selectors
      selectors = [
        'li.js-collection-item.item-type-video',
        '.js-collection-item',
        '.browse-item-card'
      ];
    } else if (this.currentSite === 'kanopy') {
      // Kanopy specific selectors
      selectors = [
        'a[href*="/product/"]',  // Kanopy product links
        'div[class*="film"]',
        'div[class*="movie"]',
        'div[class*="video-card"]',
        'article',
        '.card'
      ];
    }

    let movieElements = [];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        movieElements = Array.from(elements);
        console.log(`Found ${elements.length} potential movie elements using selector: ${selector}`);
        break;
      }
    }

    return movieElements;
  }

  extractMovieTitle(element) {
    let title = null;

    if (this.currentSite === 'criterion') {
      // Criterion Collection specific title extraction
      const titleEl = element.querySelector('.browse-item-title strong');
      if (titleEl && titleEl.textContent.trim()) {
        return this.cleanTitle(titleEl.textContent);
      }
    } else if (this.currentSite === 'kanopy') {
      // Kanopy specific title extraction

      // Try various selectors commonly used on Kanopy
      const selectors = [
        'h3',
        'h4',
        '[class*="title"]',
        '[class*="name"]',
        '[aria-label]'
      ];

      for (const selector of selectors) {
        const titleEl = element.querySelector(selector);
        if (titleEl && titleEl.textContent.trim()) {
          title = this.cleanTitle(titleEl.textContent);
          if (title) return title;
        }
      }

      // Check aria-label on the element itself
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.trim()) {
        return this.cleanTitle(ariaLabel);
      }
    }

    // Universal fallbacks for both sites

    // Check image alt text
    const img = element.querySelector('img[alt]');
    if (img && img.alt && img.alt.trim()) {
      return this.cleanTitle(img.alt);
    }

    // Check data attributes
    const dataTitle = element.getAttribute('data-title') ||
                     element.getAttribute('data-film-title') ||
                     element.getAttribute('data-movie-title');
    if (dataTitle) return this.cleanTitle(dataTitle);

    return null;
  }

  cleanTitle(title) {
    // Remove extra whitespace, year info in parentheses, etc.
    let cleaned = title
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\(\d{4}\)/, ''); // Remove year

    // For titles with " - " separator (common on Kanopy with dual language titles)
    // Take only the first part (usually English title)
    // Example: "The Romance of Astrea and Celadon - Les amours d'Astrée et de Céladon"
    // becomes: "The Romance of Astrea and Celadon"
    if (cleaned.includes(' - ')) {
      const parts = cleaned.split(' - ');
      cleaned = parts[0];
    }

    return cleaned.trim();
  }

  async processMovies() {
    const movieElements = this.findMovieElements();

    if (movieElements.length === 0) {
      console.log('Criterion RT Extension: No movie elements found on this page.');
      return;
    }

    for (const element of movieElements) {
      // Skip if already processed
      if (element.hasAttribute('data-rt-processed')) {
        continue;
      }

      const title = this.extractMovieTitle(element);

      if (title) {
        element.setAttribute('data-rt-processed', 'true');
        await this.addRatingToElement(element, title);
      }
    }
  }

  async addRatingToElement(element, title) {
    // Create rating container
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'criterion-rt-rating';
    ratingContainer.innerHTML = '<span class="rt-loading">Loading RT rating...</span>';

    // Find best place to insert rating
    const insertionPoint = this.findInsertionPoint(element);
    if (insertionPoint) {
      insertionPoint.appendChild(ratingContainer);
    } else {
      element.appendChild(ratingContainer);
    }

    // Fetch and display rating
    try {
      const rating = await this.fetchRating(title);
      this.displayRating(ratingContainer, rating);
    } catch (error) {
      console.error(`Error fetching rating for "${title}":`, error);
      ratingContainer.innerHTML = '<span class="rt-error">Rating unavailable</span>';
    }
  }

  findInsertionPoint(element) {
    // Try to find a good place to insert the rating
    let candidates = [];

    if (this.currentSite === 'criterion') {
      // Criterion Collection specific insertion points
      candidates = [
        element.querySelector('.padding-small'),
        element.querySelector('.browse-item-title'),
        element.querySelector('.grid-item-padding')
      ];
    } else if (this.currentSite === 'kanopy') {
      // Kanopy specific insertion points
      candidates = [
        element.querySelector('[class*="info"]'),
        element.querySelector('[class*="meta"]'),
        element.querySelector('[class*="details"]'),
        element.querySelector('[class*="content"]'),
        element.querySelector('div')
      ];
    }

    return candidates.find(el => el !== null) || element;
  }

  createRottenTomatoesUrl(title, year) {
    // Convert movie title to Rotten Tomatoes URL format
    // Example: "The Grand Budapest Hotel" -> "the_grand_budapest_hotel"
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/^the_/, '') // Remove leading "the_"
      .replace(/_+/g, '_') // Remove duplicate underscores
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

    return `https://www.rottentomatoes.com/m/${slug}`;
  }

  async fetchRating(title) {
    // Check cache first
    if (this.cache.has(title)) {
      return this.cache.get(title);
    }

    // Fetch from OMDB API
    const url = `https://www.omdbapi.com/?apikey=${this.apiKey}&t=${encodeURIComponent(title)}&type=movie`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === 'False') {
      throw new Error(data.Error || 'Movie not found');
    }

    // Extract Rotten Tomatoes rating
    const rtRating = data.Ratings?.find(r => r.Source === 'Rotten Tomatoes');
    const rating = {
      tomatometer: rtRating ? rtRating.Value : null,
      imdbRating: data.imdbRating !== 'N/A' ? data.imdbRating : null,
      imdbID: data.imdbID || null,
      year: data.Year,
      title: data.Title,
      rtUrl: this.createRottenTomatoesUrl(data.Title, data.Year),
      imdbUrl: data.imdbID ? `https://www.imdb.com/title/${data.imdbID}/` : null
    };

    // Cache the result
    this.cache.set(title, rating);

    return rating;
  }

  displayRating(container, rating) {
    if (rating.tomatometer) {
      const percentage = parseInt(rating.tomatometer);
      const tomatoIcon = percentage >= 60 ? '🍅' : '🤢';

      // Build IMDb rating HTML (with or without link)
      let imdbHtml = '';
      if (rating.imdbRating) {
        if (rating.imdbUrl) {
          imdbHtml = `<a href="${rating.imdbUrl}" target="_blank" rel="noopener noreferrer" class="imdb-link" title="View on IMDb"><span class="imdb-score">IMDb: ${rating.imdbRating}/10</span></a>`;
        } else {
          imdbHtml = `<span class="imdb-score">IMDb: ${rating.imdbRating}/10</span>`;
        }
      }

      container.innerHTML = `
        <div class="rt-rating-content">
          <a href="${rating.rtUrl}" target="_blank" rel="noopener noreferrer" class="rt-link" title="View on Rotten Tomatoes">
            <span class="rt-icon">${tomatoIcon}</span>
            <span class="rt-score">${rating.tomatometer}</span>
          </a>
          ${imdbHtml}
        </div>
      `;
    } else if (rating.imdbRating) {
      if (rating.imdbUrl) {
        container.innerHTML = `
          <div class="rt-rating-content">
            <a href="${rating.imdbUrl}" target="_blank" rel="noopener noreferrer" class="imdb-link" title="View on IMDb">
              <span class="imdb-score">IMDb: ${rating.imdbRating}/10</span>
            </a>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="rt-rating-content">
            <span class="imdb-score">IMDb: ${rating.imdbRating}/10</span>
          </div>
        `;
      }
    } else {
      container.innerHTML = '<span class="rt-na">No rating available</span>';
    }
  }
}

// Initialize the extension when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MovieRatingsExtension();
  });
} else {
  new MovieRatingsExtension();
}
