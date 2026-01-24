
import { RESTAURANTS as INITIAL_RESTAURANTS } from '../data/mockData.js';

const STORAGE_KEYS = {
  ORDERS: 'flavordish_db_orders',
  AUTH: 'flavordish_db_auth',
  RESTAURANTS: 'flavordish_db_restaurants',
  USERS: 'flavordish_db_users',
  ENHANCEMENTS: 'flavordish_db_menu_enhancements',
  PARTNER_INVITES: 'flavordish_db_partner_invites',
  NOTIFICATIONS: 'flavordish_db_notifications'
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

  async loginWithPhone(phone, otp) {
    await this.delay(800);
    // Simulation: Any 4-digit OTP works for demo
    if (otp.length !== 4) throw new Error("Invalid OTP");
    
    const users = this.getUsers();
    let user = users.find(u => u.phone === phone);
    
    if (!user) {
      // Create a temporary partner if not exists for demo
      user = { id: Date.now().toString(), phone, role: 'partner', name: 'Partner ' + phone.slice(-4) };
    }
    
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
    return user;
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

  // --- Admin Logic: Partners & Mail ---
  async getPartnerInvites() {
    const data = localStorage.getItem(STORAGE_KEYS.PARTNER_INVITES);
    return data ? JSON.parse(data) : [];
  }

  async sendPartnerInvite(email, restaurantName) {
    await this.delay(1000);
    const invites = await this.getPartnerInvites();
    const newInvite = { 
      id: Date.now().toString(), 
      email, 
      restaurantName, 
      status: 'Email Sent', 
      timestamp: Date.now() 
    };
    invites.push(newInvite);
    localStorage.setItem(STORAGE_KEYS.PARTNER_INVITES, JSON.stringify(invites));
    
    // Log Notification (Simulated Auto-mail)
    this.addNotification(`System: Onboarding email automatically dispatched to ${email} for ${restaurantName}.`);
    return newInvite;
  }

  addNotification(message) {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]';
    const notifications = JSON.parse(data);
    notifications.unshift({ message, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications.slice(0, 20)));
  }

  getNotifications() {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  }

  // --- Restaurants ---
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
