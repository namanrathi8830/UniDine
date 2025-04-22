// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', initDashboard);

// Constants
const API_BASE_URL = '/api';

// DOM Elements
const loadingEl = document.getElementById('loading');
const notConnectedEl = document.getElementById('not-connected');
const dashboardContentEl = document.getElementById('dashboard-content');
const userProfileEl = document.getElementById('user-profile');
const usernameEl = document.getElementById('username');
const profileImageEl = document.getElementById('profile-image');
const totalCountEl = document.getElementById('total-count');
const wantToVisitCountEl = document.getElementById('want-to-visit-count');
const visitedCountEl = document.getElementById('visited-count');
const topCuisineEl = document.getElementById('top-cuisine');
const restaurantListEl = document.getElementById('restaurant-list');
const emptyStateEl = document.getElementById('empty-state');
const paginationEl = document.getElementById('pagination');
const showingStartEl = document.getElementById('showing-start');
const showingEndEl = document.getElementById('showing-end');
const totalResultsEl = document.getElementById('total-results');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const statusFilterEl = document.getElementById('status-filter');
const cuisineFilterEl = document.getElementById('cuisine-filter');
const searchEl = document.getElementById('search');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');

// State
let currentPage = 1;
let totalPages = 1;
let restaurants = [];
let cuisines = [];

/**
 * Show error message
 */
function showError(message, error) {
  console.error(message, error);
  errorMessage.textContent = message + (error ? ': ' + error.message : '');
  errorContainer.classList.remove('hidden');
  loadingEl.classList.add('hidden');
}

/**
 * Fetch Instagram connection status
 */
async function fetchInstagramStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/instagram/status`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    showError('Error fetching Instagram status', error);
    return { connected: false };
  }
}

/**
 * Load restaurant statistics
 */
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/restaurants/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load statistics');
    }
    
    const stats = data.stats;
    
    // Update stats UI
    totalCountEl.textContent = stats.totalRecommendations;
    wantToVisitCountEl.textContent = stats.visitStatusStats.want_to_visit;
    visitedCountEl.textContent = stats.visitStatusStats.visited;
    
    // Set top cuisine
    if (stats.topCuisines && stats.topCuisines.length > 0) {
      topCuisineEl.textContent = stats.topCuisines[0]._id;
    } else {
      topCuisineEl.textContent = '-';
    }
  } catch (error) {
    showError('Error loading statistics', error);
  }
}

/**
 * Load available cuisines
 */
async function loadCuisines() {
  try {
    const response = await fetch(`${API_BASE_URL}/restaurants/cuisines`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load cuisines');
    }
    
    cuisines = data.cuisines;
    
    // Populate the cuisine filter dropdown
    cuisineFilterEl.innerHTML = '<option value="">All Cuisines</option>';
    cuisines.forEach(cuisine => {
      const option = document.createElement('option');
      option.value = cuisine;
      option.textContent = cuisine;
      cuisineFilterEl.appendChild(option);
    });
  } catch (error) {
    showError('Error loading cuisines', error);
  }
}

/**
 * Load restaurants with pagination and filtering
 */
async function loadRestaurants() {
  try {
    // Show loading state
    restaurantListEl.innerHTML = '<div class="col-span-full text-center py-4">Loading restaurants...</div>';
    
    // Get filter values
    const status = statusFilterEl.value;
    const cuisine = cuisineFilterEl.value;
    const search = searchEl.value;
    
    // Build query parameters
    let queryParams = new URLSearchParams({
      page: currentPage,
      limit: 9
    });
    
    if (status) {
      queryParams.append('visitStatus', status);
    }
    
    if (cuisine) {
      queryParams.append('cuisine', cuisine);
    }
    
    if (search) {
      queryParams.append('search', search);
    }
    
    // Fetch restaurants
    const response = await fetch(`${API_BASE_URL}/restaurants?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load restaurants');
    }
    
    restaurants = data.restaurants;
    const pagination = data.pagination;
    
    // Update pagination info
    totalPages = pagination.pages;
    
    const start = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
    const end = Math.min(start + pagination.limit - 1, pagination.total);
    
    showingStartEl.textContent = start;
    showingEndEl.textContent = end;
    totalResultsEl.textContent = pagination.total;
    
    // Update pagination buttons
    prevPageBtn.disabled = pagination.page <= 1;
    nextPageBtn.disabled = pagination.page >= pagination.pages;
    
    // If no restaurants, show empty state
    if (restaurants.length === 0) {
      emptyStateEl.classList.remove('hidden');
      restaurantListEl.innerHTML = '';
      paginationEl.classList.add('hidden');
    } else {
      emptyStateEl.classList.add('hidden');
      paginationEl.classList.remove('hidden');
      
      // Render restaurants
      renderRestaurants();
    }
  } catch (error) {
    showError('Error loading restaurants', error);
    restaurantListEl.innerHTML = '<div class="col-span-full text-center py-4 text-red-500">Error loading restaurants. Please try again.</div>';
  }
}

/**
 * Render restaurant cards
 */
