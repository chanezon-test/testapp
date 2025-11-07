# Movie Ratings for Criterion & Kanopy

A Microsoft Edge browser extension that adds Rotten Tomatoes and IMDb ratings to movies on Criterion Collection and Kanopy websites.

## Features

- **Multi-Site Support**: Works on both Criterion Collection and Kanopy streaming platforms
- **Automatic Rating Display**: Displays Rotten Tomatoes ratings (Tomatometer) under each movie on listing pages
- **Clickable Links**: Both Rotten Tomatoes and IMDb ratings are clickable - click to read full reviews and details!
- **IMDb Ratings**: Shows IMDb ratings when available, with direct links to the movie's IMDb page
- **Visual Indicators**: Shows tomato or splat emoji based on rating (Fresh: 🍅 60%+, Rotten: 🤢 <60%)
- **Site-Specific**: Only runs on https://www.criterionchannel.com/* and https://www.kanopy.com/*, ensuring no interference with other websites
- **Dynamic Loading**: Detects and rates movies even when they're loaded dynamically (perfect for single-page apps)
- **Caching**: Caches rating results to minimize API calls

## Prerequisites

Before installing the extension, you need to obtain a free OMDB API key:

1. Visit [OMDB API](https://www.omdbapi.com/apikey.aspx)
2. Select the **FREE** plan (1,000 requests per day)
3. Enter your email address
4. Check your email for the API key activation link
5. Click the activation link
6. Save your API key (you'll need it after installing the extension)

## Installation

### Method 1: Load Unpacked Extension (Recommended for Testing)

1. **Download the Extension**
   - Download this repository as a ZIP file
   - Extract it to a location on your computer

2. **Open Edge Extensions Page**
   - Open Microsoft Edge
   - Navigate to `edge://extensions/`
   - Or click the three dots menu → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the bottom left corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to the `criterion-rt-extension` folder
   - Click "Select Folder"

5. **Configure API Key**
   - Click on the extension icon in your browser toolbar
   - Or go to `edge://extensions/` and click "Details" on the extension
   - Click "Extension options"
   - Enter your OMDB API key
   - Click "Save Settings"
   - The extension will validate your API key

### Method 2: Create a Package (Optional)

For personal use, you can package the extension:

1. Go to `edge://extensions/`
2. Click "Pack extension"
3. Select the extension folder
4. Click "Pack extension"

This will create a `.crx` file you can install later.

## Usage

1. **Navigate to a Supported Site**
   - **Criterion Collection**: Go to https://www.criterionchannel.com/
     - Browse to any collection or listing page (e.g., https://www.criterionchannel.com/family-reunions)
   - **Kanopy**: Go to https://www.kanopy.com/
     - Browse to any category or search results page with movie listings

2. **View Ratings**
   - The extension will automatically detect movies on the page
   - Ratings will appear below each movie title
   - Format: 🍅 85% IMDb: 7.5/10
   - Click on ratings to view full details on Rotten Tomatoes or IMDb

3. **Troubleshooting**
   - If ratings don't appear, check:
     - Your API key is correctly entered in the options
     - You're on a supported site with movie listings
     - The page has finished loading (extension detects dynamically loaded content)
     - Check the browser console (F12) for any error messages

## Extension Structure

```
criterion-rt-extension/
├── manifest.json         # Extension configuration
├── content.js           # Main logic for detecting movies and fetching ratings
├── background.js        # Background service worker
├── styles.css           # Styling for rating display
├── options.html         # Options page for API key configuration
├── options.js           # Options page logic
├── icon16.png          # Extension icon (16x16)
├── icon48.png          # Extension icon (48x48)
├── icon128.png         # Extension icon (128x128)
└── README.md           # This file
```

## How It Works

1. **Site Detection**: Extension detects whether you're on Criterion Collection or Kanopy
2. **Content Script Injection**: The extension injects `content.js` on supported sites
3. **Movie Detection**: The script searches for movie elements using site-specific CSS selectors:
   - **Criterion**: `li.js-collection-item.item-type-video`, `.browse-item-title strong`
   - **Kanopy**: `a[href*="/product/"]`, various heading and title selectors
4. **Title Extraction**: Extracts movie titles from the page elements
5. **API Request**: Queries the OMDB API for each movie
6. **Rating Display**: Inserts clickable rating links below each movie title
7. **Dynamic Monitoring**: Watches for new movies added to the page via AJAX/dynamic loading

## API Limits

The free OMDB API key provides:
- **1,000 requests per day**
- If you exceed this limit, new ratings won't load until the next day
- Ratings are cached to minimize API usage

## Privacy

- This extension only runs on criterionchannel.com and kanopy.com
- Your API key is stored locally in your browser
- No data is sent to third parties except OMDB API for rating lookups
- No tracking or analytics

## Troubleshooting

### Ratings Not Appearing

1. **Check API Key**
   - Go to extension options
   - Verify your API key is entered correctly
   - Click "Save Settings" to validate

2. **Check Console**
   - Press F12 to open Developer Tools
   - Go to Console tab
   - Look for any error messages starting with "Movie Ratings Extension:"

3. **Refresh Page**
   - Try refreshing the page
   - Wait for the page to fully load (especially on Kanopy's dynamic interface)
   - The extension runs on page load

### "Invalid API key" Error

- Double-check your OMDB API key
- Make sure you clicked the activation link in your email
- Try generating a new API key

### Movies Not Being Detected

- Make sure you're on a collection/listing page (not a single movie page)
- Check that the page has movie thumbnails visible
- Some pages might use different layouts

## Development

### Technologies Used

- **Manifest V3**: Latest Chrome/Edge extension format
- **JavaScript ES6+**: Modern JavaScript features
- **Chrome Storage API**: For storing API key
- **OMDB API**: For movie ratings
- **MutationObserver**: For detecting dynamically loaded content

### Modifying the Extension

1. Edit files in the extension folder
2. Go to `edge://extensions/`
3. Click the refresh icon on the extension card
4. Refresh any supported site pages to see changes

## Known Limitations

- Only works on Criterion Collection and Kanopy websites
- Requires an OMDB API key (free, but limited to 1,000 requests/day)
- Some movie titles may not match perfectly (e.g., international titles, special characters)
- Ratings may not be available for very obscure or new films
- On Kanopy, selectors may need adjustment if the site layout changes (due to dynamic React/Nuxt.js app)

## Future Enhancements

Potential improvements for future versions:
- Support for more streaming platforms
- Support for more rating sources (Metacritic, Letterboxd)
- Better caching to persist across browser sessions
- Options to customize which ratings to display
- Support for individual movie pages
- Better error handling and user feedback
- Refined selectors for Kanopy based on user feedback

## License

This extension is provided as-is for personal use. OMDB API usage is subject to their terms of service.

## Credits

- **OMDB API**: http://www.omdbapi.com/
- **Rotten Tomatoes**: Rating data via OMDB
- **IMDb**: Rating data via OMDB

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review console errors (F12 → Console)
3. Verify your API key is valid and activated
4. If Kanopy detection isn't working, please share the HTML structure to help refine selectors

---

**Note**: This is an unofficial extension and is not affiliated with Criterion Collection, Kanopy, Rotten Tomatoes, or IMDb.
