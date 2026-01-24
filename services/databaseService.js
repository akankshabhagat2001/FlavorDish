import { RESTAURANTS as INITIAL_RESTAURANTS } from '../data/mockData.js';

const STORAGE_KEYS = {
  ORDERS: 'flavordish_db_orders',
  AUTH: 'flavordish_db_auth',
  RESTAURANTS: 'flavordish_db_restaurants',
  USERS: 'flavordish_db_users',
  ENHANCEMENTS: 'flavordish_db_menu_enhancements'
};

class DatabaseService {
  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Auth & Users ---
  async login(username, password) {
    await this.delay(600);
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      const { password, ...safeUser } = user;
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(safeUser));
      return safeUser;
    }
    throw new Error("Invalid credentials");
  }

  async register(userData) {
    await this.delay(500);
    const users = this.getUsers();
    if (users.find(u => u.username === userData.username)) throw new Error("User exists");
    
    const newUser = { ...userData, id: Date.now().toString(), role: 'user' };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  }

  getUsers() {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      const initialUsers = [
        { id: '1', username: 'admin', password: 'admin', role: 'admin', name: 'FlavorDish Admin' },
        { id: '2', username: 'user', password: 'pass', role: 'user', name: 'Premium Guest' }
      ];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(data);
  }

  getCurrentUser() {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH);
    return data ? JSON.parse(data) : null;
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }

  // --- Restaurants & Menu Items ---
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
    await this.delay(400);
    const restaurants = await this.getRestaurants();
    const index = restaurants.findIndex(r => r.id === restaurant.id);
    let updated;
    if (index > -1) {
      updated = [...restaurants];
      updated[index] = { ...updated[index], ...restaurant };
    } else {
      updated = [{ ...restaurant, id: Date.now().toString(), menu: restaurant.menu || [] }, ...restaurants];
    }
    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(updated));
    return updated;
  }

  async deleteRestaurant(id) {
    const restaurants = await this.getRestaurants();
    const updated = restaurants.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(updated));
    return updated;
  }

  async saveMenuItem(restaurantId, item) {
    const restaurants = await this.getRestaurants();
    const rIndex = restaurants.findIndex(r => r.id === restaurantId);
    if (rIndex === -1) return restaurants;

    const restaurant = restaurants[rIndex];
    const mIndex = restaurant.menu.findIndex(m => m.id === item.id);

    if (mIndex > -1) {
      restaurant.menu[mIndex] = item;
    } else {
      restaurant.menu.push({ ...item, id: `m_${Date.now()}` });
    }

    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(restaurants));
    return restaurants;
  }

  async deleteMenuItem(restaurantId, itemId) {
    const restaurants = await this.getRestaurants();
    const rIndex = restaurants.findIndex(r => r.id === restaurantId);
    if (rIndex > -1) {
      restaurants[rIndex].menu = restaurants[rIndex].menu.filter(m => m.id !== itemId);
      localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(restaurants));
    }
    return restaurants;
  }

  // --- Orders ---
  async getOrders() {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  }

  async saveOrder(order) {
    await this.delay(800);
    const orders = await this.getOrders();
    const newOrder = { ...order, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([newOrder, ...orders]));
    return newOrder;
  }

  async updateOrderStatus(orderId, newStatus) {
    const orders = await this.getOrders();
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    return updated;
  }
}

export const db = new DatabaseService();