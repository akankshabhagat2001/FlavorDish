
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  prepTime: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  menu: MenuItem[];
}

export interface Order {
  id: string;
  items: (MenuItem & { quantity: number; restaurantId: string; restaurantName: string })[];
  total: number;
  status: 'preparing' | 'picked_up' | 'delivering' | 'near_you' | 'delivered';
  timestamp: number;
  estimatedArrival: number;
  specialInstructions?: string;
}

export interface AiRecommendation {
  name: string;
  description: string;
  reasoning: string;
  imageUrl: string;
}

export interface DiscoveryResult {
  text: string;
  grounding: any[];
}