function renderRestaurants() {
  try {
    restaurantListEl.innerHTML = '';
    
    restaurants.forEach(restaurant => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden';
      
      let statusBadge = '';
      if (restaurant.visitStatus === 'want_to_visit') {
        statusBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Want to Visit</span>';
      } else if (restaurant.visitStatus === 'visited') {
        statusBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Visited</span>';
      } else if (restaurant.visitStatus === 'not_interested') {
        statusBadge = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Not Interested</span>';
      }
      
      const cuisineText = restaurant.cuisine && restaurant.cuisine.length > 0 
        ? restaurant.cuisine.join(', ') 
        : 'Unknown Cuisine';
        
      const locationText = restaurant.location && restaurant.location !== 'Unknown Location'
        ? restaurant.location
        : 'Location not specified';
        
      // Get the first mention text to display
      const messageText = restaurant.mentionTexts && restaurant.mentionTexts.length > 0
        ? restaurant.mentionTexts[0]
        : 'No message available';
      
      card.innerHTML = `
        <div class="p-4">
          <div class="flex justify-between items-start">
            <h3 class="text-lg font-semibold text-gray-900">${restaurant.name}</h3>
            ${statusBadge}
          </div>
          <div class="mt-2 text-sm text-gray-600">
            <p><span class="font-medium">Cuisine:</span> ${cuisineText}</p>
            <p><span class="font-medium">Location:</span> ${locationText}</p>
            <p class="mt-2 text-gray-500 italic">"${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}"</p>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <select class="status-select text-sm rounded border-gray-300" data-id="${restaurant._id}">
              <option value="want_to_visit" ${restaurant.visitStatus === 'want_to_visit' ? 'selected' : ''}>Want to Visit</option>
              <option value="visited" ${restaurant.visitStatus === 'visited' ? 'selected' : ''}>Visited</option>
              <option value="not_interested" ${restaurant.visitStatus === 'not_interested' ? 'selected' : ''}>Not Interested</option>
            </select>
            <button class="text-sm text-gray-600 hover:text-red-500 transition-colors" data-id="${restaurant._id}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      `;
      
      restaurantListEl.appendChild(card);
    });
  } catch (error) {
    showError('Error rendering restaurants', error);
  }
}

/**
 * Update restaurant status
 */
async function updateRestaurantStatus(restaurantId, newStatus) {
  try {
    const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ visitStatus: newStatus })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update restaurant status');
    }
    
    // Refresh stats and restaurants
    await loadStats();
    await loadRestaurants();
  } catch (error) {
    showError('Error updating restaurant status', error);
  }
}

/**
 * Delete restaurant
 */
async function deleteRestaurant(restaurantId) {
  try {
    const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete restaurant');
    }
    
    // Refresh stats and restaurants
    await loadStats();
    await loadRestaurants();
  } catch (error) {
    showError('Error deleting restaurant', error);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  try {
    // Pagination
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadRestaurants();
      }
    });
    
    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadRestaurants();
      }
    });
    
    // Filters
    statusFilterEl.addEventListener('change', () => {
      currentPage = 1;
      loadRestaurants();
    });
    
    cuisineFilterEl.addEventListener('change', () => {
      currentPage = 1;
      loadRestaurants();
    });
    
    // Search with debounce
    let searchTimeout;
    searchEl.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadRestaurants();
      }, 300);
    });
    
    // Restaurant status updates
    restaurantListEl.addEventListener('change', async (event) => {
      if (event.target.classList.contains('status-select')) {
        const restaurantId = event.target.dataset.id;
        const newStatus = event.target.value;
        
        await updateRestaurantStatus(restaurantId, newStatus);
      }
    });
    
    // Delete restaurant
    restaurantListEl.addEventListener('click', async (event) => {
      const deleteButton = event.target.closest('button[data-id]');
      if (deleteButton) {
        const restaurantId = deleteButton.dataset.id;
        
        if (confirm('Are you sure you want to delete this restaurant?')) {
          await deleteRestaurant(restaurantId);
        }
      }
    });
  } catch (error) {
    showError('Error setting up event listeners', error);
  }
}

/**
 * Show the not connected state
 */
function showNotConnected() {
  loadingEl.classList.add('hidden');
  notConnectedEl.classList.remove('hidden');
}

/**
 * Initialize the dashboard
 */
async function initDashboard() {
  try {
    // Check if user is connected to Instagram
    const instagramStatus = await fetchInstagramStatus();
    
    if (!instagramStatus.connected) {
      showNotConnected();
      return;
    }
    
    // Populate the user profile info
    usernameEl.textContent = instagramStatus.user.username;
    userProfileEl.classList.remove('hidden');
    userProfileEl.classList.add('flex');
    
    // Load restaurant stats
    await loadStats();
    
    // Load available cuisines for the filter
    await loadCuisines();
    
    // Load first page of restaurants
    await loadRestaurants();
    
    // Show the dashboard content
    dashboardContentEl.classList.remove('hidden');
    loadingEl.classList.add('hidden');
    
    // Set up event listeners
    setupEventListeners();
  } catch (error) {
    showError('Failed to initialize dashboard', error);
  }
} 