// Mock data for testing the UniDine dashboard
console.log('Mock data script loaded!');

// Instagram status mock response
const instagramStatusMock = {
  connected: true,
  user: {
    instagram_id: "12345678901234567",
    username: "foodie_adventures"
  }
};
console.log('instagramStatusMock defined');

// Stats mock response
const statsMock = {
  visitStatusStats: {
    want_to_visit: 17,
    visited: 8,
    not_interested: 2
  },
  topCuisines: [
    { _id: "Italian", count: 9 },
    { _id: "Mexican", count: 5 },
    { _id: "Japanese", count: 4 },
    { _id: "Thai", count: 3 },
    { _id: "Indian", count: 3 }
  ],
  recentActivity: [
    {
      _id: "rest_new",
      name: "Pasta Palace",
      createdAt: new Date().toISOString(),
      visitStatus: "want_to_visit"
    },
    {
      _id: "rest_010",
      name: "Romano",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      visitStatus: "want_to_visit"
    },
    {
      _id: "rest_001",
      name: "Bella Italia",
      createdAt: "2023-11-02T10:15:23.000Z",
      visitStatus: "want_to_visit"
    },
    {
      _id: "rest_002",
      name: "Sakura Sushi",
      createdAt: "2023-11-01T18:22:10.000Z",
      visitStatus: "visited"
    }
  ],
  totalRecommendations: 27
};

// Restaurants mock response
const restaurantsMock = {
  restaurants: [
    {
      _id: "rest_new",
      name: "Pasta Palace",
      location: "New York, NY",
      cuisine: ["Italian"],
      priceRange: "$$$",
      rating: 4.6,
      originalMessage: "I really liked Pasta Palace in New York. It has amazing Italian food and great service. Definitely worth visiting!",
      visitStatus: "want_to_visit",
      createdAt: new Date().toISOString(),
      source: "instagram"
    },
    {
      _id: "rest_010",
      name: "Romano",
      location: "Mumbai, India",
      cuisine: ["Italian"],
      priceRange: "$$$",
      rating: 4.7,
      originalMessage: "I discovered this amazing Italian restaurant called Romano in Mumbai. Their pasta and tiramisu are to die for!",
      visitStatus: "want_to_visit",
      createdAt: new Date().toISOString(),
      source: "instagram"
    },
    {
      _id: "rest_001",
      name: "Bella Italia",
      location: "123 Main St, New York, NY",
      cuisine: ["Italian", "Mediterranean"],
      priceRange: "$$",
      rating: 4.5,
      originalMessage: "I just tried this amazing Italian place called Bella Italia in NYC. The pasta was incredible!",
      visitStatus: "want_to_visit",
      createdAt: "2023-11-02T10:15:23.000Z",
      source: "instagram"
    },
    {
      _id: "rest_002",
      name: "Sakura Sushi",
      location: "456 Oak Ave, San Francisco, CA",
      cuisine: ["Japanese"],
      priceRange: "$$$",
      rating: 4.8,
      originalMessage: "Had dinner at Sakura Sushi in SF last night. The sushi was so fresh!",
      visitStatus: "visited",
      createdAt: "2023-11-01T18:22:10.000Z",
      source: "instagram"
    },
    {
      _id: "rest_003",
      name: "El Mariachi",
      location: "789 Pine St, Chicago, IL",
      cuisine: ["Mexican"],
      priceRange: "$$",
      rating: 4.2,
      originalMessage: "You have to try El Mariachi in Chicago! Best tacos and great margaritas.",
      visitStatus: "want_to_visit",
      createdAt: "2023-10-28T14:05:33.000Z",
      source: "instagram"
    },
    {
      _id: "rest_004",
      name: "Spice Garden",
      location: "234 Elm St, Austin, TX",
      cuisine: ["Indian"],
      priceRange: "$$",
      rating: 4.3,
      originalMessage: "Had dinner at Spice Garden in Austin. The butter chicken and naan were delicious!",
      visitStatus: "visited",
      createdAt: "2023-10-25T19:12:45.000Z",
      source: "instagram"
    },
    {
      _id: "rest_005",
      name: "Thai Orchid",
      location: "567 Maple Ave, Boston, MA",
      cuisine: ["Thai"],
      priceRange: "$$",
      rating: 4.4,
      originalMessage: "Thai Orchid in Boston has the best pad thai I've ever had. Highly recommend!",
      visitStatus: "want_to_visit",
      createdAt: "2023-10-22T12:33:18.000Z",
      source: "instagram"
    },
    {
      _id: "rest_006",
      name: "Burger Joint",
      location: "890 Cedar St, Seattle, WA",
      cuisine: ["American"],
      priceRange: "$",
      rating: 4.0,
      originalMessage: "Tried Burger Joint in Seattle. Good burgers but nothing special.",
      visitStatus: "not_interested",
      createdAt: "2023-10-19T15:48:22.000Z",
      source: "instagram"
    },
    {
      _id: "rest_007",
      name: "Pasta Paradise",
      location: "345 Birch St, Miami, FL",
      cuisine: ["Italian"],
      priceRange: "$$$",
      rating: 4.7,
      originalMessage: "Pasta Paradise in Miami is a must-visit! The carbonara was incredible.",
      visitStatus: "want_to_visit",
      createdAt: "2023-10-15T20:10:05.000Z",
      source: "instagram"
    },
    {
      _id: "rest_008",
      name: "Sushi Supreme",
      location: "678 Walnut St, Los Angeles, CA",
      cuisine: ["Japanese"],
      priceRange: "$$$$",
      rating: 4.9,
      originalMessage: "Had omakase at Sushi Supreme in LA. It was pricey but absolutely worth it!",
      visitStatus: "visited",
      createdAt: "2023-10-12T21:05:30.000Z",
      source: "instagram"
    },
    {
      _id: "rest_009",
      name: "Taco Town",
      location: "901 Spruce St, Dallas, TX",
      cuisine: ["Mexican"],
      priceRange: "$",
      rating: 4.1,
      originalMessage: "Taco Town in Dallas has amazing street tacos for a great price!",
      visitStatus: "want_to_visit",
      createdAt: "2023-10-08T13:27:14.000Z",
      source: "instagram"
    }
  ],
  pagination: {
    total: 27,
    page: 1,
    limit: 9,
    pages: 3
  }
};

// Export the mock data
if (typeof module !== 'undefined') {
  module.exports = {
    instagramStatusMock,
    statsMock,
    restaurantsMock
  };
} 