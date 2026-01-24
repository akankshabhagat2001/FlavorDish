
import { RESTAURANTS as INITIAL_RESTAURANTS } from '../data/mockData.js';

const STORAGE_KEYS = {
  ORDERS: 'flavordish_db_orders',
  FAVORITES: 'flavordish_db_favorites',
  CART: 'flavordish_db_cart',
  AUTH: 'flavordish_db_auth',
  RESTAURANTS: 'flavordish_db_restaurants',
  NOTIFICATIONS: 'flavordish_db_notifications',
  ENHANCEMENTS: 'flavordish_db_menu_enhancements'
};

class DatabaseService {
  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async login(username, password) {
    await this.delay(600);
    if (username === 'admin' && password === 'admin') {
      const user = { username: 'admin', role: 'admin', name: 'FlavorDish Admin' };
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
      return user;
    }
    if (username === 'user' && password === 'pass') {
      const user = { username: 'user', role: 'user', name: 'Premium Guest' };
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
      return user;
    }
    throw new Error("Invalid credentials");
  }

  getCurrentUser() {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH);
    return data ? JSON.parse(data) : null;
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }

  async getRestaurants() {
    await this.delay(200);
    const data = localStorage.getItem(STORAGE_KEYS.RESTAURANTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(INITIAL_RESTAURANTS));
      return INITIAL_RESTAURANTS;
    }
    return JSON.parse(data);
  }

  async saveRestaurant(restaurant) {
    await this.delay(500);
    const restaurants = await this.getRestaurants();
    const updated = [restaurant, ...restaurants];
    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(updated));
    return updated;
  }

  async saveMenuEnhancements(restaurantId, enhancements) {
    const data = localStorage.getItem(STORAGE_KEYS.ENHANCEMENTS);
    const allEnhancements = data ? JSON.parse(data) : {};
    allEnhancements[restaurantId] = enhancements;
    localStorage.setItem(STORAGE_KEYS.ENHANCEMENTS, JSON.stringify(allEnhancements));
    return true;
  }

  async getMenuEnhancements(restaurantId) {
    const data = localStorage.getItem(STORAGE_KEYS.ENHANCEMENTS);
    const allEnhancements = data ? JSON.parse(data) : {};
    return allEnhancements[restaurantId] || null;
  }

  async getOrders() {
    await this.delay();
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  }

  async saveOrder(order) {
    await this.delay(800);
    const orders = await this.getOrders();
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([order, ...orders]));
    return true;
  }

  async updateOrderStatus(orderId, newStatus) {
    await this.delay(400);
    const orders = await this.getOrders();
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    return updated;
  }

  async getCart() {
    await this.delay();
    const data = localStorage.getItem(STORAGE_KEYS.CART);
    return data ? JSON.parse(data) : [];
  }

  async saveCart(cart) {
    await this.delay(200);
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    return true;
  }
}

export const db = new DatabaseService();
